const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSendMessage() {
  // First, get a valid session
  const { data: session } = await supabase.from('chat_sessions').select('id, customer_id').limit(1).single();
  if (!session) {
    console.log('No chat sessions exist to test with.');
    return;
  }

  console.log('Testing with session:', session.id, 'customer:', session.customer_id);

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ 
      session_id: session.id, 
      sender_id: session.customer_id, 
      sender_role: 'customer', 
      message_text: 'Test message' 
    })
    .select()
    .single();

  console.log('Insert Error:', error);
  console.log('Insert Data:', data);
}

testSendMessage();
