const express = require('express');
const articlesController = require('./articles.controller');
const validate = require('../../middleware/validate.middleware');
const { articleSchema } = require('./articles.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', articlesController.getAllArticles);
router.get('/:id', articlesController.getArticleDetails);

// Protected routes (Member/Admin)
router.post('/', authenticate, authorizeRoles('member', 'admin', 'manager'), validate(articleSchema), articlesController.addArticle);
router.put('/:id', authenticate, authorizeRoles('member', 'admin', 'manager'), validate(articleSchema.partial()), articlesController.editArticle);
router.delete('/:id', authenticate, authorizeRoles('member', 'admin', 'manager'), articlesController.deleteArticle);

// Admin-only routes
router.get('/admin/all', authenticate, authorizeRoles('admin', 'manager'), articlesController.getAdminArticles);

module.exports = router;
