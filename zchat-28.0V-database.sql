begin;
create table if not exists public.chat_locks (
  conversation_id uuid not null,
  owner_id uuid not null,
  pin_hash text,
  created_at timestamptz not null default now(),
  primary key (conversation_id, owner_id)
);
create index if not exists chat_locks_owner on public.chat_locks (owner_id);
alter table public.chat_locks enable row level security;
revoke all on public.chat_locks from public, anon, authenticated;
grant select, insert, update, delete on public.chat_locks to authenticated;
grant all on public.chat_locks to service_role;
drop policy if exists "zchat chat locks own" on public.chat_locks;
create policy "zchat chat locks own" on public.chat_locks for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
do $$ begin
  if to_regprocedure('public.zchat_session_ok()') is not null then
    drop policy if exists zchat_session_gate on public.chat_locks;
    create policy zchat_session_gate on public.chat_locks as restrictive for all to authenticated using ((select public.zchat_session_ok()));
  end if;
end $$;

create or replace function public.zchat_reply_reads()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.group_id is null and new.receiver_id is not null and new.sender_id is not null and new.sender_id <> new.receiver_id then
    update public.messages set read = true, delivered = true
     where receiver_id = new.sender_id and sender_id = new.receiver_id and group_id is null and read = false and created_at <= new.created_at;
  end if;
  return null;
end $$;
revoke all on function public.zchat_reply_reads() from public, anon, authenticated;
drop trigger if exists zchat_reply_reads on public.messages;
create trigger zchat_reply_reads after insert on public.messages for each row execute function public.zchat_reply_reads();

do $$ begin
  if to_regclass('public.zchat_minute_jobs') is not null then
    alter table public.zchat_minute_jobs add column if not exists every_min int not null default 1;
    update public.zchat_minute_jobs set every_min = case
      when name ~ '(safety|scheduled|call.plans|live.plans)' then 1
      when name ~ 'polls' then 2
      when name ~ '(purge|expired)' then 10
      when name ~ '(status|pins|capsule|gift|creator)' then 5
      else every_min end;
  end if;
end $$;
do $$ begin
  if to_regclass('public.zchat_minute_jobs') is not null then
    execute $f$
create or replace function public.zchat_minute_tick() returns void language plpgsql security definer set search_path = public as $b$
declare j record; t0 timestamptz;
begin
  for j in select name, command from public.zchat_minute_jobs
            where active and (last_run is null or now() - last_run >= make_interval(mins => greatest(1, every_min)) - interval '20 seconds')
            order by name loop
    t0 := clock_timestamp();
    begin
      execute j.command;
      update public.zchat_minute_jobs set last_run = now(), last_ms = (extract(epoch from clock_timestamp() - t0) * 1000)::int, last_error = null where name = j.name;
    exception when others then
      update public.zchat_minute_jobs set last_run = now(), last_ms = (extract(epoch from clock_timestamp() - t0) * 1000)::int, last_error = left(sqlerrm, 300) where name = j.name;
    end;
  end loop;
end $b$;
$f$;
    revoke all on function public.zchat_minute_tick() from public, anon, authenticated;
  end if;
end $$;


