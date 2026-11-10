begin;

create table if not exists public.zchat_media_shares (
  path text not null,
  user_id uuid,
  group_id uuid,
  created_at timestamptz not null default now()
);
create unique index if not exists zchat_media_shares_one on public.zchat_media_shares (path, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid));
alter table public.zchat_media_shares enable row level security;
revoke all on public.zchat_media_shares from public, anon, authenticated;
grant all on public.zchat_media_shares to service_role;

create or replace function public.zchat_media_share_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
begin
  if new.type is distinct from 'text' or new.content is null or left(new.content, 6) <> 'zgame:' or strpos(new.content, '"zp:') = 0 then
    return new;
  end if;
  for p in select (regexp_matches(new.content, '"zp:([0-9a-fA-F-]{36}/[A-Za-z0-9][A-Za-z0-9._-]{0,159})"', 'g'))[1] loop
    continue when split_part(p, '/', 1) <> new.sender_id::text;
    insert into public.zchat_media_shares (path, user_id, group_id)
    values (p, case when new.group_id is null then new.receiver_id end, new.group_id)
    on conflict do nothing;
  end loop;
  return new;
end $$;
revoke all on function public.zchat_media_share_from_message() from public, anon, authenticated;
drop trigger if exists zchat_media_share on public.messages;
create trigger zchat_media_share after insert or update of content on public.messages
  for each row execute function public.zchat_media_share_from_message();

create schema if not exists zchat_private;
grant usage on schema zchat_private to authenticated;
create or replace function zchat_private.zchat_media_shared(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.zchat_media_shares s
    where s.path = p_name
      and (s.user_id = auth.uid()
        or (s.group_id is not null and exists (select 1 from public.group_members gm where gm.group_id = s.group_id and gm.user_id = auth.uid())))
  )
$$;
revoke all on function zchat_private.zchat_media_shared(text) from public, anon;
grant execute on function zchat_private.zchat_media_shared(text) to authenticated;

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "zchat shared game photos" on storage.objects';
    execute 'create policy "zchat shared game photos" on storage.objects for select to authenticated using (bucket_id = ''chat-private'' and zchat_private.zchat_media_shared(name))';
  end if;
end $$;

insert into public.zchat_media_shares (path, user_id, group_id)
select x.p, case when m.group_id is null then m.receiver_id end, m.group_id
from public.messages m
cross join lateral (select (regexp_matches(m.content, '"zp:([0-9a-fA-F-]{36}/[A-Za-z0-9][A-Za-z0-9._-]{0,159})"', 'g'))[1] as p) x
where m.type = 'text' and m.content like 'zgame:%' and strpos(m.content, '"zp:') > 0
  and split_part(x.p, '/', 1) = m.sender_id::text
on conflict do nothing;

create table if not exists public.zchat_game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  kind text not null,
  host uuid not null,
  guest uuid,
  listed boolean not null default true,
  state text not null default 'wait',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  constraint zchat_game_rooms_state check (state in ('wait', 'ready', 'play', 'gone')),
  constraint zchat_game_rooms_code check (code ~ '^[A-Z2-9]{6}$')
);
create unique index if not exists zchat_game_rooms_code_live on public.zchat_game_rooms (code) where state <> 'gone';
create index if not exists zchat_game_rooms_waiting on public.zchat_game_rooms (kind, created_at) where state = 'wait';
create index if not exists zchat_game_rooms_host on public.zchat_game_rooms (host, created_at desc);
create index if not exists zchat_game_rooms_guest on public.zchat_game_rooms (guest, created_at desc) where guest is not null;
create index if not exists zchat_game_rooms_updated on public.zchat_game_rooms (updated_at);
alter table public.zchat_game_rooms enable row level security;
revoke all on public.zchat_game_rooms from public, anon, authenticated;
grant all on public.zchat_game_rooms to service_role;

create or replace function public.zchat_room_kinds()
returns text[]
language sql
immutable
as $$ select array['chess', 'ckr', 'pool', 'crm', 'golf', 'zap', 'zapm', 'c4', 'ttt', 'reversi', 'gomoku', 'dots', 'ship'] $$;
revoke all on function public.zchat_room_kinds() from public, anon;
grant execute on function public.zchat_room_kinds() to authenticated;

create or replace function public.zchat_room_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.blocks x where (x.blocker_id = a and x.blocked_id = b) or (x.blocker_id = b and x.blocked_id = a))
$$;
revoke all on function public.zchat_room_blocked(uuid, uuid) from public, anon, authenticated;

create or replace function public.zchat_room_row(r public.zchat_game_rooms)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('id', r.id, 'code', r.code, 'kind', r.kind, 'state', r.state, 'listed', r.listed, 'host', r.host, 'guest', r.guest,
    'created_at', r.created_at, 'seen_at', r.seen_at,
    'host_p', (select jsonb_build_object('id', p.id, 'name', p.name, 'username', p.username, 'avatar', p.avatar) from public.profiles p where p.id = r.host),
    'guest_p', (select jsonb_build_object('id', p.id, 'name', p.name, 'username', p.username, 'avatar', p.avatar) from public.profiles p where p.id = r.guest))
$$;
revoke all on function public.zchat_room_row(public.zchat_game_rooms) from public, anon, authenticated;

