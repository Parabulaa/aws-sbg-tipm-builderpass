-- Phase 6: Event poster storage
--
-- Run this once in the Supabase SQL Editor after the baseline schema and the
-- Phase 3 Officer migration. It creates a private Storage bucket and stores
-- only a poster object key on events; existing events remain posterless.

begin;

-- Phase 3 normally creates this helper. Define it here as well so this
-- migration fails neither on an older project nor on a partial Phase 3 setup.
create or replace function public.is_officer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('OFFICER', 'ADMIN')
  )
$$;

revoke execute on function public.is_officer_or_admin() from public;
grant execute on function public.is_officer_or_admin() to authenticated;

alter table public.events
  add column if not exists poster_path text;

-- The application writes poster keys as:
-- events/<event UUID>/<random-safe-filename>.
alter table public.events
  drop constraint if exists events_poster_path_check;

alter table public.events
  add constraint events_poster_path_check
  check (
    poster_path is null
    or poster_path ~ '^events/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]*$'
  );

-- Keep posters private. The Storage policies below permit signed URLs only for
-- authenticated users and only for objects referenced by an event.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-posters',
  'event-posters',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Event posters are readable by authenticated members" on storage.objects;
drop policy if exists "Officers and admins can upload event posters" on storage.objects;
drop policy if exists "Officers and admins can remove event posters" on storage.objects;

-- A member can read only an object that the current event data references.
-- Unfinished or replaced uploads stay private until an event points to them.
create policy "Event posters are readable by authenticated members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'event-posters'
    and exists (
      select 1
      from public.events
      where events.poster_path = storage.objects.name
    )
  );

-- The bucket configuration enforces file size/type. This policy additionally
-- confines untrusted client uploads to a real event's own path.
create policy "Officers and admins can upload event posters"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-posters'
    and public.is_officer_or_admin()
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = 'events'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'
    and exists (
      select 1
      from public.events
      where events.id::text = (storage.foldername(name))[2]
    )
  );

-- A separate delete policy permits cleanup after replacement, removal, or a
-- failed event update. New uploads use unique names, so no update policy is
-- required and overwriting existing objects is not permitted.
create policy "Officers and admins can remove event posters"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-posters'
    and public.is_officer_or_admin()
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = 'events'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'
  );

commit;
