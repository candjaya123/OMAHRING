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
      console.error('[OrdersController.createOrder] Error:', error.message);
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      const orders = await ordersService.getUserOrders(req.params.userId);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error('[OrdersController.getUserOrders] Error:', error.message);
      next(error);
    }
  }

  async getOrderDetails(req, res, next) {
    try {
      const order = await ordersService.getOrderDetails(req.params.id);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      console.error('[OrdersController.getOrderDetails] Error:', error.message);
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      await ordersService.handleWebhook(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('[OrdersController.handleWebhook] Error:', error.message);
      res.status(500).send('Error');
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const orders = await ordersService.getAllOrders(req.query);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error('[OrdersController.getAllOrders] Error:', error.message);
      next(error);
    }
  }

  async regenerateSnapToken(req, res, next) {
    try {
      const result = await ordersService.regenerateSnapToken(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[OrdersController.regenerateSnapToken] Error:', error.message);
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { order_status } = req.body;
      const order = await ordersService.updateOrderStatus(req.params.id, order_status);
      res.status(200).json({ success: true, message: 'Order status updated', data: order });
    } catch (error) {
      console.error('[OrdersController.updateOrderStatus] Error:', error.message);
      next(error);
    }
  }

  async getOrderStats(req, res, next) {
    try {
      const stats = await ordersService.getOrderStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error('[OrdersController.getOrderStats] Error:', error.message);
      next(error);
    }
  }
}

module.exports = new OrdersController();
