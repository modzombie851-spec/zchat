begin;

create or replace function public.zchat_group_create(p_name text, p_bio text default null, p_accent text default null, p_members uuid[] default '{}')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  nm text := left(btrim(coalesce(p_name, '')), 50);
  bi text := nullif(left(btrim(coalesce(p_bio, '')), 300), '');
  acc text := case when p_accent ~ '^#[0-9A-Fa-f]{6}$' then p_accent end;
  g public.groups;
  gj jsonb;
  added uuid[] := '{}';
  skipped uuid[] := '{}';
  u uuid;
  pr record;
  v_fol boolean;
  v_rev boolean;
  v_chosen text[];
  names text;
  sys jsonb;
begin
  if me is null then
    raise exception 'Log in first' using errcode = '42501';
  end if;
  if nm = '' then
    raise exception 'Give the group a name' using errcode = '22023';
  end if;
  if acc is not null and exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'groups' and c.column_name = 'accent') then
    execute 'insert into public.groups (name, bio, avatar, created_by, accent) values ($1, $2, null, $3, $4) returning *' into g using nm, bi, me, acc;
  else
    insert into public.groups (name, bio, avatar, created_by) values (nm, bi, null, me) returning * into g;
  end if;
  insert into public.group_members (group_id, user_id, role, added_by) values (g.id, me, 'admin', me);
  foreach u in array (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_members, '{}'::uuid[])) as x where x is not null and x <> me) loop
    exit when coalesce(array_length(added, 1), 0) + coalesce(array_length(skipped, 1), 0) >= 49;
    select p.id, p.privacy_groups, coalesce(p.is_deleted, false) as gone into pr from public.profiles p where p.id = u;
    if not found or pr.gone then
      skipped := skipped || u;
      continue;
    end if;
    if exists (select 1 from public.blocks b where (b.blocker_id = u and b.blocked_id = me) or (b.blocker_id = me and b.blocked_id = u)) then
      skipped := skipped || u;
      continue;
    end if;
    v_fol := exists (select 1 from public.follows f where f.follower_id = me and f.following_id = u and coalesce(f.status, 'accepted') = 'accepted');
    v_rev := exists (select 1 from public.follows f where f.follower_id = u and f.following_id = me and coalesce(f.status, 'accepted') = 'accepted');
    v_chosen := coalesce((select array_agg(a.scope) from public.privacy_allow a where a.user_id = u and a.viewer_id = me), '{}'::text[]);
    if not public.zchat_pv_allows(pr.privacy_groups, 'privacy_groups', v_fol, v_rev, v_chosen) then
      skipped := skipped || u;
      continue;
    end if;
    begin
      insert into public.group_members (group_id, user_id, role, added_by) values (g.id, u, 'member', me);
      added := added || u;
    exception when others then
      skipped := skipped || u;
    end;
  end loop;
  if coalesce(array_length(added, 1), 0) > 0 then
    select string_agg(coalesce(nullif(btrim(p.name), ''), p.username), ', ') into names from public.profiles p where p.id = any (added);
  end if;
  begin
    insert into public.messages as m (sender_id, group_id, type, content)
      values (me, g.id, 'system', case when names is null then 'Group created' else left('Group created and ' || names || ' added', 500) end)
      returning to_jsonb(m.*) into sys;
  exception when others then
    sys := null;
  end;
  select to_jsonb(x.*) into gj from public.groups x where x.id = g.id;
  return jsonb_build_object('group', coalesce(gj, to_jsonb(g)), 'added', to_jsonb(added), 'skipped', to_jsonb(skipped), 'sys', sys);
end $$;

revoke all on function public.zchat_group_create(text, text, text, uuid[]) from public, anon;
grant execute on function public.zchat_group_create(text, text, text, uuid[]) to authenticated;

create or replace function public.zchat_group_nm(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select coalesce(nullif(btrim(p.name), ''), nullif(btrim(p.username), '')) from public.profiles p where p.id = p_user), 'Someone')
$$;

