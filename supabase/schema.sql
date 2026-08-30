-- Run this file in the Supabase SQL Editor before using BuilderPass.
-- The schema starts empty. It does not add sample members, events, registrations, or attendance records.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  student_number text not null unique check (char_length(btrim(student_number)) > 0),
  first_name text not null check (char_length(btrim(first_name)) > 0),
  last_name text not null check (char_length(btrim(last_name)) > 0),
  email text not null check (char_length(btrim(email)) > 0),
  course text not null check (char_length(btrim(course)) > 0),
  year_level smallint not null check (year_level between 1 and 10),
  role text not null default 'MEMBER' check (role in ('MEMBER', 'ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_key on public.profiles (lower(email));

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  description text not null default '',
  event_date date not null,
  start_time time not null,
  venue text not null check (char_length(btrim(venue)) > 0),
  registration_status text not null default 'OPEN' check (registration_status in ('OPEN', 'CLOSED')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null default 'REGISTERED' check (status = 'REGISTERED'),
  registered_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null check (status in ('PRESENT', 'ABSENT')),
  check_in_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists set_attendance_updated_at on public.attendance;
create trigger set_attendance_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
$$;

create or replace function public.is_admin()
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
      and role = 'ADMIN'
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  registration_student_number text := new.raw_user_meta_data ->> 'student_number';
  student_profile_id uuid;
  email_profile_id uuid;
  linked_profile_id uuid;
  existing_email text;
  existing_student_number text;
  existing_auth_user_id uuid;
begin
  if registration_student_number is null or char_length(btrim(registration_student_number)) = 0 then
    raise exception 'A student number is required.';
  end if;

  select id into student_profile_id
  from public.profiles
  where student_number = registration_student_number;

  select id into email_profile_id
  from public.profiles
  where lower(email) = lower(new.email);

  if student_profile_id is not null
    and email_profile_id is not null
    and student_profile_id <> email_profile_id then
    raise exception 'The student number and email belong to different membership records.';
  end if;

  linked_profile_id := coalesce(student_profile_id, email_profile_id);

  if linked_profile_id is null then
    insert into public.profiles (
      auth_user_id,
      student_number,
      first_name,
      last_name,
      email,
      course,
      year_level
    )
    values (
      new.id,
      registration_student_number,
      new.raw_user_meta_data ->> 'first_name',
      new.raw_user_meta_data ->> 'last_name',
      lower(new.email),
      new.raw_user_meta_data ->> 'course',
      (new.raw_user_meta_data ->> 'year_level')::smallint
    );
  else
    select auth_user_id, email, student_number
    into existing_auth_user_id, existing_email, existing_student_number
    from public.profiles
    where id = linked_profile_id;

    if existing_auth_user_id is not null and existing_auth_user_id <> new.id then
      raise exception 'This membership record is already connected to an account.';
    end if;

    if lower(existing_email) <> lower(new.email) then
      raise exception 'The email does not match the existing membership record.';
    end if;

    if existing_student_number <> registration_student_number then
      raise exception 'The student number does not match the existing membership record.';
    end if;

    update public.profiles
    set auth_user_id = new.id
    where id = linked_profile_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.attendance enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_registrations to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;

drop policy if exists "Members can view their profile" on public.profiles;
create policy "Members can view their profile"
  on public.profiles for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
  on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated users can view events" on public.events;
create policy "Authenticated users can view events"
  on public.events for select to authenticated
  using (true);

drop policy if exists "Admins can create events" on public.events;
create policy "Admins can create events"
  on public.events for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete to authenticated
  using (public.is_admin());

drop policy if exists "Members can view relevant registrations" on public.event_registrations;
create policy "Members can view relevant registrations"
  on public.event_registrations for select to authenticated
  using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "Members can register for open events" on public.event_registrations;
create policy "Members can register for open events"
  on public.event_registrations for insert to authenticated
  with check (
    user_id = public.current_profile_id()
    and status = 'REGISTERED'
    and exists (
      select 1
      from public.events
      where events.id = event_registrations.event_id
        and events.registration_status = 'OPEN'
    )
  );

drop policy if exists "Members can view relevant attendance" on public.attendance;
create policy "Members can view relevant attendance"
  on public.attendance for select to authenticated
  using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "Admins can create attendance" on public.attendance;
create policy "Admins can create attendance"
  on public.attendance for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update attendance" on public.attendance;
create policy "Admins can update attendance"
  on public.attendance for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke execute on function public.current_profile_id() from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- After creating your first BuilderPass account, run this once with its real email:
-- update public.profiles set role = 'ADMIN' where email = 'your-admin-email@example.com';
