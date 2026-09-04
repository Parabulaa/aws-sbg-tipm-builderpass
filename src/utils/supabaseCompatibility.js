export function isMissingEventEndTime(error) {
  const message = error?.message?.toLowerCase() || ''

  return Boolean(error) && message.includes('end_time') && (
    error.code === '42703'
    || error.code === 'PGRST204'
    || message.includes('does not exist')
    || message.includes('schema cache')
  )
}

export function isMissingProfileUpdateFunction(error) {
  const message = error?.message?.toLowerCase() || ''

  return Boolean(error) && message.includes('update_own_profile') && (
    error.code === 'PGRST202'
    || message.includes('could not find the function')
    || message.includes('schema cache')
  )
}

export function isMissingBatchSummaryFunction(error) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST202'
    || (message.includes('get_events_rsvp_summaries') && message.includes('schema cache'))
}

export async function queryWithOptionalEventEndTime(runQuery) {
  const result = await runQuery(true)

  if (!isMissingEventEndTime(result.error)) return result

  return runQuery(false)
}

export function eventWithOptionalEndTime(event) {
  return event ? { end_time: null, ...event } : event
}

export function getDatabaseFeatureMessage(error, fallback) {
  if (isMissingEventEndTime(error) || isMissingProfileUpdateFunction(error)) {
    return 'This feature needs the pending BuilderPass database update. Ask an administrator to apply the Phase 8 Supabase migration.'
  }

  return error?.message || fallback
}
