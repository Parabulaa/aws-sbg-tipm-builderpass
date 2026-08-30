-- Phase 5: RSVP capacity and cancellation
--
-- Run this once in the Supabase SQL Editor after the baseline schema and the
-- Phase 3 Officer migration. This preserves existing registrations and never
-- deletes attendance. Do not apply it automatically from the client.

begin;

-- NULL means an event has no attendance limit. Existing events remain unlimited.
alter table public.events
  add column if not exists capacity integer;

alter table public.events
  drop constraint if exists events_capacity_positive_check;

alter table public.events
  add constraint events_capacity_positive_check
  check (capacity is null or capacity > 0);

-- Store RSVP cancellation as state/history on the existing unique row rather
-- than deleting it. The unique user/event pair remains intact.
alter table public.event_registrations
  add column if not exists cancelled_at timestamptz;

alter table public.event_registrations
  drop constraint if exists event_registrations_status_check;

alter table public.event_registrations
  add constraint event_registrations_status_check
  check (status in ('REGISTERED', 'CANCELLED'));

alter table public.event_registrations
  drop constraint if exists event_registrations_cancelled_at_check;

alter table public.event_registrations
  add constraint event_registrations_cancelled_at_check
  check (status = 'REGISTERED' or cancelled_at is not null);

create index if not exists event_registrations_active_event_idx
  on public.event_registrations (event_id)
  where status = 'REGISTERED';

-- Officers/admins can update events directly, so prevent a capacity reduction
-- that would invalidate existing active RSVPs. The event-row lock held by an
-- UPDATE also serializes this check with the RSVP RPC below.
create or replace function public.prevent_capacity_below_active_rsvps()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  active_rsvp_count bigint;
begin
  if new.capacity is not null then
    select count(*)
    into active_rsvp_count
    from public.event_registrations
    where event_id = new.id
      and status = 'REGISTERED';

    if active_rsvp_count > new.capacity then
      raise exception 'Capacity cannot be lower than the number of active RSVPs.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_capacity_below_active_rsvps on public.events;
create trigger prevent_capacity_below_active_rsvps
  before insert or update of capacity on public.events
  for each row execute function public.prevent_capacity_below_active_rsvps();

-- Register or reactivate the caller's RSVP. Locking the event row means every
-- RSVP for one limited event is counted after prior competing attempts finish.
create or replace function public.rsvp_to_event(p_event_id uuid)
returns table (
  id uuid,
  status text,
  registered_at timestamptz,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  event_row public.events%rowtype;
  registration_row public.event_registrations%rowtype;
  has_registration boolean;
  active_rsvp_count bigint;
begin
  profile_id := public.current_profile_id();

  if profile_id is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select *
  into event_row
  from public.events
  where events.id = p_event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  select *
  into registration_row
  from public.event_registrations
  where event_registrations.event_id = p_event_id
    and event_registrations.user_id = profile_id
  for update;
  has_registration := found;

  -- Make duplicate requests harmless, including a second click after the
  -- registration window has closed.
  if has_registration and registration_row.status = 'REGISTERED' then
    return query
    select registration_row.id, registration_row.status, registration_row.registered_at, registration_row.cancelled_at;
    return;
  end if;

  if event_row.registration_status <> 'OPEN' then
    raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001';
  end if;

  select count(*)
  into active_rsvp_count
  from public.event_registrations
  where event_registrations.event_id = p_event_id
    and event_registrations.status = 'REGISTERED';

  if event_row.capacity is not null and active_rsvp_count >= event_row.capacity then
    raise exception 'EVENT_FULL' using errcode = 'P0001';
  end if;

  if has_registration then
    update public.event_registrations
    set status = 'REGISTERED',
        registered_at = now()
    where event_registrations.id = registration_row.id
    returning * into registration_row;
  else
    insert into public.event_registrations (user_id, event_id, status)
    values (profile_id, p_event_id, 'REGISTERED')
    returning * into registration_row;
  end if;

  return query
  select registration_row.id, registration_row.status, registration_row.registered_at, registration_row.cancelled_at;
end;
$$;

-- Members may cancel only their own active RSVP while registration is OPEN.
-- An RSVP with attendance is preserved as-is to avoid contradicting history.
create or replace function public.cancel_event_rsvp(p_event_id uuid)
returns table (
  id uuid,
  status text,
  registered_at timestamptz,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  event_row public.events%rowtype;
  registration_row public.event_registrations%rowtype;
begin
  profile_id := public.current_profile_id();

  if profile_id is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select *
  into event_row
  from public.events
  where events.id = p_event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if event_row.registration_status <> 'OPEN' then
    raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001';
  end if;

  select *
  into registration_row
  from public.event_registrations
  where event_registrations.event_id = p_event_id
    and event_registrations.user_id = profile_id
    and event_registrations.status = 'REGISTERED'
  for update;

  if not found then
    raise exception 'NO_ACTIVE_RSVP' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.attendance
    where attendance.event_id = p_event_id
      and attendance.user_id = profile_id
  ) then
    raise exception 'CANNOT_CANCEL_ATTENDED_RSVP' using errcode = 'P0001';
  end if;

  update public.event_registrations
  set status = 'CANCELLED',
      cancelled_at = now()
  where event_registrations.id = registration_row.id
  returning * into registration_row;

  return query
  select registration_row.id, registration_row.status, registration_row.registered_at, registration_row.cancelled_at;
end;
$$;

-- Member RLS only exposes a caller's own RSVP. This RPC returns aggregate
-- capacity information without exposing other members' registration records.
create or replace function public.get_event_rsvp_summary(p_event_id uuid)
returns table (
  capacity integer,
  registered_count bigint,
  slots_remaining integer,
  is_full boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  event_row public.events%rowtype;
  active_rsvp_count bigint;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = 'P0001';
  end if;

  select *
  into event_row
  from public.events
  where events.id = p_event_id;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  select count(*)
  into active_rsvp_count
  from public.event_registrations
  where event_registrations.event_id = p_event_id
    and event_registrations.status = 'REGISTERED';

  return query
  select
    event_row.capacity,
    active_rsvp_count,
    case
      when event_row.capacity is null then null
      else greatest(event_row.capacity - active_rsvp_count, 0)::integer
    end,
    event_row.capacity is not null and active_rsvp_count >= event_row.capacity;
end;
$$;

-- Browser clients use the narrowly scoped RPCs for RSVP writes. Existing RLS
-- select policies remain in place for member-owned and staff registration reads.
drop policy if exists "Members can register for open events" on public.event_registrations;
revoke insert, update, delete on table public.event_registrations from authenticated;

revoke all on function public.rsvp_to_event(uuid) from public;
revoke all on function public.cancel_event_rsvp(uuid) from public;
revoke all on function public.get_event_rsvp_summary(uuid) from public;
grant execute on function public.rsvp_to_event(uuid) to authenticated;
grant execute on function public.cancel_event_rsvp(uuid) to authenticated;
grant execute on function public.get_event_rsvp_summary(uuid) to authenticated;

commit;
