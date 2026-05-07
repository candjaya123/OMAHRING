const supabase = require('../../config/supabase');

const startChatSession = async (req, res) => {
  try {
    const { customer_id } = req.body;

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
      .select('*, users(userName)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil sesi chat' });
  }
};

module.exports = { startChatSession, sendMessage, getChatMessages, getAllSessions };
