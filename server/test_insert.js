const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('users')
    .insert({
      userName: 'Test Member Direct',
      email: 'testdirect2@example.com',
      password: 'test',
      role: 'member',
      nik: '123123',
      phone_number: '08123123'
    })
    .select()
    .single();

  console.log('Insert Error:', error);
  console.log('Inserted Data:', data);
}

testInsert();
