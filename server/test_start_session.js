const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStartSession() {
  const { data: user } = await supabase.from('users').select('id').limit(1).single();
  if (!user) {
    console.log('No user to create session for');
    return;
  }
  console.log('Creating session for user:', user.id);

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ customer_id: user.id, status: 'active' })
    .select()
    .single();

  console.log('Start Session Error:', error);
  console.log('Session Data:', data);
}

testStartSession();
