const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  const { data, error } = await supabase.rpc('increment_unread_count', { session_id_param: '123e4567-e89b-12d3-a456-426614174000' });
  console.log('RPC Check:', error ? error.message : 'RPC exists');
}

testRpc();