create table if not exists public.zchat_game_xp (
  user_id uuid not null,
  game text not null,
  xp integer not null default 0,
  plays integer not null default 0,
  wins integer not null default 0,
  day date not null default current_date,
  day_xp integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

create table if not exists public.zchat_game_xp_log (
  user_id uuid not null,
  game_id text not null,
  game text not null,
  result text not null,
  gained integer not null default 0,
  at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists zchat_game_xp_log_user_at on public.zchat_game_xp_log (user_id, at desc);
create index if not exists zchat_game_xp_game_xp on public.zchat_game_xp (game, xp desc);

alter table public.zchat_game_xp enable row level security;
alter table public.zchat_game_xp_log enable row level security;

revoke all on table public.zchat_game_xp from public, anon;
revoke all on table public.zchat_game_xp_log from public, anon;
revoke all on table public.zchat_game_xp from authenticated;
revoke all on table public.zchat_game_xp_log from authenticated;
grant select on table public.zchat_game_xp to authenticated;
grant select on table public.zchat_game_xp_log to authenticated;
grant all on table public.zchat_game_xp to service_role;
grant all on table public.zchat_game_xp_log to service_role;

drop policy if exists zchat_game_xp_own on public.zchat_game_xp;
create policy zchat_game_xp_own on public.zchat_game_xp for select to authenticated using (user_id = auth.uid());
drop policy if exists zchat_game_xp_log_own on public.zchat_game_xp_log;
create policy zchat_game_xp_log_own on public.zchat_game_xp_log for select to authenticated using (user_id = auth.uid());

create or replace function public.zchat_game_level(p_xp integer)
returns integer
language sql
immutable
set search_path = public
as $$
  select greatest(1, floor((-40 + sqrt(6400 + 80 * greatest(coalesce(p_xp, 0), 0)::numeric)) / 40)::integer)
$$;

create or replace function public.zchat_game_xp_finish(p_game_id text, p_peer uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_content text;
  v_st jsonb;
  v_game text;
  v_mark text;
  v_w text;
  v_result text;
  v_gain integer;
  v_row public.zchat_game_xp%rowtype;
  v_prev integer := 0;
  v_recent integer;
  v_bot boolean := false;
  v_allowed text[] := array['pool','chess','ckr','golf','crm','zap','c4','ship','ttt','dots','reversi','gomoku','hang','rps','wduel','tug','qrace','rrace'];
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'why', 'auth');
  end if;
  if p_game_id is null or length(p_game_id) < 8 or length(p_game_id) > 80 or p_peer is null or p_peer = v_uid then
    return jsonb_build_object('ok', false, 'why', 'bad');
  end if;
  if exists (select 1 from public.zchat_game_xp_log l where l.user_id = v_uid and l.game_id = p_game_id) then
    select x.* into v_row from public.zchat_game_xp x join public.zchat_game_xp_log l on l.user_id = x.user_id and l.game = x.game
      where l.user_id = v_uid and l.game_id = p_game_id limit 1;
    return jsonb_build_object('ok', true, 'dup', true, 'game', v_row.game, 'xp', coalesce(v_row.xp, 0), 'level', public.zchat_game_level(coalesce(v_row.xp, 0)), 'gained', 0);
  end if;
  select count(*) into v_recent from public.zchat_game_xp_log l where l.user_id = v_uid and l.at > now() - interval '1 minute';
  if v_recent >= 6 then
    return jsonb_build_object('ok', false, 'why', 'slow');
  end if;
  if public.zchat_blocked_with(p_peer) then
    return jsonb_build_object('ok', false, 'why', 'blocked');
  end if;
  select m.content into v_content
    from public.messages m
    where m.group_id is null
      and coalesce(m.deleted, false) = false
      and ((m.sender_id = v_uid and m.receiver_id = p_peer) or (m.sender_id = p_peer and m.receiver_id = v_uid))
      and m.created_at > now() - interval '3 days'
      and m.content like 'zgame:%'
      and (position(('"id":"' || p_game_id || '"') in m.content) > 0 or position(('"id": "' || p_game_id || '"') in m.content) > 0)
    order by m.id desc
    limit 1;
  if v_content is null then
    return jsonb_build_object('ok', false, 'why', 'unknown');
  end if;
  begin
    v_st := substr(v_content, 7)::jsonb;
  exception when others then
    return jsonb_build_object('ok', false, 'why', 'unknown');
  end;
  if coalesce(v_st->>'id', '') <> p_game_id then
    return jsonb_build_object('ok', false, 'why', 'unknown');
  end if;
  v_game := v_st->>'g';
  if v_game is null or not (v_game = any (v_allowed)) then
    return jsonb_build_object('ok', false, 'why', 'game');
  end if;
  if v_game = 'zap' then
    if coalesce(v_st->>'st', '') <> 'done' then
      return jsonb_build_object('ok', false, 'why', 'open');
    end if;
    if jsonb_typeof(v_st->'p') is distinct from 'array' or jsonb_array_length(v_st->'p') <> 2 or not ((v_st->'p') ? v_uid::text) or not ((v_st->'p') ? p_peer::text) then
      return jsonb_build_object('ok', false, 'why', 'player');
    end if;
    v_w := v_st->>'w';
    if v_w is null then
      return jsonb_build_object('ok', false, 'why', 'ended');
    end if;
    v_result := case when v_w = v_uid::text then 'win' when v_w = p_peer::text then 'lose' else null end;
    if v_result is null then
      return jsonb_build_object('ok', false, 'why', 'player');
    end if;
  else
    if (v_st->>'x') = v_uid::text and (v_st->>'o') = p_peer::text then
      v_mark := 'x';
    elsif (v_st->>'o') = v_uid::text and (v_st->>'x') = p_peer::text then
      v_mark := 'o';
    else
      return jsonb_build_object('ok', false, 'why', 'player');
    end if;
    v_w := v_st->>'w';
    if v_w is null or v_w not in ('x', 'o', 'd') then
      return jsonb_build_object('ok', false, 'why', 'open');
    end if;
    if v_game in ('tug', 'qrace', 'rrace') and coalesce(v_st->>'st', '') <> 'done' then
      return jsonb_build_object('ok', false, 'why', 'open');
    end if;
    v_result := case when v_w = 'd' then 'draw' when v_w = v_mark then 'win' else 'lose' end;
  end if;
  v_gain := case v_result when 'win' then 30 when 'draw' then 18 else 10 end;
  select coalesce(p.is_bot, false) into v_bot from public.profiles p where p.id = p_peer;
  if coalesce(v_bot, false) then
    v_gain := greatest(5, v_gain / 2);
  end if;
  insert into public.zchat_game_xp (user_id, game) values (v_uid, v_game) on conflict (user_id, game) do nothing;
  select * into v_row from public.zchat_game_xp where user_id = v_uid and game = v_game for update;
  v_prev := v_row.xp;
  if v_row.day <> current_date then
    v_row.day_xp := 0;
  end if;
  v_gain := greatest(0, least(v_gain, 400 - v_row.day_xp));
  update public.zchat_game_xp
    set xp = xp + v_gain,
        plays = plays + 1,
        wins = wins + case when v_result = 'win' then 1 else 0 end,
        day = current_date,
        day_xp = v_row.day_xp + v_gain,
        updated_at = now()
    where user_id = v_uid and game = v_game
    returning * into v_row;
  insert into public.zchat_game_xp_log (user_id, game_id, game, result, gained) values (v_uid, p_game_id, v_game, v_result, v_gain)
    on conflict (user_id, game_id) do nothing;
  delete from public.zchat_game_xp_log l where l.user_id = v_uid and l.at < now() - interval '120 days';
  return jsonb_build_object(
    'ok', true,
    'game', v_game,
    'result', v_result,
    'gained', v_gain,
    'xp', v_row.xp,
    'level', public.zchat_game_level(v_row.xp),
    'prev_level', public.zchat_game_level(v_prev),
    'wins', v_row.wins,
    'plays', v_row.plays
  );
end;
$$;

create or replace function public.zchat_game_xp_mine()
returns table (game text, xp integer, level integer, plays integer, wins integer)
language sql
stable
security definer
set search_path = public
as $$
  select x.game, x.xp, public.zchat_game_level(x.xp), x.plays, x.wins
  from public.zchat_game_xp x
  where x.user_id = auth.uid()
  order by x.xp desc
  limit 60
$$;

create or replace function public.zchat_game_xp_levels(p_game text, p_users uuid[])
returns table (user_id uuid, level integer, xp integer)
language sql
stable
security definer
set search_path = public
as $$
  select x.user_id, public.zchat_game_level(x.xp), x.xp
  from public.zchat_game_xp x
  where auth.uid() is not null
    and x.game = p_game
    and x.user_id = any (p_users[1:100])
    and (x.user_id = auth.uid() or not public.zchat_blocked_with(x.user_id))
$$;

revoke all on function public.zchat_game_level(integer) from public;
revoke all on function public.zchat_game_xp_finish(text, uuid) from public;
revoke all on function public.zchat_game_xp_mine() from public;
revoke all on function public.zchat_game_xp_levels(text, uuid[]) from public;
grant execute on function public.zchat_game_level(integer) to authenticated, service_role;
grant execute on function public.zchat_game_xp_finish(text, uuid) to authenticated, service_role;
grant execute on function public.zchat_game_xp_mine() to authenticated, service_role;
grant execute on function public.zchat_game_xp_levels(text, uuid[]) to authenticated, service_role;

create table if not exists public.zchat_gb_hits (
  user_id uuid not null,
  key text not null,
  win timestamptz not null default now(),
  n integer not null default 0,
  primary key (user_id, key)
);
alter table public.zchat_gb_hits enable row level security;
revoke all on table public.zchat_gb_hits from public, anon, authenticated;
grant all on table public.zchat_gb_hits to service_role;

create table if not exists public.zchat_gb_cards (
  msg_id bigint primary key,
  game_id text not null unique,
  grp uuid,
  a uuid,
  b uuid,
  hands jsonb not null default '[]'::jsonb,
  deck jsonb not null default '[]'::jsonb,
  dpile jsonb not null default '[]'::jsonb,
  drawn text,
  updated_at timestamptz not null default now()
);
alter table public.zchat_gb_cards enable row level security;
revoke all on table public.zchat_gb_cards from public, anon, authenticated;
grant all on table public.zchat_gb_cards to service_role;

create table if not exists public.zchat_gb_games (
  game_id text primary key,
  kind text not null,
  a uuid not null,
  b uuid not null,
  n integer not null default 0,
  st jsonb not null default '{}'::jsonb,
  msg_id bigint,
  done boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.zchat_gb_games enable row level security;
revoke all on table public.zchat_gb_games from public, anon, authenticated;
grant all on table public.zchat_gb_games to service_role;

create or replace function public.zchat_gb_hit(p_key text, p_max integer, p_secs integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v integer;
begin
  if me is null then return false; end if;
  insert into public.zchat_gb_hits as h (user_id, key, win, n) values (me, p_key, now(), 1)
  on conflict (user_id, key) do update
    set n = case when h.win < now() - make_interval(secs => p_secs) then 1 else h.n + 1 end,
        win = case when h.win < now() - make_interval(secs => p_secs) then now() else h.win end
  returning n into v;
  return v <= p_max;
end $$;
revoke all on function public.zchat_gb_hit(text, integer, integer) from public, anon, authenticated;

create or replace function public.zchat_gb_json(p text)
returns jsonb
language plpgsql
immutable
as $$
begin
  return p::jsonb;
exception when others then
  return null;
end $$;
revoke all on function public.zchat_gb_json(text) from public, anon;
grant execute on function public.zchat_gb_json(text) to authenticated, service_role;

create or replace function public.zchat_gb_int(v jsonb)
returns integer
language sql
immutable
as $$
  select case when jsonb_typeof(v) = 'number' and (v #>> '{}') ~ '^-?[0-9]{1,9}$' then (v #>> '{}')::integer else null end
$$;
revoke all on function public.zchat_gb_int(jsonb) from public, anon;
grant execute on function public.zchat_gb_int(jsonb) to authenticated, service_role;

create or replace function public.zchat_gb_num(v jsonb)
returns numeric
language sql
immutable
as $$
  select case when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric else null end
$$;
revoke all on function public.zchat_gb_num(jsonb) from public, anon;
grant execute on function public.zchat_gb_num(jsonb) to authenticated, service_role;

create or replace function public.zchat_gb_uuid(p text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p::uuid;
exception when others then
  return null;
end $$;
revoke all on function public.zchat_gb_uuid(text) from public, anon;
grant execute on function public.zchat_gb_uuid(text) to authenticated, service_role;

create or replace function public.zchat_gb_bad(p_msg text)
returns void
language plpgsql
as $$
begin
  raise exception '%', p_msg using errcode = 'P0001';
end $$;
revoke all on function public.zchat_gb_bad(text) from public, anon;
grant execute on function public.zchat_gb_bad(text) to authenticated, service_role;

create or replace function public.zchat_gb_keys(j jsonb)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(k order by k), '{}') from jsonb_object_keys(j) k
$$;
revoke all on function public.zchat_gb_keys(jsonb) from public, anon;
grant execute on function public.zchat_gb_keys(jsonb) to authenticated, service_role;

create or replace function public.zchat_gb_crm_initial_ok(st jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  e jsonb;
  pid integer;
  px numeric;
  py numeric;
  ids integer[] := '{}';
begin
  if public.zchat_gb_keys(st) <> array['b', 'ev', 'g', 'id', 'lb', 'ls', 'n', 'o', 'pts', 'qc', 'qp', 't', 'w', 'wc', 'why', 'x'] then return false; end if;
  if (st ->> 'wc') is distinct from 'o' or (st ->> 't') is distinct from (st ->> 'o') then return false; end if;
  if st -> 'ls' <> 'null'::jsonb or st -> 'ev' <> 'null'::jsonb or st -> 'w' <> 'null'::jsonb or st -> 'why' <> 'null'::jsonb or st -> 'lb' <> 'null'::jsonb or st -> 'qp' <> 'null'::jsonb or st -> 'qc' <> 'null'::jsonb then return false; end if;
  if public.zchat_gb_int(st -> 'pts') is distinct from 0 then return false; end if;
  if jsonb_typeof(st -> 'b') <> 'array' or jsonb_array_length(st -> 'b') <> 19 then return false; end if;
  for e in select * from jsonb_array_elements(st -> 'b') loop
    if jsonb_typeof(e) <> 'array' or jsonb_array_length(e) <> 3 then return false; end if;
    pid := public.zchat_gb_int(e -> 0); px := public.zchat_gb_num(e -> 1); py := public.zchat_gb_num(e -> 2);
    if pid is null or px is null or py is null or pid not between 1 and 19 or abs(px - 370) > 70 or abs(py - 370) > 70 then return false; end if;
    ids := ids || pid;
  end loop;
  return (select count(distinct x) from unnest(ids) x) = 19;
end $$;
revoke all on function public.zchat_gb_crm_initial_ok(jsonb) from public, anon;
grant execute on function public.zchat_gb_crm_initial_ok(jsonb) to authenticated, service_role;

create or replace function public.zchat_gb_crm_step(prev jsonb, st jsonb, sender uuid)
returns jsonb
language plpgsql
immutable
as $$
declare
  me text := sender::text;
  mark text := case when sender::text = (prev ->> 'x') then 'x' else 'o' end;
  omark text := case when sender::text = (prev ->> 'x') then 'o' else 'x' end;
  nn integer := coalesce(public.zchat_gb_int(prev -> 'n'), 0) + 1;
  ls jsonb;
  e jsonb;
  pid integer;
  px numeric;
  py numeric;
  dx integer;
  dy integer;
  sx numeric;
begin
  if (prev ->> 'w') is not null then return null; end if;
  if (st ->> 'why') = 'resign' then
    return prev || jsonb_build_object('n', nn, 'w', omark, 'why', 'resign', 'ls', null, 'ev', null, 'lb', me);
  end if;
  if (prev ->> 't') is distinct from me then return null; end if;
  if public.zchat_gb_keys(st) <> public.zchat_gb_keys(prev) then return null; end if;
  if st -> 'g' <> prev -> 'g' or st -> 'id' <> prev -> 'id' or st -> 'x' <> prev -> 'x' or st -> 'o' <> prev -> 'o' or st -> 'wc' <> prev -> 'wc' then return null; end if;
  if public.zchat_gb_int(st -> 'n') is distinct from nn or (st ->> 't') not in (prev ->> 'x', prev ->> 'o') or (st ->> 'lb') is distinct from me then return null; end if;
  if (st ->> 'w') is not null and (st ->> 'w') not in ('x', 'o') then return null; end if;
  if (st ->> 'why') is not null and (st ->> 'why') not in ('board', 'opp') then return null; end if;
  if (prev ->> 'qc') is not null and st -> 'qc' <> prev -> 'qc' then return null; end if;
  if (st ->> 'qc') is not null and (st ->> 'qc') not in ('x', 'o') then return null; end if;
  if (st ->> 'qp') is not null and (st ->> 'qp') not in ('x', 'o') then return null; end if;
  if public.zchat_gb_int(st -> 'pts') is null or public.zchat_gb_int(st -> 'pts') not between 0 and 30 then return null; end if;
  ls := st -> 'ls';
  if jsonb_typeof(ls) <> 'object' then return null; end if;
  dx := public.zchat_gb_int(ls -> 'dx'); dy := public.zchat_gb_int(ls -> 'dy'); sx := public.zchat_gb_num(ls -> 'sx');
  if dx is null or dy is null or abs(dx) > 1000000 or abs(dy) > 1000000 or (dx = 0 and dy = 0) then return null; end if;
  if sx is null or sx < 150.8 or sx > 589.2 then return null; end if;
  if public.zchat_gb_int(ls -> 'p') is null or public.zchat_gb_int(ls -> 'p') not between 1 and 1000 then return null; end if;
  if (mark = 'x' and dy >= 0) or (mark = 'o' and dy <= 0) then return null; end if;
  if jsonb_typeof(st -> 'b') <> 'array' or jsonb_array_length(st -> 'b') > 19 then return null; end if;
  for e in select * from jsonb_array_elements(st -> 'b') loop
    if jsonb_typeof(e) <> 'array' or jsonb_array_length(e) <> 3 then return null; end if;
    pid := public.zchat_gb_int(e -> 0); px := public.zchat_gb_num(e -> 1); py := public.zchat_gb_num(e -> 2);
    if pid is null or px is null or py is null or pid not between 1 and 19 or px not between 0 and 740 or py not between 0 and 740 then return null; end if;
  end loop;
  if (select count(distinct public.zchat_gb_int(z -> 0)) from jsonb_array_elements(st -> 'b') z) <> jsonb_array_length(st -> 'b') then return null; end if;
  return st;
end $$;
revoke all on function public.zchat_gb_crm_step(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.zchat_gb_crm_step(jsonb, jsonb, uuid) to authenticated, service_role;

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

create or replace function public.zchat_gb_check_update(p_old text, p_new text, p_old_deleted boolean, p_new_deleted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ost jsonb;
  nst jsonb;
begin
  if pg_trigger_depth() < 1 then perform public.zchat_gb_bad('Not allowed'); end if;
  if left(coalesce(p_old, ''), 6) = 'zgame:' then
    ost := public.zchat_gb_json(substr(p_old, 7));
    if ost is not null and (ost ->> 'g') in ('crm', 'zap') and (p_new is distinct from p_old or p_new_deleted is distinct from p_old_deleted) then
      if (ost ->> 'g') = 'crm' and exists (select 1 from public.zchat_gb_games gm where gm.game_id = ost ->> 'id' and not gm.done) then
        perform public.zchat_gb_bad('Moves of a running game are not allowed to be removed');
      end if;
      if not coalesce(p_new_deleted, false) then perform public.zchat_gb_bad('Game cards are not allowed to be changed'); end if;
    end if;
  end if;
  if left(coalesce(p_new, ''), 6) = 'zgame:' and p_new is distinct from p_old then
    nst := public.zchat_gb_json(substr(p_new, 7));
    if nst is not null and (nst ->> 'g') in ('crm', 'zap') then perform public.zchat_gb_bad('Game cards are not allowed to be changed'); end if;
  end if;
end $$;
revoke all on function public.zchat_gb_check_update(text, text, boolean, boolean) from public, anon;
grant execute on function public.zchat_gb_check_update(text, text, boolean, boolean) to authenticated;

create or replace function public.zchat_gb_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    perform public.zchat_gb_check_insert(new.id, new.sender_id, new.receiver_id, new.group_id, new.content);
  else
    perform public.zchat_gb_check_update(old.content, new.content, old.deleted, new.deleted);
  end if;
  return new;
end $$;
revoke all on function public.zchat_gb_guard() from public, anon;
grant execute on function public.zchat_gb_guard() to authenticated;

drop trigger if exists zchat_gb_guard_ins on public.messages;
create trigger zchat_gb_guard_ins before insert on public.messages
  for each row when (left(new.content, 6) = 'zgame:')
  execute function public.zchat_gb_guard();
drop trigger if exists zchat_gb_guard_upd on public.messages;
create trigger zchat_gb_guard_upd before update of content, deleted on public.messages
  for each row when (left(old.content, 6) = 'zgame:' or left(new.content, 6) = 'zgame:')
  execute function public.zchat_gb_guard();

create or replace function public.zchat_zap_deck()
returns jsonb
language sql
volatile
as $$
  select jsonb_agg(c order by random()) from (
    select col || v as c from unnest(array['r', 'y', 'g', 'b']) col, unnest(array['0', '1', '1', '2', '2', '3', '3', '4', '4', '5', '5', '6', '6', '7', '7', '8', '8', '9', '9', 'S', 'S', 'R', 'R', 'D', 'D']) v
    union all select 'W' from generate_series(1, 4)
    union all select 'F' from generate_series(1, 4)
  ) z
$$;
revoke all on function public.zchat_zap_deck() from public, anon, authenticated;

create or replace function public.zchat_zap_fits(c text, top text, col text)
returns boolean
language sql
immutable
as $$
  select c in ('W', 'F') or (length(c) = 2 and (left(c, 1) = col or (length(coalesce(top, '')) = 2 and right(c, 1) = right(top, 1))))
$$;
revoke all on function public.zchat_zap_fits(text, text, text) from public, anon, authenticated;

create or replace function public.zchat_zap_points(h jsonb)
returns integer
language sql
immutable
as $$
  select coalesce(sum(case when c in ('W', 'F') then 50 when right(c, 1) in ('S', 'R', 'D') then 20 else right(c, 1)::integer end), 0)::integer
  from jsonb_array_elements_text(coalesce(h, '[]'::jsonb)) c
$$;
revoke all on function public.zchat_zap_points(jsonb) from public, anon, authenticated;

create or replace function public.zchat_zap_counts(h jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_agg(jsonb_array_length(x) order by o), '[]'::jsonb) from jsonb_array_elements(h) with ordinality as z(x, o)
$$;
revoke all on function public.zchat_zap_counts(jsonb) from public, anon, authenticated;

create or replace function public.zchat_zap_take(inout deck jsonb, inout dpile jsonb, n integer, out got jsonb)
language plpgsql
volatile
as $$
declare
  i integer;
  top text;
begin
  got := '[]'::jsonb;
  for i in 1..n loop
    if jsonb_array_length(deck) = 0 then
      if jsonb_array_length(dpile) <= 1 then exit; end if;
      top := dpile ->> (jsonb_array_length(dpile) - 1);
      select jsonb_agg(c order by random()) into deck from jsonb_array_elements_text(dpile) with ordinality as z(c, o) where o < jsonb_array_length(dpile);
      dpile := jsonb_build_array(top);
    end if;
    got := got || (deck -> (jsonb_array_length(deck) - 1));
    deck := deck - (jsonb_array_length(deck) - 1);
  end loop;
end $$;
revoke all on function public.zchat_zap_take(jsonb, jsonb, integer) from public, anon, authenticated;

create or replace function public.zchat_zap_open(p_msg bigint, out m_group uuid, out st jsonb, out idx integer, out hands jsonb, out deck jsonb, out dpile jsonb, out drawn text)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  msg record;
begin
  idx := -1;
  st := null;
  select m.id, m.sender_id, m.receiver_id, m.group_id, m.content, m.deleted into msg from public.messages m where m.id = p_msg for update;
  if not found or coalesce(msg.deleted, false) or left(coalesce(msg.content, ''), 6) <> 'zgame:' then return; end if;
  if msg.group_id is not null then
    if not exists (select 1 from public.group_members gm where gm.group_id = msg.group_id and gm.user_id = me) then return; end if;
  elsif me is distinct from msg.sender_id and me is distinct from msg.receiver_id then return;
  end if;
  st := public.zchat_gb_json(substr(msg.content, 7));
  if st is null or (st ->> 'g') <> 'zap' then st := null; return; end if;
  select c.hands, c.deck, c.dpile, c.drawn into hands, deck, dpile, drawn from public.zchat_gb_cards c where c.msg_id = p_msg for update;
  if not found then st := null; return; end if;
  m_group := msg.group_id;
  select (o - 1)::integer into idx from jsonb_array_elements_text(st -> 'p') with ordinality as z(u, o) where u = me::text;
  idx := coalesce(idx, -1);
end $$;
revoke all on function public.zchat_zap_open(bigint) from public, anon, authenticated;

create or replace function public.zchat_zap_save(p_msg bigint, p_st jsonb, p_hands jsonb, p_deck jsonb, p_dpile jsonb, p_drawn text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content text := 'zgame:' || p_st::text;
begin
  update public.messages set content = v_content where id = p_msg;
  if p_hands is not null then
    update public.zchat_gb_cards set hands = p_hands, deck = p_deck, dpile = p_dpile, drawn = p_drawn, updated_at = now() where msg_id = p_msg;
  end if;
  return v_content;
end $$;
revoke all on function public.zchat_zap_save(bigint, jsonb, jsonb, jsonb, jsonb, text) from public, anon, authenticated;

create or replace function public.zchat_zap_deal(p_msg bigint, st jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  k integer := jsonb_array_length(st -> 'p');
  deck jsonb := public.zchat_zap_deck();
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
  perform public.zchat_zap_save(p_msg, out, hands, deck, jsonb_build_array(top), null);
  return jsonb_build_object('st', out, 'hands', hands);
end $$;
revoke all on function public.zchat_zap_deal(bigint, jsonb) from public, anon, authenticated;

create or replace function public.zchat_zap_join(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
  d jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'st') <> 'lobby' then return jsonb_build_object('ok', false, 'why', 'started'); end if;
  if o.idx >= 0 then return jsonb_build_object('ok', true, 'content', 'zgame:' || st::text, 'hand', '[]'::jsonb); end if;
  if jsonb_array_length(st -> 'p') >= public.zchat_gb_int(st -> 'mx') then return jsonb_build_object('ok', false, 'why', 'full'); end if;
  st := st || jsonb_build_object('p', (st -> 'p') || to_jsonb(me::text), 'n', public.zchat_gb_int(st -> 'n') + 1);
  if o.m_group is null and jsonb_array_length(st -> 'p') >= public.zchat_gb_int(st -> 'mx') then
    d := public.zchat_zap_deal(p_msg, st);
    return jsonb_build_object('ok', true, 'content', 'zgame:' || (d -> 'st')::text, 'hand', d -> 'hands' -> (jsonb_array_length(st -> 'p') - 1));
  end if;
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, null, null, null, null), 'hand', '[]'::jsonb);
end $$;

create or replace function public.zchat_zap_start(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  d jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  if (o.st ->> 'st') <> 'lobby' then return jsonb_build_object('ok', false, 'why', 'started'); end if;
  if o.idx <> 0 then return jsonb_build_object('ok', false, 'why', 'host'); end if;
  if jsonb_array_length(o.st -> 'p') < 2 then return jsonb_build_object('ok', false, 'why', 'few'); end if;
  d := public.zchat_zap_deal(p_msg, o.st);
  return jsonb_build_object('ok', true, 'content', 'zgame:' || (d -> 'st')::text, 'hand', d -> 'hands' -> 0);
end $$;

create or replace function public.zchat_zap_hand(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  return jsonb_build_object('ok', true, 'hand', case when o.idx >= 0 then coalesce(o.hands -> o.idx, '[]'::jsonb) else '[]'::jsonb end,
    'drawn', case when o.idx >= 0 and (o.st ->> 'dr') = o.idx::text then o.drawn else null end);
end $$;

create or replace function public.zchat_zap_next(i integer, dir integer, k integer, steps integer)
returns integer
language sql
immutable
as $$ select (((i + dir * steps) % k) + k) % k $$;
revoke all on function public.zchat_zap_next(integer, integer, integer, integer) from public, anon, authenticated;

create or replace function public.zchat_gb_zap_record(p_game_id text, p_x uuid, p_o uuid, p_win uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_w text;
  v_n integer;
begin
  if p_game_id is null or p_x is null or p_o is null or p_x = p_o then return; end if;
  if to_regclass('public.game_results') is null or to_regprocedure('public.zchat_bump_result(uuid,text,text)') is null then return; end if;
  v_w := case when p_win = p_x then 'x' when p_win = p_o then 'o' else null end;
  if v_w is null then return; end if;
  begin
    execute 'insert into public.game_results (game_id, game, x, o, w) values ($1, $2, $3, $4, $5) on conflict (game_id) do nothing' using p_game_id, 'zap', p_x, p_o, v_w;
    get diagnostics v_n = row_count;
    if v_n = 0 then return; end if;
    execute 'select public.zchat_bump_result($1, $2, $3)' using p_x, 'zap', case when v_w = 'x' then 'w' else 'l' end;
    execute 'select public.zchat_bump_result($1, $2, $3)' using p_o, 'zap', case when v_w = 'o' then 'w' else 'l' end;
    execute 'select public.zchat_bump_result($1, $2, $3)' using p_x, 'all', case when v_w = 'x' then 'w' else 'l' end;
    execute 'select public.zchat_bump_result($1, $2, $3)' using p_o, 'all', case when v_w = 'o' then 'w' else 'l' end;
  exception when others then
    return;
  end;
end $$;
revoke all on function public.zchat_gb_zap_record(text, uuid, uuid, uuid) from public, anon, authenticated;

create or replace function public.zchat_zap_play(p_msg bigint, p_card text, p_color text, p_call boolean)
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
  t record;
  sc jsonb;
  pts integer;
  i integer;
begin
  if me is null or p_card is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  me_i := o.idx;
  if (st ->> 'st') <> 'play' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if me_i < 0 or (st ->> 't') is distinct from me::text then return jsonb_build_object('ok', false, 'why', 'turn'); end if;
  hands := o.hands; deck := o.deck; dpile := o.dpile;
  mine := hands -> me_i;
  select (z.o - 1)::integer into pos from jsonb_array_elements_text(mine) with ordinality as z(c, o) where z.c = p_card limit 1;
  if pos is null then return jsonb_build_object('ok', false, 'why', 'card'); end if;
  if (st ->> 'dr') = me_i::text and p_card is distinct from o.drawn then return jsonb_build_object('ok', false, 'why', 'drawn'); end if;
  if not public.zchat_zap_fits(p_card, st ->> 'top', st ->> 'col') then return jsonb_build_object('ok', false, 'why', 'fit'); end if;
  if p_card in ('W', 'F') and (p_color is null or p_color not in ('r', 'y', 'g', 'b')) then return jsonb_build_object('ok', false, 'why', 'colour'); end if;
  mine := mine - pos;
  hands := jsonb_set(hands, array[me_i::text], mine);
  dpile := dpile || to_jsonb(p_card);
  col := case when p_card in ('W', 'F') then p_color else left(p_card, 1) end;
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  nxt := public.zchat_zap_next(me_i, dir, k, 1);
  turn := nxt;
  if p_card = 'F' then victim := nxt; give := 4; turn := public.zchat_zap_next(me_i, dir, k, 2);
  elsif length(p_card) = 2 and right(p_card, 1) = 'D' then victim := nxt; give := 2; turn := public.zchat_zap_next(me_i, dir, k, 2);
  elsif length(p_card) = 2 and right(p_card, 1) = 'S' then skipped := nxt; turn := public.zchat_zap_next(me_i, dir, k, 2);
  elsif length(p_card) = 2 and right(p_card, 1) = 'R' then
    dir := -dir;
    if k = 2 then turn := me_i; skipped := nxt; else turn := public.zchat_zap_next(me_i, dir, k, 1); end if;
  end if;
  if victim is not null and jsonb_array_length(mine) > 0 then
    select * into t from public.zchat_zap_take(deck, dpile, give);
    deck := t.deck; dpile := t.dpile;
    hands := jsonb_set(hands, array[victim::text], (hands -> victim) || t.got);
  end if;
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'top', p_card, 'col', col, 'dir', dir, 'dr', null,
    'open', case when jsonb_array_length(mine) = 1 and not coalesce(p_call, false) then to_jsonb(me_i) else null end,
    'lt', jsonb_build_object('a', 'play', 'p', me_i, 'c', p_card, 'col', col, 'v', victim, 'k', case when victim is null then 0 else give end, 'sk', skipped, 'cl', coalesce(p_call, false) and jsonb_array_length(mine) = 1),
    'at', floor(extract(epoch from now()))::bigint);
  if jsonb_array_length(mine) = 0 then
    pts := 0;
    for i in 0..k - 1 loop if i <> me_i then pts := pts + public.zchat_zap_points(hands -> i); end if; end loop;
    sc := coalesce(st -> 'sc', '[]'::jsonb);
    sc := jsonb_set(sc, array[me_i::text], to_jsonb(coalesce(public.zchat_gb_int(sc -> me_i), 0) + pts));
    st := st || jsonb_build_object('st', 'done', 'w', me::text, 't', null, 'sc', sc, 'open', null, 'rh', hands, 'pts', pts);
  else
    st := st || jsonb_build_object('t', st -> 'p' -> turn);
  end if;
  st := st || jsonb_build_object('cnt', public.zchat_zap_counts(hands), 'pile', jsonb_array_length(deck));
  if (st ->> 'st') = 'done' and o.m_group is null and k = 2 then
    perform public.zchat_gb_zap_record(st ->> 'id', public.zchat_gb_uuid(st -> 'p' ->> 0), public.zchat_gb_uuid(st -> 'p' ->> 1), me);
  end if;
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, hands, deck, dpile, null), 'hand', hands -> me_i);
end $$;

create or replace function public.zchat_zap_draw(p_msg bigint)
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
  t record;
  card text;
  k integer;
  dir integer;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'st') <> 'play' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if o.idx < 0 or (st ->> 't') is distinct from me::text then return jsonb_build_object('ok', false, 'why', 'turn'); end if;
  if (st ->> 'dr') is not null then return jsonb_build_object('ok', false, 'why', 'drew'); end if;
  select * into t from public.zchat_zap_take(o.deck, o.dpile, 1);
  if jsonb_array_length(t.got) = 0 then return jsonb_build_object('ok', false, 'why', 'empty'); end if;
  card := t.got ->> 0;
  hands := jsonb_set(o.hands, array[o.idx::text], (o.hands -> o.idx) || t.got);
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'open', null, 'cnt', public.zchat_zap_counts(hands), 'pile', jsonb_array_length(t.deck), 'at', floor(extract(epoch from now()))::bigint);
  if public.zchat_zap_fits(card, st ->> 'top', st ->> 'col') then
    st := st || jsonb_build_object('dr', o.idx, 'lt', jsonb_build_object('a', 'draw', 'p', o.idx, 'k', 1, 'keep', true));
    return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, hands, t.deck, t.dpile, card), 'hand', hands -> o.idx, 'drawn', card);
  end if;
  st := st || jsonb_build_object('dr', null, 't', st -> 'p' -> public.zchat_zap_next(o.idx, dir, k, 1), 'lt', jsonb_build_object('a', 'draw', 'p', o.idx, 'k', 1, 'keep', false));
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, hands, t.deck, t.dpile, null), 'hand', hands -> o.idx, 'drawn', card);
end $$;

create or replace function public.zchat_zap_pass(p_msg bigint)
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
  if (st ->> 'st') <> 'play' then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if o.idx < 0 or (st ->> 't') is distinct from me::text or (st ->> 'dr') is distinct from o.idx::text then return jsonb_build_object('ok', false, 'why', 'turn'); end if;
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'dr', null, 'open', null, 't', st -> 'p' -> public.zchat_zap_next(o.idx, dir, k, 1),
    'lt', jsonb_build_object('a', 'pass', 'p', o.idx), 'at', floor(extract(epoch from now()))::bigint);
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, o.hands, o.deck, o.dpile, null), 'hand', o.hands -> o.idx);
end $$;

