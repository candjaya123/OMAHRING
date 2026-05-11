const promosService = require('./promos.service');

class PromosController {
  async getAllPromos(req, res, next) {
    try {
      const promos = await promosService.getAllPromos();
      res.status(200).json({ success: true, data: promos });
    } catch (error) {
      next(error);
    }
  }

  async addPromo(req, res, next) {
    try {
      const promo = await promosService.createPromo(req.body);
      res.status(201).json({ success: true, message: 'Promo created successfully', data: promo });
    } catch (error) {
      next(error);
    }
  }

  async updatePromo(req, res, next) {
    try {
      const promo = await promosService.updatePromo(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Promo updated successfully', data: promo });
    } catch (error) {
      next(error);
    }
  }

  async deletePromo(req, res, next) {
    try {
      await promosService.deletePromo(req.params.id);
      res.status(200).json({ success: true, message: 'Promo deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async validatePromo(req, res, next) {
    try {
      const { code, cartTotal } = req.body;
      const result = await promosService.validatePromo(code, cartTotal);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PromosController();
