const express = require('express');
const pageContentsController = require('./page-contents.controller');
const validate = require('../../middleware/validate.middleware');
const { contentUpsertSchema, bulkUpsertSchema } = require('./page-contents.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');
const { upload } = require('../../shared/cloudinary.service');

const router = express.Router();

// Public: Get content for a specific page
router.get('/:pageSlug', pageContentsController.getPageContent);

// Admin/Manager: List all page contents
router.get('/', authenticate, authorizeRoles('admin', 'manager'), pageContentsController.getAllPagesContent);

// Admin/Manager: Upsert single content
router.put('/:pageSlug/:sectionKey', authenticate, authorizeRoles('admin', 'manager'), validate(contentUpsertSchema), pageContentsController.upsertContent);

// Admin/Manager: Bulk upsert for a page
router.put('/:pageSlug/bulk', authenticate, authorizeRoles('admin', 'manager'), validate(bulkUpsertSchema), pageContentsController.bulkUpsertContent);

// Admin/Manager: Upload image for CMS
router.post('/upload-image', authenticate, authorizeRoles('admin', 'manager'), upload.single('my_file'), pageContentsController.uploadImage);

// Manager only: Delete content
router.delete('/:id', authenticate, authorizeRoles('manager'), pageContentsController.deleteContent);

module.exports = router;
