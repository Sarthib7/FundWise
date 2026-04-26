import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.1'
import { writeAuditLog } from './_shared/audit.ts'
import { verifySolanaTx } from './_shared/verify-tx.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { pool: { min: 0, max: 2 } },
})

serve(async (req) => {
  const { groupId, fromWallet, toWallet, amount, mint, txSig } = await req.json()

  const actorWallet = Deno.env.get('ACTOR_WALLET') ?? 'unknown'
  const requestId = Deno.env.get('REQUEST_ID') ?? crypto.randomUUID()

  try {
    // 1. Verify group and membership
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single()

    if (groupErr || !group) throw new Error('Group not found')

    // 2. Verify on-chain transaction
    const verified = await verifySolanaTx(txSig, {
      from: fromWallet,
      to: toWallet,
      amount,
      mint,
    })

    if (!verified.valid) {
      throw new Error(`Transaction verification failed: ${verified.error}`)
    }

    // 3. Insert settlement
    const { error: insertErr } = await supabase.from('settlements').insert({
      group_id: groupId,
      from_wallet: fromWallet,
      to_wallet: toWallet,
      amount,
      mint,
      tx_sig: txSig,
    })

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`)

    // 4. Audit log
    await writeAuditLog({
      supabase,
      tableName: 'settlements',
      operation: 'INSERT',
      actorWallet,
      recordId: null,
      outcome: 'SUCCESS',
      payload: { groupId, fromWallet, toWallet, amount, mint, txSig, verified: verified.details },
      requestId,
    })

    return new Response(JSON.stringify({ success: true, settlement: verified }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err: any) {
    // Audit failure
    await writeAuditLog({
      supabase,
      tableName: 'settlements',
      operation: 'INSERT',
      actorWallet,
      recordId: null,
      outcome: 'FAILURE',
      errorMessage: err.message,
      payload: { groupId, fromWallet, toWallet, amount, mint, txSig },
      requestId,
    }).catch(() => {})

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
})
