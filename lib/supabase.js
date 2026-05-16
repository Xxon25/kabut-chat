import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cek hanya saat runtime, jangan matikan build process
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Perhatian: Variabel Supabase belum di-set. Cek Dashboard Vercel / .env bross!")
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)
