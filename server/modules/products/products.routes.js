const express = require('express');
const productsController = require('./products.controller');
const validate = require('../../middleware/validate.middleware');
const { productSchema } = require('./products.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');
const { upload } = require('../../helpers/cloudinary');

const router = express.Router();

// Public routes
router.get('/', productsController.getAllProducts);
router.get('/:id', productsController.getProductDetails);

// Admin-only routes
router.post('/upload-image', authenticate, authorizeRoles('admin', 'manager'), upload.single('my_file'), productsController.handleImageUpload);
router.post('/', authenticate, authorizeRoles('admin', 'manager'), validate(productSchema), productsController.addProduct);
router.put('/:id', authenticate, authorizeRoles('admin', 'manager'), validate(productSchema.partial()), productsController.updateProduct);
router.delete('/:id', authenticate, authorizeRoles('admin', 'manager'), productsController.deleteProduct);

module.exports = router;
