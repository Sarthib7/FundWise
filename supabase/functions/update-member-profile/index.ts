import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.1'
import { writeAuditLog } from './_shared/audit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const { groupId, wallet, displayName } = await req.json()
  const requestId = crypto.randomUUID()

  try {
    // Verify member exists in group
    const { data: member, error: me } = await supabase
      .from('members')
      .select('id')
      .eq('group_id', groupId)
      .eq('wallet', wallet)
      .single()

    if (me || !member) throw new Error('Member not found in group')

    // Update display name
    const { error } = await supabase
      .from('members')
      .update({ display_name: displayName })
      .eq('group_id', groupId)
      .eq('wallet', wallet)

    if (error) throw new Error(error.message)

    await writeAuditLog({
      supabase,
      tableName: 'members',
      operation: 'UPDATE',
      actorWallet: wallet,
      recordId: member.id,
      outcome: 'SUCCESS',
      payload: { groupId, displayName },
      requestId,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err: any) {
    await writeAuditLog({
      supabase,
      tableName: 'members',
      operation: 'UPDATE',
      actorWallet: wallet,
      recordId: null,
      outcome: 'FAILURE',
      errorMessage: err.message,
      payload: { groupId, displayName },
      requestId,
    }).catch(() => {})

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
})
