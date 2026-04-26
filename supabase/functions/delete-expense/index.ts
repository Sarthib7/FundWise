import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.1'
import { writeAuditLog } from './_shared/audit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const { expenseId, actorWallet } = await req.json()
  const requestId = crypto.randomUUID()

  try {
    // RPC call with service_role bypasses auth.uid(); pass actorWallet explicitly
    const { error } = await supabase.rpc('delete_expense_secure', {
      p_expense_id: expenseId,
      p_actor_wallet: actorWallet,
    })

    if (error) throw new Error(error.message)

    await writeAuditLog({
      supabase,
      tableName: 'expenses',
      operation: 'DELETE',
      actorWallet,
      recordId: expenseId,
      outcome: 'SUCCESS',
      requestId,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err: any) {
    await writeAuditLog({
      supabase,
      tableName: 'expenses',
      operation: 'DELETE',
      actorWallet,
      recordId: expenseId,
      outcome: 'FAILURE',
      errorMessage: err.message,
      requestId,
    }).catch(() => {})

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
})
