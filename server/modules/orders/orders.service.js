const ordersRepository = require('./orders.repository');
const cartRepository = require('../cart/cart.repository');
const productsService = require('../products/products.service');
const settingsService = require('../settings/settings.service');
const { getPaymentStrategy } = require('../../shared/payment/payment.factory');
const crypto = require('crypto');

class OrdersService {
  async createOrder(data) {
    const { userId, cartId, addressInfo, paymentCategory, shippingCost } = data;

    // 1. Check for duplicate pending order for this cart
    const existing = await ordersRepository.findPendingByCartId(cartId);
    if (existing) {
      const error = new Error('Checkout already in progress for this cart');
      error.statusCode = 409;
      error.orderId = existing.id;
      throw error;
    }

    // 2. Get Cart and Validate Items/Stock
    const cart = await cartRepository.findByUserId(userId) || await cartRepository.findBySessionId(userId);
    if (!cart || !cart.cart_items || cart.cart_items.length === 0) throw new Error('Cart is empty');

    // 3. Calculate Totals and Fees
    const settings = await settingsService.getSettings();
    const storeServiceFee = settings.store_service_fee || 0;
    
    let productTotal = 0;
    const orderItems = cart.cart_items.map(item => {
      const price = item.unit_price;
      productTotal += price * item.quantity;
      return {
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: price,
        subtotal: price * item.quantity
      };
    });

    const baseTotal = productTotal + (shippingCost || 0) + storeServiceFee;
    const paymentServiceFee = this.calculatePaymentFee(baseTotal, paymentCategory);
    const finalTotal = baseTotal + paymentServiceFee;

    // 4. Create Order Header
    const order = await ordersRepository.create({
      user_id: userId,
      cart_id: cartId,
      customer_name: data.customerName,
      customer_email: data.email,
      address_snapshot: {
        address: addressInfo.address,
        city: addressInfo.city,
        pincode: addressInfo.pincode || '',
        phone: addressInfo.phone,
        notes: addressInfo.notes || ''
      },
      shipping_cost: shippingCost || 0,
      store_service_fee: storeServiceFee,
      payment_service_fee: paymentServiceFee,
      total_amount: finalTotal,
      payment_category: paymentCategory,
      payment_status: 'unpaid',
      order_status: 'pending',
      payment_mode: settings.payment_mode || 'midtrans',
      payment_reference: `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    });

    // 5. Create Order Items
    await ordersRepository.addItems(order.id, orderItems);

    // 6. Initiate Payment via Strategy
    const paymentStrategy = await getPaymentStrategy();
    const paymentResult = await paymentStrategy.initiate(order, settings);

    // 7. Clear Cart
    await cartRepository.deleteCart(cartId);

    return {
      orderId: order.id,
      paymentMode: paymentResult.paymentMode,
      instructions: paymentResult.instructions
    };
  }

  calculatePaymentFee(baseTotal, category) {
    // Manual payments have 0 gateway fee
    if (category === 'manual') return 0;

    switch (category) {
      case 'bank_transfer': return 4000;
      case 'minimarket': return 5000;
      case 'qris': return Math.round(baseTotal * 0.007);
      case 'ewallet': return Math.round(baseTotal * 0.02);
      case 'credit_card': return Math.round(baseTotal * 0.029) + 2000;
      default: return 0;
    }
  }

  async handleWebhook(payload) {
    const paymentStrategy = await getPaymentStrategy();
    if (!paymentStrategy.handleWebhook) return false;

    const { orderId, status, rawPayload } = await paymentStrategy.handleWebhook(payload);

    const order = await ordersRepository.findById(orderId);
    if (!order) throw new Error('Order not found');

    if (status === 'confirmed' && order.payment_status !== 'paid') {
      await this.fulfillOrder(order);
    }

    await ordersRepository.update(orderId, {
      payment_status: status === 'confirmed' ? 'paid' : (status === 'expired' ? 'failed' : 'pending'),
      order_status: status === 'confirmed' ? 'confirmed' : (status === 'expired' ? 'expired' : 'pending'),
      payment_method_used: rawPayload.payment_type || rawPayload.payment_method
    });

    return true;
  }

  async submitPaymentProof(orderId, imageFile) {
    const paymentStrategy = await getPaymentStrategy();
    if (paymentStrategy.submitProof) {
      return await paymentStrategy.submitProof(orderId, imageFile);
    }
    throw new Error('Manual payment not active');
  }

  async confirmManualPayment(orderId, adminUserId) {
    const paymentStrategy = await getPaymentStrategy();
    if (paymentStrategy.confirmPayment) {
      const result = await paymentStrategy.confirmPayment(orderId, adminUserId);
      if (!result.alreadyConfirmed) {
        const order = await ordersRepository.findById(orderId);
        await this.fulfillOrder(order);
        await ordersRepository.update(orderId, {
          payment_status: 'paid',
          order_status: 'confirmed'
        });
      }
      return result;
    }
    throw new Error('Manual payment not active');
  }

  async rejectManualPayment(orderId, adminUserId, reason) {
    const paymentStrategy = await getPaymentStrategy();
    if (paymentStrategy.rejectPayment) {
      await ordersRepository.update(orderId, {
        payment_status: 'failed',
        order_status: 'cancelled'
      });
      return await paymentStrategy.rejectPayment(orderId, adminUserId, reason);
    }
    throw new Error('Manual payment not active');
  }

  async fulfillOrder(order) {
    // Deduct stock for each item
    if (order.order_items) {
      for (const item of order.order_items) {
        await productsService.adjustStock(item.variant_id, -item.quantity);
      }
    }
  }

  async getUserOrders(userId) {
    return await ordersRepository.findByUserId(userId);
  }

  async getOrderDetails(id) {
    return await ordersRepository.findById(id);
  }

  async regenerateSnapToken(orderId) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new Error('Order not found');

    const settings = await settingsService.getSettings();
    if (settings.payment_mode !== 'midtrans') throw new Error('Midtrans not active');

    const paymentStrategy = await getPaymentStrategy();
    const result = await paymentStrategy.initiate(order, settings);

    return result.instructions;
  }

  async updateOrderStatus(id, status) {
    return await ordersRepository.update(id, { order_status: status });
  }

  async getOrderStats() {
    const orders = await ordersRepository.getStats();
    
    return {
      pending: orders.filter(o => o.order_status === 'pending').length,
      confirmed: orders.filter(o => o.order_status === 'confirmed').length,
      totalRevenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0)
    };
  }

  async getAllOrders(filters) {
    return await ordersRepository.findAll(filters);
  }
}

module.exports = new OrdersService();
