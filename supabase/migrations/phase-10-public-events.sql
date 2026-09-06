-- Apply after Phase 9. Existing events stay published to members only.
begin;

alter table public.events
  add column if not exists publication_status text not null default 'PUBLISHED'
    check (publication_status in ('DRAFT', 'PUBLISHED')),
  add column if not exists visibility text not null default 'MEMBERS'
    check (visibility in ('MEMBERS', 'PUBLIC')),
  add column if not exists recap text not null default '' check (char_length(recap) <= 1500);
alter table public.events alter column publication_status set default 'DRAFT';

-- Guests receive only announcement fields, never creator IDs or member data.
grant usage on schema public to anon;
revoke all on public.events from anon;
grant select (id, title, description, event_date, start_time, end_time, venue,
  capacity, registration_status, poster_path, publication_status, visibility, recap)
  on public.events to anon;

drop policy if exists "Authenticated users can view events" on public.events;
drop policy if exists "Members can view published events" on public.events;
create policy "Members can view published events"
  on public.events for select to authenticated
  using (publication_status = 'PUBLISHED' or public.is_officer_or_admin());

drop policy if exists "Guests can view public announcements" on public.events;
create policy "Guests can view public announcements"
  on public.events for select to anon
  using (publication_status = 'PUBLISHED' and visibility = 'PUBLIC');

-- The bucket stays private. Only posters referenced by a public, published
-- announcement can be signed by guests; drafts and unused uploads stay private.
drop policy if exists "Guests can read public event posters" on storage.objects;
create policy "Guests can read public event posters"
  on storage.objects for select to anon
  using (
    bucket_id = 'event-posters'
    and exists (
      select 1 from public.events
      where events.poster_path = storage.objects.name
        and events.publication_status = 'PUBLISHED'
        and events.visibility = 'PUBLIC'
    )
  );

create index if not exists events_public_schedule_idx
  on public.events (event_date, start_time, id)
  where publication_status = 'PUBLISHED' and visibility = 'PUBLIC';

-- Definer RPCs must enforce publication explicitly because they bypass RLS.
create or replace function public.get_events_rsvp_summaries(p_event_ids uuid[])
returns table (event_id uuid, capacity integer, registered_count bigint, slots_remaining integer, is_full boolean)
language sql stable security definer set search_path = public
as $$
  select e.id, e.capacity,
    count(r.id) filter (where r.status = 'REGISTERED'),
    greatest(e.capacity - count(r.id) filter (where r.status = 'REGISTERED'), 0)::integer,
    count(r.id) filter (where r.status = 'REGISTERED') >= e.capacity
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  where auth.uid() is not null
    and (e.publication_status = 'PUBLISHED' or public.is_officer_or_admin())
    and e.id = any(coalesce(p_event_ids, array[]::uuid[]))
  group by e.id, e.capacity;
$$;

create or replace function public.get_event_rsvp_summary(p_event_id uuid)
returns table (capacity integer, registered_count bigint, slots_remaining integer, is_full boolean)
language sql stable security definer set search_path = public
as $$
  select capacity, registered_count, slots_remaining, is_full
    from public.get_events_rsvp_summaries(array[p_event_id]);
$$;

revoke all on function public.get_events_rsvp_summaries(uuid[]) from public;
revoke all on function public.get_event_rsvp_summary(uuid) from public;
grant execute on function public.get_events_rsvp_summaries(uuid[]) to authenticated;
grant execute on function public.get_event_rsvp_summary(uuid) to authenticated;

-- Also protects direct registration writes, not just the RSVP RPC. Holding
-- the event lock serializes publication changes with new reservations.
create or replace function public.require_published_event_for_rsvp()
returns trigger language plpgsql security definer set search_path = public
as $$
declare event_publication text;
begin
  if new.status = 'REGISTERED' then
    select publication_status into event_publication
      from public.events where id = new.event_id for update;
    if event_publication is distinct from 'PUBLISHED' then
      raise exception 'EVENT_NOT_PUBLISHED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.require_published_event_for_rsvp() from public;
drop trigger if exists require_published_event_for_rsvp on public.event_registrations;
create trigger require_published_event_for_rsvp
  before insert or update on public.event_registrations
  for each row execute function public.require_published_event_for_rsvp();

commit;