create or replace function public.zchat_room_accept(a uuid, b uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.chat_accepts') is null then return; end if;
  begin
    execute 'insert into public.chat_accepts (user_id, other_id) values ($1, $2), ($2, $1) on conflict do nothing' using a, b;
  exception when others then
    null;
  end;
end $$;
revoke all on function public.zchat_room_accept(uuid, uuid) from public, anon, authenticated;

create or replace function public.zchat_room_ok_user(u uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = u and not coalesce(p.is_deleted, false) and not coalesce(p.banned, false) and not coalesce(p.is_bot, false))
$$;
revoke all on function public.zchat_room_ok_user(uuid) from public, anon, authenticated;

create or replace function public.zchat_room_open(p_kind text, p_listed boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r public.zchat_game_rooms;
  c text;
  i integer;
  j integer;
  n integer;
  abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if me is null then return jsonb_build_object('ok', false, 'why', 'auth'); end if;
  if p_kind is null or not (p_kind = any (public.zchat_room_kinds())) then return jsonb_build_object('ok', false, 'why', 'kind'); end if;
  if not public.zchat_room_ok_user(me) then return jsonb_build_object('ok', false, 'why', 'auth'); end if;
  select count(*) into n from public.zchat_game_rooms x where x.host = me and x.created_at > now() - interval '1 hour';
  if n >= 40 then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  update public.zchat_game_rooms set state = 'gone', updated_at = now() where host = me and state = 'wait';
  for i in 1..12 loop
    c := '';
    for j in 1..6 loop c := c || substr(abc, 1 + floor(random() * length(abc))::integer, 1); end loop;
    begin
      insert into public.zchat_game_rooms (code, kind, host, listed) values (c, p_kind, me, coalesce(p_listed, true)) returning * into r;
      exit;
    exception when unique_violation then
      r := null;
    end;
  end loop;
  if r.id is null then return jsonb_build_object('ok', false, 'why', 'busy'); end if;
  return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r));
end $$;
revoke all on function public.zchat_room_open(text, boolean) from public, anon;
grant execute on function public.zchat_room_open(text, boolean) to authenticated;

create or replace function public.zchat_room_join(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r public.zchat_game_rooms;
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  n integer;
begin
  if me is null or not public.zchat_room_ok_user(me) then return jsonb_build_object('ok', false, 'why', 'auth'); end if;
  if c !~ '^[A-Z2-9]{6}$' then return jsonb_build_object('ok', false, 'why', 'code'); end if;
  select count(*) into n from public.zchat_game_rooms x where x.guest = me and x.updated_at > now() - interval '10 minutes';
  if n >= 30 then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into r from public.zchat_game_rooms x where x.code = c and x.state <> 'gone' order by x.created_at desc limit 1 for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  if r.host = me then return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r), 'mine', true); end if;
  if r.guest = me then return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r)); end if;
  if r.state <> 'wait' or r.guest is not null then return jsonb_build_object('ok', false, 'why', 'taken'); end if;
  if r.seen_at < now() - interval '2 minutes' then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  if public.zchat_room_blocked(me, r.host) then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  update public.zchat_game_rooms set guest = me, state = 'ready', updated_at = now() where id = r.id returning * into r;
  perform public.zchat_room_accept(r.host, me);
  return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r));
end $$;
revoke all on function public.zchat_room_join(text) from public, anon;
grant execute on function public.zchat_room_join(text) to authenticated;

create or replace function public.zchat_room_quick(p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r public.zchat_game_rooms;
  res jsonb;
begin
  if me is null or not public.zchat_room_ok_user(me) then return jsonb_build_object('ok', false, 'why', 'auth'); end if;
  if p_kind is null or not (p_kind = any (public.zchat_room_kinds())) then return jsonb_build_object('ok', false, 'why', 'kind'); end if;
  select * into r from public.zchat_game_rooms x
  where x.kind = p_kind and x.state = 'wait' and x.listed and x.guest is null and x.host <> me
    and x.seen_at > now() - interval '75 seconds'
    and not public.zchat_room_blocked(me, x.host)
  order by x.created_at
  limit 1
  for update skip locked;
  if found then
    update public.zchat_game_rooms set guest = me, state = 'ready', updated_at = now() where id = r.id returning * into r;
    perform public.zchat_room_accept(r.host, me);
    update public.zchat_game_rooms set state = 'gone', updated_at = now() where host = me and state = 'wait';
    return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r));
  end if;
  res := public.zchat_room_open(p_kind, true);
  return res || jsonb_build_object('made', true);
end $$;
revoke all on function public.zchat_room_quick(text) from public, anon;
grant execute on function public.zchat_room_quick(text) to authenticated;

create or replace function public.zchat_room_ping(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r public.zchat_game_rooms;
begin
  if me is null then return jsonb_build_object('ok', false, 'why', 'auth'); end if;
  select * into r from public.zchat_game_rooms x where x.id = p_id;
  if not found or (r.host <> me and r.guest is distinct from me) then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  if r.host = me and r.state in ('wait', 'ready') and r.seen_at < now() - interval '8 seconds' then
    update public.zchat_game_rooms set seen_at = now() where id = r.id returning * into r;
  end if;
  return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r));
end $$;
revoke all on function public.zchat_room_ping(uuid) from public, anon;
grant execute on function public.zchat_room_ping(uuid) to authenticated;

create or replace function public.zchat_room_set(p_id uuid, p_state text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r public.zchat_game_rooms;
begin
  if me is null or p_state not in ('play', 'gone', 'wait') then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  select * into r from public.zchat_game_rooms x where x.id = p_id for update;
  if not found or (r.host <> me and r.guest is distinct from me) then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  if p_state = 'play' then
    if r.host <> me or r.state <> 'ready' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
    update public.zchat_game_rooms set state = 'play', updated_at = now() where id = r.id returning * into r;
  elsif p_state = 'wait' then
    if r.host <> me or r.state <> 'ready' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
    update public.zchat_game_rooms set state = 'wait', guest = null, updated_at = now(), seen_at = now() where id = r.id returning * into r;
  else
    if r.state = 'play' then return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r)); end if;
    if r.guest = me and r.host <> me then
      update public.zchat_game_rooms set state = 'wait', guest = null, updated_at = now() where id = r.id returning * into r;
    else
      update public.zchat_game_rooms set state = 'gone', updated_at = now() where id = r.id returning * into r;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'room', public.zchat_room_row(r));
end $$;
revoke all on function public.zchat_room_set(uuid, text) from public, anon;
grant execute on function public.zchat_room_set(uuid, text) to authenticated;

