import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default supabase

const { data, error } = await supabase.from('users').select('id').limit(1);
console.log('Supabase connection test:', error ? error.message : 'connected');