create or replace function public.zchat_group_say(p_group uuid, p_actor uuid, p_text text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_ jsonb;
begin
  if p_group is null or p_actor is null or coalesce(btrim(p_text), '') = '' then
    return null;
  end if;
  perform set_config('zchat.g1_ok', '1', true);
  insert into public.messages as m (sender_id, group_id, type, content)
    values (p_actor, p_group, 'system', left(p_text, 500))
    returning to_jsonb(m.*) into row_;
  perform set_config('zchat.g1_ok', '', true);
  return row_;
exception when others then
  perform set_config('zchat.g1_ok', '', true);
  return null;
end $$;

create or replace function public.zchat_group_pv_ok(p_me uuid, p_user uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  pr record;
  v_fol boolean;
  v_rev boolean;
  v_chosen text[];
begin
  select p.id, p.privacy_groups, coalesce(p.is_deleted, false) as gone into pr from public.profiles p where p.id = p_user;
  if not found or pr.gone then
    return 'gone';
  end if;
  if exists (select 1 from public.blocks b where (b.blocker_id = p_user and b.blocked_id = p_me) or (b.blocker_id = p_me and b.blocked_id = p_user)) then
    return 'blocked';
  end if;
  v_fol := exists (select 1 from public.follows f where f.follower_id = p_me and f.following_id = p_user and coalesce(f.status, 'accepted') = 'accepted');
  v_rev := exists (select 1 from public.follows f where f.follower_id = p_user and f.following_id = p_me and coalesce(f.status, 'accepted') = 'accepted');
  v_chosen := coalesce((select array_agg(a.scope) from public.privacy_allow a where a.user_id = p_user and a.viewer_id = p_me), '{}'::text[]);
  if not public.zchat_pv_allows(pr.privacy_groups, 'privacy_groups', v_fol, v_rev, v_chosen) then
    return 'privacy';
  end if;
  return 'ok';
end $$;

create or replace function public.zchat_group_add_members(p_group uuid, p_members uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  g record;
  r integer;
  u uuid;
  why text;
  added uuid[] := '{}';
  skipped uuid[] := '{}';
  reasons jsonb := '{}'::jsonb;
  names text;
  line jsonb;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  select x.id, x.created_by, x.add_members_policy into g from public.groups x where x.id = p_group;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'This group is gone.');
  end if;
  r := public.zchat_g1_rank(p_group, me);
  if r < 0 then
    return jsonb_build_object('ok', false, 'reason', 'You are not in this group anymore.');
  end if;
  if coalesce(g.add_members_policy, 'everyone') = 'admins' and r < 2 then
    return jsonb_build_object('ok', false, 'reason', 'Only admins can add people to this group.');
  end if;
  foreach u in array (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_members, '{}'::uuid[])) as x where x is not null and x <> me) loop
    exit when coalesce(array_length(added, 1), 0) + coalesce(array_length(skipped, 1), 0) >= 100;
    if exists (select 1 from public.group_members m where m.group_id = p_group and m.user_id = u) then
      continue;
    end if;
    why := public.zchat_group_pv_ok(me, u);
    if why = 'ok' then
      begin
        insert into public.group_members (group_id, user_id, role, added_by) values (p_group, u, 'member', me);
        added := added || u;
      exception when others then
        why := 'error';
      end;
    end if;
    if why <> 'ok' then
      skipped := skipped || u;
      reasons := reasons || jsonb_build_object(u::text, why);
    end if;
  end loop;
  if coalesce(array_length(added, 1), 0) > 0 then
    select string_agg(public.zchat_group_nm(x), ', ') into names from unnest(added) as x;
    line := public.zchat_group_say(p_group, me, public.zchat_group_nm(me) || ' added ' || names);
  end if;
  return jsonb_build_object('ok', true, 'added', to_jsonb(added), 'skipped', to_jsonb(skipped), 'why', reasons, 'line', line);
end $$;

