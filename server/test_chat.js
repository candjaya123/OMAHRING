const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChat() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .limit(1);

  console.log('Chat Messages Check:', error ? error.message : 'Table exists');
}

testChat();
