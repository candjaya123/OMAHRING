const supabase = require('../../config/supabase');

class ChatRepository {
  async findActiveSessionByCustomerId(customerId) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findActiveSessionByToken(token) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createSession(data) {
    const { customerId, sessionToken, contextType, contextId, contextTitle, contextUrl } = data;
    const { data: record, error } = await supabase
      .from('chat_sessions')
      .insert({ 
        customer_id: customerId, 
        session_token: sessionToken,
        context_type: contextType,
        context_id: contextId,
        context_title: contextTitle,
        context_url: contextUrl,
        status: 'active' 
      })
      .select()
      .single();

    if (error) throw error;
    return record;
  }

  async insertMessage(messageData) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: messageData.session_id,
        sender_id: messageData.sender_id,
        sender_role: messageData.sender_role,
        message_text: messageData.message_text
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSessionMetadata(sessionId, updateData) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getMessagesBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getAllSessions() {
    // Note: using user_name instead of userName as per target schema
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, users:users!chat_sessions_customer_id_fkey(user_name)')
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async incrementUnreadCount(sessionId) {
    const { error } = await supabase.rpc('increment_unread_count', { session_id_param: sessionId });
    if (error) throw error;
    return true;
  }

  async getActiveSessionsUnreadCount() {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('unread_count')
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }
}

module.exports = new ChatRepository();
