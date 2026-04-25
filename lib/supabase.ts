import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("[FundWise] NEXT_PUBLIC_SUPABASE_URL not set — database features will not work")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
