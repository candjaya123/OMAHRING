const articlesService = require('./articles.service');

class ArticlesController {
  async addArticle(req, res, next) {
    try {
      const article = await articlesService.createArticle(req.body, req.user.id);
      res.status(201).json({ success: true, data: article });
    } catch (error) {
      console.error('[ArticlesController.addArticle] Error:', error.message);
      next(error);
    }
  }

  async getAllArticles(req, res, next) {
    try {
      const role = req.user ? req.user.role : 'guest';
      const articles = await articlesService.getAllArticles(role);
      res.status(200).json({ success: true, data: articles });
    } catch (error) {
      console.error('[ArticlesController.getAllArticles] Error:', error.message);
      next(error);
    }
  }

  async getAdminArticles(req, res, next) {
    try {
      const articles = await articlesService.getAdminArticles();
      res.status(200).json({ success: true, data: articles });
    } catch (error) {
      console.error('[ArticlesController.getAdminArticles] Error:', error.message);
      next(error);
    }
  }

  async getArticleDetails(req, res, next) {
    try {
      const role = req.user ? req.user.role : 'guest';
      const article = await articlesService.getArticleById(req.params.id, role);
      res.status(200).json({ success: true, data: article });
    } catch (error) {
      console.error('[ArticlesController.getArticleDetails] Error:', error.message);
      next(error);
    }
  }

  async editArticle(req, res, next) {
    try {
      const article = await articlesService.updateArticle(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data: article });
    } catch (error) {
      console.error('[ArticlesController.editArticle] Error:', error.message);
      next(error);
    }
  }

  async deleteArticle(req, res, next) {
    try {
      await articlesService.deleteArticle(req.params.id, req.user);
      res.status(200).json({ success: true, message: 'Article deleted successfully' });
    } catch (error) {
      console.error('[ArticlesController.deleteArticle] Error:', error.message);
      next(error);
    }
  }
}

module.exports = new ArticlesController();
