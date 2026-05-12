const pageContentsRepository = require('./page-contents.repository');

class PageContentsService {
  async getPageContent(pageSlug) {
    return await pageContentsRepository.getByPage(pageSlug);
  }

  async getAllPagesContent() {
    return await pageContentsRepository.getAll();
  }

  async upsertContent(data, userId) {
    return await pageContentsRepository.upsert({
      ...data,
      updated_by: userId
    });
  }

  async bulkUpsertContent(pageSlug, entries, userId) {
    const preparedEntries = entries.map(entry => ({
      ...entry,
      page_slug: pageSlug,
      updated_by: userId
    }));
    return await pageContentsRepository.bulkUpsert(preparedEntries);
  }

  async deleteContent(id) {
    return await pageContentsRepository.delete(id);
  }
}

module.exports = new PageContentsService();
