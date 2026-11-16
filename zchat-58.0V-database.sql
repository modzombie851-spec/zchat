begin;

do $hero$
declare
  c record;
begin
  if to_regclass('public.zchat_siege_heroes') is null then
    return;
  end if;
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.zchat_siege_heroes'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%hero%'
      and pg_get_constraintdef(con.oid) not ilike '%level%'
  loop
    execute format('alter table public.zchat_siege_heroes drop constraint %I', c.conname);
  end loop;
  alter table public.zchat_siege_heroes
    add constraint zchat_siege_heroes_hero_check
    check (hero in ('blaze', 'pip', 'boom', 'mira', 'rex', 'volt', 'kai', 'ivy', 'nyx', 'arlo', 'wren', 'tusk', 'bones', 'hex', 'rattle'));
end $hero$;

alter table public.zchat_siege_profile add column if not exists xp integer not null default 0;
alter table public.zchat_siege_profile add column if not exists xp_day date not null default current_date;
alter table public.zchat_siege_profile add column if not exists xp_today integer not null default 0;
alter table public.zchat_siege_profile add column if not exists match_id text;
alter table public.zchat_siege_profile add column if not exists match_mode text;
alter table public.zchat_siege_profile add column if not exists match_at timestamptz;

do $xp$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.zchat_siege_profile'::regclass and conname = 'zchat_siege_profile_xp_check') then
    alter table public.zchat_siege_profile
      add constraint zchat_siege_profile_xp_check check (xp >= 0 and xp <= 100000000 and xp_today >= 0);
  end if;
end $xp$;

alter table public.zchat_siege_profile enable row level security;
revoke all on table public.zchat_siege_profile from public, anon, authenticated;
revoke all on table public.zchat_siege_heroes from public, anon, authenticated;

create or replace function public.zchat_siege_lv(p_xp integer)
returns integer
language sql
immutable
set search_path = public
as $$
  select least(100, 1 + floor((-250 + sqrt(62500 + 200.0 * greatest(coalesce(p_xp, 0), 0))) / 100)::integer)
$$;

create or replace function public.zchat_siege_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then jsonb_build_object('ok', false)
    else jsonb_build_object(
      'ok', true,
      'scrap', coalesce((select p.scrap from public.zchat_siege_profile p where p.user_id = auth.uid()), 0),
      'xp', coalesce((select p.xp from public.zchat_siege_profile p where p.user_id = auth.uid()), 0),
      'lv', public.zchat_siege_lv(coalesce((select p.xp from public.zchat_siege_profile p where p.user_id = auth.uid()), 0)),
      'levels', coalesce((select jsonb_object_agg(h.hero, h.level) from public.zchat_siege_heroes h where h.user_id = auth.uid()), '{}'::jsonb))
  end
$$;

