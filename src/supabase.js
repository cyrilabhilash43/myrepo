import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://xasbqstbdhcjpujwkkhe.supabase.co'
const SUPABASE_KEY = 'sb_publishable_qE_UhjfdIGAn7dQu_u1HBw_M-W4jF-j'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)