create or replace function public.zchat_room_lobby(p_kind text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  waiting jsonb;
  counts jsonb;
  rooms jsonb;
  playing jsonb := '{}'::jsonb;
  part jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) into waiting from (
    select x.kind, count(*) n from public.zchat_game_rooms x
    where x.state = 'wait' and x.listed and x.seen_at > now() - interval '75 seconds'
    group by x.kind
  ) q;
  select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) into counts from (
    select x.kind, count(*) * 2 n from public.zchat_game_rooms x
    where x.state in ('ready', 'play') and x.updated_at > now() - interval '20 minutes'
    group by x.kind
  ) q;
  playing := counts;
  if to_regclass('public.zchat_g1_games') is not null then
    begin
      execute $q$ select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (
        select g.kind, count(*) * 2 n from public.zchat_g1_games g where not g.done and g.updated_at > now() - interval '10 minutes' group by g.kind) q $q$ into part;
      select coalesce(jsonb_object_agg(k, greatest(coalesce((playing ->> k)::integer, 0), coalesce((part ->> k)::integer, 0))), '{}'::jsonb) into playing
      from (select jsonb_object_keys(playing || part) k) z;
    exception when others then null;
    end;
  end if;
  if to_regclass('public.zchat_gb_games') is not null then
    begin
      execute $q$ select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (
        select g.kind, count(*) * 2 n from public.zchat_gb_games g where not g.done and g.updated_at > now() - interval '10 minutes' group by g.kind) q $q$ into part;
      select coalesce(jsonb_object_agg(k, greatest(coalesce((playing ->> k)::integer, 0), coalesce((part ->> k)::integer, 0))), '{}'::jsonb) into playing
      from (select jsonb_object_keys(playing || part) k) z;
    exception when others then null;
    end;
  end if;
  select coalesce(jsonb_agg(public.zchat_room_row(x) order by x.created_at desc), '[]'::jsonb) into rooms from (
    select * from public.zchat_game_rooms x
    where x.state = 'wait' and x.listed and x.seen_at > now() - interval '75 seconds' and x.host <> me
      and (p_kind is null or x.kind = p_kind)
      and not public.zchat_room_blocked(me, x.host)
    order by x.created_at desc
    limit 30
  ) x;
  return jsonb_build_object('ok', true, 'waiting', waiting, 'playing', playing, 'rooms', rooms);
end $$;
revoke all on function public.zchat_room_lobby(text) from public, anon;
grant execute on function public.zchat_room_lobby(text) to authenticated;

do $$ begin
  if to_regclass('public.zchat_minute_jobs') is not null then
    insert into public.zchat_minute_jobs (name, command) values ('zchat-game-rooms-purge', 'delete from public.zchat_game_rooms where updated_at < now() - interval ''1 day''')
    on conflict (name) do update set command = excluded.command;
    begin
      execute 'update public.zchat_minute_jobs set every_min = 30 where name = ''zchat-game-rooms-purge''';
    exception when others then null;
    end;
  end if;
end $$;

create or replace function public.zchat_zapm_deck()
returns jsonb
language sql
volatile
as $$
  select jsonb_agg(c order by random()) from (
    select col || v as c from unnest(array['r', 'y', 'g', 'b']) col,
      unnest(array['0', '0', '1', '1', '2', '2', '3', '3', '4', '4', '5', '5', '6', '6', '7', '7', '8', '8', '9', '9', 'S', 'S', 'R', 'R', 'D', 'D', 'P', 'P', 'K', 'K', 'A', 'A']) v
    union all select w from unnest(array['W', 'V', 'X', 'T', 'C']) w, generate_series(1, 4)
  ) z
$$;
revoke all on function public.zchat_zapm_deck() from public, anon, authenticated;

create or replace function public.zchat_zapm_val(c text)
returns integer
language sql
immutable
as $$
  select case when c in ('V', 'F') then 4 when c = 'X' then 6 when c = 'T' then 10
    when length(c) = 2 and right(c, 1) = 'D' then 2 when length(c) = 2 and right(c, 1) = 'P' then 4 else 0 end
$$;
revoke all on function public.zchat_zapm_val(text) from public, anon, authenticated;

create or replace function public.zchat_zapm_fits(c text, top text, col text, pd integer, pv integer)
returns boolean
language sql
immutable
as $$
  select case
    when coalesce(pd, 0) > 0 then public.zchat_zapm_val(c) > 0 and public.zchat_zapm_val(c) >= coalesce(pv, 0)
    when length(c) = 1 then c in ('W', 'V', 'X', 'T', 'C')
    else left(c, 1) = col or (length(coalesce(top, '')) = 2 and right(c, 1) = right(top, 1))
  end
$$;
revoke all on function public.zchat_zapm_fits(text, text, text, integer, integer) from public, anon, authenticated;

create or replace function public.zchat_zapm_points(h jsonb)
returns integer
language sql
immutable
as $$
  select coalesce(sum(case when length(c) = 1 then 50 when right(c, 1) ~ '^[0-9]$' then right(c, 1)::integer else 20 end), 0)::integer
  from jsonb_array_elements_text(coalesce(h, '[]'::jsonb)) c
$$;
revoke all on function public.zchat_zapm_points(jsonb) from public, anon, authenticated;

create or replace function public.zchat_zapm_next(i integer, dir integer, k integer, outs jsonb)
returns integer
language plpgsql
immutable
as $$
declare
  j integer;
  c integer;
begin
  for j in 1..k loop
    c := (((i + dir * j) % k) + k) % k;
    if not coalesce(outs, '[]'::jsonb) @> to_jsonb(c) then return c; end if;
  end loop;
  return i;
end $$;
revoke all on function public.zchat_zapm_next(integer, integer, integer, jsonb) from public, anon, authenticated;

create or replace function public.zchat_zapm_live(k integer, outs jsonb)
returns integer
language sql
immutable
as $$ select k - coalesce(jsonb_array_length(outs), 0) $$;
revoke all on function public.zchat_zapm_live(integer, jsonb) from public, anon, authenticated;

create or replace function public.zchat_zapm_mercy(inout hands jsonb, inout deck jsonb, inout outs jsonb, out fresh jsonb)
language plpgsql
volatile
as $$
declare
  i integer;
