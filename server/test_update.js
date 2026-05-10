const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'member' })
    .eq('email', 'hawe@gmail.com')
    .select()
    .single();

  console.log('Update Error:', error);
  console.log('Updated Data:', data);
}

testUpdate();
