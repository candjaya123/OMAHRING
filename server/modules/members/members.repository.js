const supabase = require('../../config/supabase');

class MembersRepository {
  async findAllByRoles(roles) {
    const { data, error } = await supabase
      .from('users')
      .select('id, user_name, email, role, created_at, updated_at')
      .in('role', roles)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, user_name, email, role, created_at, updated_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRole(id, role) {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date() })
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = new MembersRepository();