create or replace function public.zchat_zap_call(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'st') <> 'play' or o.idx < 0 or (st ->> 'open') is distinct from o.idx::text then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'open', null, 'lt', (case when jsonb_typeof(st -> 'lt') = 'object' then st -> 'lt' else '{}'::jsonb end) || jsonb_build_object('cl', true, 'late', true));
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, null, null, null, null));
end $$;

create or replace function public.zchat_zap_catch(p_msg bigint, p_who integer)
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
begin
  if me is null or p_who is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'st') <> 'play' or o.idx < 0 or o.idx = p_who or (st ->> 'open') is distinct from p_who::text then return jsonb_build_object('ok', false, 'why', 'late'); end if;
  select * into t from public.zchat_zap_take(o.deck, o.dpile, 2);
  hands := jsonb_set(o.hands, array[p_who::text], (o.hands -> p_who) || t.got);
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'open', null, 'cnt', public.zchat_zap_counts(hands), 'pile', jsonb_array_length(t.deck),
    'lt', jsonb_build_object('a', 'catch', 'p', o.idx, 'v', p_who, 'k', jsonb_array_length(t.got)));
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, hands, t.deck, t.dpile, o.drawn), 'hand', hands -> o.idx);
end $$;

create or replace function public.zchat_zap_nudge(p_msg bigint)
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
  k integer;
  dir integer;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'st') <> 'play' or o.idx < 0 or (st ->> 't') = me::text then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  if floor(extract(epoch from now())) - coalesce((st ->> 'at')::bigint, 0) < 60 then return jsonb_build_object('ok', false, 'why', 'wait'); end if;
  select (z.o - 1)::integer into cur from jsonb_array_elements_text(st -> 'p') with ordinality as z(u, o) where z.u = st ->> 't';
  if cur is null then return jsonb_build_object('ok', false, 'why', 'state'); end if;
  k := jsonb_array_length(st -> 'p');
  dir := coalesce(public.zchat_gb_int(st -> 'dir'), 1);
  hands := o.hands;
  if (st ->> 'dr') is null then
    select * into t from public.zchat_zap_take(o.deck, o.dpile, 1);
    hands := jsonb_set(hands, array[cur::text], (hands -> cur) || t.got);
  else
    select o.deck as deck, o.dpile as dpile into t;
  end if;
  st := st || jsonb_build_object('n', public.zchat_gb_int(st -> 'n') + 1, 'dr', null, 'open', null, 't', st -> 'p' -> public.zchat_zap_next(cur, dir, k, 1),
    'cnt', public.zchat_zap_counts(hands), 'pile', jsonb_array_length(t.deck), 'lt', jsonb_build_object('a', 'late', 'p', cur, 'k', case when (o.st ->> 'dr') is null then 1 else 0 end),
    'at', floor(extract(epoch from now()))::bigint);
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, hands, t.deck, t.dpile, null), 'hand', hands -> o.idx);
end $$;

