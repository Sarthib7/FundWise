export async function writeAuditLog(params: {
  supabase: any
  tableName: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  actorWallet: string
  actorUid?: string
  recordId?: string | null
  requestId: string
  payload?: Record<string, any>
  outcome: 'SUCCESS' | 'FAILURE'
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}) {
  const { supabase, tableName, operation, actorWallet, recordId, requestId, payload, outcome, errorMessage } = params

  await supabase.from('audit_log').insert({
    table_name: tableName,
    operation,
    record_id: recordId,
    actor_wallet: actorWallet,
    actor_uid: params.actorUid,
    request_id: requestId,
    payload: payload ?? {},
    outcome,
    error_message: errorMessage ?? null,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  })
}
