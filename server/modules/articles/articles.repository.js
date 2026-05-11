const supabase = require('../../config/supabase');

class ArticlesRepository {
  async findAll(filters = {}) {
    let query = supabase
      .from('articles')
      .select('*, author:users!articles_author_id_fkey(user_name)')
      .is('deleted_at', null);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.is_member_only !== undefined) query = query.eq('is_member_only', filters.is_member_only);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users!articles_author_id_fkey(user_name)')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByAuthorId(authorId) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', authorId)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  async create(articleData) {
    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, articleData) {
    const { data, error } = await supabase
      .from('articles')
      .update({ ...articleData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    const { error } = await supabase
      .from('articles')
      .update({ deleted_at: new Date() })
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = new ArticlesRepository();