create or replace function public.zchat_group_kick(p_group uuid, p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r_me integer;
  r_u integer;
  nm text;
  line jsonb;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  if p_user is null or p_user = me then
    return jsonb_build_object('ok', false, 'reason', 'Use leave group to go.');
  end if;
  r_me := public.zchat_g1_rank(p_group, me);
  r_u := public.zchat_g1_rank(p_group, p_user);
  if r_u < 0 then
    return jsonb_build_object('ok', true, 'line', null);
  end if;
  if r_me < 2 then
    return jsonb_build_object('ok', false, 'reason', 'Only admins can remove people.');
  end if;
  if r_u >= r_me then
    return jsonb_build_object('ok', false, 'reason', 'You can only remove people below you in this group.');
  end if;
  nm := public.zchat_group_nm(p_user);
  delete from public.group_members m where m.group_id = p_group and m.user_id = p_user;
  line := public.zchat_group_say(p_group, me, public.zchat_group_nm(me) || ' removed ' || nm);
  return jsonb_build_object('ok', true, 'line', line);
end $$;

create or replace function public.zchat_group_leave(p_group uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  owner_ uuid;
  heir uuid;
  line jsonb;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  select x.created_by into owner_ from public.groups x where x.id = p_group;
  if not found then
    return jsonb_build_object('ok', true, 'gone', true);
  end if;
  if owner_ = me then
    select m.user_id into heir from public.group_members m
      where m.group_id = p_group and m.user_id <> me
      order by (m.role = 'admin') desc, (m.role = 'moderator') desc, m.joined_at asc nulls last
      limit 1;
    if heir is null then
      delete from public.groups x where x.id = p_group;
      return jsonb_build_object('ok', true, 'gone', true);
    end if;
    perform set_config('zchat.g1_ok', '1', true);
    update public.group_members m set role = 'admin' where m.group_id = p_group and m.user_id = heir;
    update public.groups x set created_by = heir where x.id = p_group;
    perform set_config('zchat.g1_ok', '', true);
  end if;
  line := public.zchat_group_say(p_group, me, public.zchat_group_nm(me) || ' left the group');
  delete from public.group_members m where m.group_id = p_group and m.user_id = me;
  return jsonb_build_object('ok', true, 'heir', heir);
end $$;

create or replace function public.zchat_group_delete(p_group uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  if not exists (select 1 from public.groups x where x.id = p_group) then
    return jsonb_build_object('ok', true);
  end if;
  if public.zchat_g1_rank(p_group, me) < 3 then
    return jsonb_build_object('ok', false, 'reason', 'Only the group owner can delete the group.');
  end if;
  delete from public.groups x where x.id = p_group;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.zchat_group_transfer(p_group uuid, p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  line jsonb;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  if public.zchat_g1_rank(p_group, me) < 3 then
    return jsonb_build_object('ok', false, 'reason', 'Only the group owner can do that.');
  end if;
  if p_user is null or p_user = me or not exists (select 1 from public.group_members m where m.group_id = p_group and m.user_id = p_user) then
    return jsonb_build_object('ok', false, 'reason', 'They are not in this group anymore.');
  end if;
  perform set_config('zchat.g1_ok', '1', true);
  update public.group_members m set role = 'admin' where m.group_id = p_group and m.user_id = p_user;
  update public.group_members m set role = 'admin' where m.group_id = p_group and m.user_id = me;
  update public.groups x set created_by = p_user where x.id = p_group;
  perform set_config('zchat.g1_ok', '', true);
  line := public.zchat_group_say(p_group, me, public.zchat_group_nm(me) || ' made ' || public.zchat_group_nm(p_user) || ' the group owner');
  return jsonb_build_object('ok', true, 'line', line);
end $$;

create or replace function public.zchat_group_update(p_group uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r integer;
  allowed text[] := array['name', 'bio', 'avatar', 'wallpaper', 'name_bar', 'add_members_policy', 'send_policy', 'invite_code', 'invite_enabled', 'disappear_secs', 'accent', 'slow_secs', 'mention_all', 'topics', 'join_approval', 'approve_posts', 'admin_links', 'read_only', 'welcome_text', 'welcome_name', 'group_rules', 'join_questions'];
  cols text[];
  sets text;
  out_ jsonb;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'Nothing to save.');
  end if;
  r := public.zchat_g1_rank(p_group, me);
  if r < 0 then
    return jsonb_build_object('ok', false, 'reason', 'You are not in this group anymore.');
  end if;
  if r < 2 then
    return jsonb_build_object('ok', false, 'reason', 'Only admins can change this group.');
  end if;
  if p_patch ? 'name' and coalesce(btrim(p_patch ->> 'name'), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'Give the group a name.');
  end if;
  select array_agg(k) into cols from jsonb_object_keys(p_patch) as k
    where k = any (allowed)
      and exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'groups' and c.column_name = k);
  if cols is null then
    return jsonb_build_object('ok', false, 'reason', 'That setting switches on once the latest ZChat setup is finished.');
  end if;
  select string_agg(format('%I = r.%I', c, c), ', ') into sets from unnest(cols) as c;
  execute format('update public.groups x set %s from jsonb_populate_record(null::public.groups, $1) r where x.id = $2', sets) using p_patch, p_group;
  select to_jsonb(x.*) into out_ from public.groups x where x.id = p_group;
  return jsonb_build_object('ok', true, 'group', out_);
end $$;

create or replace function public.zchat_group_member_mute(p_group uuid, p_user uuid, p_on boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r_me integer;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  r_me := public.zchat_g1_rank(p_group, me);
  if r_me < 2 or public.zchat_g1_rank(p_group, p_user) >= r_me then
    return jsonb_build_object('ok', false, 'reason', 'Only admins can mute people below them.');
  end if;
  perform set_config('zchat.g1_ok', '1', true);
  update public.group_members m set muted = coalesce(p_on, false) where m.group_id = p_group and m.user_id = p_user;
  perform set_config('zchat.g1_ok', '', true);
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.zchat_group_nm(uuid) from public, anon, authenticated;
revoke all on function public.zchat_group_say(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.zchat_group_pv_ok(uuid, uuid) from public, anon, authenticated;
revoke all on function public.zchat_group_add_members(uuid, uuid[]) from public, anon;
revoke all on function public.zchat_group_kick(uuid, uuid) from public, anon;
revoke all on function public.zchat_group_leave(uuid) from public, anon;
revoke all on function public.zchat_group_delete(uuid) from public, anon;
revoke all on function public.zchat_group_transfer(uuid, uuid) from public, anon;
revoke all on function public.zchat_group_update(uuid, jsonb) from public, anon;
revoke all on function public.zchat_group_member_mute(uuid, uuid, boolean) from public, anon;
grant execute on function public.zchat_group_add_members(uuid, uuid[]) to authenticated;
grant execute on function public.zchat_group_kick(uuid, uuid) to authenticated;
grant execute on function public.zchat_group_leave(uuid) to authenticated;
grant execute on function public.zchat_group_delete(uuid) to authenticated;
grant execute on function public.zchat_group_transfer(uuid, uuid) to authenticated;
grant execute on function public.zchat_group_update(uuid, jsonb) to authenticated;
grant execute on function public.zchat_group_member_mute(uuid, uuid, boolean) to authenticated;

create table if not exists public.zchat_live_now (
  user_id uuid primary key references auth.users (id) on delete cascade,
  game text not null,
  room text not null,
  watch boolean not null default true,
  info jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.zchat_live_now enable row level security;
revoke all on table public.zchat_live_now from public, anon, authenticated;
create index if not exists zchat_live_now_updated on public.zchat_live_now (updated_at);

create or replace function public.zchat_live_set(p_game text, p_room text, p_watch boolean, p_info jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_info jsonb := coalesce(p_info, '{}'::jsonb);
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_game is null or p_game not in ('duo', 'gulp', 'roll') then raise exception 'unknown game'; end if;
  if p_room is null or char_length(p_room) < 3 or char_length(p_room) > 80 then raise exception 'bad room'; end if;
  if jsonb_typeof(v_info) <> 'object' or pg_column_size(v_info) > 1500 then v_info := '{}'::jsonb; end if;
  insert into public.zchat_live_now (user_id, game, room, watch, info, updated_at)
  values (me, p_game, p_room, coalesce(p_watch, true), v_info, now())
  on conflict (user_id) do update set game = excluded.game, room = excluded.room, watch = excluded.watch, info = excluded.info, updated_at = now();
end;
$$;

create or replace function public.zchat_live_clear()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  delete from public.zchat_live_now where user_id = auth.uid();
end;
$$;

create or replace function public.zchat_live_friends()
returns table (user_id uuid, game text, room text, info jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.user_id, l.game, l.room, l.info, l.updated_at
  from public.zchat_live_now l
  where auth.uid() is not null
    and l.user_id <> auth.uid()
    and l.watch
    and l.updated_at > now() - interval '3 minutes'
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

revoke all on function public.zchat_live_set(text, text, boolean, jsonb) from public, anon;
revoke all on function public.zchat_live_clear() from public, anon;
revoke all on function public.zchat_live_friends() from public, anon;
grant execute on function public.zchat_live_set(text, text, boolean, jsonb) to authenticated;
grant execute on function public.zchat_live_clear() to authenticated;
grant execute on function public.zchat_live_friends() to authenticated;

create or replace function public.zchat_g1_clock_apply(prev jsonb, st jsonb, nx jsonb, mark text)
returns jsonb
language plpgsql
stable
as $$
declare
  v_now bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  pck jsonb := prev -> 'ck';
  sck jsonb := st -> 'ck';
  i integer := case when mark = 'x' then 0 else 1 end;
  j integer := case when mark = 'x' then 1 else 0 end;
  inc numeric := coalesce(public.zchat_g1_int(prev -> 'ti'), 0) * 1000;
  stt numeric;
  was numeric;
  now_left numeric;
  claim numeric;
begin
  if jsonb_typeof(pck) <> 'array' or jsonb_array_length(pck) <> 2 or jsonb_typeof(sck) <> 'array' or jsonb_array_length(sck) <> 2 then return null; end if;
  if jsonb_typeof(sck -> 0) <> 'number' or jsonb_typeof(sck -> 1) <> 'number' or jsonb_typeof(st -> 'tt') <> 'number' then return null; end if;
  if inc < 0 or inc > 10000 then return null; end if;
  stt := (st ->> 'tt')::numeric;
  if stt <> trunc(stt) or abs(stt - v_now) > 15000 then return null; end if;
  if (sck ->> j)::numeric <> (pck ->> j)::numeric then return null; end if;
  was := (pck ->> i)::numeric;
  claim := (sck ->> i)::numeric;
  if claim <> trunc(claim) or claim < 0 then return null; end if;
  if jsonb_typeof(prev -> 'tt') = 'number' then
    if claim > was + inc then return null; end if;
    now_left := was - (v_now - (prev ->> 'tt')::numeric);
    if now_left < -5000 or claim > now_left + inc + 5000 then return null; end if;
  elsif claim <> was then
    return null;
  end if;
  return nx || jsonb_build_object('ck', sck, 'tt', st -> 'tt');
end $$;

create or replace function public.zchat_g1_initial(k text, st jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  base jsonb := jsonb_build_object('g', k, 'id', st -> 'id', 'x', st -> 'x', 'o', st -> 'o', 'n', 0, 'w', null);
  wh text := st ->> 'wh';
  b jsonb; e jsonb; ids integer[]; bx numeric; by_ numeric; pid integer;
  pz jsonb; w integer; h integer; cells text; cl jsonb; r integer; c integer; l integer; j integer;
  sq3 numeric := sqrt(3);
  ex jsonb;
  tc integer;
  ti integer;
  nine boolean := false;
begin
  if k in ('chess', 'ckr') then
    if wh is null or wh not in (st ->> 'x', st ->> 'o') then return null; end if;
    if k = 'chess' then
      ex := base || jsonb_build_object('wh', wh, 't', wh, 'b', public.zchat_g1_ch_start(), 'c', 'KQkq', 'e', -1, 'h', 0, 'k', '',
        'r', jsonb_build_array(public.zchat_g1_fnv(public.zchat_g1_ch_start() || 'wKQkq-1')), 'm', null, 'why', null, 'dr', null, 'a', 'start');
    else
      ex := base || jsonb_build_object('wh', wh, 't', wh, 'b', public.zchat_g1_ck_start(), 'h', 0, 'm', null, 'why', null, 'dr', null, 'a', 'start');
    end if;
    if st ? 'tc' then
      tc := public.zchat_g1_int(st -> 'tc');
      if tc is null or tc not in (60, 120, 180, 300, 600, 900) then return null; end if;
      ex := ex || jsonb_build_object('tc', tc, 'ck', jsonb_build_array(tc * 1000, tc * 1000), 'tt', null);
      if st ? 'ti' then
        ti := public.zchat_g1_int(st -> 'ti');
        if ti is null or ti not in (1, 2, 3, 5, 10) then return null; end if;
        ex := ex || jsonb_build_object('ti', ti);
      end if;
    end if;
    return ex;
  elsif k = 'pool' then
    nine := st ? 'v';
    if nine and public.zchat_g1_int(st -> 'v') is distinct from 9 then return null; end if;
    b := st -> 'b';
    if jsonb_typeof(b) <> 'array' or jsonb_array_length(b) <> (case when nine then 10 else 16 end) then return null; end if;
    for e in select * from jsonb_array_elements(b) loop
      if jsonb_typeof(e) <> 'array' or jsonb_array_length(e) <> 3 then return null; end if;
      pid := public.zchat_g1_int(e -> 0); bx := public.zchat_g1_num(e -> 1); by_ := public.zchat_g1_num(e -> 2);
      if pid is null or bx is null or by_ is null or pid not between 0 and (case when nine then 9 else 15 end) then return null; end if;
      ids := ids || pid;
      if pid = 0 then
        if bx not between 28.6 and 1241.4 or by_ not between 1905 and 2511.4 then return null; end if;
      else
        if abs(bx - 635) > 6 * 28.7 or by_ > 635 + 2 * 28.7 or by_ < 635 - 4 * 28.7 * sq3 - 2 * 28.7 then return null; end if;
        if pid = (case when nine then 9 else 8 end) and (abs(bx - 635) > 1 or abs(by_ - (635 - 2 * 28.7 * sq3)) > 1) then return null; end if;
        if nine and pid = 1 and (abs(bx - 635) > 1 or abs(by_ - 635) > 1) then return null; end if;
      end if;
    end loop;
    if (select count(distinct x) from unnest(ids) x) <> (case when nine then 10 else 16 end) then return null; end if;
    return base || jsonb_build_object('t', st -> 'o', 'b', b, 'gx', null, 'bih', true, 'ls', null, 'ev', null, 'why', null, 'lb', null)
      || (case when nine then jsonb_build_object('v', 9) else '{}'::jsonb end);
  elsif k = 'golf' then
    return base || jsonb_build_object('t', st -> 'o', 'f', st -> 'o', 'h', 1, 'sx', '[]'::jsonb, 'so', '[]'::jsonb, 'ls', null, 'lh', 0, 'lb', null, 'why', null);
  elsif k = 'sdk' then
    if public.zchat_g1_int(st -> 'lv') is null or public.zchat_g1_int(st -> 'lv') not between 1 and 4 then return null; end if;
    if not public.zchat_g1_sdk_ok(st ->> 'gv', null, true) then return null; end if;
    return base || jsonb_build_object('lv', st -> 'lv', 'gv', st -> 'gv', 'fx', null, 'fo', null);
  elsif k = 'jig' then
    if (st ->> 'u') is null or (st ->> 'u') !~ ('^zp:' || (st ->> 'x') || '/[A-Za-z0-9._-]{1,120}$') then return null; end if;
    if public.zchat_g1_int(st -> 'pc') is null or public.zchat_g1_int(st -> 'pc') not in (9, 16, 25, 36) then return null; end if;
    if public.zchat_g1_num(st -> 'ar') is null or public.zchat_g1_num(st -> 'ar') not between 0.5 and 2 then return null; end if;
    return base || jsonb_build_object('u', st -> 'u', 'pc', st -> 'pc', 'sd', st -> 'id', 'ar', st -> 'ar', 'tm', null);
  elsif k = 'xw' then
    pz := st -> 'pz';
    if jsonb_typeof(pz) <> 'object' then return null; end if;
    w := public.zchat_g1_int(pz -> 'w'); h := public.zchat_g1_int(pz -> 'h'); cells := pz ->> 'cells';
    if w is null or h is null or w not between 3 and 9 or h not between 3 and 9 or cells is null or length(cells) <> w * h or cells !~ '^[A-Z#]+$' then return null; end if;
    if jsonb_typeof(pz -> 'clues') <> 'array' or jsonb_array_length(pz -> 'clues') not between 2 and 40 then return null; end if;
    for cl in select * from jsonb_array_elements(pz -> 'clues') loop
      r := public.zchat_g1_int(cl -> 'r'); c := public.zchat_g1_int(cl -> 'c'); l := public.zchat_g1_int(cl -> 'l');
      if r is null or c is null or l is null or l not between 2 and 9 or (cl ->> 'd') not in ('a', 'd') or public.zchat_g1_int(cl -> 'n') is null
        or jsonb_typeof(cl -> 'q') <> 'string' or length(cl ->> 'q') not between 1 and 160 then return null; end if;
      for j in 0..l - 1 loop
        if (cl ->> 'd') = 'a' and (c + j >= w or substr(cells, r * w + c + j + 1, 1) = '#') then return null; end if;
        if (cl ->> 'd') = 'd' and (r + j >= h or substr(cells, (r + j) * w + c + 1, 1) = '#') then return null; end if;
      end loop;
    end loop;
    if public.zchat_g1_num(st -> 'at') is null then return null; end if;
    return base || jsonb_build_object('pz', pz, 'at', st -> 'at', 'tm', null);
  end if;
  return null;
end $$;

create or replace function public.zchat_g1_step(k text, prev jsonb, st jsonb, sender uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  me text := sender::text;
  mark text := case when sender::text = (prev ->> 'x') then 'x' else 'o' end;
  omark text := case when sender::text = (prev ->> 'x') then 'o' else 'x' end;
  other text := case when sender::text = (prev ->> 'x') then prev ->> 'o' else prev ->> 'x' end;
  nn integer := coalesce(public.zchat_g1_int(prev -> 'n'), 0) + 1;
  a text := st ->> 'a';
  ls jsonb; e jsonb; f text; v integer; pv jsonb; sx jsonb; so jsonb; mine jsonb; theirs jsonb; s integer; second boolean; hh integer; w text; t text;
  ids integer[]; pid integer; cnt integer; ck record; row_ record; px numeric; py numeric;
begin
  if (prev ->> 'w') is not null then return null; end if;
  if k in ('chess', 'ckr') then
    if a = 'resign' then return prev || jsonb_build_object('n', nn, 'w', omark, 'why', 'resign', 'a', 'resign', 'dr', null); end if;
    if a = 'offer' then
      if (prev ->> 'a') = 'mv' and (prev ->> 't') <> me and (prev ->> 'dr') is null then return prev || jsonb_build_object('n', nn, 'dr', me, 'a', 'offer'); end if;
      return null;
    end if;
    if a in ('decline', 'accept') then
      if (prev ->> 'a') <> 'offer' or (prev ->> 'dr') is null or (prev ->> 'dr') = me then return null; end if;
      if a = 'decline' then return prev || jsonb_build_object('n', nn, 'dr', null, 'a', 'decline'); end if;
      return prev || jsonb_build_object('n', nn, 'w', 'd', 'why', 'agree', 'a', 'accept', 'dr', null);
    end if;
    if a = 'flag' then return public.zchat_g1_clock_flag(prev, nn); end if;
    if a = 'mv' and (prev ->> 't') = me then
      if k = 'chess' then
        pv := public.zchat_g1_ch_next(prev, st ->> 'm', sender);
      else
        pv := public.zchat_g1_ck_next(prev, st -> 'm', sender);
      end if;
      if pv is null or (prev ->> 'tc') is null then return pv; end if;
      return public.zchat_g1_clock_apply(prev, st, pv, mark);
    end if;
    return null;
  end if;
  if k = 'pool' then
    if (st ->> 'why') = 'resign' then return prev || jsonb_build_object('n', nn, 'w', omark, 'why', 'resign', 'ls', null, 'ev', null, 'lb', me); end if;
    if (prev ->> 't') <> me then return null; end if;
    if (select array_agg(x order by x) from jsonb_object_keys(st) x) <> (select array_agg(x order by x) from jsonb_object_keys(prev) x) then return null; end if;
    if st -> 'g' <> prev -> 'g' or st -> 'id' <> prev -> 'id' or st -> 'x' <> prev -> 'x' or st -> 'o' <> prev -> 'o' then return null; end if;
    if public.zchat_g1_int(st -> 'n') <> nn or (st ->> 't') not in (prev ->> 'x', prev ->> 'o') or (st ->> 'lb') <> me then return null; end if;
    if (st ->> 'w') is not null and (st ->> 'w') not in ('x', 'o') then return null; end if;
    if (st ->> 'why') is not null and (st ->> 'why') <> (case when public.zchat_g1_int(prev -> 'v') = 9 then 'nine' else 'eight' end) then return null; end if;
    if public.zchat_g1_int(prev -> 'v') = 9 and (st ->> 'gx') is not null then return null; end if;
    if (prev ->> 'gx') is not null and st -> 'gx' <> prev -> 'gx' then return null; end if;
    if (st ->> 'gx') is not null and (st ->> 'gx') not in ('s', 't') then return null; end if;
    if jsonb_typeof(st -> 'bih') <> 'boolean' then return null; end if;
    ls := st -> 'ls';
    if jsonb_typeof(ls) <> 'object' then return null; end if;
    if public.zchat_g1_int(ls -> 'dx') is null or public.zchat_g1_int(ls -> 'dy') is null or abs(public.zchat_g1_int(ls -> 'dx')) > 1000000 or abs(public.zchat_g1_int(ls -> 'dy')) > 1000000
      or (public.zchat_g1_int(ls -> 'dx') = 0 and public.zchat_g1_int(ls -> 'dy') = 0) then return null; end if;
    if public.zchat_g1_int(ls -> 'p') is null or public.zchat_g1_int(ls -> 'p') not between 1 and 1000 or public.zchat_g1_int(ls -> 's') is null or public.zchat_g1_int(ls -> 's') not between -100 and 100 then return null; end if;
    if coalesce((prev ->> 'bih')::boolean, false) then
      px := public.zchat_g1_num(ls -> 'cx'); py := public.zchat_g1_num(ls -> 'cy');
      if px is null or py is null or px not between 28.6 and 1241.4 or py not between 28.6 and 2511.4 then return null; end if;
      if coalesce(public.zchat_g1_int(prev -> 'n'), 0) = 0 and py < 1905 then return null; end if;
    elsif ls ? 'cx' or ls ? 'cy' then return null; end if;
    if jsonb_typeof(st -> 'b') <> 'array' or jsonb_array_length(st -> 'b') > 16 then return null; end if;
    select array_agg(public.zchat_g1_int(z -> 0)) into ids from jsonb_array_elements(prev -> 'b') z;
    for e in select * from jsonb_array_elements(st -> 'b') loop
      if jsonb_typeof(e) <> 'array' or jsonb_array_length(e) <> 3 then return null; end if;
      pid := public.zchat_g1_int(e -> 0); px := public.zchat_g1_num(e -> 1); py := public.zchat_g1_num(e -> 2);
      if pid is null or px is null or py is null or px not between -60 and 1330 or py not between -60 and 2600 then return null; end if;
      if not (pid = any (coalesce(ids, '{}')) or pid = 0 or (pid = 8 and coalesce(public.zchat_g1_int(prev -> 'n'), 0) = 0)
        or (pid = 9 and public.zchat_g1_int(prev -> 'v') = 9)) then return null; end if;
    end loop;
    if (select count(distinct public.zchat_g1_int(z -> 0)) from jsonb_array_elements(st -> 'b') z) <> jsonb_array_length(st -> 'b') then return null; end if;
    return st;
  end if;
  if k = 'golf' then
    if (st ->> 'why') = 'resign' then return prev || jsonb_build_object('n', nn, 'w', omark, 'why', 'resign', 'ls', null, 'lb', me); end if;
    if (prev ->> 't') <> me then return null; end if;
    ls := st -> 'ls';
    if jsonb_typeof(ls) <> 'array' or jsonb_array_length(ls) not between 1 and 6 then return null; end if;
    for e in select * from jsonb_array_elements(ls) loop
      if jsonb_typeof(e) <> 'array' or jsonb_array_length(e) <> 3 or public.zchat_g1_int(e -> 0) is null or public.zchat_g1_int(e -> 1) is null or public.zchat_g1_int(e -> 2) is null
        or abs(public.zchat_g1_int(e -> 0)) > 1000000 or abs(public.zchat_g1_int(e -> 1)) > 1000000 or public.zchat_g1_int(e -> 2) not between 1 and 1000 then return null; end if;
    end loop;
    mine := case when mark = 'x' then prev -> 'sx' else prev -> 'so' end;
    theirs := case when mark = 'x' then st -> 'so' else st -> 'sx' end;
    if theirs <> (case when mark = 'x' then prev -> 'so' else prev -> 'sx' end) then return null; end if;
    pv := case when mark = 'x' then st -> 'sx' else st -> 'so' end;
    if jsonb_typeof(pv) <> 'array' or jsonb_array_length(pv) <> jsonb_array_length(mine) + 1 then return null; end if;
    s := public.zchat_g1_int(pv -> (jsonb_array_length(pv) - 1));
    if s is null or not (s = jsonb_array_length(ls) or (jsonb_array_length(ls) = 6 and s = 7)) then return null; end if;
    if mine || to_jsonb(s) <> pv then return null; end if;
    sx := case when mark = 'x' then pv else prev -> 'sx' end;
    so := case when mark = 'o' then pv else prev -> 'so' end;
    second := me <> (prev ->> 'f');
    hh := case when second then public.zchat_g1_int(prev -> 'h') + 1 else public.zchat_g1_int(prev -> 'h') end;
    w := null;
    if jsonb_array_length(sx) = 9 and jsonb_array_length(so) = 9 then
      select case when a1 = b1 then 'd' when a1 < b1 then 'x' else 'o' end into w
      from (select (select sum(z::integer) from jsonb_array_elements_text(sx) z) a1, (select sum(z::integer) from jsonb_array_elements_text(so) z) b1) q;
    end if;
    t := case when w is not null then prev ->> 't' when second then prev ->> 'f' else other end;
    return prev || jsonb_build_object('sx', sx, 'so', so, 'h', case when w is not null then 9 else hh end, 't', t, 'n', nn, 'ls', ls, 'lh', prev -> 'h', 'lb', me, 'w', w, 'why', case when w is not null then 'done' else null end);
  end if;
  if k = 'sdk' then
    f := case when mark = 'x' then 'fx' else 'fo' end;
    if (prev ->> f) is not null then return null; end if;
    v := public.zchat_g1_int(st -> f);
    if v is null then return null; end if;
    if v <> -1 then
      select * into ck from public.zchat_g1_clock where game_id = prev ->> 'id' and user_id = sender;
      if not found or ck.done_ms is null or ck.done_ms <> v then return null; end if;
    end if;
    pv := prev || jsonb_build_object('n', nn, f, v);
    if (pv ->> 'fx') is not null and (pv ->> 'fo') is not null then
      pv := pv || jsonb_build_object('w', case
        when (pv ->> 'fx')::integer < 0 and (pv ->> 'fo')::integer < 0 then 'd'
        when (pv ->> 'fx')::integer < 0 then 'o'
        when (pv ->> 'fo')::integer < 0 then 'x'
        when (pv ->> 'fx')::integer = (pv ->> 'fo')::integer then 'd'
        when (pv ->> 'fx')::integer < (pv ->> 'fo')::integer then 'x' else 'o' end);
    end if;
    return pv;
  end if;
  if k = 'jig' then
    if me <> (prev ->> 'o') then return null; end if;
    v := public.zchat_g1_int(st -> 'tm');
    if v is null or v not between 1000 and 259200000 then return null; end if;
    return prev || jsonb_build_object('n', nn, 'w', 'done', 'tm', v);
  end if;
  if k = 'xw' then
    v := public.zchat_g1_int(st -> 'tm');
    if v is null or v not between 1000 and 604800000 then return null; end if;
    select * into row_ from public.zchat_g1_xw where game_id = prev ->> 'id';
    if not found or row_.cells <> row_.sol then return null; end if;
    return prev || jsonb_build_object('n', nn, 'w', 'done', 'tm', v);
  end if;
  return null;
end $$;

notify pgrst, 'reload schema';
commit;
