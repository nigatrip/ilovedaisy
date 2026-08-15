-- ilovedaisy · room persistence
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Apply in order. Afterwards, app runs in "persistent room" mode.

-- 1. Rooms table ---------------------------------------------------------------
create table if not exists public.rooms (
  code       text primary key,
  host_id    text not null,
  status     text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  game_id    text,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

-- RLS: no direct anon access. All access goes through the security-definer
-- functions below, which are granted to anon + authenticated.

-- 2. Create room (returns a unique 6-char code) ---------------------------------
create or replace function public.create_room(p_host_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  chars    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  if p_host_id is null or p_host_id = '' then
    raise exception 'host id required';
  end if;
  loop
    new_code := (
      select string_agg(substr(chars, (1 + floor(random() * length(chars)))::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.rooms where code = new_code);
  end loop;
  insert into public.rooms (code, host_id, status) values (new_code, p_host_id, 'waiting');
  return new_code;
end;
$$;

-- 3. Look up a room by code -----------------------------------------------------
create or replace function public.get_room(p_code text)
returns table (code text, host_id text, status text, game_id text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select code, host_id, status, game_id, created_at
  from public.rooms
  where code = upper(p_code);
$$;

-- 4. Update room status / selected game -----------------------------------------
create or replace function public.set_room_status(p_code text, p_status text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.rooms set status = p_status where code = upper(p_code);
$$;

create or replace function public.set_room_game(p_code text, p_game_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.rooms set game_id = p_game_id where code = upper(p_code);
$$;

-- 5. Grants ----------------------------------------------------------------------
grant execute on function public.create_room(text) to anon, authenticated;
grant execute on function public.get_room(text) to anon, authenticated;
grant execute on function public.set_room_status(text, text) to anon, authenticated;
grant execute on function public.set_room_game(text, text) to anon, authenticated;

-- 6. (Optional) stream room changes over realtime --------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.rooms;
  end if;
end;
$$;
