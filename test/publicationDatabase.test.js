import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('migration chain preserves existing events and enforces publication across roles, posters, and RSVP RPCs', async () => {
  const db = new PGlite()
  try {
    // Minimal Supabase-provided schemas. Everything in public comes from the
    // actual migration chain. pgcrypto is unnecessary: core provides UUIDs.
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, storage to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant select, insert, delete on storage.objects to anon, authenticated;
      create function storage.foldername(text) returns text[] language sql immutable as
        $$ select (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'), 1)-1] $$;
      create function storage.filename(text) returns text language sql immutable as
        $$ select (string_to_array($1, '/'))[array_length(string_to_array($1, '/'), 1)] $$;
    `)
    const files = ['schema.sql', 'migrations/phase-3-officer-role.sql', 'migrations/phase-5-rsvp-capacity.sql', 'migrations/phase-6-event-posters.sql', 'migrations/phase-7-attendance-workflow.sql', 'migrations/phase-8-event-lifecycle-member-profile.sql', 'migrations/phase-9-batch-rsvp-summaries.sql']
    for (const file of files) {
      const sql = (await readFile(new URL(`../supabase/${file}`, import.meta.url), 'utf8')).replace('create extension if not exists pgcrypto;', '')
      await db.exec(sql)
    }
    await db.exec(`insert into public.events (title, event_date, start_time, end_time, venue) values ('Existing event', '2099-01-01', '10:00', '12:00', 'Campus');`)
    const migration = await readFile(new URL('../supabase/migrations/phase-10-public-events.sql', import.meta.url), 'utf8')
    await db.exec(migration)
    await db.exec(migration) // Safe retry must not publish drafts or widen access.
    const legacy = (await db.query('select publication_status, visibility from public.events')).rows[0]
    assert.deepEqual(legacy, { publication_status: 'PUBLISHED', visibility: 'MEMBERS' })
    await db.exec(`
      insert into auth.users values
        ('10000000-0000-4000-8000-000000000001', 'member@example.test', '{"student_number":"1","first_name":"Test","last_name":"Member","course":"BS Computer Science (BS CS)","year_level":1}'),
        ('10000000-0000-4000-8000-000000000002', 'officer@example.test', '{"student_number":"2","first_name":"Test","last_name":"Officer","course":"BS Computer Science (BS CS)","year_level":1}'),
        ('10000000-0000-4000-8000-000000000003', 'admin@example.test', '{"student_number":"3","first_name":"Test","last_name":"Admin","course":"BS Computer Science (BS CS)","year_level":1}');
      update public.profiles set role = 'OFFICER' where student_number = '2';
      update public.profiles set role = 'ADMIN' where student_number = '3';
      insert into public.events (id, title, event_date, start_time, end_time, venue, publication_status, visibility, poster_path) values
        ('20000000-0000-4000-8000-000000000001','Public event','2099-01-01','10:00','12:00','Campus','PUBLISHED','PUBLIC','events/20000000-0000-4000-8000-000000000001/public.jpg'),
        ('20000000-0000-4000-8000-000000000002','Draft event','2099-01-01','10:00','12:00','Campus','DRAFT','PUBLIC','events/20000000-0000-4000-8000-000000000002/draft.jpg');
      insert into public.events (title, event_date, start_time, end_time, venue) values ('New default', '2099-01-01', '10:00', '12:00', 'Campus');
      insert into storage.objects (bucket_id,name) values
        ('event-posters','events/20000000-0000-4000-8000-000000000001/public.jpg'),
        ('event-posters','events/20000000-0000-4000-8000-000000000002/draft.jpg'),
        ('event-posters','unused.jpg');
    `)
    assert.deepEqual((await db.query("select publication_status, visibility from events where title='New default'")).rows[0], { publication_status: 'DRAFT', visibility: 'MEMBERS' })

    async function asRole(role, suffix = '') {
      await db.exec('reset role;')
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [suffix ? `10000000-0000-4000-8000-00000000000${suffix}` : ''])
      await db.exec(`set role ${role};`)
    }
    await asRole('anon')
    assert.deepEqual((await db.query('select title from events')).rows.map(r => r.title), ['Public event'])
    await assert.rejects(db.query('select created_by from events'), /permission denied/)
    await assert.rejects(db.query('select * from profiles'), /permission denied/)
    await assert.rejects(db.query('select * from event_registrations'), /permission denied/)
    await assert.rejects(db.query('select * from attendance'), /permission denied/)
    assert.equal((await db.query('select name from storage.objects')).rows.length, 1)
    await assert.rejects(db.query("select * from rsvp_to_event('20000000-0000-4000-8000-000000000001')"), /permission denied/)

    await asRole('authenticated', '1')
    assert.equal((await db.query('select title from events')).rows.length, 2)
    assert.equal((await db.query("select * from get_event_rsvp_summary('20000000-0000-4000-8000-000000000002')")).rows.length, 0)
    assert.equal((await db.query("select * from get_events_rsvp_summaries(array['20000000-0000-4000-8000-000000000002']::uuid[])")).rows.length, 0)
    await assert.rejects(db.query("select * from rsvp_to_event('20000000-0000-4000-8000-000000000002')"), /EVENT_NOT_PUBLISHED/)
    assert.equal((await db.query("select * from rsvp_to_event('20000000-0000-4000-8000-000000000001')")).rows[0].status, 'REGISTERED')
    assert.equal((await db.query("select * from get_event_rsvp_summary('20000000-0000-4000-8000-000000000001')")).rows[0].registered_count, 1)
    await db.exec("update events set visibility='PUBLIC' where title='Existing event'")
    await asRole('anon')
    assert.equal((await db.query('select title from events')).rows.length, 1, 'member cannot publish an event')

    for (const suffix of ['2', '3']) {
      await asRole('authenticated', suffix)
      assert.equal((await db.query('select title from events')).rows.length, 4)
      assert.equal((await db.query('select name from storage.objects')).rows.length, 2)
    }
    await db.exec("update events set publication_status='PUBLISHED', visibility='PUBLIC', registration_status='CLOSED' where title='Draft event'")
    await asRole('anon')
    assert.equal((await db.query('select title from events')).rows.length, 2, 'closing RSVP does not hide an announcement')
    assert.equal((await db.query('select name from storage.objects')).rows.length, 2)
    await asRole('authenticated', '1')
    await assert.rejects(db.query("select * from rsvp_to_event('20000000-0000-4000-8000-000000000002')"), /REGISTRATION_CLOSED/)
    await asRole('authenticated', '2')
    await db.exec("update events set publication_status='DRAFT' where title='Public event'")
    await asRole('anon')
    assert.equal((await db.query('select name from storage.objects')).rows.length, 1, 'unpublishing revokes access to new poster URLs')
  } finally {
    await db.close()
  }
})
