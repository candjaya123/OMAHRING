const ordersService = require('./orders.service');

class OrdersController {
  async createOrder(req, res, next) {
    try {
      const result = await ordersService.createOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: result
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message,
          orderId: error.orderId
        });
      }
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      const orders = await ordersService.getUserOrders(req.params.userId);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getOrderDetails(req, res, next) {
    try {
      const order = await ordersService.getOrderDetails(req.params.id);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      await ordersService.handleWebhook(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).send('Error');
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const orders = await ordersService.getAllOrders(req.query);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async regenerateSnapToken(req, res, next) {
    try {
      const result = await ordersService.regenerateSnapToken(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const order = await ordersService.updateOrderStatus(req.params.id, req.body.orderStatus);
      res.status(200).json({ success: true, message: 'Order status updated', data: order });
    } catch (error) {
      next(error);
    }
  }

  async getOrderStats(req, res, next) {
    try {
      const stats = await ordersService.getOrderStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrdersController();
