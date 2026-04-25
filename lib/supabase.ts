import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("[FundWise] NEXT_PUBLIC_SUPABASE_URL not set — database features will not work")
}

if (
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn(
    "[FundWise] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set — Supabase client auth will not work"
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)
