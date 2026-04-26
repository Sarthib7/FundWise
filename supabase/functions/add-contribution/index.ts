import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.1'
import { writeAuditLog } from './_shared/audit.ts'
import { verifySolanaTx } from './_shared/verify-tx.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const { groupId, memberWallet, amount, mint, txSig } = await req.json()
  const requestId = crypto.randomUUID()

  try {
    // Verify membership
    const { data: member, error: me } = await supabase
      .from('members')
      .select('id')
      .eq('group_id', groupId)
      .eq('wallet', memberWallet)
      .single()

    if (me || !member) throw new Error('Member not found in group')

    // Verify on-chain contribution transaction
    const verified = await verifySolanaTx(txSig, {
      from: memberWallet,
      to: null, // Fund contributions go to treasury, not a specific member
      amount,
      mint,
    })

    if (!verified.valid) {
      throw new Error(`Contribution verification failed: ${verified.error}`)
    }

    // Insert contribution
    const { error } = await supabase.from('contributions').insert({
      group_id: groupId,
      member_wallet: memberWallet,
      amount,
      mint,
      tx_sig: txSig,
    })

    if (error) throw new Error(error.message)

    await writeAuditLog({
      supabase,
      tableName: 'contributions',
      operation: 'INSERT',
      actorWallet: memberWallet,
      recordId: null,
      outcome: 'SUCCESS',
      payload: { groupId, amount, mint, txSig, verified: verified.details },
      requestId,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err: any) {
    await writeAuditLog({
      supabase,
      tableName: 'contributions',
      operation: 'INSERT',
      actorWallet: '',
      recordId: null,
      outcome: 'FAILURE',
      errorMessage: err.message,
      payload: { groupId, amount, mint, txSig },
      requestId,
    }).catch(() => {})

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
})