begin
  fresh := '[]'::jsonb;
  for i in 0..jsonb_array_length(hands) - 1 loop
    if not outs @> to_jsonb(i) and jsonb_array_length(hands -> i) >= 25 then
      deck := (hands -> i) || deck;
      hands := jsonb_set(hands, array[i::text], '[]'::jsonb);
      outs := outs || to_jsonb(i);
      fresh := fresh || to_jsonb(i);
    end if;
  end loop;
end $$;
revoke all on function public.zchat_zapm_mercy(jsonb, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.zchat_zapm_finish(p_msg bigint, st jsonb, hands jsonb, deck jsonb, dpile jsonb, drawn text, m_group uuid, outs jsonb, fresh jsonb, winner integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  k integer := jsonb_array_length(st -> 'p');
  i integer;
  w integer := winner;
  pts integer := 0;
  sc jsonb;
  t integer;
begin
  if w is null and public.zchat_zapm_live(k, outs) <= 1 then
    for i in 0..k - 1 loop if not outs @> to_jsonb(i) then w := i; end if; end loop;
  end if;
  if jsonb_array_length(fresh) > 0 then
    st := st || jsonb_build_object('lt', (case when jsonb_typeof(st -> 'lt') = 'object' then st -> 'lt' else '{}'::jsonb end) || jsonb_build_object('out', fresh));
  end if;
  st := st || jsonb_build_object('out', outs, 'cnt', public.zchat_zap_counts(hands), 'pile', jsonb_array_length(deck));
  if w is not null then
    for i in 0..k - 1 loop if i <> w then pts := pts + public.zchat_zapm_points(hands -> i); end if; end loop;
    sc := coalesce(st -> 'sc', '[]'::jsonb);
    sc := jsonb_set(sc, array[w::text], to_jsonb(coalesce(public.zchat_gb_int(sc -> w), 0) + pts));
    st := st || jsonb_build_object('st', 'done', 'w', st -> 'p' ->> w, 't', null, 'sc', sc, 'open', null, 'rh', hands, 'pts', pts, 'pd', 0, 'pv', 0, 'dr', null);
    if m_group is null and k = 2 then
      perform public.zchat_gb_zap_record(st ->> 'id', public.zchat_gb_uuid(st -> 'p' ->> 0), public.zchat_gb_uuid(st -> 'p' ->> 1), public.zchat_gb_uuid(st -> 'p' ->> w));
    end if;
  else
    select (z.o - 1)::integer into t from jsonb_array_elements_text(st -> 'p') with ordinality as z(u, o) where z.u = st ->> 't';
    if t is not null and outs @> to_jsonb(t) then
      st := st || jsonb_build_object('t', st -> 'p' -> public.zchat_zapm_next(t, coalesce(public.zchat_gb_int(st -> 'dir'), 1), k, outs), 'dr', null, 'pd', 0, 'pv', 0);
      drawn := null;
    end if;
  end if;
  return jsonb_build_object('content', public.zchat_zap_save(p_msg, st, hands, deck, dpile, drawn), 'st', st);
end $$;
revoke all on function public.zchat_zapm_finish(bigint, jsonb, jsonb, jsonb, jsonb, text, uuid, jsonb, jsonb, integer) from public, anon, authenticated;

create or replace function public.zchat_zap_deal(p_msg bigint, st jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  k integer := jsonb_array_length(st -> 'p');
  mayhem boolean := (st ->> 'md') = 'mayhem';
  deck jsonb := case when (st ->> 'md') = 'mayhem' then public.zchat_zapm_deck() else public.zchat_zap_deck() end;
  hands jsonb := '[]'::jsonb;
  i integer;
  top text;
  pos integer;
  v_first integer := floor(random() * k)::integer;
  out jsonb;
begin
  for i in 0..k - 1 loop
    hands := hands || jsonb_build_array((select coalesce(jsonb_agg(c order by o), '[]'::jsonb) from jsonb_array_elements(deck) with ordinality as z(c, o) where o > i * 7 and o <= i * 7 + 7));
  end loop;
  deck := (select coalesce(jsonb_agg(c order by o), '[]'::jsonb) from jsonb_array_elements(deck) with ordinality as z(c, o) where o > k * 7);
  select (o - 1)::integer, c into pos, top from jsonb_array_elements_text(deck) with ordinality as z(c, o) where c ~ '^[rygb][0-9]$' order by o desc limit 1;
  deck := deck - pos;
  out := st || jsonb_build_object('st', 'play', 'n', public.zchat_gb_int(st -> 'n') + 1, 't', st -> 'p' -> v_first, 'dir', 1, 'top', top, 'col', left(top, 1),
    'cnt', public.zchat_zap_counts(hands), 'pile', jsonb_array_length(deck), 'dr', null, 'open', null, 'lt', jsonb_build_object('a', 'deal', 'p', v_first),
    'at', floor(extract(epoch from now()))::bigint, 'sc', (select jsonb_agg(0) from jsonb_array_elements(st -> 'p')));
  if mayhem then out := out || jsonb_build_object('pd', 0, 'pv', 0, 'out', '[]'::jsonb); end if;
  perform public.zchat_zap_save(p_msg, out, hands, deck, jsonb_build_array(top), null);
  return jsonb_build_object('st', out, 'hands', hands);
end $$;
revoke all on function public.zchat_zap_deal(bigint, jsonb) from public, anon, authenticated;

create or replace function public.zchat_zapm_play(p_msg bigint, p_card text, p_color text, p_call boolean, p_who integer default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
  hands jsonb;
  mine jsonb;
  deck jsonb;
  dpile jsonb;
  outs jsonb;
  k integer;
  dir integer;
  me_i integer;
  nxt integer;
  turn integer;
  victim integer := null;
  skipped integer := null;
  give integer := 0;
  col text;
  pos integer;
  v text;
  pd integer;
  pv integer;
  val integer;
  dropped integer := 0;
  swap_with integer := null;
  passed boolean := false;
  t record;
  c text;
  i integer;
  j integer;
  live integer[];
  moved jsonb;
  mer record;
  fin jsonb;
  win integer := null;
begin
  if me is null or p_card is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  me_i := o.idx;
  if (st ->> 'md') is distinct from 'mayhem' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if (st ->> 'st') <> 'play' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if me_i < 0 or (st ->> 't') is distinct from me::text then return jsonb_build_object('ok', false, 'why', 'turn'); end if;
  hands := o.hands; deck := o.deck; dpile := o.dpile;
  outs := coalesce(st -> 'out', '[]'::jsonb);
  pd := coalesce(public.zchat_gb_int(st -> 'pd'), 0);
  pv := coalesce(public.zchat_gb_int(st -> 'pv'), 0);
  mine := hands -> me_i;
  select (z.o - 1)::integer into pos from jsonb_array_elements_text(mine) with ordinality as z(c, o) where z.c = p_card limit 1;
  if pos is null then return jsonb_build_object('ok', false, 'why', 'card'); end if;
  if (st ->> 'dr') = me_i::text and p_card is distinct from o.drawn then return jsonb_build_object('ok', false, 'why', 'drawn'); end if;
  if not public.zchat_zapm_fits(p_card, st ->> 'top', st ->> 'col', pd, pv) then return jsonb_build_object('ok', false, 'why', 'fit'); end if;
  if length(p_card) = 1 and (p_color is null or p_color not in ('r', 'y', 'g', 'b')) then return jsonb_build_object('ok', false, 'why', 'colour'); end if;
  mine := mine - pos;
  col := case when length(p_card) = 1 then p_color else left(p_card, 1) end;
  v := case when length(p_card) = 1 then p_card else right(p_card, 1) end;
  if v = 'A' then
    select count(*) into dropped from jsonb_array_elements_text(mine) z(c) where length(z.c) = 2 and left(z.c, 1) = col;
    dpile := dpile || coalesce((select jsonb_agg(to_jsonb(z.c) order by z.o) from jsonb_array_elements_text(mine) with ordinality as z(c, o) where length(z.c) = 2 and left(z.c, 1) = col), '[]'::jsonb);
    mine := coalesce((select jsonb_agg(to_jsonb(z.c) order by z.o) from jsonb_array_elements_text(mine) with ordinality as z(c, o) where not (length(z.c) = 2 and left(z.c, 1) = col)), '[]'::jsonb);
  end if;
  hands := jsonb_set(hands, array[me_i::text], mine);
  dpile := dpile || to_jsonb(p_card);
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  val := public.zchat_zapm_val(p_card);
  if v = 'V' then dir := -dir; end if;
  nxt := public.zchat_zapm_next(me_i, dir, k, outs);
  turn := nxt;
  if jsonb_array_length(mine) = 0 then
    win := me_i;
  elsif val > 0 then
    pd := pd + val; pv := val; victim := nxt; give := pd;
  else
    pd := 0; pv := 0;
    if v = 'S' then skipped := nxt; turn := public.zchat_zapm_next(nxt, dir, k, outs);
    elsif v = 'R' then
      dir := -dir;
      if public.zchat_zapm_live(k, outs) = 2 then turn := me_i; skipped := nxt; else turn := public.zchat_zapm_next(me_i, dir, k, outs); end if;
    elsif v = 'K' then turn := me_i; skipped := -1;
    elsif v = 'C' then
      victim := nxt;
      for j in 1..60 loop
        select * into t from public.zchat_zap_take(deck, dpile, 1);
        deck := t.deck; dpile := t.dpile;
        exit when jsonb_array_length(t.got) = 0;
        hands := jsonb_set(hands, array[nxt::text], (hands -> nxt) || t.got);
        give := give + 1;
        c := t.got ->> 0;
        exit when length(c) = 2 and left(c, 1) = col;
      end loop;
      turn := public.zchat_zapm_next(nxt, dir, k, outs);
    elsif v = '7' then
      if p_who is not null and p_who >= 0 and p_who < k and p_who <> me_i and not outs @> to_jsonb(p_who) then swap_with := p_who;
      else
        select z.i into swap_with from generate_series(0, k - 1) z(i)
        where z.i <> me_i and not outs @> to_jsonb(z.i) order by jsonb_array_length(hands -> z.i), z.i limit 1;
      end if;
      if swap_with is not null then
        moved := hands -> me_i;
        hands := jsonb_set(hands, array[me_i::text], hands -> swap_with);
        hands := jsonb_set(hands, array[swap_with::text], moved);
      end if;
    elsif v = '0' then
      select array_agg(z.i order by z.i) into live from generate_series(0, k - 1) z(i) where not outs @> to_jsonb(z.i);
      if array_length(live, 1) > 1 then
        moved := hands;
        for i in 1..array_length(live, 1) loop
          j := live[(((i - 1 + dir) % array_length(live, 1)) + array_length(live, 1)) % array_length(live, 1) + 1];
          hands := jsonb_set(hands, array[j::text], moved -> live[i]);
        end loop;
        passed := true;
      end if;
    end if;
  end if;
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'top', p_card, 'col', col, 'dir', dir, 'dr', null, 'pd', pd, 'pv', pv,
    't', st -> 'p' -> turn,
    'open', case when jsonb_array_length(hands -> me_i) = 1 and not coalesce(p_call, false) then to_jsonb(me_i) else null end,
    'lt', jsonb_build_object('a', 'play', 'p', me_i, 'c', p_card, 'col', col, 'v', victim, 'k', case when victim is null then 0 else give end, 'sk', skipped,
      'cl', coalesce(p_call, false) and jsonb_array_length(hands -> me_i) = 1, 'pd', pd, 'sw', swap_with, 'ps', passed, 'ds', dropped),
    'at', floor(extract(epoch from now()))::bigint);
  select * into mer from public.zchat_zapm_mercy(hands, deck, outs);
  fin := public.zchat_zapm_finish(p_msg, st, mer.hands, mer.deck, dpile, null, o.m_group, mer.outs, mer.fresh, win);
  return jsonb_build_object('ok', true, 'content', fin ->> 'content', 'hand', mer.hands -> me_i);
end $$;

create or replace function public.zchat_zapm_draw(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
  hands jsonb;
  deck jsonb;
  dpile jsonb;
  outs jsonb;
  t record;
  card text := null;
  k integer;
  dir integer;
  pd integer;
  n integer := 0;
  j integer;
  keep boolean := false;
  mer record;
  fin jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'md') is distinct from 'mayhem' or (st ->> 'st') <> 'play' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if o.idx < 0 or (st ->> 't') is distinct from me::text then return jsonb_build_object('ok', false, 'why', 'turn'); end if;
  if (st ->> 'dr') is not null then return jsonb_build_object('ok', false, 'why', 'drew'); end if;
  hands := o.hands; deck := o.deck; dpile := o.dpile;
  outs := coalesce(st -> 'out', '[]'::jsonb);
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  pd := coalesce(public.zchat_gb_int(st -> 'pd'), 0);
  if pd > 0 then
    select * into t from public.zchat_zap_take(deck, dpile, pd);
    deck := t.deck; dpile := t.dpile;
    hands := jsonb_set(hands, array[o.idx::text], (hands -> o.idx) || t.got);
    n := jsonb_array_length(t.got);
    st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'open', null, 'dr', null, 'pd', 0, 'pv', 0,
      't', st -> 'p' -> public.zchat_zapm_next(o.idx, dir, k, outs), 'lt', jsonb_build_object('a', 'take', 'p', o.idx, 'k', n), 'at', floor(extract(epoch from now()))::bigint);
  else
    for j in 1..40 loop
      select * into t from public.zchat_zap_take(deck, dpile, 1);
      deck := t.deck; dpile := t.dpile;
      exit when jsonb_array_length(t.got) = 0;
      hands := jsonb_set(hands, array[o.idx::text], (hands -> o.idx) || t.got);
      n := n + 1;
      card := t.got ->> 0;
      if public.zchat_zapm_fits(card, st ->> 'top', st ->> 'col', 0, 0) then keep := true; exit; end if;
      exit when jsonb_array_length(hands -> o.idx) >= 25;
    end loop;
    if n = 0 then return jsonb_build_object('ok', false, 'why', 'empty'); end if;
    st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'open', null, 'at', floor(extract(epoch from now()))::bigint,
      'dr', case when keep then to_jsonb(o.idx) else null end,
      't', case when keep then st -> 't' else st -> 'p' -> public.zchat_zapm_next(o.idx, dir, k, outs) end,
      'lt', jsonb_build_object('a', 'draw', 'p', o.idx, 'k', n, 'keep', keep));
  end if;
  select * into mer from public.zchat_zapm_mercy(hands, deck, outs);
  fin := public.zchat_zapm_finish(p_msg, st, mer.hands, mer.deck, dpile, case when keep and not mer.outs @> to_jsonb(o.idx) then card else null end, o.m_group, mer.outs, mer.fresh, null);
  return jsonb_build_object('ok', true, 'content', fin ->> 'content', 'hand', mer.hands -> o.idx, 'drawn', case when keep then card else null end, 'k', n);
end $$;

create or replace function public.zchat_zapm_pass(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
  k integer;
  dir integer;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'md') is distinct from 'mayhem' or (st ->> 'st') <> 'play' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if o.idx < 0 or (st ->> 't') is distinct from me::text or (st ->> 'dr') is distinct from o.idx::text then return jsonb_build_object('ok', false, 'why', 'turn'); end if;
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'dr', null, 'open', null,
    't', st -> 'p' -> public.zchat_zapm_next(o.idx, dir, k, coalesce(st -> 'out', '[]'::jsonb)),
    'lt', jsonb_build_object('a', 'pass', 'p', o.idx), 'at', floor(extract(epoch from now()))::bigint);
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, o.hands, o.deck, o.dpile, null), 'hand', o.hands -> o.idx);
end $$;

