import { supabase } from './client.js'
import { isMissingBatchSummaryFunction } from '../../utils/supabaseCompatibility.js'

export async function getRsvpSummaries(eventIds) {
  if (eventIds.length === 0) return { hadFailures: false, summariesByEvent: {} }

  const batchResult = await supabase.rpc('get_events_rsvp_summaries', { p_event_ids: eventIds })

  if (!batchResult.error) {
    return {
      hadFailures: false,
      summariesByEvent: Object.fromEntries((batchResult.data ?? []).map((summary) => [summary.event_id, summary])),
    }
  }

  if (!isMissingBatchSummaryFunction(batchResult.error)) {
    return { hadFailures: true, summariesByEvent: {} }
  }

  const results = await Promise.all(eventIds.map(async (eventId) => {
    const { data, error } = await supabase.rpc('get_event_rsvp_summary', { p_event_id: eventId })
    return { eventId, error, summary: data?.[0] ?? null }
  }))

  return {
    hadFailures: results.some(({ error, summary }) => error || !summary),
    summariesByEvent: Object.fromEntries(
      results.filter(({ error, summary }) => !error && summary).map(({ eventId, summary }) => [eventId, summary]),
    ),
  }
}