create or replace function public.zchat_zap_end(p_msg bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o record;
  st jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if not public.zchat_gb_hit('zap', 120, 60) then return jsonb_build_object('ok', false, 'why', 'slow'); end if;
  select * into o from public.zchat_zap_open(p_msg);
  if o.st is null then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  st := o.st;
  if (st ->> 'st') = 'done' then return jsonb_build_object('ok', true, 'content', 'zgame:' || st::text); end if;
  if o.idx < 0 then return jsonb_build_object('ok', false, 'why', 'player'); end if;
  st := st || jsonb_build_object('st', 'done', 'w', null, 't', null, 'n', public.zchat_gb_int(st -> 'n') + 1, 'ended', me::text, 'open', null);
  return jsonb_build_object('ok', true, 'content', public.zchat_zap_save(p_msg, st, null, null, null, null));
end $$;

do $$
declare f text;
begin
  foreach f in array array['zchat_zap_join(bigint)', 'zchat_zap_start(bigint)', 'zchat_zap_hand(bigint)', 'zchat_zap_play(bigint, text, text, boolean)', 'zchat_zap_draw(bigint)', 'zchat_zap_pass(bigint)', 'zchat_zap_call(bigint)', 'zchat_zap_catch(bigint, integer)', 'zchat_zap_nudge(bigint)', 'zchat_zap_end(bigint)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;


CREATE OR REPLACE FUNCTION public.zchat_game_rule(p_game text)
 RETURNS TABLE(kind text, lower_better boolean, min_score integer, max_score integer)
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select r.kind, r.lower_better, r.min_score, r.max_score
  from (values
    ('stack', 'solo', false, 1, 5000),
    ('dash', 'solo', false, 1, 1000000),
    ('catch', 'solo', false, 1, 100000),
    ('ctrap', 'solo', false, 1, 10000),
    ('odd', 'solo', false, 1, 5000),
    ('hilo', 'solo', false, 1, 10000),
    ('2048', 'solo', false, 4, 4000000),
    ('snake', 'solo', false, 1, 10000),
    ('sky', 'solo', false, 1, 100000),
    ('bricks', 'solo', false, 1, 10000000),
    ('word', 'solo', false, 1, 10000),
    ('memory', 'solo', true, 8, 10000),
    ('reflex', 'solo', true, 60, 20000),
    ('quiz', 'solo', false, 1, 10),
    ('echo', 'solo', false, 1, 1000),
    ('ttt', 'duel', false, 0, 0), ('fade', 'duel', false, 0, 0), ('c4', 'duel', false, 0, 0),
    ('paint', 'duel', false, 0, 0), ('ship', 'duel', false, 0, 0), ('gem', 'duel', false, 0, 0),
    ('bomb', 'duel', false, 0, 0), ('dots', 'duel', false, 0, 0), ('gomoku', 'duel', false, 0, 0),
    ('reversi', 'duel', false, 0, 0), ('sl', 'duel', false, 0, 0), ('pairs', 'duel', false, 0, 0),
    ('nim', 'duel', false, 0, 0), ('mancala', 'duel', false, 0, 0), ('dice', 'duel', false, 0, 0),
    ('bj', 'duel', false, 0, 0), ('war', 'duel', false, 0, 0), ('rps', 'duel', false, 0, 0),
    ('hang', 'duel', false, 0, 0), ('num', 'duel', false, 0, 0), ('wduel', 'duel', true, 0, 0),
    ('qduel', 'duel', false, 0, 0), ('math', 'duel', false, 0, 0), ('rduel', 'duel', true, 0, 0),
    ('taps', 'duel', false, 0, 0),
    ('sd:stack', 'duel', false, 0, 0), ('sd:dash', 'duel', false, 0, 0), ('sd:catch', 'duel', false, 0, 0),
    ('sd:ctrap', 'duel', false, 0, 0), ('sd:odd', 'duel', false, 0, 0), ('sd:hilo', 'duel', false, 0, 0),
    ('sd:sky', 'duel', false, 0, 0), ('sd:snake', 'duel', false, 0, 0), ('sd:echo', 'duel', false, 0, 0),
    ('sd:bricks', 'duel', false, 0, 0),
    ('tug', 'duel', false, 0, 0), ('qrace', 'duel', false, 0, 0), ('rrace', 'duel', false, 0, 0),
    ('chess', 'duel', false, 0, 0), ('ckr', 'duel', false, 0, 0), ('pool', 'duel', false, 0, 0),
    ('golf', 'duel', false, 0, 0), ('sdk', 'duel', false, 0, 0),
    ('squish', 'solo', false, 1, 100000000),
    ('crm', 'duel', false, 0, 0), ('zap', 'duel', false, 0, 0),
    ('all', 'total', false, 0, 0)
  ) as r(g, kind, lower_better, min_score, max_score)
  where r.g = p_game
$function$;
revoke all on function public.zchat_game_rule(text) from public, anon;
grant execute on function public.zchat_game_rule(text) to authenticated, service_role;

create or replace function public.zchat_game_retired_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.kind = 'ccard' then
    raise exception 'ga2:missing' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.zchat_game_retired_guard() from public, anon;

do $$
begin
  if to_regclass('public.ga2_games') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ga2_games' and column_name = 'kind') then
    execute 'drop trigger if exists zchat_game_retired_ins on public.ga2_games';
    execute 'create trigger zchat_game_retired_ins before insert on public.ga2_games for each row when (new.kind = ''ccard'') execute function public.zchat_game_retired_guard()';
  end if;
end $$;


do $$
begin
  if to_regclass('public.zchat_app_prefs') is null then
    raise notice 'public.zchat_app_prefs not found, app language sync skipped';
    return;
  end if;

  alter table public.zchat_app_prefs add column if not exists lang text;

  alter table public.zchat_app_prefs drop constraint if exists zchat_app_prefs_lang_ok;
  alter table public.zchat_app_prefs add constraint zchat_app_prefs_lang_ok
    check (lang is null or lang in ('en', 'si', 'ta'));

  grant select (lang) on public.zchat_app_prefs to authenticated;
  grant insert (lang) on public.zchat_app_prefs to authenticated;
  grant update (lang) on public.zchat_app_prefs to authenticated;
  grant all on public.zchat_app_prefs to service_role;
end $$;



create table if not exists public.zchat_launch_config (
  k text primary key,
  v text,
  updated_at timestamptz not null default now()
);
alter table public.zchat_launch_config enable row level security;
revoke all on public.zchat_launch_config from public, anon, authenticated;
grant all on public.zchat_launch_config to service_role;

insert into public.zchat_launch_config (k, v) values
  ('net_salt', gen_random_uuid()::text),
  ('plan', 'free'),
  ('terms_version', '2026-11'),
  ('signup_device_day', '3'),
  ('signup_net_hour', '6'),
  ('signup_net_day', '20'),
  ('signup_hook_net_day', '40'),
  ('signup_pass', 'off')
on conflict (k) do nothing;

create or replace function public.zchat_launch_num(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select case when c.v ~ '^[0-9]{1,6}$' then c.v::integer end from public.zchat_launch_config c where c.k = p_key), p_default)
$$;
revoke all on function public.zchat_launch_num(text, integer) from public, anon, authenticated;
grant execute on function public.zchat_launch_num(text, integer) to service_role;

create or replace function public.zchat_request_role()
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  r text;
begin
  begin
    r := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  exception when others then
    r := null;
  end;
  return coalesce(r, nullif(current_setting('request.jwt.claim.role', true), ''), '');
end $$;
revoke all on function public.zchat_request_role() from public, anon, authenticated;
grant execute on function public.zchat_request_role() to service_role;

create or replace function public.zchat_request_ip()
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  h jsonb;
  v text;
  parts text[];
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    return null;
  end;
  if h is null then
    return null;
  end if;
  v := nullif(btrim(coalesce(h ->> 'cf-connecting-ip', '')), '');
  if v is null then
    parts := string_to_array(coalesce(h ->> 'x-forwarded-for', ''), ',');
    if coalesce(array_length(parts, 1), 0) >= 1 then
      v := nullif(btrim(parts[array_length(parts, 1)]), '');
    end if;
  end if;
  if v is null then
    v := nullif(btrim(coalesce(h ->> 'x-real-ip', '')), '');
  end if;
  return left(v, 64);
end $$;
revoke all on function public.zchat_request_ip() from public, anon, authenticated;
grant execute on function public.zchat_request_ip() to service_role;

create or replace function public.zchat_net_key(p_ip text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ip inet;
  nk text;
  salt text;
begin
  if p_ip is null or btrim(p_ip) = '' then
    return null;
  end if;
  begin
    ip := btrim(p_ip)::inet;
  exception when others then
    return null;
  end;
  if family(ip) = 6 then
    nk := host(network(set_masklen(ip, 64)));
  else
    nk := host(ip);
  end if;
  select c.v into salt from public.zchat_launch_config c where c.k = 'net_salt';
  return left(encode(sha256(convert_to(coalesce(salt, '') || '|' || nk, 'UTF8')), 'hex'), 32);
end $$;
revoke all on function public.zchat_net_key(text) from public, anon, authenticated;
grant execute on function public.zchat_net_key(text) to service_role;

create table if not exists public.zchat_user_age (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  young boolean not null default false,
  terms_at timestamptz,
  terms_version text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.zchat_user_age enable row level security;
revoke all on public.zchat_user_age from public, anon, authenticated;
grant all on public.zchat_user_age to service_role;

create or replace function public.zchat_age_terms_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r public.zchat_user_age%rowtype;
  want text;
begin
  if me is null then
    return jsonb_build_object('ok', false);
  end if;
  select * into r from public.zchat_user_age a where a.user_id = me;
  select c.v into want from public.zchat_launch_config c where c.k = 'terms_version';
  return jsonb_build_object(
    'ok', true,
    'need_age', r.user_id is null,
    'need_terms', r.terms_at is null or (want is not null and coalesce(r.terms_version, '') <> want),
    'young', coalesce(r.young, false),
    'terms_version', coalesce(want, '')
  );
end $$;
revoke all on function public.zchat_age_terms_state() from public, anon;
grant execute on function public.zchat_age_terms_state() to authenticated, service_role;

create or replace function public.zchat_age_terms_save(p_birth date, p_terms boolean, p_source text default 'signup')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  cur public.zchat_user_age%rowtype;
  b date;
  yrs integer;
  want text;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;
  if not coalesce(p_terms, false) then
    return jsonb_build_object('ok', false, 'reason', 'terms');
  end if;
  select * into cur from public.zchat_user_age a where a.user_id = me for update;
  b := coalesce(cur.birth_date, p_birth);
  if b is null or b > current_date or b < date '1900-01-01' then
    return jsonb_build_object('ok', false, 'reason', 'date');
  end if;
  yrs := extract(year from age(current_date, b))::integer;
  select c.v into want from public.zchat_launch_config c where c.k = 'terms_version';
  insert into public.zchat_user_age as a (user_id, birth_date, young, terms_at, terms_version, source)
  values (me, b, yrs < 13, now(), coalesce(want, ''), left(coalesce(p_source, ''), 20))
  on conflict (user_id) do update
    set young = excluded.young,
        terms_at = now(),
        terms_version = excluded.terms_version,
        updated_at = now();
  if yrs < 13 then
    return jsonb_build_object('ok', false, 'reason', 'young', 'young', true);
  end if;
  return jsonb_build_object('ok', true, 'young', false);
end $$;
revoke all on function public.zchat_age_terms_save(date, boolean, text) from public, anon;
grant execute on function public.zchat_age_terms_save(date, boolean, text) to authenticated;

create table if not exists public.zchat_disposable_domains (
  domain text primary key,
  added_at timestamptz not null default now()
);
alter table public.zchat_disposable_domains enable row level security;
revoke all on public.zchat_disposable_domains from public, anon, authenticated;
grant all on public.zchat_disposable_domains to service_role;

insert into public.zchat_disposable_domains (domain)
select unnest(array[
  '10mail.org', '10minutemail.co.uk', '10minutemail.com', '10minutemail.net', '1secmail.com', '1secmail.net', '1secmail.org',
  '20minutemail.com', 'anonbox.net', 'armyspy.com', 'burnermail.io', 'cool.fr.nf', 'crazymailing.com', 'cuvox.de', 'dayrep.com',
  'deadaddress.com', 'discard.email', 'discardmail.com', 'discardmail.de', 'dispostable.com', 'dropmail.me', 'e4ward.com',
  'einrot.com', 'emailfake.com', 'emailondeck.com', 'emltmp.com', 'eyepaste.com', 'fakeinbox.com', 'fakemail.net',
  'fakemailgenerator.com', 'fleckens.hu', 'generator.email', 'getairmail.com', 'getnada.com', 'grr.la', 'guerrillamail.biz',
  'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'gustr.com', 'harakirimail.com', 'inboxkitten.com', 'incognitomail.org', 'jetable.org', 'jourrapide.com', 'luxusmail.org',
  'mail.gw', 'mail.tm', 'mail-temp.com', 'mailcatch.com', 'maildrop.cc', 'mailexpire.com', 'mailforspam.com', 'mailinator.com',
  'mailinator.net', 'mailinator2.com', 'mailmetrash.com', 'mailnesia.com', 'mailnull.com', 'mailpoof.com', 'mailsac.com',
  'mailtemp.info', 'meltmail.com', 'minuteinbox.com', 'mintemail.com', 'moakt.com', 'mohmal.com', 'mvrht.com', 'mvrht.net',
  'mytemp.email', 'mytrashmail.com', 'nada.email', 'nowmymail.com', 'pokemail.net', 'rcpt.at', 'rhyta.com', 'sharklasers.com',
  'smailpro.com', 'spam4.me', 'spambog.com', 'spambox.us', 'spamcero.com', 'spamdecoy.net', 'spamex.com', 'spamfree24.org',
  'spamgourmet.com', 'spamhole.com', 'superrito.com', 'teleworm.us', 'temp-mail.io', 'temp-mail.org', 'tempail.com',
  'tempemail.net', 'tempinbox.com', 'tempm.com', 'tempmail.com', 'tempmail.net', 'tempmailaddress.com', 'tempmailo.com',
  'tempomail.fr', 'temporary-mail.net', 'tempr.email', 'throwam.com', 'throwawaymail.com', 'tmail.ws', 'tmpmail.net',
  'tmpmail.org', 'trash-mail.com', 'trashmail.com', 'trashmail.de', 'trashmail.me', 'trashmail.net', 'trbvm.com',
  'wegwerfmail.de', 'wegwerfmail.net', 'wh4f.org', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'zetmail.com'
])
on conflict (domain) do nothing;

create or replace function public.zchat_email_disposable(p_email text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  dom text := lower(btrim(split_part(coalesce(p_email, ''), '@', 2)));
begin
  while dom like '%.%' loop
    if exists (select 1 from public.zchat_disposable_domains d where d.domain = dom) then
      return true;
    end if;
    dom := substr(dom, strpos(dom, '.') + 1);
  end loop;
  return false;
end $$;
revoke all on function public.zchat_email_disposable(text) from public, anon, authenticated;
grant execute on function public.zchat_email_disposable(text) to service_role;

create table if not exists public.zchat_signup_log (
  user_id uuid primary key,
  device text,
  net text,
  created_at timestamptz not null default now()
);
create index if not exists zchat_signup_log_device on public.zchat_signup_log (device, created_at);
create index if not exists zchat_signup_log_net on public.zchat_signup_log (net, created_at);
alter table public.zchat_signup_log enable row level security;
revoke all on public.zchat_signup_log from public, anon, authenticated;
grant all on public.zchat_signup_log to service_role;

create table if not exists public.zchat_signup_attempts (
  id bigserial primary key,
  net text,
  device text,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists zchat_signup_attempts_net on public.zchat_signup_attempts (net, kind, created_at);
create index if not exists zchat_signup_attempts_at on public.zchat_signup_attempts (created_at);
alter table public.zchat_signup_attempts enable row level security;
revoke all on public.zchat_signup_attempts from public, anon, authenticated;
grant all on public.zchat_signup_attempts to service_role;
revoke all on sequence public.zchat_signup_attempts_id_seq from public, anon, authenticated;
grant usage, select on sequence public.zchat_signup_attempts_id_seq to service_role;

create table if not exists public.zchat_signup_passes (
  id bigserial primary key,
  email text,
  device text,
  user_id uuid,
  net text,
  human boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists zchat_signup_passes_email on public.zchat_signup_passes (email, created_at);
create index if not exists zchat_signup_passes_device on public.zchat_signup_passes (device, created_at);
create index if not exists zchat_signup_passes_user on public.zchat_signup_passes (user_id, created_at);
alter table public.zchat_signup_passes enable row level security;
revoke all on public.zchat_signup_passes from public, anon, authenticated;
grant all on public.zchat_signup_passes to service_role;
revoke all on sequence public.zchat_signup_passes_id_seq from public, anon, authenticated;
grant usage, select on sequence public.zchat_signup_passes_id_seq to service_role;

create or replace function public.zchat_signup_text(p_reason text)
returns text
language sql
immutable
as $$
  select case p_reason
    when 'disposable' then 'Use an email address you plan to keep. Temporary inboxes cannot be used on ZChat.'
    when 'device' then 'This phone has made a lot of new accounts today. Try again tomorrow, or log in to an account you already have.'
    when 'net_hour' then 'A lot of new accounts were just made on this network. Wait a little while and try again.'
    when 'net' then 'Too many new accounts were made on this network today. Try again tomorrow, or switch to mobile data or another WiFi.'
    when 'young' then 'ZChat is for people 13 and older.'
    when 'pass' then 'Please finish the quick check so we know you are a person.'
    when 'bot' then 'Something did not look right. Please try again.'
    else 'Sign up is not available right now. Try again later.'
  end
$$;
revoke all on function public.zchat_signup_text(text) from public, anon, authenticated;
grant execute on function public.zchat_signup_text(text) to service_role;

create or replace function public.zchat_signup_limit_reason(p_device text, p_net text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_device is not null and btrim(p_device) <> '' then
    select count(*) into n from public.zchat_signup_log l
      where l.device = p_device and l.created_at > now() - interval '1 day';
    if n >= public.zchat_launch_num('signup_device_day', 3) then
      return 'device';
    end if;
  end if;
  if p_net is not null then
    select count(*) into n from public.zchat_signup_log l
      where l.net = p_net and l.created_at > now() - interval '1 hour';
    if n >= public.zchat_launch_num('signup_net_hour', 6) then
      return 'net_hour';
    end if;
    select count(*) into n from public.zchat_signup_log l
      where l.net = p_net and l.created_at > now() - interval '1 day';
    if n >= public.zchat_launch_num('signup_net_day', 20) then
      return 'net';
    end if;
  end if;
  return null;
end $$;
revoke all on function public.zchat_signup_limit_reason(text, text) from public, anon, authenticated;
grant execute on function public.zchat_signup_limit_reason(text, text) to service_role;

create or replace function public.zchat_signup_note(p_kind text, p_net text, p_device text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.zchat_signup_attempts (net, device, kind) values (p_net, left(p_device, 120), left(p_kind, 20));
  if random() < 0.02 then
    delete from public.zchat_signup_attempts where id in (
      select a.id from public.zchat_signup_attempts a where a.created_at < now() - interval '30 days' limit 2000
    );
    delete from public.zchat_signup_passes where id in (
      select p.id from public.zchat_signup_passes p where p.created_at < now() - interval '3 days' limit 2000
    );
  end if;
exception when others then
  raise notice 'zchat signup note skipped: %', sqlerrm;
end $$;
revoke all on function public.zchat_signup_note(text, text, text) from public, anon, authenticated;
grant execute on function public.zchat_signup_note(text, text, text) to service_role;

create or replace function public.zchat_signup_precheck(p_email text, p_ip text, p_device text, p_user uuid default null, p_human boolean default false, p_bot boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_net text := public.zchat_net_key(p_ip);
  v_dev text := nullif(left(btrim(coalesce(p_device, '')), 120), '');
  v_em text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_why text;
begin
  if coalesce(p_bot, false) then
    v_why := 'bot';
  elsif v_em is not null and public.zchat_email_disposable(v_em) then
    v_why := 'disposable';
  else
    v_why := public.zchat_signup_limit_reason(v_dev, v_net);
  end if;
  if v_why is not null then
    perform public.zchat_signup_note(v_why, v_net, v_dev);
    return jsonb_build_object('ok', false, 'reason', v_why, 'message', public.zchat_signup_text(v_why));
  end if;
  insert into public.zchat_signup_passes (email, device, user_id, net, human) values (v_em, v_dev, p_user, v_net, coalesce(p_human, false));
  perform public.zchat_signup_note(case when coalesce(p_human, false) then 'pass_human' else 'pass' end, v_net, v_dev);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.zchat_signup_precheck(text, text, text, uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.zchat_signup_precheck(text, text, text, uuid, boolean, boolean) to service_role;

create or replace function public.zchat_signup_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_em text := lower(coalesce(event -> 'user' ->> 'email', ''));
  v_net text := public.zchat_net_key(event -> 'metadata' ->> 'ip_address');
  v_dev text := nullif(left(coalesce(event -> 'user' -> 'user_metadata' ->> 'zdev', ''), 120), '');
  v_n integer;
begin
  if v_em <> '' and public.zchat_email_disposable(v_em) then
    perform public.zchat_signup_note('hook_disposable', v_net, v_dev);
    return jsonb_build_object('error', jsonb_build_object('http_code', 400, 'message', public.zchat_signup_text('disposable')));
  end if;
  if v_net is not null then
    select count(*) into v_n from public.zchat_signup_attempts a
      where a.net = v_net and a.kind = 'hook_created' and a.created_at > now() - interval '1 day';
    if v_n >= public.zchat_launch_num('signup_hook_net_day', 40) then
      perform public.zchat_signup_note('hook_net', v_net, v_dev);
      return jsonb_build_object('error', jsonb_build_object('http_code', 429, 'message', public.zchat_signup_text('net')));
    end if;
  end if;
  perform public.zchat_signup_note('hook_created', v_net, v_dev);
  return '{}'::jsonb;
exception when others then
  return '{}'::jsonb;
end $$;
revoke all on function public.zchat_signup_hook(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function public.zchat_signup_hook(jsonb) to supabase_auth_admin';
  end if;
end $$;

create or replace function public.zchat_launch_signup_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_em text;
  v_dev text := nullif(left(btrim(coalesce(new.device_id, '')), 120), '');
  v_net text := public.zchat_net_key(public.zchat_request_ip());
  v_why text;
begin
  if public.zchat_request_role() <> 'authenticated' or new.id is distinct from auth.uid() then
    return new;
  end if;
  if exists (select 1 from public.zchat_user_age a where a.user_id = new.id and a.young) then
    v_why := 'young';
  end if;
  if v_why is null then
    select u.email into v_em from auth.users u where u.id = new.id;
    if v_em is not null and public.zchat_email_disposable(v_em) then
      v_why := 'disposable';
    end if;
  end if;
  if v_why is null then
    v_why := public.zchat_signup_limit_reason(v_dev, v_net);
  end if;
  if v_why is null and coalesce((select c.v from public.zchat_launch_config c where c.k = 'signup_pass'), 'off') = 'on' then
    if not exists (
      select 1 from public.zchat_signup_passes p
      where p.created_at > now() - interval '3 hours'
        and ((v_em is not null and p.email = lower(v_em)) or (v_dev is not null and p.device = v_dev) or p.user_id = new.id)
    ) then
      v_why := 'pass';
    end if;
  end if;
  if v_why is not null then
    raise exception using errcode = 'P0001', message = public.zchat_signup_text(v_why), hint = 'zchat_signup_' || v_why;
  end if;
  insert into public.zchat_signup_log (user_id, device, net) values (new.id, v_dev, v_net) on conflict (user_id) do nothing;
  return new;
end $$;
revoke all on function public.zchat_launch_signup_guard() from public, anon, authenticated;

drop trigger if exists zchat_launch_signup_guard on public.profiles;
create trigger zchat_launch_signup_guard
  before insert on public.profiles
  for each row execute function public.zchat_launch_signup_guard();

create table if not exists public.zchat_photo_checks (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  user_id uuid,
  kind text,
  status text not null default 'queued',
  verdict text,
  reason text,
  scores jsonb,
  tries integer not null default 0,
  error text,
  source text,
  review text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  checked_at timestamptz
);
create index if not exists zchat_photo_checks_todo on public.zchat_photo_checks (created_at) where status in ('queued', 'failed', 'working');
create index if not exists zchat_photo_checks_flagged on public.zchat_photo_checks (created_at desc) where verdict in ('block', 'sensitive');
create index if not exists zchat_photo_checks_checked on public.zchat_photo_checks (checked_at);
alter table public.zchat_photo_checks enable row level security;
revoke all on public.zchat_photo_checks from public, anon, authenticated;
grant all on public.zchat_photo_checks to service_role;

create table if not exists public.zchat_photo_targets (
  path text not null,
  tbl text not null,
  row_id text not null,
  col text not null,
  url text,
  owner uuid,
  applied text,
  prev text,
  created_at timestamptz not null default now(),
  primary key (path, tbl, row_id, col)
);
alter table public.zchat_photo_targets enable row level security;
revoke all on public.zchat_photo_targets from public, anon, authenticated;
grant all on public.zchat_photo_targets to service_role;

create or replace function public.zchat_photo_key(p_url text)
returns text
language plpgsql
immutable
as $$
declare
  k text;
  i integer;
begin
  if p_url is null or length(p_url) > 700 then
    return null;
  end if;
  if p_url like 'zp:%' then
    k := 'chat-private/' || split_part(split_part(substr(p_url, 4), '?', 1), '#', 1);
  else
    i := strpos(p_url, '/storage/v1/object/public/chat-media/');
    if i = 0 then
      return null;
    end if;
    k := 'chat-media/' || split_part(split_part(substr(p_url, i + 37), '?', 1), '#', 1);
  end if;
  if k !~ '^(chat-media|chat-private)/[0-9a-fA-F-]{36}/[A-Za-z0-9][A-Za-z0-9._-]{0,159}$' or k ~* '\.(gif|mp4|webm|mov|m4a|mp3|wav|ogg|pdf)$' then
    return null;
  end if;
  return k;
end $$;
revoke all on function public.zchat_photo_key(text) from public, anon, authenticated;
grant execute on function public.zchat_photo_key(text) to service_role;

create or replace function public.zchat_photo_effect(p_verdict text, p_review text)
returns text
language sql
immutable
as $$
  select case
    when p_review = 'allow' then 'ok'
    when p_review = 'hide' then 'block'
    else coalesce(p_verdict, 'ok')
  end
$$;
revoke all on function public.zchat_photo_effect(text, text) from public, anon, authenticated;

create or replace function public.zchat_photo_apply(p_path text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.zchat_photo_checks%rowtype;
  t record;
  eff text;
  n integer := 0;
  hits integer;
begin
  select * into c from public.zchat_photo_checks x where x.path = p_path;
  if not found then
    return 0;
  end if;
  eff := public.zchat_photo_effect(c.verdict, c.review);
  perform set_config('zchat.photo_bypass', 'on', true);
  for t in select * from public.zchat_photo_targets g where g.path = p_path for update loop
    n := n + 1;
    hits := 0;
    if eff = 'block' or (eff = 'sensitive' and t.tbl in ('profiles', 'groups')) then
      if t.applied is distinct from 'hidden' then
        if t.tbl = 'posts' then
          execute 'update public.posts set photo_hidden_at = coalesce(photo_hidden_at, now()) where id::text = $1' using t.row_id;
          get diagnostics hits = row_count;
        elsif t.tbl = 'stories' then
          execute 'update public.stories set photo_hidden_at = coalesce(photo_hidden_at, now()) where id::text = $1' using t.row_id;
          get diagnostics hits = row_count;
        elsif t.tbl = 'profiles' and t.col = 'avatar' then
          update public.profiles set avatar = null where id::text = t.row_id and avatar = t.url;
          get diagnostics hits = row_count;
          if to_regclass('public.zchat_profile_hidden') is not null then
            execute 'update public.zchat_profile_hidden set avatar = null where id::text = $1 and avatar = $2' using t.row_id, t.url;
          end if;
        elsif t.tbl = 'profiles' and t.col = 'cover_url' then
          update public.profiles set cover_url = null where id::text = t.row_id and cover_url = t.url;
          get diagnostics hits = row_count;
        elsif t.tbl = 'groups' then
          update public.groups set avatar = null where id::text = t.row_id and avatar = t.url;
          get diagnostics hits = row_count;
        elsif t.tbl = 'messages' then
          update public.messages set media_url = null, deleted = true where id::text = t.row_id and media_url = t.url;
          get diagnostics hits = row_count;
        end if;
        update public.zchat_photo_targets g set applied = 'hidden'
          where g.path = t.path and g.tbl = t.tbl and g.row_id = t.row_id and g.col = t.col;
      end if;
    elsif eff = 'sensitive' and t.tbl in ('posts', 'stories') then
      if t.applied is null then
        if t.tbl = 'posts' then
          execute 'update public.posts set photo_flag = ''sensitive'', sensitive = true where id::text = $1' using t.row_id;
        else
          execute 'update public.stories set photo_flag = ''sensitive'' where id::text = $1' using t.row_id;
        end if;
        update public.zchat_photo_targets g set applied = 'blurred'
          where g.path = t.path and g.tbl = t.tbl and g.row_id = t.row_id and g.col = t.col;
      end if;
    end if;
  end loop;
  perform set_config('zchat.photo_bypass', 'off', true);
  return n;
end $$;
revoke all on function public.zchat_photo_apply(text) from public, anon, authenticated;
grant execute on function public.zchat_photo_apply(text) to service_role;

create or replace function public.zchat_photo_restore(p_path text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  n integer := 0;
begin
  perform set_config('zchat.photo_bypass', 'on', true);
  for t in select * from public.zchat_photo_targets g where g.path = p_path and g.applied is not null for update loop
    n := n + 1;
    if t.tbl = 'posts' then
      execute 'update public.posts set photo_hidden_at = null, photo_flag = null, sensitive = case when photo_flag = ''sensitive'' then coalesce($2 = ''sensitive'', false) else sensitive end where id::text = $1' using t.row_id, t.prev;
    elsif t.tbl = 'stories' then
      execute 'update public.stories set photo_hidden_at = null, photo_flag = null where id::text = $1' using t.row_id;
    elsif t.tbl = 'profiles' and t.col = 'avatar' then
      update public.profiles set avatar = t.url where id::text = t.row_id and avatar is null;
    elsif t.tbl = 'profiles' and t.col = 'cover_url' then
      update public.profiles set cover_url = t.url where id::text = t.row_id and cover_url is null;
    elsif t.tbl = 'groups' then
      update public.groups set avatar = t.url where id::text = t.row_id and avatar is null;
    elsif t.tbl = 'messages' then
      update public.messages set media_url = t.url, deleted = false where id::text = t.row_id and media_url is null;
    end if;
    update public.zchat_photo_targets g set applied = null
      where g.path = t.path and g.tbl = t.tbl and g.row_id = t.row_id and g.col = t.col;
  end loop;
  perform set_config('zchat.photo_bypass', 'off', true);
  return n;
end $$;
revoke all on function public.zchat_photo_restore(text) from public, anon, authenticated;

create or replace function public.zchat_photo_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  urls text[] := '{}';
  cols text[] := '{}';
  el jsonb;
  i integer;
  k text;
  c public.zchat_photo_checks%rowtype;
  eff text;
  v_owner uuid;
  v_prev text;
  rid text;
  is_pub boolean := tg_table_name in ('posts', 'stories', 'profiles', 'groups');
  role_now text := public.zchat_request_role();
begin
  if coalesce(current_setting('zchat.photo_bypass', true), '') = 'on' or role_now not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_op = 'UPDATE' and tg_table_name in ('posts', 'stories') then
    new.photo_hidden_at := old.photo_hidden_at;
    new.photo_flag := old.photo_flag;
    if tg_table_name = 'posts' and old.photo_flag = 'sensitive' then
      new.sensitive := true;
    end if;
  end if;
  if tg_table_name = 'posts' then
    v_owner := new.user_id;
    v_prev := case when coalesce(new.sensitive, false) then 'sensitive' end;
    if tg_op = 'INSERT' or new.media_url is distinct from old.media_url or new.media_urls is distinct from old.media_urls then
      if new.media_type is distinct from 'video' and new.media_url is not null then
        urls := urls || new.media_url; cols := cols || 'media_url'::text;
      end if;
      if jsonb_typeof(new.media_urls) = 'array' then
        for el in select * from jsonb_array_elements(new.media_urls) loop
          if jsonb_typeof(el) = 'object' and (el ->> 't') is distinct from 'video' and (el ->> 'u') is not null then
            urls := urls || (el ->> 'u'); cols := cols || 'media_urls'::text;
          end if;
        end loop;
      end if;
    end if;
  elsif tg_table_name = 'stories' then
    v_owner := new.user_id;
    if (tg_op = 'INSERT' or new.media_url is distinct from old.media_url) and new.media_type is distinct from 'video' and new.media_url is not null then
      urls := urls || new.media_url; cols := cols || 'media_url'::text;
    end if;
  elsif tg_table_name = 'profiles' then
    v_owner := new.id;
    if (tg_op = 'INSERT' or new.avatar is distinct from old.avatar) and new.avatar is not null then
      urls := urls || new.avatar; cols := cols || 'avatar'::text;
    end if;
    if (tg_op = 'INSERT' or new.cover_url is distinct from old.cover_url) and new.cover_url is not null then
      urls := urls || new.cover_url; cols := cols || 'cover_url'::text;
    end if;
  elsif tg_table_name = 'groups' then
    v_owner := auth.uid();
    if (tg_op = 'INSERT' or new.avatar is distinct from old.avatar) and new.avatar is not null then
      urls := urls || new.avatar; cols := cols || 'avatar'::text;
    end if;
  elsif tg_table_name = 'messages' then
    v_owner := new.sender_id;
    if tg_op = 'INSERT' and new.type = 'image' and new.media_url is not null then
      urls := urls || new.media_url; cols := cols || 'media_url'::text;
    end if;
  end if;
  if coalesce(array_length(urls, 1), 0) = 0 then
    return new;
  end if;
  rid := new.id::text;
  for i in 1 .. array_length(urls, 1) loop
    k := public.zchat_photo_key(urls[i]);
    continue when k is null;
    select * into c from public.zchat_photo_checks x where x.path = k;
    if found and c.status = 'done' then
      eff := public.zchat_photo_effect(c.verdict, c.review);
      if eff = 'block' or (eff = 'sensitive' and tg_table_name in ('profiles', 'groups')) then
        raise exception using errcode = 'P0001',
          message = case when tg_table_name in ('profiles', 'groups') then 'This photo cannot be used here. Try a different one.' else 'This photo cannot be shared on ZChat.' end,
          hint = 'zchat_photo_blocked';
      elsif eff = 'sensitive' and tg_table_name in ('posts', 'stories') then
        if tg_table_name = 'posts' then
          new.sensitive := true;
        end if;
        new.photo_flag := 'sensitive';
        if rid is not null then
          insert into public.zchat_photo_targets (path, tbl, row_id, col, url, owner, applied, prev)
          values (k, tg_table_name, rid, cols[i], urls[i], v_owner, 'blurred', v_prev)
          on conflict (path, tbl, row_id, col) do update set url = excluded.url, applied = 'blurred';
        end if;
      end if;
    elsif found or is_pub then
      if not found then
        insert into public.zchat_photo_checks (path, user_id, kind, status, source)
        values (k, case when split_part(k, '/', 2) ~ '^[0-9a-fA-F-]{36}$' then split_part(k, '/', 2)::uuid end, tg_table_name, 'queued', 'trigger')
        on conflict (path) do nothing;
      end if;
      if rid is not null then
        insert into public.zchat_photo_targets (path, tbl, row_id, col, url, owner, prev)
        values (k, tg_table_name, rid, cols[i], urls[i], v_owner, v_prev)
        on conflict (path, tbl, row_id, col) do update set url = excluded.url, applied = null;
      end if;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.zchat_photo_guard() from public, anon, authenticated;

do $$
begin
  if to_regclass('public.posts') is not null then
    execute 'alter table public.posts add column if not exists photo_hidden_at timestamptz';
    execute 'alter table public.posts add column if not exists photo_flag text';
    execute 'alter table public.posts add column if not exists sensitive boolean not null default false';
    execute 'drop trigger if exists zchat_photo_guard on public.posts';
    execute 'create trigger zchat_photo_guard before insert or update of media_url, media_urls, photo_hidden_at, photo_flag, sensitive on public.posts for each row execute function public.zchat_photo_guard()';
    execute 'drop policy if exists "zchat photo hidden posts" on public.posts';
    execute 'create policy "zchat photo hidden posts" on public.posts as restrictive for select to anon, authenticated using (photo_hidden_at is null or user_id = (select auth.uid()) or (select public.zchat_is_admin()))';
  end if;
  if to_regclass('public.stories') is not null then
    execute 'alter table public.stories add column if not exists photo_hidden_at timestamptz';
    execute 'alter table public.stories add column if not exists photo_flag text';
    execute 'drop trigger if exists zchat_photo_guard on public.stories';
    execute 'create trigger zchat_photo_guard before insert or update of media_url, photo_hidden_at, photo_flag on public.stories for each row execute function public.zchat_photo_guard()';
    execute 'drop policy if exists "zchat photo hidden stories" on public.stories';
    execute 'create policy "zchat photo hidden stories" on public.stories as restrictive for select to anon, authenticated using (photo_hidden_at is null or user_id = (select auth.uid()) or (select public.zchat_is_admin()))';
  end if;
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles add column if not exists cover_url text';
    execute 'drop trigger if exists zchat_photo_guard on public.profiles';
    execute 'create trigger zchat_photo_guard before insert or update of avatar, cover_url on public.profiles for each row execute function public.zchat_photo_guard()';
  end if;
  if to_regclass('public.groups') is not null then
    execute 'drop trigger if exists zchat_photo_guard on public.groups';
    execute 'create trigger zchat_photo_guard before insert or update of avatar on public.groups for each row execute function public.zchat_photo_guard()';
  end if;
  if to_regclass('public.messages') is not null then
    execute 'drop trigger if exists zchat_photo_guard on public.messages';
    execute 'create trigger zchat_photo_guard before insert on public.messages for each row execute function public.zchat_photo_guard()';
  end if;
end $$;

create or replace function public.zchat_photo_begin(p_user uuid, p_paths text[], p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
  c public.zchat_photo_checks%rowtype;
  res jsonb := '[]'::jsonb;
begin
  foreach p in array coalesce(p_paths, '{}'::text[]) loop
    continue when p is null or split_part(p, '/', 2) <> p_user::text or public.zchat_photo_key(case when p like 'chat-private/%' then 'zp:' || substr(p, 14) else '/storage/v1/object/public/' || p end) is distinct from p;
    insert into public.zchat_photo_checks as x (path, user_id, kind, status, source, tries, claimed_at)
    values (p, p_user, left(coalesce(p_kind, ''), 20), 'working', 'pre', 1, now())
    on conflict (path) do update
      set status = 'working', claimed_at = now(), tries = x.tries + 1, kind = coalesce(x.kind, excluded.kind)
      where x.status <> 'done' and (x.status <> 'working' or x.claimed_at < now() - interval '40 seconds')
    returning * into c;
    if not found then
      select * into c from public.zchat_photo_checks x where x.path = p;
      res := res || jsonb_build_array(jsonb_build_object('id', c.id, 'path', c.path, 'run', false, 'status', c.status, 'verdict', public.zchat_photo_effect(c.verdict, c.review), 'reason', c.reason));
    else
      res := res || jsonb_build_array(jsonb_build_object('id', c.id, 'path', c.path, 'run', true));
    end if;
  end loop;
  return res;
end $$;
revoke all on function public.zchat_photo_begin(uuid, text[], text) from public, anon, authenticated;
grant execute on function public.zchat_photo_begin(uuid, text[], text) to service_role;

create or replace function public.zchat_photo_done(p_id uuid, p_verdict text, p_reason text, p_scores jsonb, p_error text default null, p_source text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.zchat_photo_checks%rowtype;
  n integer := 0;
begin
  if p_verdict in ('ok', 'sensitive', 'block') then
    update public.zchat_photo_checks x
      set status = 'done', verdict = p_verdict, reason = left(p_reason, 40), scores = p_scores, error = null,
          checked_at = now(), source = coalesce(p_source, x.source)
      where x.id = p_id
      returning * into c;
  elsif p_error in ('missing', 'type', 'big') then
    update public.zchat_photo_checks x
      set status = 'skipped', error = p_error, checked_at = now()
      where x.id = p_id
      returning * into c;
  else
    update public.zchat_photo_checks x
      set status = 'failed', error = left(coalesce(p_error, 'unknown'), 200)
      where x.id = p_id
      returning * into c;
  end if;
  if not found then
    return jsonb_build_object('ok', false);
  end if;
  if c.status = 'done' then
    n := public.zchat_photo_apply(c.path);
  else
    select count(*) into n from public.zchat_photo_targets g where g.path = c.path;
  end if;
  return jsonb_build_object('ok', true, 'targets', n, 'path', c.path);
end $$;
revoke all on function public.zchat_photo_done(uuid, text, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.zchat_photo_done(uuid, text, text, jsonb, text, text) to service_role;

create or replace function public.zchat_photo_claim(p_limit integer default 8)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  res jsonb;
begin
  update public.zchat_photo_checks x set status = 'failed', error = coalesce(x.error, 'stalled')
    where x.status = 'working' and x.claimed_at < now() - interval '3 minutes';
  with picked as (
    select x.id from public.zchat_photo_checks x
    where x.status in ('queued', 'failed') and x.tries < 5 and x.created_at > now() - interval '7 days'
    order by x.created_at
    limit greatest(1, least(coalesce(p_limit, 8), 40))
    for update skip locked
  ), done as (
    update public.zchat_photo_checks x set status = 'working', claimed_at = now(), tries = x.tries + 1
    from picked where x.id = picked.id
    returning x.id, x.path, x.kind
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'path', path, 'kind', kind)), '[]'::jsonb) into res from done;
  if random() < 0.05 then
    delete from public.zchat_photo_checks x
      where x.id in (
        select y.id from public.zchat_photo_checks y
        where y.verdict = 'ok' and y.review is null and y.checked_at < now() - interval '60 days'
          and not exists (select 1 from public.zchat_photo_targets g where g.path = y.path and g.applied is not null)
        limit 2000
      );
  end if;
  return res;
end $$;
revoke all on function public.zchat_photo_claim(integer) from public, anon, authenticated;
grant execute on function public.zchat_photo_claim(integer) to service_role;

create or replace function public.zchat_admin_photo_flags(p_filter text default 'open', p_limit integer default 60)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  res jsonb;
begin
  if not public.zchat_is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(row_to_json(r)::jsonb order by r.created_at desc), '[]'::jsonb) into res from (
    select c.id, c.path, c.kind, c.verdict, c.reason, c.status, c.review, c.source, c.created_at, c.checked_at, c.reviewed_at,
      c.user_id, p.username, p.name,
      (select coalesce(jsonb_agg(jsonb_build_object('tbl', g.tbl, 'row_id', g.row_id, 'col', g.col, 'applied', g.applied, 'url', g.url)), '[]'::jsonb)
        from public.zchat_photo_targets g where g.path = c.path) as targets
    from public.zchat_photo_checks c
    left join public.profiles p on p.id = c.user_id
    where c.verdict in ('block', 'sensitive')
      and (coalesce(p_filter, 'open') <> 'open' or c.review is null)
    order by c.created_at desc
    limit greatest(1, least(coalesce(p_limit, 60), 200))
  ) r;
  return res;
end $$;
revoke all on function public.zchat_admin_photo_flags(text, integer) from public, anon;
grant execute on function public.zchat_admin_photo_flags(text, integer) to authenticated;

create or replace function public.zchat_admin_photo_review(p_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.zchat_photo_checks%rowtype;
  n integer := 0;
begin
  if not public.zchat_is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_action not in ('allow', 'hide', 'dismiss') then
    return jsonb_build_object('ok', false, 'reason', 'action');
  end if;
  update public.zchat_photo_checks x
    set review = case when p_action = 'dismiss' then coalesce(x.review, 'seen') else p_action end,
        reviewed_by = auth.uid(), reviewed_at = now()
    where x.id = p_id
    returning * into c;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'gone');
  end if;
  if p_action = 'allow' then
    n := public.zchat_photo_restore(c.path);
  elsif p_action = 'hide' then
    n := public.zchat_photo_apply(c.path);
  end if;
  return jsonb_build_object('ok', true, 'changed', n);
end $$;
revoke all on function public.zchat_admin_photo_review(uuid, text) from public, anon;
grant execute on function public.zchat_admin_photo_review(uuid, text) to authenticated;

create table if not exists public.zchat_backups (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  size_bytes bigint,
  kind text not null default 'github',
  note text
);
alter table public.zchat_backups enable row level security;
revoke all on public.zchat_backups from public, anon, authenticated;
grant all on public.zchat_backups to service_role;
revoke all on sequence public.zchat_backups_id_seq from public, anon, authenticated;
grant usage, select on sequence public.zchat_backups_id_seq to service_role;

create or replace function public.zchat_backup_done(p_size bigint, p_note text default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.zchat_backups (size_bytes, note) values (p_size, left(p_note, 300));
$$;
revoke all on function public.zchat_backup_done(bigint, text) from public, anon, authenticated;
grant execute on function public.zchat_backup_done(bigint, text) to service_role;

create or replace function public.zchat_admin_health()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  res jsonb := jsonb_build_object('at', now());
  part jsonb;
  rel text;
  cache text;
  cache_at timestamptz;
begin
  if not public.zchat_is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  begin
    select jsonb_build_object(
      'bytes', pg_database_size(current_database()),
      'plan', coalesce((select c.v from public.zchat_launch_config c where c.k = 'plan'), 'free')
    ) into part;
    res := res || jsonb_build_object('db', part);
  exception when others then
    res := res || jsonb_build_object('db', jsonb_build_object('error', sqlerrm));
  end;

  begin
    select jsonb_build_object(
      'total', count(*),
      'active', count(*) filter (where a.state = 'active'),
      'idle_tx', count(*) filter (where a.state like 'idle in transaction%'),
      'max', current_setting('max_connections')::integer,
      'long', count(*) filter (where a.state = 'active' and a.query_start < now() - interval '1 minute' and a.backend_type = 'client backend' and a.pid <> pg_backend_pid()),
      'longest_s', coalesce(round(max(extract(epoch from now() - a.query_start)) filter (where a.state = 'active' and a.backend_type = 'client backend' and a.pid <> pg_backend_pid())), 0)
    ) into part
    from pg_stat_activity a;
    res := res || jsonb_build_object('conn', part);
  exception when others then
    res := res || jsonb_build_object('conn', jsonb_build_object('error', sqlerrm));
  end;

  begin
    rel := coalesce(to_regclass('extensions.pg_stat_statements')::text, to_regclass('public.pg_stat_statements')::text);
    if rel is null then
      res := res || jsonb_build_object('slow', jsonb_build_object('off', true));
    else
      execute format($q$
        select coalesce(jsonb_agg(jsonb_build_object('q', q, 'calls', calls, 'mean_ms', mean_ms, 'total_s', total_s) order by mean_ms desc), '[]'::jsonb)
        from (
          select left(regexp_replace(s.query, '\s+', ' ', 'g'), 140) as q, s.calls, round(s.mean_exec_time::numeric, 1) as mean_ms, round((s.total_exec_time / 1000)::numeric) as total_s
          from %s s
          where s.calls >= 20 and s.query !~* 'pg_stat|zchat_admin_health|^\s*(begin|commit|rollback|set |show |select pg_sleep)'
          order by s.mean_exec_time desc
          limit 5
        ) x
      $q$, rel) into part;
      res := res || jsonb_build_object('slow', jsonb_build_object('top', part));
    end if;
  exception when others then
    res := res || jsonb_build_object('slow', jsonb_build_object('error', sqlerrm));
  end;

  begin
    if to_regclass('public.zchat_minute_jobs') is null then
      res := res || jsonb_build_object('jobs', jsonb_build_object('off', true));
    else
      execute $q$
        select coalesce(jsonb_agg((to_jsonb(j) - 'command') || jsonb_build_object('cmd', left(coalesce(to_jsonb(j) ->> 'command', ''), 90)) order by (to_jsonb(j) ->> 'name')), '[]'::jsonb)
        from public.zchat_minute_jobs j
      $q$ into part;
      res := res || jsonb_build_object('jobs', jsonb_build_object('list', part));
    end if;
  exception when others then
    res := res || jsonb_build_object('jobs', jsonb_build_object('error', sqlerrm));
  end;

  begin
    if to_regclass('cron.job_run_details') is null then
      res := res || jsonb_build_object('cron', jsonb_build_object('off', true));
    else
      execute $q$
        with recent as (
          select d.jobid, d.status, d.return_message, d.start_time
          from cron.job_run_details d
          order by d.runid desc
          limit 20000
        )
        select jsonb_build_object(
          'runs_day', count(*) filter (where r.start_time > now() - interval '1 day'),
          'fail_hour', count(*) filter (where r.status = 'failed' and r.start_time > now() - interval '1 hour'),
          'fail_day', count(*) filter (where r.status = 'failed' and r.start_time > now() - interval '1 day'),
          'stuck', count(*) filter (where r.status = 'running' and r.start_time < now() - interval '10 minutes'),
          'last_fail', (
            select jsonb_build_object('at', f.start_time, 'msg', left(coalesce(f.return_message, ''), 200), 'job', coalesce(j.jobname, f.jobid::text))
            from recent f left join cron.job j on j.jobid = f.jobid
            where f.status = 'failed' order by f.start_time desc limit 1
          ),
          'rows', (select greatest(c.reltuples, 0)::bigint from pg_class c where c.oid = 'cron.job_run_details'::regclass)
        )
        from recent r
      $q$ into part;
      res := res || jsonb_build_object('cron', part);
    end if;
  exception when others then
    res := res || jsonb_build_object('cron', jsonb_build_object('error', sqlerrm));
  end;

  begin
    if to_regclass('net._http_response') is null then
      res := res || jsonb_build_object('net', jsonb_build_object('off', true));
    else
      execute $q$
        select jsonb_build_object(
          'total', count(*),
          'fail_hour', count(*) filter (where (r.timed_out or r.error_msg is not null or coalesce(r.status_code, 0) >= 400) and r.created > now() - interval '1 hour'),
          'fail', count(*) filter (where r.timed_out or r.error_msg is not null or coalesce(r.status_code, 0) >= 400),
          'last_fail', (
            select jsonb_build_object('at', f.created, 'code', f.status_code, 'msg', left(coalesce(f.error_msg, case when f.timed_out then 'timed res' end, left(f.content, 120), ''), 160))
            from net._http_response f
            where f.timed_out or f.error_msg is not null or coalesce(f.status_code, 0) >= 400
            order by f.created desc limit 1
          )
        )
        from net._http_response r
        where r.created > now() - interval '6 hours'
      $q$ into part;
      res := res || jsonb_build_object('net', part);
    end if;
  exception when others then
    res := res || jsonb_build_object('net', jsonb_build_object('error', sqlerrm));
  end;

  begin
    if to_regclass('storage.objects') is null then
      res := res || jsonb_build_object('storage', jsonb_build_object('off', true));
    else
      select c.v, c.updated_at into cache, cache_at from public.zchat_launch_config c where c.k = 'storage_cache';
      if cache is not null and cache_at > now() - interval '30 minutes' then
        part := cache::jsonb;
      else
        execute $q$
          select jsonb_build_object(
            'buckets', coalesce(jsonb_agg(jsonb_build_object('bucket', b.bucket_id, 'files', b.n, 'bytes', b.bytes) order by b.bytes desc), '[]'::jsonb),
            'bytes', coalesce(sum(b.bytes), 0),
            'at', now()
          )
          from (
            select o.bucket_id, count(*) as n, coalesce(sum(case when (o.metadata ->> 'size') ~ '^[0-9]+$' then (o.metadata ->> 'size')::bigint else 0 end), 0) as bytes
            from storage.objects o
            group by o.bucket_id
          ) b
        $q$ into part;
        insert into public.zchat_launch_config (k, v, updated_at) values ('storage_cache', part::text, now())
          on conflict (k) do update set v = excluded.v, updated_at = now();
      end if;
      res := res || jsonb_build_object('storage', part);
    end if;
  exception when others then
    res := res || jsonb_build_object('storage', jsonb_build_object('error', sqlerrm));
  end;

  begin
    select jsonb_build_object(
      'hours', coalesce(jsonb_agg(jsonb_build_object('h', h.h, 'n', coalesce(s.n, 0)) order by h.h), '[]'::jsonb)
    ) into part
    from generate_series(date_trunc('hour', now()) - interval '23 hours', date_trunc('hour', now()), interval '1 hour') as h(h)
    left join (
      select date_trunc('hour', p.created_at) as hh, count(*) as n
      from public.profiles p
      where p.created_at > date_trunc('hour', now()) - interval '23 hours'
      group by 1
    ) s on s.hh = h.h;
    select part || jsonb_build_object(
      'blocked', coalesce((
        select jsonb_object_agg(x.kind, x.n) from (
          select a.kind, count(*) as n from public.zchat_signup_attempts a
          where a.created_at > now() - interval '1 day' and a.kind not in ('pass', 'pass_human', 'hook_created')
          group by a.kind
        ) x
      ), '{}'::jsonb),
      'passes', (select count(*) from public.zchat_signup_attempts a where a.created_at > now() - interval '1 day' and a.kind in ('pass', 'pass_human')),
      'human', (select count(*) from public.zchat_signup_attempts a where a.created_at > now() - interval '1 day' and a.kind = 'pass_human'),
      'hook', (select count(*) from public.zchat_signup_attempts a where a.created_at > now() - interval '1 day' and a.kind like 'hook%'),
      'pass_rule', coalesce((select c.v from public.zchat_launch_config c where c.k = 'signup_pass'), 'off')
    ) into part;
    res := res || jsonb_build_object('signups', part);
  exception when others then
    res := res || jsonb_build_object('signups', jsonb_build_object('error', sqlerrm));
  end;

  begin
    if to_regclass('public.client_errors') is null then
      res := res || jsonb_build_object('crashes', jsonb_build_object('off', true));
    else
      execute $q$
        select jsonb_build_object(
          'hour', count(*) filter (where e.created_at > now() - interval '1 hour'),
          'day', count(*),
          'people', count(distinct (to_jsonb(e) ->> 'user_id')),
          'top', (
            select jsonb_build_object('msg', left(t.message, 160), 'n', t.n)
            from (
              select x.message, count(*) as n from public.client_errors x
              where x.created_at > now() - interval '1 day'
              group by x.message order by count(*) desc limit 1
            ) t
          )
        )
        from public.client_errors e
        where e.created_at > now() - interval '1 day'
      $q$ into part;
      res := res || jsonb_build_object('crashes', part);
    end if;
  exception when others then
    res := res || jsonb_build_object('crashes', jsonb_build_object('error', sqlerrm));
  end;

  begin
    select jsonb_build_object(
      'last', (select b.ran_at from public.zchat_backups b order by b.ran_at desc limit 1),
      'size', (select b.size_bytes from public.zchat_backups b order by b.ran_at desc limit 1),
      'month', (select count(*) from public.zchat_backups b where b.ran_at > now() - interval '30 days')
    ) into part;
    res := res || jsonb_build_object('backups', part);
  exception when others then
    res := res || jsonb_build_object('backups', jsonb_build_object('error', sqlerrm));
  end;

  begin
    select jsonb_build_object(
      'waiting', count(*) filter (where c.status in ('queued', 'failed', 'working') and c.tries < 5),
      'oldest', min(c.created_at) filter (where c.status in ('queued', 'failed') and c.tries < 5),
      'stuck', count(*) filter (where c.status = 'failed' and c.tries >= 5),
      'checked_day', count(*) filter (where c.checked_at > now() - interval '1 day'),
      'flagged_day', count(*) filter (where c.verdict in ('block', 'sensitive') and c.checked_at > now() - interval '1 day'),
      'open', count(*) filter (where c.verdict in ('block', 'sensitive') and c.review is null),
      'last_error', (select left(x.error, 120) from public.zchat_photo_checks x where x.status = 'failed' order by x.created_at desc limit 1)
    ) into part
    from public.zchat_photo_checks c
    where c.created_at > now() - interval '7 days' or c.review is null;
    res := res || jsonb_build_object('photos', part);
  exception when others then
    res := res || jsonb_build_object('photos', jsonb_build_object('error', sqlerrm));
  end;

  return res;
end $$;
revoke all on function public.zchat_admin_health() from public, anon;
grant execute on function public.zchat_admin_health() to authenticated;

create or replace function public.zchat_admin_health_set(p_key text, p_value text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.zchat_is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not ((p_key = 'plan' and p_value in ('free', 'pro'))
      or (p_key = 'signup_pass' and p_value in ('on', 'off'))
      or (p_key in ('signup_device_day', 'signup_net_hour', 'signup_net_day', 'signup_hook_net_day') and p_value ~ '^[0-9]{1,4}$' and p_value::integer between 1 and 5000)) then
    return jsonb_build_object('ok', false);
  end if;
  insert into public.zchat_launch_config (k, v, updated_at) values (p_key, p_value, now())
    on conflict (k) do update set v = excluded.v, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.zchat_admin_health_set(text, text) from public, anon;
grant execute on function public.zchat_admin_health_set(text, text) to authenticated;


create or replace function public.zchat_post_view_counts(p_posts uuid[])
returns table(post_id uuid, views integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_posts is null or cardinality(p_posts) = 0 then
    return;
  end if;
  return query
  with ids as (
    select distinct x.id
    from unnest((p_posts)[1:200]) as x(id)
    where x.id is not null
  ),
  rows_in as (
    select p.id, p.user_id, coalesce(p.hide_likes, false) as hidden
    from public.posts p
    join ids on ids.id = p.id
    where p.archived_at is null
      and (p.scheduled_for is null or p.scheduled_for <= now() or p.user_id = me)
  ),
  owners_ok as (
    select o.user_id
    from (select distinct r.user_id from rows_in r) o
    where o.user_id = me or public.zchat_can_view_posts(me, o.user_id)
  ),
  shown as (
    select r.id
    from rows_in r
    join owners_ok ok on ok.user_id = r.user_id
    where r.user_id = me or not r.hidden
  ),
  counted as (
    select e.post_id as pid, count(distinct e.user_id)::integer as n
    from public.post_events e
    join shown s on s.id = e.post_id
    where e.kind = 'view'
    group by e.post_id
  )
  select s.id, coalesce(c.n, 0)
  from shown s
  left join counted c on c.pid = s.id;
end $$;

revoke all on function public.zchat_post_view_counts(uuid[]) from public, anon;
grant execute on function public.zchat_post_view_counts(uuid[]) to authenticated;


create schema if not exists zchat_private;
revoke all on schema zchat_private from public;
grant usage on schema zchat_private to anon, authenticated, service_role;
create table if not exists zchat_private.moved_functions (
  name text not null,
  args text not null,
  moved_at timestamptz not null default now(),
  primary key (name, args)
);
revoke all on zchat_private.moved_functions from public, anon, authenticated;

create or replace function zchat_private.zchat_sync_twin()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  c record;
  def text;
  twin oid;
begin
  for c in select * from pg_event_trigger_ddl_commands() where object_type = 'function' and schema_name = 'public' loop
    select p2.oid into twin
      from pg_proc p1
      join pg_proc p2 on p2.proname = p1.proname
       and pg_get_function_identity_arguments(p2.oid) = pg_get_function_identity_arguments(p1.oid)
       and p2.pronamespace = 'zchat_private'::regnamespace
     where p1.oid = c.objid;
    if twin is null then continue; end if;
    def := pg_get_functiondef(c.objid);
    def := regexp_replace(def, '^CREATE OR REPLACE FUNCTION public\.', 'CREATE OR REPLACE FUNCTION zchat_private.');
    begin
      execute def;
    exception when others then
      raise warning 'zchat: could not update the internal copy of %: %', c.object_identity, sqlerrm;
    end;
  end loop;
end $$;

do $mv$
declare
  r record;
  used text[] := array[
  'access_token',
  'active_day',
  'actor_id',
  'add_members_policy',
  'added_at',
  'added_by',
  'admin_add_knowledge',
  'admin_ban',
  'admin_bot_knowledge_count',
  'admin_broadcast',
  'admin_delete_content',
  'admin_delete_row',
  'admin_delete_user',
  'admin_get_user',
  'admin_grant_reward',
  'admin_ids',
  'admin_level',
  'admin_lift_restriction',
  'admin_links',
  'admin_list_tables',
  'admin_list_users',
  'admin_log',
  'admin_log_action',
  'admin_name',
  'admin_recent_log',
  'admin_remove_user_messages',
  'admin_reports',
  'admin_resolve_report',
  'admin_restrict',
  'admin_revoke_reward',
  'admin_send_mail',
  'admin_set_admin',
  'admin_set_badge',
  'admin_set_frame',
  'admin_set_verified',
  'admin_sign_out_user',
  'admin_stats',
  'admin_table_rows',
  'admin_unban',
  'admin_update_profile',
  'admin_update_row',
  'admin_user_messages',
  'admin_user_overview',
  'ai_artist',
  'ai_character_messages',
  'ai_characters',
  'ai_flash_decks',
  'ai_images',
  'ai_link_cache',
  'ai_photo_jobs',
  'ai_practice_sessions',
  'ai_usage',
  'album_id',
  'album_photos',
  'alert_birthday',
  'alert_moment',
  'alt_texts',
  'ama_on',
  'announce_id',
  'answered_at',
  'api_key',
  'app_metadata',
  'apply_after',
  'approval_off',
  'approve_posts',
  'archived_at',
  'arts_centre',
  'as_group',
  'asked_at',
  'author_id',
  'autumn_fox',
  'avatar_anim',
  'avatar_cfg',
  'avatar_frame',
  'avatar_url',
  'away_log',
  'away_on',
  'away_text',
  'bag_back',
  'bag_id',
  'bag_in',
  'bag_out',
  'ban_duration',
  'bday_back',
  'bday_card',
  'bday_hold',
  'bday_open',
  'beat_at',
  'birthday_gifts',
  'blocked_by',
  'blocked_id',
  'blocker_id',
  'booth_id',
  'bot_find_knowledge',
  'bot_group',
  'bot_knowledge',
  'bot_messages',
  'bot_reply',
  'broadcast_lists',
  'bubble_style',
  'bubble_tea',
  'bubble_tea_matcha',
  'butterfly_garden',
  'call_blur',
  'call_captions',
  'call_hides',
  'call_id',
  'callee_id',
  'caller_id',
  'campfire_night',
  'can_claim',
  'can_move',
  'can_redeem',
  'can_sign',
  'cancel_at_end',
  'cancelled_at',
  'candy_land',
  'candy_land_mint',
  'cannot_post',
  'channel_follows',
  'channel_id',
  'channel_post_likes',
  'channel_posts',
  'character_id',
  'chat_accepts',
  'chat_imports',
  'chat_key',
  'chat_label',
  'chat_lock_enabled',
  'chat_lock_hash',
  'chat_locks',
  'chat_name',
  'checked_day',
  'chip_back',
  'chip_out',
  'client_errors',
  'client_id',
  'close_friends',
  'closed_at',
  'coffee_shop',
  'coin_bag_opens',
  'coin_bags',
  'coin_ledger',
  'coins_added',
  'collab_id',
  'collab_status',
  'collection_id',
  'comment_id',
  'comment_like',
  'comments_off',
  'comments_on',
  'community_groups',
  'community_id',
  'community_members',
  'compliments_all',
  'compliments_new',
  'conference_centre',
  'contact_id',
  'contact_nicknames',
  'conversation_id',
  'cosy_room',
  'cover_anim',
  'cover_meta',
  'cover_type',
  'cover_url',
  'cozy_rain',
  'created_at',
  'created_by',
  'creator_id',
  'creator_members',
  'creator_msg_holds',
  'creator_packs',
  'creator_settings',
  'creator_shoutouts',
  'cricket_match',
  'crop_free',
  'crystal_phoenix',
  'custom_badge',
  'custom_data',
  'cutecat_heart',
  'data_ready',
  'deep_sea',
  'delete_account',
  'deliver_at',
  'desert_oasis',
  'device_id',
  'device_keys',
  'device_name',
  'dino_park',
  'disappear_secs',
  'dm_user_id',
  'done_at',
  'downsized_medium',
  'dragon_hoard',
  'drop_id',
  'drop_reminders',
  'drum_roll',
  'due_at',
  'earned_at',
  'edited_by',
  'email_confirm',
  'email_missed',
  'ended_at',
  'ends_at',
  'entry_paid',
  'entry_price',
  'error_description',
  'event_id',
  'event_name',
  'events_venue',
  'exhibition_centre',
  'expires_at',
  'export_link',
  'export_start',
  'exported_at',
  'factor_type',
  'fail_day',
  'fail_hour',
  'fan_id',
  'fast_food',
  'festival_elephant',
  'fire_flare',
  'fire_phoenix',
  'fire_wolf',
  'fireworks_night',
  'first_at',
  'first_order_item',
  'first_post',
  'fixed_width',
  'fixed_width_downsampled',
  'flagged_day',
  'folder_id',
  'follow_request',
  'follower_id',
  'followers_10',
  'followers_100',
  'followers_1000',
  'followers_count',
  'following_count',
  'following_id',
  'food_court',
  'forwarded_from_name',
  'free_bubbles',
  'free_sets',
  'friend_id',
  'friend_name',
  'friend_rank',
  'friends_10',
  'from_coins',
  'from_id',
  'from_name',
  'from_user_id',
  'full_name',
  'ga2_act',
  'ga2_active',
  'ga2_chain_srv',
  'ga2_create',
  'ga2_end',
  'ga2_games',
  'ga2_get',
  'ga2_join',
  'ga2_leave',
  'ga2_secrets',
  'ga2_start',
  'ga2_tick',
  'game_id',
  'game_stats',
  'gift_codes',
  'gift_id',
  'gift_in',
  'gift_item',
  'gift_out',
  'gift_sent',
  'goal_rush',
  'golden_hour',
  'gone_at',
  'grant_type',
  'granted_at',
  'grey_butterfly',
  'group_entry_payments',
  'group_gift_people',
  'group_gifts',
  'group_id',
  'group_join_requests',
  'group_members',
  'group_reads',
  'group_rules',
  'guest_house',
  'had_item',
  'has_email',
  'has_pin',
  'hashed_token',
  'heart_fireworks',
  'heart_pump',
  'hidden_account',
  'hidden_id',
  'hidden_messages',
  'hide_activity',
  'hide_age',
  'hide_bio',
  'hide_country',
  'hide_gender',
  'hide_likes',
  'hide_photo',
  'highlight_id',
  'highlight_items',
  'highlight_likes',
  'hint_at',
  'honey_bees',
  'hook_disposable',
  'hook_net',
  'host_id',
  'host_only',
  'hot_air_balloon',
  'hot_air_balloon_dusk',
  'i_am_their_best',
  'ia_archiver',
  'ice_wolf',
  'idle_tx',
  'image_all',
  'import_id',
  'imported_messages',
  'importer_id',
  'inserted_at',
  'invite_code',
  'invite_enabled',
  'invite_reset',
  'is_admin',
  'is_blocked',
  'is_bot',
  'is_deleted',
  'is_me',
  'is_private',
  'item_id',
  'item_key',
  'item_kind',
  'jaw_drop',
  'jellyfish_glow',
  'join_approval',
  'join_questions',
  'join_until',
  'joined_at',
  'jungle_swing',
  'key_a',
  'key_b',
  'key_half',
  'koi_gold',
  'koi_ink',
  'koi_pond',
  'koi_pond_night',
  'last_active',
  'last_at',
  'last_claim',
  'last_error',
  'last_fail',
  'last_message',
  'last_message_at',
  'last_message_type',
  'last_ms',
  'last_read_id',
  'last_run',
  'last_seen',
  'last_sender_id',
  'last_sign_in_at',
  'last_used_at',
  'laugh_shake',
  'lava_island',
  'left_coins',
  'let_in',
  'limit_recent',
  'limit_strangers',
  'limits_until',
  'link_code',
  'link_url',
  'linked_at',
  'list_id',
  'live_comments',
  'live_gifts',
  'live_goals',
  'live_id',
  'live_in',
  'live_out',
  'live_plans',
  'live_polls',
  'live_questions',
  'live_sessions',
  'live_thanks',
  'live_typing_a',
  'live_typing_b',
  'loc_at',
  'local_time',
  'location_bias_scale',
  'lock_half',
  'locked_until',
  'lofi_beats',
  'login_alerts',
  'login_options',
  'login_requests',
  'login_verify',
  'longest_s',
  'love_letters',
  'max_uses',
  'me_name',
  'mean_ms',
  'media_h',
  'media_idx',
  'media_path',
  'media_type',
  'media_url',
  'media_urls',
  'media_w',
  'member_closed',
  'member_count',
  'member_ended',
  'member_id',
  'member_ids',
  'member_join',
  'member_perks',
  'member_price',
  'member_soon',
  'members_only',
  'mention_all',
  'message_created_at',
  'message_id',
  'message_likes',
  'message_report_id',
  'message_reports',
  'messages_1000',
  'messages_10000',
  'messages_removed',
  'messages_sent',
  'messages_today',
  'messaging_non_clips',
  'mic_drop',
  'midnight_ramen',
  'mind_blown',
  'misty_hills',
  'mod_add',
  'mod_remove',
  'mods_full',
  'moon_half',
  'move_at',
  'move_to',
  'msg_paid',
  'msg_price',
  'msg_refund',
  'mushroom_grove',
  'muted_until',
  'muted_until_a',
  'muted_until_b',
  'mutual_best',
  'name_bar',
  'name_en',
  'name_style',
  'nature_reserve',
  'need_age',
  'need_terms',
  'neon_city',
  'neon_rain',
  'net_hour',
  'new_best',
  'new_email',
  'new_today',
  'new_week',
  'next_at',
  'next_limit',
  'next_set',
  'ninja_cat',
  'no_answer',
  'non_followers',
  'northern_lights',
  'not_found',
  'not_in_chat',
  'not_member',
  'not_player',
  'not_ready',
  'not_turn',
  'notify_muted_until',
  'num_ctx',
  'ocean_reef',
  'ocean_reef_night',
  'offender_id',
  'old_email',
  'on_break',
  'on_trial',
  'one_year',
  'online_at',
  'online_now',
  'open_at',
  'open_reports',
  'opens_at',
  'order_created',
  'order_refunded',
  'origami_cranes',
  'osm_value',
  'other_id',
  'overlay_url',
  'owner_id',
  'p_acc',
  'p_accept',
  'p_act',
  'p_action',
  'p_active',
  'p_admin',
  'p_after',
  'p_alg',
  'p_amount',
  'p_answer',
  'p_answers',
  'p_approve',
  'p_at',
  'p_audience',
  'p_auth',
  'p_avatar',
  'p_backed_up',
  'p_bag',
  'p_base',
  'p_bio',
  'p_birth',
  'p_body',
  'p_booth',
  'p_bot',
  'p_budget',
  'p_buyer',
  'p_call',
  'p_cam',
  'p_cancel',
  'p_cancel_hash',
  'p_cap',
  'p_card',
  'p_ch',
  'p_challenge',
  'p_channel',
  'p_chat',
  'p_choice',
  'p_cid',
  'p_claim_hash',
  'p_client',
  'p_client_id',
  'p_code',
  'p_code_hash',
  'p_coins',
  'p_color',
  'p_content',
  'p_cover',
  'p_cover_set',
  'p_creator',
  'p_cred_id',
  'p_days',
  'p_detail',
  'p_device',
  'p_drop',
  'p_due',
  'p_email',
  'p_emoji',
  'p_end',
  'p_endpoint',
  'p_ends_at',
  'p_equip',
  'p_error',
  'p_event',
  'p_expect',
  'p_expires_secs',
  'p_extra',
  'p_fact',
  'p_filter',
  'p_force',
  'p_frame',
  'p_friends',
  'p_from',
  'p_game',
  'p_game_id',
  'p_get',
  'p_get_coins',
  'p_gift',
  'p_give',
  'p_give_coins',
  'p_going',
  'p_greeting',
  'p_grid',
  'p_group',
  'p_groups',
  'p_h',
  'p_hash',
  'p_hashes',
  'p_host',
  'p_hours',
  'p_human',
  'p_id',
  'p_ids',
  'p_idx',
  'p_import',
  'p_invite',
  'p_ip',
  'p_items',
  'p_job',
  'p_join',
  'p_join_until',
  'p_keep',
  'p_key',
  'p_keys',
  'p_kind',
  'p_km',
  'p_label',
  'p_last',
  'p_lat',
  'p_level',
  'p_limit',
  'p_link',
  'p_listeners',
  'p_live',
  'p_lng',
  'p_max',
  'p_max_uses',
  'p_mds',
  'p_me_name',
  'p_meaning',
  'p_media',
  'p_media_path',
  'p_media_type',
  'p_message',
  'p_minutes',
  'p_mode',
  'p_msg',
  'p_n',
  'p_name',
  'p_nonce',
  'p_nonce_hash',
  'p_note',
  'p_occasion',
  'p_offset',
  'p_ok',
  'p_old',
  'p_on',
  'p_open_at',
  'p_options',
  'p_order',
  'p_other',
  'p_owner',
  'p_p256dh',
  'p_pack',
  'p_paper',
  'p_passkey',
  'p_password',
  'p_patch',
  'p_path',
  'p_paths',
  'p_pay',
  'p_peak',
  'p_peaks',
  'p_peer',
  'p_people',
  'p_period',
  'p_personality',
  'p_photo',
  'p_phrase',
  'p_pin',
  'p_place',
  'p_plan',
  'p_poll',
  'p_post',
  'p_poster',
  'p_posts',
  'p_price',
  'p_profile',
  'p_prompt',
  'p_public_key',
  'p_q',
  'p_query',
  'p_question',
  'p_quiet_hours',
  'p_reads',
  'p_reason',
  'p_ref',
  'p_replaces',
  'p_reported',
  'p_restore',
  'p_reveal_at',
  'p_ribbon',
  'p_role',
  'p_round',
  'p_row',
  'p_rows',
  'p_rp_id',
  'p_say',
  'p_scope',
  'p_score',
  'p_scores',
  'p_search',
  'p_secret_hash',
  'p_secs',
  'p_seen',
  'p_sender',
  'p_session',
  'p_settings',
  'p_shared',
  'p_shown',
  'p_sign_count',
  'p_slot',
  'p_slots',
  'p_songs',
  'p_source',
  'p_starts',
  'p_starts_at',
  'p_state',
  'p_status',
  'p_step',
  'p_sticker',
  'p_story',
  'p_style',
  'p_sw',
  'p_table',
  'p_tag',
  'p_tagline',
  'p_target',
  'p_terms',
  'p_text',
  'p_tier',
  'p_tile',
  'p_title',
  'p_to',
  'p_to_name',
  'p_token',
  'p_tone',
  'p_topic',
  'p_total',
  'p_tour',
  'p_trade',
  'p_transports',
  'p_tz',
  'p_until',
  'p_url',
  'p_urls',
  'p_user',
  'p_user_id',
  'p_username',
  'p_users',
  'p_value',
  'p_variant',
  'p_verdict',
  'p_version',
  'p_w',
  'p_watched',
  'p_who',
  'p_word',
  'p_year',
  'pack_id',
  'pack_live',
  'pack_rejected',
  'pack_sold',
  'paid_at',
  'panda_bamboo',
  'parent_id',
  'party_popper',
  'pass_rule',
  'past_due',
  'paw_five',
  'peer_id',
  'period_end',
  'photo_admin_urls',
  'photo_ask',
  'photo_ask_all',
  'photo_flag',
  'photo_label',
  'photo_label_all',
  'photo_labels',
  'photo_ocr',
  'photo_ocr_all',
  'photo_off',
  'photo_url',
  'picked_at',
  'pin_hash',
  'pinned_at',
  'pinned_by',
  'pinned_by_a',
  'pinned_by_b',
  'pinned_comment_id',
  'pinned_until',
  'pirate_cove',
  'pixel_quest',
  'place_of_worship',
  'plan_live',
  'plan_off',
  'plan_soon',
  'plan_start',
  'poll_id',
  'post_comment_likes',
  'post_comments',
  'post_id',
  'post_likes',
  'post_no',
  'post_ok',
  'post_tips',
  'poster_url',
  'postgres_changes',
  'posts_25',
  'posts_count',
  'practice_end',
  'prev_level',
  'prev_mute',
  'price_text',
  'privacy_allow',
  'privacy_bio',
  'privacy_calls',
  'privacy_comments',
  'privacy_groups',
  'privacy_lastseen',
  'privacy_leaderboard',
  'privacy_mentions',
  'privacy_messages',
  'privacy_online',
  'privacy_profile',
  'privacy_story_replies',
  'privacy_tags',
  'profile_disposable',
  'profile_id',
  'profile_theme',
  'profile_visits',
  'public_group_preview',
  'public_key',
  'public_post_preview',
  'public_profile_decor',
  'public_profile_preview',
  'published_at',
  'push_endpoint',
  'push_subscription',
  'push_subscriptions',
  'qa_on',
  'qr_code',
  'qr_decide',
  'qr_new',
  'qr_peek',
  'qr_poll',
  'race_track',
  'rain_cloud',
  'rain_window',
  'read_only',
  'read_receipts',
  'read_receipts_a',
  'read_receipts_b',
  'ready_at',
  'rec_cancel',
  'rec_code',
  'rec_email',
  'rec_finish',
  'rec_start',
  'rec_status',
  'receiver_id',
  'recipient_id',
  'record_start',
  'record_stop',
  'recovery_cancel',
  'recovery_denied',
  'recovery_help',
  'recovery_notice',
  'refresh_token',
  'reg_options',
  'reg_verify',
  'remix_layout',
  'remix_of',
  'remix_ok',
  'removed_at',
  'render_height',
  'render_min_height',
  'renews_at',
  'repeat_anchor',
  'replaced_at',
  'replaced_by',
  'reply_more',
  'reply_to_id',
  'report_id',
  'report_queue',
  'report_warning',
  'reported_at',
  'reported_by',
  'reported_id',
  'reported_user_id',
  'reporter_id',
  'reporter_username',
  'reports_against',
  'repost_label',
  'repost_of',
  'request_id',
  'restricted_users',
  'reveal_at',
  'revealed_at',
  'reviewed_at',
  'reviewed_by',
  'reward_key',
  'robot_buddy',
  'robot_buddy_gold',
  'room_kick',
  'royal_crown',
  'rp_id',
  'rules_version',
  'runs_day',
  'safety_alert',
  'safety_check',
  'safety_ok',
  'safety_start',
  'sakura_shrine',
  'sakura_shrine_night',
  'sample_id',
  'sample_url',
  'santa_back',
  'santa_events',
  'santa_out',
  'santa_people',
  'saved_collections',
  'saved_looks',
  'saved_messages',
  'saved_posts',
  'scheduled_for',
  'scheduled_messages',
  'scuba_cat',
  'secure_url',
  'seen_at',
  'self_aliases',
  'send_at',
  'send_bio_mention',
  'send_policy',
  'send_report_warning',
  'sender_id',
  'sensitive_media',
  'sent_at',
  'session_id',
  'settled_at',
  'shared_id',
  'shoot_at',
  'shop_listings',
  'shout_declined',
  'shout_done',
  'shout_note',
  'shout_order',
  'shout_price',
  'shout_refund',
  'show_on_search_engines',
  'show_supporters',
  'signup_check',
  'signup_pass',
  'site_name',
  'size_portrait',
  'size_square',
  'size_story',
  'size_wide',
  'slow_secs',
  'snow_globe',
  'snow_globe_night',
  'snow_town',
  'social_links',
  'sold_out',
  'song_id',
  'source_message_id',
  'space_explorer',
  'spam_verdicts',
  'speaker_add',
  'speaker_remove',
  'spirit_wolf',
  'spooky_pumpkin',
  'sports_centre',
  'started_at',
  'starts_at',
  'status_emoji',
  'status_text',
  'status_until',
  'sticker_favorites',
  'sticker_key',
  'sticker_packs',
  'store_id',
  'stories_10',
  'stories_live',
  'story_hidden',
  'story_id',
  'story_likes',
  'story_media_type',
  'story_media_url',
  'story_mention',
  'story_owner_id',
  'story_reply',
  'story_responses',
  'story_views',
  'streak_30',
  'streak_7',
  'summary_large_image',
  'sun_half',
  'super_key',
  'surf_day',
  'sym_mirror',
  'sym_off',
  'sym_quad',
  'sym_radial',
  'tag_follows',
  'tagger_id',
  'target_count',
  'target_id',
  'target_user_id',
  'taught_by',
  'test_mode',
  'text_color',
  'text_font',
  'text_size',
  'theme_park',
  'they_have',
  'this_phone',
  'thumbs_confetti',
  'timer_id',
  'tip_in',
  'tip_out',
  'tipper_id',
  'to_coins',
  'to_id',
  'to_name',
  'today_done',
  'token_hash',
  'tone_bell',
  'tone_chirp',
  'tone_drop',
  'tone_glass',
  'tone_harp',
  'tone_marimba',
  'tone_pop',
  'tone_pulse',
  'total_count',
  'total_users',
  'tr_from',
  'tr_orig',
  'translate_live',
  'translate_many',
  'transportation_name',
  'trim_end',
  'trim_start',
  'trusted_added',
  'trusted_friends',
  'typing_privacy',
  'typing_style',
  'tz_share',
  'unicorn_dream',
  'updated_at',
  'updated_by',
  'url_hash',
  'use_fedcm_for_prompt',
  'use_fn',
  'user_a',
  'user_b',
  'user_devices',
  'user_id',
  'user_locations',
  'user_metadata',
  'user_restrictions',
  'user_rewards',
  'user_stickers',
  'username_changed_at',
  'validation_failed',
  'variant_id',
  'verified_gift',
  'verified_gift_orders',
  'verified_seen',
  'verified_until',
  'viewed_at',
  'viewer_id',
  'visitors_on',
  'voice_note',
  'voice_rooms',
  'w3c_validator',
  'wallpaper_a',
  'wallpaper_b',
  'watched_at',
  'watched_by',
  'water_name',
  'welcome_name',
  'welcome_text',
  'wishlist_items',
  'witch_brew',
  'writer_id',
  'written_at',
  'zc_note_hp',
  'zchat_admin_coins',
  'zchat_admin_grant',
  'zchat_admin_health',
  'zchat_admin_health_set',
  'zchat_admin_login_approval_off',
  'zchat_admin_photo_flags',
  'zchat_admin_photo_review',
  'zchat_admin_revoke',
  'zchat_admin_take_coins',
  'zchat_admin_wallet',
  'zchat_age_terms_save',
  'zchat_age_terms_state',
  'zchat_ai_bump',
  'zchat_aiphoto_job',
  'zchat_aiphoto_take',
  'zchat_answer_question',
  'zchat_app_prefs',
  'zchat_ask',
  'zchat_bag_open',
  'zchat_bag_send',
  'zchat_bags',
  'zchat_bday_candidates',
  'zchat_bday_card_for',
  'zchat_bday_card_get',
  'zchat_bday_card_invite',
  'zchat_bday_card_mark',
  'zchat_bday_card_sign',
  'zchat_bday_card_start',
  'zchat_bday_card_unsign',
  'zchat_bday_cards_mine',
  'zchat_bday_gift_cancel',
  'zchat_bday_gift_save',
  'zchat_birthday_targets',
  'zchat_board_add',
  'zchat_board_items',
  'zchat_booth_clock',
  'zchat_booth_join',
  'zchat_booth_leave',
  'zchat_booth_open',
  'zchat_booth_people',
  'zchat_booth_shot',
  'zchat_booth_start',
  'zchat_booth_state',
  'zchat_booths',
  'zchat_break_check',
  'zchat_break_start',
  'zchat_breaks',
  'zchat_buy_deal',
  'zchat_buy_drop',
  'zchat_buy_item',
  'zchat_buy_match_pair',
  'zchat_buy_set',
  'zchat_buy_wrap',
  'zchat_call_link',
  'zchat_can_dm',
  'zchat_can_interact',
  'zchat_capsule_send',
  'zchat_capsules_get',
  'zchat_channel_post_stats',
  'zchat_channels',
  'zchat_character_bump',
  'zchat_character_mark_checked',
  'zchat_character_report',
  'zchat_chat_list',
  'zchat_chat_marks',
  'zchat_chat_note_versions',
  'zchat_chat_notes',
  'zchat_check_achievements',
  'zchat_check_chat_pin',
  'zchat_chip_cancel',
  'zchat_chip_pay',
  'zchat_chip_start',
  'zchat_chips',
  'zchat_cl_live',
  'zchat_cl_plan_cancel',
  'zchat_cl_plan_rsvp',
  'zchat_cl_plan_rsvps',
  'zchat_cl_plan_send',
  'zchat_cl_plans',
  'zchat_cl_plans_get',
  'zchat_claim_free_bubble',
  'zchat_claim_free_set',
  'zchat_claim_invite',
  'zchat_claim_job',
  'zchat_claim_milestone',
  'zchat_cm_lt_key',
  'zchat_cm_sched_claim',
  'zchat_cm_wait',
  'zchat_cm_waiting',
  'zchat_code_create',
  'zchat_code_redeem',
  'zchat_code_set',
  'zchat_collab_respond',
  'zchat_community_add_group',
  'zchat_community_add_members',
  'zchat_community_admin_set',
  'zchat_community_create',
  'zchat_community_delete',
  'zchat_community_edit',
  'zchat_community_invite',
  'zchat_community_invite_reset',
  'zchat_community_join',
  'zchat_community_join_group',
  'zchat_community_leave',
  'zchat_community_mine',
  'zchat_community_new_group',
  'zchat_community_page',
  'zchat_community_remove_group',
  'zchat_community_remove_member',
  'zchat_compliment_send',
  'zchat_compliment_set',
  'zchat_compliments_mine',
  'zchat_contacts_get',
  'zchat_contacts_match',
  'zchat_contacts_set_email',
  'zchat_contacts_set_phone',
  'zchat_cr_chat_state',
  'zchat_cr_group_join',
  'zchat_cr_group_price',
  'zchat_cr_me',
  'zchat_cr_member_cancel',
  'zchat_cr_member_ids',
  'zchat_cr_member_join',
  'zchat_cr_msg_send',
  'zchat_cr_pack_buy',
  'zchat_cr_pack_sell',
  'zchat_cr_pack_stop',
  'zchat_cr_packs_bought',
  'zchat_cr_packs_top',
  'zchat_cr_page',
  'zchat_cr_settings_save',
  'zchat_cr_shout_decline',
  'zchat_cr_shout_deliver',
  'zchat_cr_shout_order',
  'zchat_credit_order',
  'zchat_ct_remove',
  'zchat_ct_summary',
  'zchat_daily_reward',
  'zchat_data_exports',
  'zchat_deal_today',
  'zchat_delete_question',
  'zchat_digest_due',
  'zchat_digest_mark',
  'zchat_dm_unread',
  'zchat_dom_end',
  'zchat_dom_hand',
  'zchat_dom_join',
  'zchat_dom_next',
  'zchat_dom_pass',
  'zchat_dom_play',
  'zchat_dom_start',
  'zchat_drafts',
  'zchat_edit_history',
  'zchat_edition_left',
  'zchat_email_unsub',
  'zchat_equip_charm',
  'zchat_export_begin',
  'zchat_export_done',
  'zchat_friend_ranks',
  'zchat_g1_clock_start',
  'zchat_g1_join_answer',
  'zchat_g1_nick_clear',
  'zchat_g1_pending_drop',
  'zchat_g1_review',
  'zchat_g1_rules_accept',
  'zchat_g1_send',
  'zchat_g1_sudoku_done',
  'zchat_game_xp_finish',
  'zchat_game_xp_levels',
  'zchat_game_xp_mine',
  'zchat_gh_bot_move',
  'zchat_gh_end',
  'zchat_gh_get',
  'zchat_gh_live',
  'zchat_gh_move',
  'zchat_gh_new',
  'zchat_gh_secret',
  'zchat_gh_tour_cancel',
  'zchat_gh_tour_join',
  'zchat_gh_tour_new',
  'zchat_gh_tour_start',
  'zchat_gift_item',
  'zchat_gift_send',
  'zchat_group_invite',
  'zchat_group_open',
  'zchat_group_read',
  'zchat_group_reads_get',
  'zchat_group_role_set',
  'zchat_grp_as_group',
  'zchat_grp_emoji',
  'zchat_grp_emoji_add',
  'zchat_grp_emoji_remove',
  'zchat_grp_hidden',
  'zchat_grp_join_answers',
  'zchat_grp_keywords',
  'zchat_grp_kw_any',
  'zchat_grp_link_delete',
  'zchat_grp_link_save',
  'zchat_grp_links',
  'zchat_grp_log',
  'zchat_grp_pending',
  'zchat_grp_rules_ok',
  'zchat_guestbook',
  'zchat_guestbook_decide',
  'zchat_guestbook_delete',
  'zchat_guestbook_page',
  'zchat_guestbook_prefs',
  'zchat_guestbook_write',
  'zchat_import_add',
  'zchat_import_finish',
  'zchat_import_remove',
  'zchat_import_start',
  'zchat_inside_jokes',
  'zchat_join_group',
  'zchat_joke_save',
  'zchat_leaderboard',
  'zchat_link_lookup',
  'zchat_link_store',
  'zchat_listen_clock',
  'zchat_live_ask',
  'zchat_live_beat',
  'zchat_live_comment',
  'zchat_live_end',
  'zchat_live_get',
  'zchat_live_gift',
  'zchat_live_goal_end',
  'zchat_live_goal_set',
  'zchat_live_moderate',
  'zchat_live_now',
  'zchat_live_poll_end',
  'zchat_live_poll_now',
  'zchat_live_poll_start',
  'zchat_live_poll_vote',
  'zchat_live_question_set',
  'zchat_live_questions',
  'zchat_live_start',
  'zchat_live_supporters',
  'zchat_live_supporters_show',
  'zchat_live_thank',
  'zchat_local_time',
  'zchat_local_times',
  'zchat_login_approval_set',
  'zchat_login_approval_state',
  'zchat_login_codes_confirm',
  'zchat_login_codes_new',
  'zchat_login_decide',
  'zchat_login_pending',
  'zchat_login_recovery',
  'zchat_lookalike',
  'zchat_lookalike_many',
  'zchat_lost_streaks',
  'zchat_match_pairs',
  'zchat_match_with',
  'zchat_memories',
  'zchat_milestones',
  'zchat_mod_delete',
  'zchat_mod_mute',
  'zchat_mod_pin',
  'zchat_mod_review_join',
  'zchat_moment_add',
  'zchat_moment_targets',
  'zchat_msg_link',
  'zchat_my_avatar_anim',
  'zchat_my_games',
  'zchat_my_profile',
  'zchat_my_questions',
  'zchat_note_device',
  'zchat_note_save',
  'zchat_open_dm',
  'zchat_passkey_add',
  'zchat_passkey_challenge_new',
  'zchat_passkey_challenge_take',
  'zchat_passkey_fail',
  'zchat_passkey_ids',
  'zchat_passkey_lookup',
  'zchat_passkey_remove',
  'zchat_passkey_used',
  'zchat_pf_extras',
  'zchat_pf_tz_set',
  'zchat_photo_begin',
  'zchat_photo_blocked',
  'zchat_photo_claim',
  'zchat_photo_done',
  'zchat_photo_find',
  'zchat_photo_labels_put',
  'zchat_photo_labels_todo',
  'zchat_photos_set',
  'zchat_pin_message',
  'zchat_pin_post',
  'zchat_place_feed',
  'zchat_plan_cancel',
  'zchat_plan_create',
  'zchat_plan_edit',
  'zchat_plan_get',
  'zchat_plan_list',
  'zchat_plan_push',
  'zchat_plan_remind',
  'zchat_plan_room_open',
  'zchat_playlist_add',
  'zchat_playlist_songs',
  'zchat_poll_counts',
  'zchat_poll_finish',
  'zchat_poll_tally',
  'zchat_post_count',
  'zchat_post_event',
  'zchat_post_insights',
  'zchat_post_place',
  'zchat_post_poll_counts',
  'zchat_post_poll_vote',
  'zchat_post_poll_votes',
  'zchat_post_tags',
  'zchat_post_view_counts',
  'zchat_post_views',
  'zchat_problem_reports',
  'zchat_profile_view',
  'zchat_push_forget',
  'zchat_push_save',
  'zchat_qr_claim',
  'zchat_qr_decide',
  'zchat_qr_devices',
  'zchat_qr_logout',
  'zchat_qr_new',
  'zchat_qr_peek',
  'zchat_qr_poll',
  'zchat_qr_take',
  'zchat_rec_cancel',
  'zchat_rec_check',
  'zchat_rec_deny',
  'zchat_rec_email',
  'zchat_rec_for_me',
  'zchat_rec_friend_code',
  'zchat_rec_mark_done',
  'zchat_rec_owner_cancel',
  'zchat_rec_ready',
  'zchat_rec_start',
  'zchat_rec_status',
  'zchat_recap',
  'zchat_record_game',
  'zchat_refund_order',
  'zchat_restore_streak',
  'zchat_review_join',
  'zchat_revoke_device',
  'zchat_roll',
  'zchat_room_kick',
  'zchat_room_list',
  'zchat_room_set_enabled',
  'zchat_room_state',
  'zchat_room_sync',
  'zchat_safety_end',
  'zchat_safety_extend',
  'zchat_safety_loc',
  'zchat_safety_start',
  'zchat_safety_timers',
  'zchat_santa_cancel',
  'zchat_santa_join',
  'zchat_santa_pick',
  'zchat_santa_start',
  'zchat_santas',
  'zchat_saved_folders',
  'zchat_score',
  'zchat_search_pref_get',
  'zchat_search_pref_set',
  'zchat_search_prefs',
  'zchat_send_gift',
  'zchat_sender_signals',
  'zchat_session_claim',
  'zchat_session_state',
  'zchat_session_state_for',
  'zchat_set_member_title',
  'zchat_set_verified_sub',
  'zchat_shared',
  'zchat_shared_add',
  'zchat_shared_create',
  'zchat_shared_members',
  'zchat_shared_remove',
  'zchat_shared_stories',
  'zchat_shared_update',
  'zchat_shop_owners',
  'zchat_shop_popular',
  'zchat_signup_pass',
  'zchat_signup_precheck',
  'zchat_signup_young',
  'zchat_snooze',
  'zchat_snoozes',
  'zchat_spend_allow',
  'zchat_spend_limit',
  'zchat_spend_limit_set',
  'zchat_spend_pin',
  'zchat_status',
  'zchat_status_set',
  'zchat_story_list_members',
  'zchat_story_lists',
  'zchat_story_of_us',
  'zchat_story_results',
  'zchat_streaks',
  'zchat_streaks2',
  'zchat_submit_score',
  'zchat_tag_decide',
  'zchat_tag_settings',
  'zchat_tagged_posts',
  'zchat_time_create',
  'zchat_time_pick',
  'zchat_time_polls',
  'zchat_time_vote',
  'zchat_time_votes',
  'zchat_tip_post',
  'zchat_tip_summary',
  'zchat_tones',
  'zchat_trade_cards',
  'zchat_trade_offer',
  'zchat_trade_respond',
  'zchat_trade_setup',
  'zchat_trending_tags',
  'zchat_trusted_friends',
  'zchat_trusted_list',
  'zchat_trusted_set',
  'zchat_unsnooze',
  'zchat_us_moments',
  'zchat_verified_gift_paid',
  'zchat_verified_gift_refund',
  'zchat_verified_gift_start',
  'zchat_visit_profile',
  'zchat_voice_intro_clear',
  'zchat_voice_intro_say',
  'zchat_voice_intro_set',
  'zchat_wallet',
  'zchat_watch',
  'zchat_watch_add',
  'zchat_watch_items',
  'zchat_watch_mark',
  'zchat_watch_react',
  'zchat_watch_reacts',
  'zchat_watch_remove',
  'zchat_xw_get',
  'zchat_xw_put',
  'zchat_zap_call',
  'zchat_zap_catch',
  'zchat_zap_draw',
  'zchat_zap_end',
  'zchat_zap_hand',
  'zchat_zap_join',
  'zchat_zap_nudge',
  'zchat_zap_pass',
  'zchat_zap_play',
  'zchat_zap_start'
]::text[];
  bodies text;
  jobs text := '';
  settings text := '';
  can_sync boolean := false;
  moved int := 0;
  moved_trig int := 0;
begin
  begin
    if not exists (select 1 from pg_event_trigger where evtname = 'zchat_sync_twin') then
      create event trigger zchat_sync_twin on ddl_command_end when tag in ('CREATE FUNCTION') execute function zchat_private.zchat_sync_twin();
    end if;
    can_sync := true;
  exception when others then
    can_sync := false;
    raise notice 'zchat: event triggers are not allowed here (%), so trigger functions stay in public', sqlerrm;
  end;
  select coalesce(string_agg(p.prosrc, E'\n'), '') into bodies
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema');
  if to_regclass('cron.job') is not null then
    execute 'select coalesce(string_agg(command, E''\n''), '''') from cron.job' into jobs;
  end if;
  if to_regclass('public.zchat_minute_jobs') is not null then
    execute 'select coalesce(string_agg(command, E''\n''), '''') from public.zchat_minute_jobs' into settings;
    jobs := jobs || E'\n' || settings;
  end if;
  select coalesce(string_agg(array_to_string(setconfig, ' '), ' '), '') into settings from pg_db_role_setting;
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prorettype = 'trigger'::regtype as is_trig, p.proacl
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
     order by p.proname
  loop
    if r.proname = any(used) then continue; end if;
    if r.is_trig and not can_sync then continue; end if;
    if not r.is_trig and r.proname ~ '(alert|push|notif|digest|daily|cron|tick|job|worker|purge|expire|clean|hook|mail|report|stat|health|pre_request|session|login|auth|admin|bot|webhook|backup|export|import)' then continue; end if;
    if strpos(bodies, r.proname) > 0 then continue; end if;
    if strpos(jobs, r.proname) > 0 or strpos(settings, r.proname) > 0 then continue; end if;
    if r.proacl is not null and exists (select 1 from aclexplode(r.proacl) a join pg_roles ro on ro.oid = a.grantee where ro.rolname in ('supabase_auth_admin', 'supabase_storage_admin')) then continue; end if;
    if exists (select 1 from pg_proc p2 where p2.pronamespace = 'zchat_private'::regnamespace and p2.proname = r.proname and pg_get_function_identity_arguments(p2.oid) = r.args) then continue; end if;
    begin
      execute format('alter function public.%I(%s) set schema zchat_private', r.proname, r.args);
      insert into zchat_private.moved_functions (name, args) values (r.proname, r.args) on conflict do nothing;
      moved := moved + 1;
      if r.is_trig then moved_trig := moved_trig + 1; end if;
    exception when others then
      raise notice 'zchat: kept %(%) in public: %', r.proname, r.args, sqlerrm;
    end;
  end loop;
  raise notice 'zchat: moved % internal functions out of the API (% trigger functions)', moved, moved_trig;
end $mv$;

create index if not exists messages_unread_pair on public.messages (receiver_id, sender_id) where read = false and group_id is null;

notify pgrst, 'reload schema';
commit;