create or replace function public.zchat_zapm_catch(p_msg bigint, p_who integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
  t record;
  hands jsonb;
  mer record;
  fin jsonb;
begin
  if me is null or p_who is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'md') is distinct from 'mayhem' or (st ->> 'st') <> 'play' or o.idx < 0 or o.idx = p_who or (st ->> 'open') is distinct from p_who::text then return jsonb_build_object('ok', false, 'why', 'late'); end if;
  select * into t from public.zchat_zap_take(o.deck, o.dpile, 2);
  hands := jsonb_set(o.hands, array[p_who::text], (o.hands -> p_who) || t.got);
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'open', null, 'lt', jsonb_build_object('a', 'catch', 'p', o.idx, 'v', p_who, 'k', jsonb_array_length(t.got)));
  select * into mer from public.zchat_zapm_mercy(hands, t.deck, coalesce(st -> 'out', '[]'::jsonb));
  fin := public.zchat_zapm_finish(p_msg, st, mer.hands, mer.deck, t.dpile, o.drawn, o.m_group, mer.outs, mer.fresh, null);
  return jsonb_build_object('ok', true, 'content', fin ->> 'content', 'hand', mer.hands -> o.idx);
end $$;

create or replace function public.zchat_zapm_nudge(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
  cur integer;
  t record;
  hands jsonb;
  deck jsonb;
  dpile jsonb;
  k integer;
  dir integer;
  pd integer;
  n integer := 0;
  mer record;
  fin jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'md') is distinct from 'mayhem' or (st ->> 'st') <> 'play' or o.idx < 0 or (st ->> 't') = me::text then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if floor(extract(epoch from now())) - coalesce((st ->> 'at')::bigint, 0) < 60 then return jsonb_build_object('ok', false, 'why', 'wait'); end if;
  select (z.o - 1)::integer into cur from jsonb_array_elements_text(st -> 'p') with ordinality as z(u, o) where z.u = st ->> 't';
  if cur is null then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  pd := coalesce(public.zchat_gb_int(st -> 'pd'), 0);
  hands := o.hands; deck := o.deck; dpile := o.dpile;
  if (st ->> 'dr') is null then
    select * into t from public.zchat_zap_take(deck, dpile, greatest(1, pd));
    deck := t.deck; dpile := t.dpile;
    hands := jsonb_set(hands, array[cur::text], (hands -> cur) || t.got);
    n := jsonb_array_length(t.got);
  end if;
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'dr', null, 'open', null, 'pd', 0, 'pv', 0,
    't', st -> 'p' -> public.zchat_zapm_next(cur, dir, k, coalesce(st -> 'out', '[]'::jsonb)),
    'lt', jsonb_build_object('a', 'late', 'p', cur, 'k', n), 'at', floor(extract(epoch from now()))::bigint);
  select * into mer from public.zchat_zapm_mercy(hands, deck, coalesce(st -> 'out', '[]'::jsonb));
  fin := public.zchat_zapm_finish(p_msg, st, mer.hands, mer.deck, dpile, null, o.m_group, mer.outs, mer.fresh, null);
  return jsonb_build_object('ok', true, 'content', fin ->> 'content', 'hand', mer.hands -> o.idx);
