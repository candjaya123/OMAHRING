const articlesRepository = require('./articles.repository');

class ArticlesService {
  async createArticle(data, authorId) {
    const slug = data.slug || this.generateSlug(data.title);
    return await articlesRepository.create({
      ...data,
      author_id: authorId,
      slug
    });
  }

  async getAllArticles(userRole = 'guest') {
    const filters = { status: 'published' };
    
    // If not admin/manager, only show published articles
    // Could also filter member_only based on role
    const articles = await articlesRepository.findAll(filters);
    
    if (userRole !== 'member' && userRole !== 'admin' && userRole !== 'manager') {
      return articles.map(a => a.is_member_only ? { ...a, content_body: 'MEMBER_ONLY_CONTENT' } : a);
    }
    
    return articles;
  }

  async getAdminArticles() {
    return await articlesRepository.findAll();
  }

  async getArticleById(id, userRole = 'guest') {
    const article = await articlesRepository.findById(id);
    if (!article) throw new Error('Article not found');

    if (article.is_member_only && !['member', 'admin', 'manager'].includes(userRole)) {
      article.content_body = 'MEMBER_ONLY_CONTENT';
    }

    return article;
  }

  async updateArticle(id, data, user) {
    const existing = await articlesRepository.findById(id);
    if (!existing) throw new Error('Article not found');

    // Authorization: only author or admin can update
    if (user.role === 'member' && existing.author_id !== user.id) {
      throw new Error('Unauthorized to edit this article');
    }

    if (data.title && !data.slug) {
      data.slug = this.generateSlug(data.title);
    }

    return await articlesRepository.update(id, data);
  }

  async deleteArticle(id, user) {
    const existing = await articlesRepository.findById(id);
    if (!existing) throw new Error('Article not found');

    if (user.role === 'member' && existing.author_id !== user.id) {
      throw new Error('Unauthorized to delete this article');
    }

    return await articlesRepository.softDelete(id);
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
}

module.exports = new ArticlesService();
