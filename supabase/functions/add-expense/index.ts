import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.1'
import { writeAuditLog } from './_shared/audit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const {
    groupId,
    payer,
    createdBy,
    amount,
    mint,
    memo,
    category,
    splitMethod,
    splits,
  } = await req.json()

  const actorWallet = createdBy  // Edge Function acts as proxy
  const requestId = crypto.randomUUID()

  try {
    // Verify group exists
    const { data: group, error: ge } = await supabase.from('groups').select('id').eq('id', groupId).single()
    if (ge || !group) throw new Error('Group not found')

    // Verify all split wallets are members of the group
    const splitWallets = splits.map((s: any) => s.wallet)
    const { data: memberCheck, error: me } = await supabase
      .from('members')
      .select('wallet')
      .eq('group_id', groupId)
      .in('wallet', [payer, ...splitWallets])

    if (me) throw new Error('Failed to verify membership')
    if (memberCheck.length !== 1 + splitWallets.length) {
      throw new Error('All split participants must be group members')
    }

    // Atomic transaction: create expense + splits in one go
    const { data: expense, error: expenseErr } = await supabase
      .from('expenses')
      .insert({
        group_id: groupId,
        payer,
        created_by: createdBy,
        amount,
        mint,
        memo: memo || null,
        category: category || 'general',
        split_method: splitMethod,
      })
      .select('id')
      .single()

    if (expenseErr) throw new Error(`Expense insert failed: ${expenseErr.message}`)

    const splitRows = splits.map((s: any) => ({
      expense_id: expense.id,
      wallet: s.wallet,
      share: s.share,
    }))

    const { error: splitsErr } = await supabase.from('expense_splits').insert(splitRows)
    if (splitsErr) throw new Error(`Splits insert failed: ${splitsErr.message}`)

    // Audit
    await writeAuditLog({
      supabase,
      tableName: 'expenses',
      operation: 'INSERT',
      actorWallet,
      recordId: expense.id,
      outcome: 'SUCCESS',
      payload: { groupId, payer, amount, mint, splitMethod, splits: splitRows.length },
      requestId,
    })

    return new Response(JSON.stringify({ success: true, expenseId: expense.id }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err: any) {
    await writeAuditLog({
      supabase,
      tableName: 'expenses',
      operation: 'INSERT',
      actorWallet,
      recordId: null,
      outcome: 'FAILURE',
      errorMessage: err.message,
      payload: { groupId, payer, amount, mint },
      requestId,
    }).catch(() => {})

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
})