end $$;

do $$
declare f text;
begin
  foreach f in array array['zchat_zapm_play(bigint, text, text, boolean, integer)', 'zchat_zapm_draw(bigint)', 'zchat_zapm_pass(bigint)', 'zchat_zapm_catch(bigint, integer)', 'zchat_zapm_nudge(bigint)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

create or replace function public.zchat_gb_check_insert(p_id bigint, p_sender uuid, p_receiver uuid, p_group uuid, p_content text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  st jsonb := public.zchat_gb_json(substr(p_content, 7));
  k text;
  gid text;
  v_n integer;
  mx integer;
  x uuid;
  o uuid;
  g record;
  ex jsonb;
begin
  if pg_trigger_depth() < 1 then perform public.zchat_gb_bad('Not allowed'); end if;
  if st is null or jsonb_typeof(st) <> 'object' then return; end if;
  k := st ->> 'g';
  if k is null or k not in ('crm', 'zap') then return; end if;
  if me is null or p_sender is distinct from me then perform public.zchat_gb_bad('Game moves are sent in your own name'); end if;
  gid := st ->> 'id';
  v_n := public.zchat_gb_int(st -> 'n');
  if gid is null or length(gid) > 64 or gid !~ '^[A-Za-z0-9-]+$' or v_n is null or v_n < 0 or length(p_content) > 24000 then perform public.zchat_gb_bad('That game is not valid'); end if;
  if not public.zchat_gb_hit('move', 120, 60) then perform public.zchat_gb_bad('Too many moves in a minute. Wait a moment and try again.'); end if;
  if k = 'zap' then
    mx := public.zchat_gb_int(st -> 'mx');
    if p_group is null and (p_receiver is null or mx is distinct from 2) then perform public.zchat_gb_bad('That game is not valid'); end if;
    if mx is null or mx not between 2 and 4 then perform public.zchat_gb_bad('That game is not valid'); end if;
    ex := jsonb_build_object('g', 'zap', 'id', gid, 'n', 0, 'st', 'lobby', 'p', jsonb_build_array(me::text), 'by', me::text, 'mx', mx, 't', null, 'w', null);
    if (st ->> 'md') = 'mayhem' then ex := ex || jsonb_build_object('md', 'mayhem'); end if;
    if ex <> st then perform public.zchat_gb_bad('That game is not valid'); end if;
    if exists (select 1 from public.zchat_gb_cards c where c.game_id = gid) then perform public.zchat_gb_bad('That game is not valid'); end if;
    insert into public.zchat_gb_cards (msg_id, game_id, grp, a, b) values (p_id, gid, p_group, me, p_receiver);
    return;
  end if;
  if p_group is not null or p_receiver is null then perform public.zchat_gb_bad('This game is played in a chat between two people'); end if;
  x := public.zchat_gb_uuid(st ->> 'x');
  o := public.zchat_gb_uuid(st ->> 'o');
  if x is null or o is null or x = o or not ((x = p_sender and o = p_receiver) or (x = p_receiver and o = p_sender)) then
    perform public.zchat_gb_bad('The players do not match this chat');
  end if;
  select * into g from public.zchat_gb_games where game_id = gid for update;
  if not found then
    if v_n <> 0 or x <> p_sender or not public.zchat_gb_crm_initial_ok(st) then perform public.zchat_gb_bad('That game is not valid'); end if;
    insert into public.zchat_gb_games (game_id, kind, a, b, n, st, msg_id, done) values (gid, k, x, o, 0, st, p_id, false);
    return;
  end if;
  if g.kind <> k or g.a <> x or g.b <> o then perform public.zchat_gb_bad('That game is not valid'); end if;
  if g.done then perform public.zchat_gb_bad('This game is already over'); end if;
  if v_n <> g.n + 1 then perform public.zchat_gb_bad('That move is out of date. Open the chat again to catch up.'); end if;
  ex := public.zchat_gb_crm_step(g.st, st, p_sender);
  if ex is null or ex <> st then perform public.zchat_gb_bad('That move is not allowed'); end if;
  update public.zchat_gb_games set n = v_n, st = ex, msg_id = p_id, done = (ex ->> 'w') is not null, updated_at = now() where game_id = gid;
end $$;
revoke all on function public.zchat_gb_check_insert(bigint, uuid, uuid, uuid, text) from public, anon;
grant execute on function public.zchat_gb_check_insert(bigint, uuid, uuid, uuid, text) to authenticated;

do $$
declare
  v text[];
  t record;
begin
  for t in select * from (values
    ('shop_items', 'shop_items_kind_check'),
    ('user_rewards', 'user_rewards_kind_check'),
    ('wishlist_items', 'wishlist_items_kind_check')
  ) as x(tbl, con) loop
    if to_regclass('public.' || t.tbl) is null then
      continue;
    end if;
    select array_agg(distinct m[1] order by m[1]) into v
    from pg_constraint c, regexp_matches(pg_get_constraintdef(c.oid), '([a-z_]+)', 'g') as m
    where c.conname = t.con and c.conrelid = ('public.' || t.tbl)::regclass and m[1] not in ('kind', 'text');
    if v is null then
      continue;
    end if;
    if not ('gamekit' = any (v)) then
      v := v || 'gamekit'::text;
      execute format('alter table public.%I drop constraint if exists %I', t.tbl, t.con);
      execute format('alter table public.%I add constraint %I check (kind = any (%L::text[]))', t.tbl, t.con, v);
    end if;
  end loop;
end $$;

do $$ begin
  if to_regclass('public.shop_items') is not null then
    insert into public.shop_items (kind, key, label, rarity, price, active) values
      ('gamekit', 'chess-club', 'Club green chess set', 'rare', 200, true),
      ('gamekit', 'chess-marble', 'Marble chess set', 'epic', 400, true),
      ('gamekit', 'chess-royal', 'Royal gold chess set', 'legendary', 800, true),
      ('gamekit', 'chess-midnight', 'Midnight glass chess set', 'mythic', 1200, true),
      ('gamekit', 'ckr-candy', 'Candy checkers', 'rare', 200, true),
      ('gamekit', 'ckr-stone', 'River stone checkers', 'epic', 350, true),
      ('gamekit', 'ckr-royal', 'Royal checkers', 'legendary', 700, true),
      ('gamekit', 'pool-blue', 'Tournament blue pool table', 'rare', 250, true),
      ('gamekit', 'pool-wine', 'Wine red pool table', 'epic', 400, true),
      ('gamekit', 'pool-velvet', 'Velvet purple pool table', 'epic', 400, true),
      ('gamekit', 'pool-midnight', 'Midnight pool table', 'legendary', 900, true),
      ('gamekit', 'crm-walnut', 'Dark walnut carrom board', 'epic', 350, true),
      ('gamekit', 'crm-ice', 'Ice maple carrom board', 'legendary', 700, true)
    on conflict (kind, key) do update set label = excluded.label, rarity = excluded.rarity, price = excluded.price, active = true;
  end if;
end $$;

create or replace function public.zchat_buy_item(p_kind text, p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  it public.shop_items%rowtype;
  bal integer;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  if p_kind is null or p_kind not in ('frame', 'nameplate', 'effect', 'charm', 'bubble', 'namestyle', 'theme', 'reaction', 'wallpaper', 'stickerpack', 'soundpack', 'typing', 'gamekit') then
    return jsonb_build_object('ok', false, 'reason', 'That item is not in the Shop.');
  end if;
  select * into it from public.shop_items where kind = p_kind and key = p_key and active;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'That item is not in the Shop.');
  end if;
  perform public.zchat_wallet_lock(me);
  if public.zchat_owns_forever(me, p_kind, p_key) then
    return jsonb_build_object('ok', false, 'reason', 'You already have this one.');
  end if;
  bal := public.zchat_coins_move(me, -it.price, 'shop', it.label, null);
  if bal is null then
    return jsonb_build_object('ok', false, 'reason', 'You do not have enough coins.');
  end if;
  perform public.zchat_grant_item(me, p_kind, p_key, null, true);
  return jsonb_build_object('ok', true, 'coins', bal, 'expires_at', null);
end $$;
revoke all on function public.zchat_buy_item(text, text) from public, anon;
grant execute on function public.zchat_buy_item(text, text) to authenticated;

create table if not exists public.zchat_game_kits (
  user_id uuid primary key,
  kit jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.zchat_game_kits enable row level security;
revoke all on public.zchat_game_kits from public, anon, authenticated;
grant all on public.zchat_game_kits to service_role;

create or replace function public.zchat_game_kit_set(p_game text, p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  k text := nullif(btrim(coalesce(p_key, '')), '');
  cur jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if p_game is null or p_game not in ('chess', 'ckr', 'pool', 'crm') then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  if k is not null then
    if left(k, length(p_game) + 1) <> p_game || '-' or length(k) > 40 then return jsonb_build_object('ok', false, 'why', 'key'); end if;
    if not exists (select 1 from public.user_rewards r where r.user_id = me and r.kind = 'gamekit' and r.reward_key = k and (r.expires_at is null or r.expires_at > now())) then
      return jsonb_build_object('ok', false, 'why', 'own');
    end if;
  end if;
  select g.kit into cur from public.zchat_game_kits g where g.user_id = me;
  cur := coalesce(cur, '{}'::jsonb) || jsonb_build_object(p_game, coalesce(k, ''));
  insert into public.zchat_game_kits (user_id, kit, updated_at) values (me, cur, now())
  on conflict (user_id) do update set kit = excluded.kit, updated_at = now();
  return jsonb_build_object('ok', true, 'kit', cur);
end $$;
revoke all on function public.zchat_game_kit_set(text, text) from public, anon;
grant execute on function public.zchat_game_kit_set(text, text) to authenticated;

create or replace function public.zchat_game_kit_get()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select g.kit from public.zchat_game_kits g where g.user_id = auth.uid()), '{}'::jsonb)
$$;
revoke all on function public.zchat_game_kit_get() from public, anon;
grant execute on function public.zchat_game_kit_get() to authenticated;

create table if not exists public.zchat_tz_names (name text primary key);
alter table public.zchat_tz_names enable row level security;
revoke all on public.zchat_tz_names from public, anon, authenticated;
grant select on public.zchat_tz_names to anon, authenticated;
grant all on public.zchat_tz_names to service_role;
drop policy if exists "zchat tz names read" on public.zchat_tz_names;
create policy "zchat tz names read" on public.zchat_tz_names for select to anon, authenticated using (true);
insert into public.zchat_tz_names (name) select z.name from pg_timezone_names z on conflict do nothing;

do $$
declare
  r record;
  def text;
  n integer := 0;
begin
  for r in
    select p.oid, p.proname
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.prokind = 'f' and p.prosrc like '%pg_timezone_names%'
  loop
    def := pg_get_functiondef(r.oid);
    if def ~* '(utc_offset|abbrev|is_dst)' then
      continue;
    end if;
    def := regexp_replace(def, '(pg_catalog\.)?pg_timezone_names', 'public.zchat_tz_names', 'g');
    execute def;
    n := n + 1;
  end loop;
  raise notice 'zchat: % functions now use the cached time zone list', n;
end $$;

create index if not exists zchat_messages_group_created on public.messages (group_id, created_at desc) where group_id is not null;

do $$ begin
  if to_regclass('public.hidden_messages') is not null then
    execute 'create index if not exists zchat_hidden_messages_user on public.hidden_messages (user_id)';
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
