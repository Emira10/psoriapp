// Supabase bağlantısı
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// 🔥 Backend için SERVICE ROLE kullanılır
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL veya SERVICE ROLE KEY eksik.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;