create or replace function public.zchat_siege_begin(p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_row public.zchat_siege_profile%rowtype;
  v_id text;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  if p_mode is null or p_mode not in ('tdm', 'hp', 'waves') then return jsonb_build_object('ok', false, 'reason', 'mode'); end if;
  insert into public.zchat_siege_profile (user_id) values (me) on conflict (user_id) do nothing;
  select * into v_row from public.zchat_siege_profile where user_id = me for update;
  if v_row.match_id is not null and v_row.match_mode = p_mode and v_row.match_at > now() - interval '15 seconds' then
    return jsonb_build_object('ok', true, 'id', v_row.match_id);
  end if;
  v_id := md5(me::text || clock_timestamp()::text || random()::text);
  update public.zchat_siege_profile
    set match_id = v_id, match_mode = p_mode, match_at = now(), updated_at = now()
    where user_id = me;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.zchat_siege_finish(p_id text, p_won boolean, p_kills integer, p_assists integer, p_wave integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_row public.zchat_siege_profile%rowtype;
  v_secs integer;
  v_team boolean;
  v_won boolean := coalesce(p_won, false);
  v_kills integer;
  v_assists integer;
  v_wave integer;
  v_xp integer;
  v_scrap integer;
  v_today integer;
  v_xp_today integer;
  v_lv0 integer;
  v_lv1 integer;
  v_bonus integer;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select * into v_row from public.zchat_siege_profile where user_id = me for update;
  if not found or v_row.match_id is null or p_id is null or v_row.match_id <> p_id then
    return jsonb_build_object('ok', false, 'reason', 'match');
  end if;
  v_secs := greatest(0, floor(extract(epoch from (now() - v_row.match_at)))::integer);
  v_team := v_row.match_mode in ('tdm', 'hp');
  if v_secs < (case when v_team then 45 else 30 end) then
    update public.zchat_siege_profile set match_id = null, updated_at = now() where user_id = me;
    return jsonb_build_object('ok', false, 'reason', 'short');
  end if;
  if v_row.last_award is not null and v_row.last_award > now() - interval '40 seconds' then
    update public.zchat_siege_profile set match_id = null, updated_at = now() where user_id = me;
    return jsonb_build_object('ok', false, 'reason', 'wait');
  end if;
  v_wave := greatest(0, least(coalesce(p_wave, 0), v_secs / 15, 60));
  if v_team then
    v_kills := greatest(0, least(coalesce(p_kills, 0), v_secs / 5, 60));
    v_assists := greatest(0, least(coalesce(p_assists, 0), v_secs / 5, 60));
    v_xp := 80 + case when v_won then 70 else 0 end + v_kills * 14 + v_assists * 6 + least(v_secs / 30, 30) * 2;
    v_scrap := 4 * least(v_secs / 60, 20) + case when v_won then 24 else 8 end + 2 * v_kills + v_assists;
  else
    v_kills := greatest(0, least(coalesce(p_kills, 0), v_secs * 2, 3000));
    v_assists := 0;
    v_won := v_won and v_wave >= 15;
    v_xp := 40 + v_wave * 12 + v_kills / 4 + case when v_won then 80 else 0 end;
    v_scrap := v_wave * 4 + v_kills / 3 + case when v_won then 30 else 0 end;
  end if;
  v_xp := greatest(0, least(v_xp, 450));
  v_scrap := greatest(0, least(v_scrap, 120));
  v_today := case when v_row.earned_day = current_date then v_row.earned_today else 0 end;
  v_xp_today := case when v_row.xp_day = current_date then v_row.xp_today else 0 end;
  v_scrap := greatest(0, least(v_scrap, 1500 - v_today));
  v_xp := greatest(0, least(v_xp, 9000 - v_xp_today));
  v_lv0 := public.zchat_siege_lv(v_row.xp);
  v_lv1 := public.zchat_siege_lv(least(100000000, v_row.xp + v_xp));
  v_bonus := 40 * greatest(0, v_lv1 - v_lv0);
  update public.zchat_siege_profile
    set scrap = least(1000000, scrap + v_scrap + v_bonus),
        earned_day = current_date,
        earned_today = v_today + v_scrap,
        xp = least(100000000, xp + v_xp),
        xp_day = current_date,
        xp_today = v_xp_today + v_xp,
        last_award = now(),
        match_id = null,
        updated_at = now()
    where user_id = me
    returning * into v_row;
  return jsonb_build_object('ok', true, 'got', v_scrap + v_bonus, 'scrap', v_row.scrap, 'xp_got', v_xp, 'xp', v_row.xp, 'lv', v_lv1, 'ups', v_lv1 - v_lv0, 'bonus', v_bonus);
end;
$$;

create or replace function public.zchat_siege_award(p_wave integer, p_kills integer, p_won boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_id text;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select match_id into v_id from public.zchat_siege_profile where user_id = me;
  if v_id is null then return jsonb_build_object('ok', false, 'reason', 'update'); end if;
  return public.zchat_siege_finish(v_id, p_won, greatest(0, coalesce(p_kills, 0)) / 6, 0, p_wave);
end;
$$;

create or replace function public.zchat_siege_lvs(p_ids uuid[])
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null or p_ids is null then '{}'::jsonb
    else coalesce((
      select jsonb_object_agg(p.user_id::text, public.zchat_siege_lv(p.xp))
      from public.zchat_siege_profile p
      where p.user_id = any (p_ids[1:20])
    ), '{}'::jsonb)
  end
$$;

create or replace function public.zchat_siege_level(p_hero text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_level integer;
  v_cost integer;
  v_scrap integer;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  if p_hero is null or p_hero not in ('blaze', 'pip', 'boom', 'mira', 'rex', 'volt', 'kai', 'ivy', 'nyx', 'arlo', 'wren', 'tusk', 'bones', 'hex', 'rattle') then
    return jsonb_build_object('ok', false, 'reason', 'hero');
  end if;
  insert into public.zchat_siege_profile (user_id) values (me) on conflict (user_id) do nothing;
  insert into public.zchat_siege_heroes (user_id, hero) values (me, p_hero) on conflict (user_id, hero) do nothing;
  select scrap into v_scrap from public.zchat_siege_profile where user_id = me for update;
  select level into v_level from public.zchat_siege_heroes where user_id = me and hero = p_hero for update;
  if v_level >= 10 then return jsonb_build_object('ok', false, 'reason', 'max', 'level', v_level, 'scrap', v_scrap); end if;
  v_cost := 80 * v_level;
  if v_scrap < v_cost then return jsonb_build_object('ok', false, 'reason', 'scrap', 'level', v_level, 'scrap', v_scrap, 'cost', v_cost); end if;
  update public.zchat_siege_profile set scrap = scrap - v_cost, updated_at = now() where user_id = me returning scrap into v_scrap;
  update public.zchat_siege_heroes set level = level + 1, updated_at = now() where user_id = me and hero = p_hero returning level into v_level;
  return jsonb_build_object('ok', true, 'level', v_level, 'scrap', v_scrap);
end;
$$;

create or replace function public.zchat_live_friends()
returns table (user_id uuid, game text, room text, info jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.user_id, l.game, l.room,
    l.info || jsonb_build_object(
      'w', coalesce(p.allow_watch, true) and coalesce(l.info -> 'w', 'true'::jsonb) not in ('false'::jsonb, '0'::jsonb),
      'j', coalesce(p.allow_join, true) and coalesce(l.info -> 'j', 'true'::jsonb) not in ('false'::jsonb, '0'::jsonb)) as info,
    l.updated_at
  from public.zchat_live_now l
  left join public.zchat_game_privacy p on p.user_id = l.user_id
  where auth.uid() is not null
    and l.user_id <> auth.uid()
    and l.watch
    and coalesce(p.show_playing, true)
    and l.updated_at > now() - interval '75 seconds'
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = l.user_id) or (b.blocker_id = l.user_id and b.blocked_id = auth.uid())
    )
    and (
      (
        exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = l.user_id and coalesce(f.status, 'accepted') = 'accepted')
        and exists (select 1 from public.follows f where f.follower_id = l.user_id and f.following_id = auth.uid() and coalesce(f.status, 'accepted') = 'accepted')
      )
      or (
        exists (select 1 from public.messages m where m.sender_id = l.user_id and m.receiver_id = auth.uid() and m.group_id is null)
        and exists (select 1 from public.messages m where m.sender_id = auth.uid() and m.receiver_id = l.user_id and m.group_id is null)
      )
    )
  order by l.updated_at desc
  limit 30
$$;

revoke all on function public.zchat_siege_lv(integer) from public, anon;
revoke all on function public.zchat_siege_state() from public, anon;
revoke all on function public.zchat_siege_begin(text) from public, anon;
revoke all on function public.zchat_siege_finish(text, boolean, integer, integer, integer) from public, anon;
revoke all on function public.zchat_siege_award(integer, integer, boolean) from public, anon;
revoke all on function public.zchat_siege_lvs(uuid[]) from public, anon;
revoke all on function public.zchat_siege_level(text) from public, anon;
revoke all on function public.zchat_live_friends() from public, anon;
grant execute on function public.zchat_siege_lv(integer) to authenticated;
grant execute on function public.zchat_siege_state() to authenticated;
grant execute on function public.zchat_siege_begin(text) to authenticated;
grant execute on function public.zchat_siege_finish(text, boolean, integer, integer, integer) to authenticated;
grant execute on function public.zchat_siege_award(integer, integer, boolean) to authenticated;
grant execute on function public.zchat_siege_lvs(uuid[]) to authenticated;
grant execute on function public.zchat_siege_level(text) to authenticated;
grant execute on function public.zchat_live_friends() to authenticated;

commit;

select
  (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('zchat_siege_begin', 'zchat_siege_finish', 'zchat_siege_lvs', 'zchat_siege_lv')) as new_functions,
  (select pg_get_constraintdef(con.oid) from pg_constraint con where con.conrelid = 'public.zchat_siege_heroes'::regclass and con.conname = 'zchat_siege_heroes_hero_check') as hero_check,
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'zchat_siege_profile' and column_name in ('xp', 'xp_day', 'xp_today', 'match_id', 'match_mode', 'match_at')) as new_columns;
