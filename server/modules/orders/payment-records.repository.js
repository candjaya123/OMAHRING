const supabase = require('../../shared/supabase.client');

const create = async (data) => {
  const { data: record, error } = await supabase
    .from('payment_records')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return record;
};

const findByOrderId = async (orderId) => {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const updateByOrderId = async (orderId, data) => {
  const { error } = await supabase
    .from('payment_records')
    .update(data)
    .eq('order_id', orderId);
  if (error) throw error;
};

const countPendingManual = async () => {
  const { count, error } = await supabase
    .from('payment_records')
    .select('*', { count: 'exact', head: true })
    .eq('payment_mode', 'manual')
    .eq('status', 'proof_submitted');
  if (error) throw error;
  return count || 0;
};

module.exports = { create, findByOrderId, updateByOrderId, countPendingManual };
