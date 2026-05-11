const productsRepository = require('./products.repository');

class ProductsService {
  async getAllProducts(filters) {
    return await productsRepository.findAll(filters);
  }

  async getProductById(id) {
    const product = await productsRepository.findById(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async createProduct(data) {
    const { variants, images, ...productData } = data;

    const product = await productsRepository.create(productData);

    if (variants && variants.length > 0) {
      await productsRepository.upsertVariants(product.id, variants);
    }

    if (images && images.length > 0) {
      await productsRepository.upsertImages(product.id, images);
    }

    return await this.getProductById(product.id);
  }

  async updateProduct(id, data) {
    const { variants, images, ...productData } = data;

    await productsRepository.update(id, productData);

    if (variants) {
      await productsRepository.upsertVariants(id, variants);
    }

    if (images) {
      await productsRepository.upsertImages(id, images);
    }

    return await this.getProductById(id);
  }

  async deleteProduct(id) {
    return await productsRepository.softDelete(id);
  }

  async adjustStock(variantId, quantity) {
    return await productsRepository.updateVariantStock(variantId, quantity);
  }
}

module.exports = new ProductsService();
