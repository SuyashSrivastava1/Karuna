require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FATAL: Missing Supabase credentials in .env file. Server cannot start.');
  process.exit(1);
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('FATAL: SUPABASE_URL is not a valid URL.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
