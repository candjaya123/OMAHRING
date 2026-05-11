const supabase = require('../../config/supabase');

const findByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const create = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      user_name: userData.userName,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
      nik: userData.nik || null,
      phone_number: userData.phone_number || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, updateData) => {
  // Convert camelCase to snake_case for DB
  const dbData = {};
  if (updateData.userName) dbData.user_name = updateData.userName;
  if (updateData.password) dbData.password = updateData.password;
  if (updateData.role) dbData.role = updateData.role;
  if (updateData.nik) dbData.nik = updateData.nik;
  if (updateData.phone_number) dbData.phone_number = updateData.phone_number;

  const { data, error } = await supabase
    .from('users')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateRole = async (email, role) => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('email', email)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = {
  findByEmail,
  findById,
  create,
  update,
  updateRole,
};
