const pageContentsService = require('./page-contents.service');
const { imageUploadUtil } = require('../../shared/cloudinary.service');

class PageContentsController {
  async getPageContent(req, res, next) {
    try {
      const { pageSlug } = req.params;
      const content = await pageContentsService.getPageContent(pageSlug);
      res.status(200).json({ success: true, data: content });
    } catch (error) {
      console.error('[PageContentsController.getPageContent] Error:', error.message);
      next(error);
    }
  }

  async getAllPagesContent(req, res, next) {
    try {
      const content = await pageContentsService.getAllPagesContent();
      res.status(200).json({ success: true, data: content });
    } catch (error) {
      console.error('[PageContentsController.getAllPagesContent] Error:', error.message);
      next(error);
    }
  }

  async upsertContent(req, res, next) {
    try {
      const { pageSlug, sectionKey } = req.params;
      const data = { ...req.body, page_slug: pageSlug, section_key: sectionKey };
      const content = await pageContentsService.upsertContent(data, req.user.id);
      res.status(200).json({ success: true, message: 'Content updated successfully', data: content });
    } catch (error) {
      console.error('[PageContentsController.upsertContent] Error:', error.message);
      next(error);
    }
  }

  async bulkUpsertContent(req, res, next) {
    try {
      const { pageSlug } = req.params;
      const { entries } = req.body;
      const content = await pageContentsService.bulkUpsertContent(pageSlug, entries, req.user.id);
      res.status(200).json({ success: true, message: 'Bulk content updated successfully', data: content });
    } catch (error) {
      console.error('[PageContentsController.bulkUpsertContent] Error:', error.message);
      next(error);
    }
  }

  async uploadImage(req, res, next) {
    try {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const url = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await imageUploadUtil(url);

      res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id
        }
      });
    } catch (error) {
      console.error('[PageContentsController.uploadImage] Error:', error.message);
      next(error);
    }
  }

  async deleteContent(req, res, next) {
    try {
      const { id } = req.params;
      await pageContentsService.deleteContent(id);
      res.status(200).json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
      console.error('[PageContentsController.deleteContent] Error:', error.message);
      next(error);
    }
  }
}

module.exports = new PageContentsController();
