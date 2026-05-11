const promosRepository = require('./promos.repository');

class PromosService {
  async getAllPromos() {
    return await promosRepository.findAll();
  }

  async createPromo(data) {
    // Check if code already exists
    const existing = await promosRepository.findByCode(data.promo_code);
    if (existing) {
      const error = new Error('Promo code already exists');
      error.statusCode = 409;
      throw error;
    }

    return await promosRepository.create(data);
  }

  async updatePromo(id, data) {
    return await promosRepository.update(id, data);
  }

  async deletePromo(id) {
    return await promosRepository.softDelete(id);
  }

  async validatePromo(code, cartTotal) {
    const promo = await promosRepository.findByCode(code);
    if (!promo) throw new Error('Invalid promo code');

    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) throw new Error('Promo not yet started');
    if (promo.end_date && new Date(promo.end_date) < now) throw new Error('Promo has expired');
    
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      throw new Error('Promo usage limit reached');
    }

    if (cartTotal < promo.min_order) {
      throw new Error(`Minimum order of ${promo.min_order} required for this promo`);
    }

    let discount = 0;
    if (promo.discount_type === 'fixed') {
      discount = promo.discount_value;
    } else {
      discount = (cartTotal * promo.discount_value) / 100;
      if (promo.max_discount && discount > promo.max_discount) {
        discount = promo.max_discount;
      }
    }

    return {
      promo,
      discount: Math.floor(discount)
    };
  }
}

module.exports = new PromosService();
