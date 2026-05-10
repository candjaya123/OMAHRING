const supabase = require('../../config/supabase');

const startChatSession = async (req, res) => {
  try {
    const { customer_id } = req.body;

    // Check if an active session already exists (pick the most recent one)
    const { data: existingSessions, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (existingSessions && existingSessions.length > 0) {
      return res.status(200).json({ success: true, data: existingSessions[0] });
    }

    // Otherwise create a new session
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ customer_id, status: 'active' })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error starting chat session:', error);
    res.status(500).json({ success: false, message: 'Gagal memulai chat' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { session_id, sender_id, sender_role, message_text } = req.body;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ session_id, sender_id, sender_role, message_text })
      .select()
      .single();

    if (error) throw error;

    // If message is from customer, update unread count and last message
    if (sender_role === 'customer') {
      await supabase.rpc('increment_unread_count', { session_id_param: session_id });
      await supabase
        .from('chat_sessions')
        .update({
          last_message: message_text,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', session_id);
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim pesan' });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pesan' });
  }
};

const getAllSessions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, users:users!chat_sessions_customer_id_fkey(userName)')
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil sesi chat' });
  }
};

const replyMessage = async (req, res) => {
  try {
    const { session_id, sender_id, message_text } = req.body;

    // 1. Insert reply message
    const { data: messageData, error: messageError } = await supabase
      .from('chat_messages')
      .insert({ session_id, sender_id, sender_role: 'admin', message_text })
      .select()
      .single();

    if (messageError) throw messageError;

    // 2. Update session metadata
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .update({ 
        last_message: message_text, 
        last_message_at: new Date().toISOString(),
        unread_count: 0 // Admin replied, so unread count resets
      })
      .eq('id', session_id);

    if (sessionError) throw sessionError;

    res.status(201).json({ success: true, data: messageData });
  } catch (error) {
    console.error('Error replying message:', error);
    res.status(500).json({ success: false, message: 'Gagal membalas pesan' });
  }
};

const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error closing chat session:', error);
    res.status(500).json({ success: false, message: 'Gagal menutup sesi' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('unread_count')
      .eq('status', 'active');

    if (error) throw error;

    const totalUnread = data.reduce((sum, session) => sum + (session.unread_count || 0), 0);

    res.status(200).json({ success: true, totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil jumlah pesan baru' });
  }
};

module.exports = { 
  startChatSession, 
  sendMessage, 
  getChatMessages, 
  getAllSessions, 
  replyMessage, 
  closeSession, 
  getUnreadCount 
};
