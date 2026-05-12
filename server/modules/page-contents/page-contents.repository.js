const supabase = require('../../config/supabase');

class PageContentsRepository {
  async getByPage(pageSlug) {
    const { data, error } = await supabase
      .from('page_contents')
      .select('*')
      .eq('page_slug', pageSlug)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getAll() {
    const { data, error } = await supabase
      .from('page_contents')
      .select('*')
      .order('page_slug', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  async upsert(contentData) {
    const { data, error } = await supabase
      .from('page_contents')
      .upsert({
        ...contentData,
        updated_at: new Date()
      }, {
        onConflict: 'page_slug,section_key'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async bulkUpsert(entries) {
    const { data, error } = await supabase
      .from('page_contents')
      .upsert(entries.map(e => ({
        ...e,
        updated_at: new Date()
      })), {
        onConflict: 'page_slug,section_key'
      })
      .select();

    if (error) throw error;
    return data;
  }

  async delete(id) {
    const { error } = await supabase
      .from('page_contents')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = new PageContentsRepository();
