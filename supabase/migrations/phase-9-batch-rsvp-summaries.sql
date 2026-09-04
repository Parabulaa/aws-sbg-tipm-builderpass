-- Phase 9: batch RSVP summaries
-- Run once after the Phase 5 RSVP capacity migration.

begin;

create or replace function public.get_events_rsvp_summaries(p_event_ids uuid[])
returns table (
  event_id uuid,
  capacity integer,
  registered_count bigint,
  slots_remaining integer,
  is_full boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    events.id as event_id,
    events.capacity,
    count(registrations.id) filter (where registrations.status = 'REGISTERED') as registered_count,
    case
      when events.capacity is null then null
      else greatest(
        events.capacity - count(registrations.id) filter (where registrations.status = 'REGISTERED'),
        0
      )::integer
    end as slots_remaining,
    events.capacity is not null
      and count(registrations.id) filter (where registrations.status = 'REGISTERED') >= events.capacity as is_full
  from public.events
  left join public.event_registrations as registrations
    on registrations.event_id = events.id
  where auth.uid() is not null
    and events.id = any(coalesce(p_event_ids, array[]::uuid[]))
  group by events.id, events.capacity;
$$;

revoke all on function public.get_events_rsvp_summaries(uuid[]) from public;
grant execute on function public.get_events_rsvp_summaries(uuid[]) to authenticated;

commit;
