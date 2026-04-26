import { createClient } from '@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://placeholder.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: { pool: { min: 0, max: 2 } },
})
