const supabase = require('../../config/supabase');

class PromosRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByCode(code) {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .eq('promo_code', code.toUpperCase())
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(promoData) {
    const { data, error } = await supabase
      .from('promos')
      .insert(promoData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, promoData) {
    const { data, error } = await supabase
      .from('promos')
      .update({ ...promoData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async incrementUsage(id) {
    const { error } = await supabase.rpc('increment_promo_usage', { promo_id_param: id });
    if (error) throw error;
    return true;
  }

  async softDelete(id) {
    const { error } = await supabase
      .from('promos')
      .update({ deleted_at: new Date() })
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = new PromosRepository();
