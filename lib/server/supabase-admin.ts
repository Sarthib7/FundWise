import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { FundWiseError } from "@/lib/server/fundwise-error"

let cachedClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new FundWiseError("NEXT_PUBLIC_SUPABASE_URL is not configured.", 500)
  }

  if (!serviceRoleKey) {
    throw new FundWiseError("SUPABASE_SERVICE_ROLE_KEY is not configured.", 500)
  }

  cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  return cachedClient
}
