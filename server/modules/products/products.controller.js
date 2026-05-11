const productsService = require('./products.service');
const { imageUploadUtil } = require('../../helpers/cloudinary');

class ProductsController {
  async handleImageUpload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
      }

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const url = 'data:' + req.file.mimetype + ';base64,' + b64;
      const result = await imageUploadUtil(url);

      res.status(200).json({
        success: true,
        result: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProducts(req, res, next) {
    try {
      const filters = req.query;
      const products = await productsService.getAllProducts(filters);
      res.status(200).json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async getProductDetails(req, res, next) {
    try {
      const product = await productsService.getProductById(req.params.id);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async addProduct(req, res, next) {
    try {
      const product = await productsService.createProduct(req.body);
      res.status(201).json({ success: true, message: 'Product added successfully', data: product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productsService.updateProduct(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productsService.deleteProduct(req.params.id);
      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductsController();
