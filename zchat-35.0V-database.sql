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
  if p_patch ? 'wallpaper' and not public.zchat_wall_key_ok(nullif(btrim(coalesce(p_patch ->> 'wallpaper', '')), ''), array(select m.user_id from public.group_members m where m.group_id = p_group)) then
    return jsonb_build_object('ok', false, 'reason', 'That wallpaper cannot be used. Pick another one.');
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

drop function if exists public.zchat_wall_key_ok(text, uuid);
create or replace function public.zchat_wall_key_ok(p_key text, p_owners uuid[])
returns boolean
language plpgsql
immutable
as $$
declare
  folder text;
begin
  if p_key is null then
    return true;
  end if;
  if length(p_key) <= 120 and p_key !~ '\s' and p_key !~* '^(url:|https?:|data:|blob:|javascript:)' and p_key ~ '^[A-Za-z0-9#]' then
    return true;
  end if;
  if length(p_key) > 600 then
    return false;
  end if;
  folder := substring(p_key from '^url:https://etcmbghcmlgeezwgnwuz\.supabase\.co/storage/v1/object/public/chat-media/([0-9a-fA-F-]{36})/[A-Za-z0-9][A-Za-z0-9._-]{0,159}$');
  if folder is null then
    return false;
  end if;
  return lower(folder) = any (select lower(o::text) from unnest(coalesce(p_owners, '{}'::uuid[])) o);
end $$;
revoke all on function public.zchat_wall_key_ok(text, uuid[]) from public, anon;
grant execute on function public.zchat_wall_key_ok(text, uuid[]) to authenticated, service_role;

create or replace function public.zchat_chat_wallpaper(p_conv text, p_key text, p_both boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  k text := nullif(btrim(coalesce(p_key, '')), '');
  c record;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'Log in first.');
  end if;
  select x.id, x.user_a, x.user_b into c from public.conversations x where x.id::text = p_conv limit 1;
  if not found or me not in (c.user_a, c.user_b) then
    return jsonb_build_object('ok', false, 'reason', 'That chat was not found.');
  end if;
  if not public.zchat_wall_key_ok(k, array[c.user_a, c.user_b]) then
    return jsonb_build_object('ok', false, 'reason', 'That wallpaper cannot be used. Pick another one.');
  end if;
  if coalesce(p_both, true) then
    update public.conversations x set wallpaper_a = k, wallpaper_b = k where x.id = c.id;
  elsif c.user_a = me then
    update public.conversations x set wallpaper_a = k where x.id = c.id;
  else
    update public.conversations x set wallpaper_b = k where x.id = c.id;
  end if;
  return jsonb_build_object('ok', true, 'wallpaper', k);
end $$;
revoke all on function public.zchat_chat_wallpaper(text, text, boolean) from public, anon;
grant execute on function public.zchat_chat_wallpaper(text, text, boolean) to authenticated;

create or replace function public.zchat_db_manifest()
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  fn_app text[] := array[
    'admin_add_knowledge', 'admin_ban', 'admin_bot_knowledge_count', 'admin_broadcast', 'admin_delete_content', 'admin_delete_row',
    'admin_delete_user', 'admin_grant_reward', 'admin_lift_restriction', 'admin_list_tables', 'admin_log_action', 'admin_recent_log',
    'admin_remove_user_messages', 'admin_restrict', 'admin_revoke_reward', 'admin_send_mail', 'admin_set_admin', 'admin_set_verified',
    'admin_sign_out_user', 'admin_stats', 'admin_table_rows', 'admin_unban', 'admin_update_profile', 'admin_update_row',
    'admin_user_messages', 'admin_user_overview', 'ga2_create', 'is_blocked', 'public_post_preview', 'public_profile_decor',
    'public_profile_preview', 'send_bio_mention', 'send_report_warning', 'zchat_admin_coins', 'zchat_admin_db_check', 'zchat_admin_grant',
    'zchat_admin_health', 'zchat_admin_health_set', 'zchat_admin_login_approval_off', 'zchat_admin_photo_flags', 'zchat_admin_photo_review', 'zchat_admin_revoke',
    'zchat_admin_take_coins', 'zchat_admin_wallet', 'zchat_age_terms_save', 'zchat_age_terms_state', 'zchat_aiphoto_job', 'zchat_answer_question',
    'zchat_ask', 'zchat_bag_open', 'zchat_bag_send', 'zchat_bags', 'zchat_bday_candidates', 'zchat_bday_card_for',
    'zchat_bday_card_get', 'zchat_bday_card_invite', 'zchat_bday_card_mark', 'zchat_bday_card_sign', 'zchat_bday_card_start', 'zchat_bday_card_unsign',
    'zchat_bday_cards_mine', 'zchat_bday_gift_cancel', 'zchat_bday_gift_save', 'zchat_board_add', 'zchat_booth_clock', 'zchat_booth_join',
    'zchat_booth_leave', 'zchat_booth_open', 'zchat_booth_shot', 'zchat_booth_start', 'zchat_booth_state', 'zchat_break_check',
    'zchat_break_start', 'zchat_buy_deal', 'zchat_buy_drop', 'zchat_buy_item', 'zchat_buy_match_pair', 'zchat_buy_set',
    'zchat_buy_wrap', 'zchat_call_link', 'zchat_can_dm', 'zchat_can_interact', 'zchat_capsule_send', 'zchat_capsules_get',
    'zchat_channel_post_stats', 'zchat_channels', 'zchat_character_report', 'zchat_chat_list', 'zchat_chat_wallpaper', 'zchat_check_achievements',
    'zchat_check_chat_pin', 'zchat_chip_cancel', 'zchat_chip_pay', 'zchat_chip_start', 'zchat_chips', 'zchat_cl_plan_cancel',
    'zchat_cl_plan_rsvp', 'zchat_cl_plan_send', 'zchat_cl_plans_get', 'zchat_claim_free_bubble', 'zchat_claim_free_set', 'zchat_claim_invite',
    'zchat_claim_milestone', 'zchat_cm_lt_key', 'zchat_cm_sched_claim', 'zchat_cm_wait', 'zchat_code_create', 'zchat_code_redeem',
    'zchat_code_set', 'zchat_collab_respond', 'zchat_community_add_group', 'zchat_community_add_members', 'zchat_community_admin_set', 'zchat_community_create',
    'zchat_community_delete', 'zchat_community_edit', 'zchat_community_invite', 'zchat_community_invite_reset', 'zchat_community_join', 'zchat_community_join_group',
    'zchat_community_leave', 'zchat_community_mine', 'zchat_community_new_group', 'zchat_community_page', 'zchat_community_remove_group', 'zchat_community_remove_member',
    'zchat_compliment_send', 'zchat_compliment_set', 'zchat_compliments_mine', 'zchat_contacts_get', 'zchat_contacts_match', 'zchat_contacts_set_email',
    'zchat_contacts_set_phone', 'zchat_cr_chat_state', 'zchat_cr_group_join', 'zchat_cr_group_price', 'zchat_cr_me', 'zchat_cr_member_cancel',
    'zchat_cr_member_ids', 'zchat_cr_member_join', 'zchat_cr_msg_send', 'zchat_cr_pack_buy', 'zchat_cr_pack_sell', 'zchat_cr_pack_stop',
    'zchat_cr_packs_bought', 'zchat_cr_packs_top', 'zchat_cr_page', 'zchat_cr_settings_save', 'zchat_cr_shout_decline', 'zchat_cr_shout_deliver',
    'zchat_cr_shout_order', 'zchat_ct_remove', 'zchat_ct_summary', 'zchat_daily_reward', 'zchat_deal_today', 'zchat_delete_question',
    'zchat_dm_unread', 'zchat_edit_history', 'zchat_edition_left', 'zchat_equip_charm', 'zchat_friend_ranks', 'zchat_g1_clock_start',
    'zchat_g1_join_answer', 'zchat_g1_nick_clear', 'zchat_g1_pending_drop', 'zchat_g1_review', 'zchat_g1_rules_accept', 'zchat_g1_send',
    'zchat_g1_sudoku_done', 'zchat_game_kit_get', 'zchat_game_kit_of', 'zchat_game_kit_set', 'zchat_game_pair_counts', 'zchat_game_xp_finish',
    'zchat_game_xp_levels', 'zchat_game_xp_mine', 'zchat_gh_bot_move', 'zchat_gh_end', 'zchat_gh_get', 'zchat_gh_live',
    'zchat_gh_move', 'zchat_gh_new', 'zchat_gh_secret', 'zchat_gh_tour_cancel', 'zchat_gh_tour_join', 'zchat_gh_tour_new',
    'zchat_gh_tour_start', 'zchat_gift_item', 'zchat_gift_send', 'zchat_group_add_members', 'zchat_group_create', 'zchat_group_delete',
    'zchat_group_invite', 'zchat_group_kick', 'zchat_group_leave', 'zchat_group_member_mute', 'zchat_group_read', 'zchat_group_read_mark',
    'zchat_group_reads_get', 'zchat_group_role_set', 'zchat_group_transfer', 'zchat_group_update', 'zchat_grp_emoji_add', 'zchat_grp_emoji_remove',
    'zchat_grp_kw_any', 'zchat_grp_link_delete', 'zchat_grp_link_save', 'zchat_guestbook_decide', 'zchat_guestbook_delete', 'zchat_guestbook_page',
    'zchat_guestbook_write', 'zchat_import_add', 'zchat_import_finish', 'zchat_import_remove', 'zchat_import_start', 'zchat_join_group',
    'zchat_joke_save', 'zchat_leaderboard', 'zchat_listen_clock', 'zchat_live_ask', 'zchat_live_beat', 'zchat_live_clear',
    'zchat_live_comment', 'zchat_live_end', 'zchat_live_friends', 'zchat_live_get', 'zchat_live_gift', 'zchat_live_goal_end',
    'zchat_live_goal_set', 'zchat_live_moderate', 'zchat_live_now', 'zchat_live_poll_end', 'zchat_live_poll_now', 'zchat_live_poll_start',
    'zchat_live_poll_vote', 'zchat_live_question_set', 'zchat_live_questions', 'zchat_live_set', 'zchat_live_start', 'zchat_live_supporters',
    'zchat_live_supporters_show', 'zchat_live_thank', 'zchat_local_time', 'zchat_local_times', 'zchat_login_approval_set', 'zchat_login_approval_state',
    'zchat_login_codes_confirm', 'zchat_login_codes_new', 'zchat_login_decide', 'zchat_login_pending', 'zchat_login_recovery', 'zchat_lookalike',
    'zchat_lookalike_many', 'zchat_lost_streaks', 'zchat_match_pairs', 'zchat_match_with', 'zchat_memories', 'zchat_milestones',
    'zchat_mod_delete', 'zchat_mod_mute', 'zchat_mod_pin', 'zchat_mod_review_join', 'zchat_moment_add', 'zchat_msg_link',
    'zchat_my_avatar_anim', 'zchat_my_games', 'zchat_my_profile', 'zchat_my_questions', 'zchat_note_device', 'zchat_note_save',
    'zchat_passkey_remove', 'zchat_pf_extras', 'zchat_pf_tz_set', 'zchat_photo_find', 'zchat_photos_set', 'zchat_pin_message',
    'zchat_pin_post', 'zchat_place_feed', 'zchat_plan_cancel', 'zchat_plan_create', 'zchat_plan_edit', 'zchat_plan_get',
    'zchat_plan_list', 'zchat_plan_push', 'zchat_plan_remind', 'zchat_plan_room_open', 'zchat_playlist_add', 'zchat_poll_counts',
    'zchat_poll_finish', 'zchat_post_count', 'zchat_post_event', 'zchat_post_insights', 'zchat_post_place', 'zchat_post_poll_vote',
    'zchat_post_view_counts', 'zchat_post_views', 'zchat_profile_view', 'zchat_push_forget', 'zchat_push_save', 'zchat_qr_claim',
    'zchat_qr_devices', 'zchat_qr_logout', 'zchat_rec_deny', 'zchat_rec_for_me', 'zchat_rec_friend_code', 'zchat_rec_owner_cancel',
    'zchat_recap', 'zchat_record_game', 'zchat_restore_streak', 'zchat_review_join', 'zchat_revoke_device', 'zchat_roll',
    'zchat_room_join', 'zchat_room_kick', 'zchat_room_list', 'zchat_room_lobby', 'zchat_room_open', 'zchat_room_ping',
    'zchat_room_quick', 'zchat_room_set', 'zchat_room_set_enabled', 'zchat_room_state', 'zchat_room_sync', 'zchat_safety_end',
    'zchat_safety_extend', 'zchat_safety_loc', 'zchat_safety_start', 'zchat_santa_cancel', 'zchat_santa_join', 'zchat_santa_pick',
    'zchat_santa_start', 'zchat_santas', 'zchat_score', 'zchat_search_pref_get', 'zchat_search_pref_set', 'zchat_sender_signals',
    'zchat_session_claim', 'zchat_session_state', 'zchat_set_member_title', 'zchat_shared_add', 'zchat_shared_create', 'zchat_shared_remove',
    'zchat_shared_update', 'zchat_shop_list', 'zchat_shop_owners', 'zchat_shop_popular', 'zchat_snooze', 'zchat_spend_allow',
    'zchat_spend_limit', 'zchat_spend_limit_set', 'zchat_spend_pin', 'zchat_status_set', 'zchat_story_of_us', 'zchat_story_results',
    'zchat_streaks', 'zchat_streaks2', 'zchat_submit_score', 'zchat_tag_decide', 'zchat_tagged_posts', 'zchat_time_create',
    'zchat_time_pick', 'zchat_time_vote', 'zchat_tip_post', 'zchat_tip_summary', 'zchat_trade_cards', 'zchat_trade_offer',
    'zchat_trade_respond', 'zchat_trade_setup', 'zchat_trending_tags', 'zchat_trusted_list', 'zchat_trusted_set', 'zchat_unsnooze',
    'zchat_verified_gift_start', 'zchat_visit_profile', 'zchat_voice_intro_clear', 'zchat_voice_intro_say', 'zchat_voice_intro_set', 'zchat_wallet',
    'zchat_watch_add', 'zchat_watch_mark', 'zchat_watch_react', 'zchat_watch_remove', 'zchat_xw_get', 'zchat_xw_put',
    'zchat_zap_call', 'zchat_zap_catch', 'zchat_zap_draw', 'zchat_zap_end', 'zchat_zap_hand', 'zchat_zap_join',
    'zchat_zap_nudge', 'zchat_zap_pass', 'zchat_zap_play', 'zchat_zap_start', 'zchat_zapm_catch', 'zchat_zapm_draw',
    'zchat_zapm_nudge', 'zchat_zapm_pass', 'zchat_zapm_play'
  ]::text[];
  fn_srv text[] := array[
    'bot_find_knowledge', 'ga2_chain_srv', 'zchat_ai_bump', 'zchat_aiphoto_take', 'zchat_birthday_targets', 'zchat_character_bump',
    'zchat_character_mark_checked', 'zchat_claim_job', 'zchat_credit_order', 'zchat_digest_due', 'zchat_digest_mark', 'zchat_email_unsub',
    'zchat_export_begin', 'zchat_export_done', 'zchat_link_lookup', 'zchat_link_store', 'zchat_moment_targets', 'zchat_passkey_add',
    'zchat_passkey_challenge_new', 'zchat_passkey_challenge_take', 'zchat_passkey_fail', 'zchat_passkey_ids', 'zchat_passkey_lookup', 'zchat_passkey_used',
    'zchat_photo_begin', 'zchat_photo_claim', 'zchat_photo_done', 'zchat_photo_labels_put', 'zchat_photo_labels_todo', 'zchat_rec_cancel',
    'zchat_rec_check', 'zchat_rec_email', 'zchat_rec_mark_done', 'zchat_rec_ready', 'zchat_rec_start', 'zchat_rec_status',
    'zchat_refund_order', 'zchat_session_state_for', 'zchat_set_verified_sub', 'zchat_signup_precheck', 'zchat_verified_gift_paid', 'zchat_verified_gift_refund'
  ]::text[];
  tbls text[] := array[
    'achievements', 'admins', 'ai_character_messages', 'ai_characters', 'ai_flash_decks', 'ai_images',
    'ai_link_cache', 'ai_photo_jobs', 'ai_practice_sessions', 'album_photos', 'albums', 'birthday_gifts',
    'birthdays', 'blocks', 'bot_knowledge', 'broadcast_lists', 'call_hides', 'calls',
    'channel_follows', 'channel_post_likes', 'channel_posts', 'channels', 'chat_accepts', 'chat_imports',
    'chat_locks', 'client_errors', 'close_friends', 'coin_ledger', 'community_members', 'contact_nicknames',
    'conversations', 'creator_members', 'creator_packs', 'creator_settings', 'creator_shoutouts', 'device_keys',
    'drop_reminders', 'drops', 'follows', 'gift_codes', 'group_entry_payments', 'group_join_requests',
    'group_members', 'groups', 'hidden_messages', 'highlight_items', 'highlight_likes', 'highlights',
    'imported_messages', 'mails', 'message_likes', 'message_reports', 'messages', 'notes',
    'notifications', 'passkeys', 'photo_labels', 'post_comment_likes', 'post_comments', 'post_likes',
    'post_tips', 'posts', 'privacy_allow', 'profile_visits', 'profiles', 'push_subscriptions',
    'report_queue', 'reports', 'restricted_users', 'saved_collections', 'saved_looks', 'saved_messages',
    'saved_posts', 'scheduled_messages', 'self_aliases', 'shop_listings', 'spam_verdicts', 'sticker_favorites',
    'sticker_packs', 'stories', 'story_likes', 'story_responses', 'story_views', 'tag_follows',
    'user_devices', 'user_locations', 'user_restrictions', 'user_rewards', 'user_stickers', 'verified_gift_orders',
    'wallets', 'wishlist_items', 'zchat_app_prefs', 'zchat_chat_marks', 'zchat_chat_note_versions', 'zchat_chat_notes',
    'zchat_cl_live', 'zchat_cm_waiting', 'zchat_data_exports', 'zchat_drafts', 'zchat_grp_as_group', 'zchat_grp_emoji',
    'zchat_grp_hidden', 'zchat_grp_join_answers', 'zchat_grp_keywords', 'zchat_grp_links', 'zchat_grp_log', 'zchat_grp_pending',
    'zchat_grp_rules_ok', 'zchat_guestbook_prefs', 'zchat_post_poll_counts', 'zchat_post_poll_votes', 'zchat_post_tags', 'zchat_problem_reports',
    'zchat_safety_timers', 'zchat_saved_folders', 'zchat_search_prefs', 'zchat_shared_members', 'zchat_shared_stories', 'zchat_snoozes',
    'zchat_story_list_members', 'zchat_story_lists', 'zchat_tag_settings', 'zchat_time_polls', 'zchat_time_votes', 'zchat_tones',
    'zchat_trusted_friends', 'zchat_watch_items', 'zchat_watch_reacts'
  ]::text[];
  cols text[] := array[
    'achievements.earned_at', 'achievements.key', 'achievements.user_id', 'admins.user_id', 'ai_character_messages.character_id',
    'ai_character_messages.content', 'ai_character_messages.created_at', 'ai_character_messages.id', 'ai_character_messages.role', 'ai_character_messages.user_id',
    'ai_characters.chats', 'ai_characters.greeting', 'ai_characters.held', 'ai_characters.id', 'ai_characters.name',
    'ai_characters.owner_id', 'ai_characters.personality', 'ai_characters.published_at', 'ai_characters.updated_at', 'ai_characters.visibility',
    'ai_flash_decks.cards', 'ai_flash_decks.id', 'ai_flash_decks.known', 'ai_flash_decks.owner_id', 'ai_flash_decks.source',
    'ai_flash_decks.title', 'ai_flash_decks.updated_at', 'ai_images.created_at', 'ai_images.done_at', 'ai_images.error',
    'ai_images.id', 'ai_images.kind', 'ai_images.prompt', 'ai_images.ratio', 'ai_images.status',
    'ai_images.style', 'ai_images.url', 'ai_images.user_id', 'ai_link_cache.created_at', 'ai_link_cache.ok',
    'ai_link_cache.points', 'ai_link_cache.reason', 'ai_link_cache.title', 'ai_link_cache.url', 'ai_link_cache.url_hash',
    'ai_photo_jobs.created_at', 'ai_photo_jobs.done_at', 'ai_photo_jobs.error', 'ai_photo_jobs.id', 'ai_photo_jobs.kind',
    'ai_photo_jobs.prompt', 'ai_photo_jobs.status', 'ai_photo_jobs.style', 'ai_photo_jobs.urls', 'ai_photo_jobs.user_id',
    'ai_practice_sessions.created_at', 'ai_practice_sessions.good', 'ai_practice_sessions.id', 'ai_practice_sessions.level', 'ai_practice_sessions.next',
    'ai_practice_sessions.topic', 'ai_practice_sessions.user_id', 'album_photos.album_id', 'album_photos.created_at', 'album_photos.id',
    'album_photos.media_type', 'album_photos.media_url', 'album_photos.user_id', 'albums.chat_key', 'albums.created_at',
    'albums.created_by', 'albums.id', 'albums.title', 'birthday_gifts.coins', 'birthday_gifts.deliver_at',
    'birthday_gifts.from_id', 'birthday_gifts.held', 'birthday_gifts.id', 'birthday_gifts.item_key', 'birthday_gifts.kind',
    'birthday_gifts.md', 'birthday_gifts.note', 'birthday_gifts.pay', 'birthday_gifts.price', 'birthday_gifts.status',
    'birthday_gifts.to_id', 'birthday_gifts.wrap', 'birthdays.md', 'birthdays.show', 'birthdays.updated_at',
    'birthdays.user_id', 'blocks.blocked_id', 'blocks.blocker_id', 'blocks.created_at', 'bot_knowledge.created_at',
    'bot_knowledge.fact', 'bot_knowledge.id', 'bot_knowledge.taught_by', 'bot_knowledge.topic', 'broadcast_lists.created_at',
    'broadcast_lists.id', 'broadcast_lists.owner_id', 'call_hides.call_id', 'call_hides.user_id', 'calls.answered_at',
    'calls.callee_id', 'calls.caller_id', 'calls.created_at', 'calls.ended_at', 'calls.group_id',
    'calls.id', 'calls.kind', 'calls.link_code', 'calls.status', 'calls.title',
    'channel_follows.channel_id', 'channel_follows.muted', 'channel_follows.user_id', 'channel_post_likes.post_id', 'channel_post_likes.user_id',
    'channel_posts.author_id', 'channel_posts.channel_id', 'channel_posts.content', 'channel_posts.created_at', 'channel_posts.id',
    'channel_posts.media_type', 'channel_posts.media_url', 'channels.avatar', 'channels.bio', 'channels.id',
    'channels.name', 'channels.owner_id', 'chat_accepts.other_id', 'chat_accepts.user_id', 'chat_imports.count',
    'chat_imports.created_at', 'chat_imports.first_at', 'chat_imports.group_id', 'chat_imports.id', 'chat_imports.importer_id',
    'chat_imports.last_at', 'chat_imports.me_name', 'chat_imports.peer_id', 'chat_imports.status', 'chat_imports.title',
    'chat_locks.conversation_id', 'chat_locks.owner_id', 'chat_locks.pin_hash', 'client_errors.created_at', 'client_errors.extra',
    'client_errors.id', 'client_errors.message', 'client_errors.stack', 'client_errors.ua', 'client_errors.url',
    'client_errors.version', 'close_friends.created_at', 'close_friends.friend_id', 'close_friends.owner_id', 'coin_ledger.created_at',
    'coin_ledger.delta', 'coin_ledger.id', 'coin_ledger.note', 'coin_ledger.other_id', 'coin_ledger.reason',
    'coin_ledger.user_id', 'community_members.community_id', 'community_members.joined_at', 'community_members.role', 'community_members.user_id',
    'contact_nicknames.contact_id', 'contact_nicknames.nickname', 'contact_nicknames.owner_id', 'conversations.id', 'conversations.last_message',
    'conversations.last_message_at', 'conversations.last_sender_id', 'conversations.muted_until_a', 'conversations.muted_until_b', 'conversations.user_a',
    'conversations.user_b', 'creator_members.creator_id', 'creator_members.started_at', 'creator_members.status', 'creator_packs.created_at',
    'creator_packs.owner_id', 'creator_settings.msg_price', 'creator_settings.user_id', 'device_keys.fp', 'device_keys.pub',
    'device_keys.updated_at', 'device_keys.user_id', 'drop_reminders.drop_id', 'drop_reminders.user_id', 'drops.blurb',
    'drops.ends_at', 'drops.id', 'drops.item_key', 'drops.kind', 'drops.price',
    'drops.starts_at', 'drops.title', 'follows.created_at', 'follows.follower_id', 'follows.following_id',
    'follows.status', 'gift_codes.created_at', 'group_entry_payments.group_id', 'group_entry_payments.status', 'group_entry_payments.user_id',
    'group_join_requests.created_at', 'group_join_requests.group_id', 'group_join_requests.reviewed_at', 'group_join_requests.reviewed_by', 'group_join_requests.status',
    'group_join_requests.user_id', 'group_members.added_by', 'group_members.group_id', 'group_members.muted', 'group_members.nick',
    'group_members.notify_muted_until', 'group_members.role', 'group_members.user_id', 'groups.avatar', 'groups.created_by',
    'groups.id', 'groups.invite_code', 'groups.name', 'hidden_messages.created_at', 'hidden_messages.message_id',
    'hidden_messages.user_id', 'highlight_items.created_at', 'highlight_items.highlight_id', 'highlight_items.id', 'highlight_items.media_type',
    'highlight_items.media_url', 'highlight_items.user_id', 'highlight_likes.highlight_id', 'highlight_likes.user_id', 'highlights.cover_meta',
    'highlights.cover_type', 'highlights.cover_url', 'highlights.created_at', 'highlights.id', 'highlights.title',
    'highlights.user_id', 'imported_messages.body', 'imported_messages.import_id', 'imported_messages.seq', 'mails.created_at',
    'mails.id', 'mails.read', 'mails.recipient_id', 'message_likes.emoji', 'message_likes.message_id',
    'message_likes.super_key', 'message_likes.user_id', 'message_reports.message_id', 'message_reports.reason', 'message_reports.reporter_id',
    'messages.bot_reply', 'messages.client_id', 'messages.content', 'messages.created_at', 'messages.deleted',
    'messages.delivered', 'messages.edited', 'messages.expires_at', 'messages.group_id', 'messages.id',
    'messages.media_url', 'messages.overlay_url', 'messages.read', 'messages.receiver_id', 'messages.reply_to_id',
    'messages.sender_id', 'messages.story_id', 'messages.suggestions', 'messages.trim_end', 'messages.trim_start',
    'messages.type', 'notes.expires_at', 'notes.user_id', 'notifications.actor_id', 'notifications.created_at',
    'notifications.id', 'notifications.kind', 'notifications.meta', 'notifications.text', 'notifications.user_id',
    'passkeys.created_at', 'passkeys.device_name', 'passkeys.id', 'passkeys.last_used_at', 'passkeys.user_id',
    'photo_labels.labels', 'photo_labels.message_id', 'post_comment_likes.comment_id', 'post_comment_likes.user_id', 'post_comments.content',
    'post_comments.created_at', 'post_comments.id', 'post_comments.post_id', 'post_comments.user_id', 'post_likes.created_at',
    'post_likes.post_id', 'post_likes.user_id', 'post_tips.amount', 'post_tips.post_id', 'post_tips.tipper_id',
    'posts.alt_texts', 'posts.archived_at', 'posts.caption', 'posts.captions', 'posts.created_at',
    'posts.id', 'posts.kind', 'posts.media_type', 'posts.media_url', 'posts.media_urls',
    'posts.overlay_url', 'posts.pinned_at', 'posts.pinned_comment_id', 'posts.poll', 'posts.remix_of',
    'posts.remix_ok', 'posts.sensitive', 'posts.user_id', 'posts.voice', 'privacy_allow.scope',
    'privacy_allow.user_id', 'privacy_allow.viewer_id', 'profile_visits.n', 'profile_visits.profile_id', 'profile_visits.viewed_at',
    'profile_visits.viewer_id', 'profiles.ama_on', 'profiles.avatar', 'profiles.avatar_cfg', 'profiles.avatar_frame',
    'profiles.banned', 'profiles.chat_lock_enabled', 'profiles.chat_lock_hash', 'profiles.cover_anim', 'profiles.cover_url',
    'profiles.created_at', 'profiles.custom_badge', 'profiles.device_id', 'profiles.hide_activity', 'profiles.id',
    'profiles.interests', 'profiles.is_bot', 'profiles.is_deleted', 'profiles.is_private', 'profiles.last_seen',
    'profiles.name', 'profiles.name_style', 'profiles.nameplate', 'profiles.profile_theme', 'profiles.song',
    'profiles.status_emoji', 'profiles.status_text', 'profiles.status_until', 'profiles.username', 'profiles.verified',
    'profiles.verified_seen', 'profiles.verified_until', 'profiles.visitors_on', 'push_subscriptions.auth', 'push_subscriptions.endpoint',
    'push_subscriptions.p256dh', 'push_subscriptions.user_id', 'reports.reason', 'reports.reported_id', 'reports.reporter_id',
    'restricted_users.owner_id', 'restricted_users.user_id', 'saved_collections.created_at', 'saved_collections.id', 'saved_collections.name',
    'saved_collections.user_id', 'saved_looks.slot', 'saved_looks.user_id', 'saved_messages.chat_label', 'saved_messages.content',
    'saved_messages.created_at', 'saved_messages.folder_id', 'saved_messages.from_name', 'saved_messages.id', 'saved_messages.kind',
    'saved_messages.media_url', 'saved_messages.source_message_id', 'saved_messages.user_id', 'saved_posts.collection_id', 'saved_posts.created_at',
    'saved_posts.post_id', 'saved_posts.user_id', 'scheduled_messages.content', 'scheduled_messages.id', 'scheduled_messages.send_at',
    'scheduled_messages.sender_id', 'self_aliases.alias', 'self_aliases.user_id', 'self_aliases.viewer_id', 'shop_listings.created_at',
    'shop_listings.id', 'shop_listings.owner_id', 'shop_listings.sold_out', 'spam_verdicts.other_id', 'spam_verdicts.updated_at',
    'spam_verdicts.user_id', 'spam_verdicts.verdict', 'sticker_favorites.sticker_key', 'sticker_favorites.user_id', 'sticker_packs.created_at',
    'sticker_packs.id', 'sticker_packs.owner_id', 'stories.audience', 'stories.caption', 'stories.created_at',
    'stories.expires_at', 'stories.id', 'stories.media_type', 'stories.media_url', 'stories.mentions',
    'stories.overlay_url', 'stories.repost_label', 'stories.repost_of', 'stories.shared_id', 'stories.user_id',
    'story_likes.story_id', 'story_likes.user_id', 'story_responses.created_at', 'story_responses.story_id', 'story_views.story_id',
    'story_views.viewer_id', 'tag_follows.tag', 'tag_follows.user_id', 'user_devices.device_id', 'user_devices.last_active',
    'user_devices.revoked', 'user_devices.user_id', 'user_locations.acc', 'user_locations.lat', 'user_locations.lng',
    'user_locations.share', 'user_locations.updated_at', 'user_locations.user_id', 'user_restrictions.lifted', 'user_restrictions.until',
    'user_restrictions.user_id', 'user_rewards.expires_at', 'user_rewards.granted_at', 'user_rewards.id', 'user_rewards.kind',
    'user_rewards.reward_key', 'user_rewards.seen', 'user_rewards.user_id', 'user_stickers.created_at', 'user_stickers.id',
    'user_stickers.url', 'user_stickers.user_id', 'verified_gift_orders.id', 'verified_gift_orders.status', 'wallets.coins',
    'wallets.free_bubbles', 'wallets.free_sets', 'wallets.last_claim', 'wallets.streak', 'wallets.updated_at',
    'wallets.user_id', 'wishlist_items.created_at', 'wishlist_items.item_key', 'wishlist_items.kind', 'wishlist_items.user_id',
    'zchat_app_prefs.user_id', 'zchat_chat_marks.actor_id', 'zchat_chat_marks.chat_key', 'zchat_chat_marks.created_at', 'zchat_chat_marks.kind',
    'zchat_chat_marks.message_id', 'zchat_chat_marks.user_id', 'zchat_chat_note_versions.body', 'zchat_chat_note_versions.chat_key', 'zchat_chat_note_versions.created_at',
    'zchat_chat_note_versions.edited_by', 'zchat_chat_note_versions.id', 'zchat_chat_note_versions.updated_at', 'zchat_chat_note_versions.version', 'zchat_chat_notes.body',
    'zchat_chat_notes.chat_key', 'zchat_chat_notes.updated_at', 'zchat_chat_notes.updated_by', 'zchat_chat_notes.version', 'zchat_cl_live.beat_at',
    'zchat_cl_live.call_id', 'zchat_cl_live.can_move', 'zchat_cl_live.dev', 'zchat_cl_live.group_id', 'zchat_cl_live.kind',
    'zchat_cl_live.mode', 'zchat_cl_live.move_at', 'zchat_cl_live.move_to', 'zchat_cl_live.peer_id', 'zchat_cl_live.started_at',
    'zchat_cl_live.title', 'zchat_cl_live.user_id', 'zchat_cm_waiting.client_id', 'zchat_cm_waiting.content', 'zchat_cm_waiting.created_at',
    'zchat_cm_waiting.id', 'zchat_cm_waiting.receiver_id', 'zchat_data_exports.created_at', 'zchat_data_exports.error', 'zchat_data_exports.expires_at',
    'zchat_data_exports.id', 'zchat_data_exports.parts', 'zchat_data_exports.status', 'zchat_data_exports.updated_at', 'zchat_data_exports.user_id',
    'zchat_drafts.data', 'zchat_drafts.id', 'zchat_drafts.kind', 'zchat_drafts.thumb', 'zchat_drafts.updated_at',
    'zchat_drafts.user_id', 'zchat_grp_as_group.message_id', 'zchat_grp_as_group.sender_id', 'zchat_grp_emoji.animated', 'zchat_grp_emoji.created_at',
    'zchat_grp_emoji.group_id', 'zchat_grp_emoji.id', 'zchat_grp_emoji.name', 'zchat_grp_emoji.url', 'zchat_grp_hidden.created_at',
    'zchat_grp_hidden.group_id', 'zchat_grp_hidden.hidden_id', 'zchat_grp_hidden.id', 'zchat_grp_hidden.user_id', 'zchat_grp_join_answers.answers',
    'zchat_grp_join_answers.group_id', 'zchat_grp_join_answers.user_id', 'zchat_grp_keywords.group_id', 'zchat_grp_keywords.user_id', 'zchat_grp_keywords.words',
    'zchat_grp_links.created_at', 'zchat_grp_links.group_id', 'zchat_grp_log.action', 'zchat_grp_log.actor_id', 'zchat_grp_log.created_at',
    'zchat_grp_log.detail', 'zchat_grp_log.group_id', 'zchat_grp_log.id', 'zchat_grp_log.target_id', 'zchat_grp_pending.client_id',
    'zchat_grp_pending.created_at', 'zchat_grp_pending.group_id', 'zchat_grp_pending.id', 'zchat_grp_pending.payload', 'zchat_grp_pending.sender_id',
    'zchat_grp_pending.status', 'zchat_grp_rules_ok.group_id', 'zchat_grp_rules_ok.user_id', 'zchat_grp_rules_ok.version', 'zchat_guestbook_prefs.updated_at',
    'zchat_guestbook_prefs.user_id', 'zchat_guestbook_prefs.who', 'zchat_post_poll_counts.counts', 'zchat_post_poll_counts.post_id', 'zchat_post_poll_counts.total',
    'zchat_post_poll_votes.choice', 'zchat_post_poll_votes.post_id', 'zchat_post_tags.created_at', 'zchat_post_tags.id', 'zchat_post_tags.media_idx',
    'zchat_post_tags.post_id', 'zchat_post_tags.status', 'zchat_post_tags.tagger_id', 'zchat_post_tags.user_id', 'zchat_post_tags.x',
    'zchat_post_tags.y', 'zchat_problem_reports.body', 'zchat_problem_reports.device', 'zchat_problem_reports.kind', 'zchat_problem_reports.lab',
    'zchat_problem_reports.shots', 'zchat_problem_reports.user_id', 'zchat_safety_timers.friends', 'zchat_safety_timers.id', 'zchat_safety_timers.owner_id',
    'zchat_safety_timers.started_at', 'zchat_safety_timers.status', 'zchat_saved_folders.created_at', 'zchat_saved_folders.id', 'zchat_saved_folders.name',
    'zchat_saved_folders.user_id', 'zchat_search_prefs.user_id', 'zchat_search_prefs.visible', 'zchat_shared_members.added_by', 'zchat_shared_members.created_at',
    'zchat_shared_members.shared_id', 'zchat_shared_members.user_id', 'zchat_shared_stories.created_at', 'zchat_shared_stories.expires_at', 'zchat_shared_stories.id',
    'zchat_shared_stories.keep', 'zchat_shared_stories.owner_id', 'zchat_snoozes.chat_key', 'zchat_snoozes.prev_mute', 'zchat_snoozes.until',
    'zchat_snoozes.user_id', 'zchat_story_list_members.list_id', 'zchat_story_list_members.member_id', 'zchat_story_list_members.owner_id', 'zchat_story_lists.created_at',
    'zchat_story_lists.id', 'zchat_story_lists.name', 'zchat_story_lists.owner_id', 'zchat_tag_settings.auto', 'zchat_tag_settings.updated_at',
    'zchat_tag_settings.user_id', 'zchat_time_polls.id', 'zchat_time_votes.chat_key', 'zchat_time_votes.poll_id', 'zchat_time_votes.slots',
    'zchat_time_votes.updated_at', 'zchat_time_votes.user_id', 'zchat_tones.created_at', 'zchat_tones.id', 'zchat_tones.name',
    'zchat_tones.path', 'zchat_tones.secs', 'zchat_tones.user_id', 'zchat_trusted_friends.added_at', 'zchat_trusted_friends.friend_id',
    'zchat_trusted_friends.owner_id', 'zchat_watch_items.chat_key', 'zchat_watch_items.created_at', 'zchat_watch_items.removed_at', 'zchat_watch_reacts.chat_key',
    'zchat_watch_reacts.emoji', 'zchat_watch_reacts.item_id', 'zchat_watch_reacts.user_id'
  ]::text[];
begin
  return jsonb_build_object('fn_app', to_jsonb(fn_app), 'fn_srv', to_jsonb(fn_srv), 'tables', to_jsonb(tbls), 'cols', to_jsonb(cols));
end $$;
revoke all on function public.zchat_db_manifest() from public, anon, authenticated;

create or replace function public.zchat_admin_db_check()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  man jsonb := public.zchat_db_manifest();
  fn_app text[] := array(select jsonb_array_elements_text(man -> 'fn_app'));
  fn_srv text[] := array(select jsonb_array_elements_text(man -> 'fn_srv'));
  tbls text[] := array(select jsonb_array_elements_text(man -> 'tables'));
  cols text[] := array(select jsonb_array_elements_text(man -> 'cols'));
  out_ jsonb;
  x jsonb;
begin
  if auth.uid() is null or not coalesce(public.zchat_is_admin_id(auth.uid()), false) then
    return jsonb_build_object('ok', false, 'reason', 'Only admins can run this check.');
  end if;
  select coalesce(jsonb_agg(f order by f), '[]'::jsonb) into x from unnest(fn_app || fn_srv) f
    where not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = f);
  out_ := jsonb_build_object('functions', x);
  select coalesce(jsonb_agg(f order by f), '[]'::jsonb) into x from unnest(fn_app) f
    where exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = f)
      and not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = f and has_function_privilege('authenticated', p.oid, 'execute'));
  out_ := out_ || jsonb_build_object('locked', x);
  select coalesce(jsonb_agg(t order by t), '[]'::jsonb) into x from unnest(tbls) t
    where to_regclass(format('public.%I', t)) is null;
  out_ := out_ || jsonb_build_object('tables', x);
  select coalesce(jsonb_agg(c order by c), '[]'::jsonb) into x from unnest(cols) c
    where to_regclass(format('public.%I', split_part(c, '.', 1))) is not null
      and not exists (
        select 1 from pg_attribute a
        where a.attrelid = to_regclass(format('public.%I', split_part(c, '.', 1)))
          and a.attname = split_part(c, '.', 2) and a.attnum > 0 and not a.attisdropped
      );
  out_ := out_ || jsonb_build_object('columns', x);
  begin
    if to_regclass('storage.buckets') is not null then
      select coalesce(jsonb_agg(b order by b), '[]'::jsonb) into x from unnest(array['chat-media', 'chat-private', 'zchat-reports']) b
        where not exists (select 1 from storage.buckets sb where sb.id = b);
      out_ := out_ || jsonb_build_object('buckets', x);
      select coalesce(jsonb_agg(k order by k), '[]'::jsonb) into x from (values ('chat-media', 'INSERT'), ('chat-private', 'INSERT'), ('chat-private', 'SELECT'), ('chat-private', 'DELETE')) v(b, cmd)
        cross join lateral (select v.b || ' ' || lower(v.cmd) as k) kk
        where not exists (
          select 1 from pg_policies p
          where p.schemaname = 'storage' and p.tablename = 'objects' and p.cmd in (v.cmd, 'ALL')
            and p.policyname <> 'zchat shared game photos'
            and (coalesce(p.with_check, '') || ' ' || coalesce(p.qual, '')) like '%' || v.b || '%'
        );
      out_ := out_ || jsonb_build_object('storage', x);
    end if;
  exception when others then
    out_ := out_ || jsonb_build_object('storage_error', sqlerrm);
  end;
  return out_ || jsonb_build_object('ok', true, 'checked', jsonb_build_object('functions', cardinality(fn_app) + cardinality(fn_srv), 'tables', cardinality(tbls), 'columns', cardinality(cols)));
end $$;
revoke all on function public.zchat_admin_db_check() from public, anon;
grant execute on function public.zchat_admin_db_check() to authenticated;

do $mv$
declare
  r record;
  want text[] := array(select jsonb_array_elements_text(public.zchat_db_manifest() -> 'fn_app') union select jsonb_array_elements_text(public.zchat_db_manifest() -> 'fn_srv'));
  n integer := 0;
begin
  if to_regclass('zchat_private.moved_functions') is null then
    return;
  end if;
  for r in select m.name, m.args from zchat_private.moved_functions m where m.name = any (want) loop
    if exists (select 1 from pg_proc p where p.pronamespace = 'zchat_private'::regnamespace and p.proname = r.name and pg_get_function_identity_arguments(p.oid) = r.args)
       and not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = r.name and pg_get_function_identity_arguments(p.oid) = r.args) then
      execute format('alter function zchat_private.%I(%s) set schema public', r.name, r.args);
      delete from zchat_private.moved_functions where name = r.name and args = r.args;
      n := n + 1;
    end if;
  end loop;
  if n > 0 then
    raise notice 'zchat: brought back % functions the app uses', n;
  end if;
end $mv$;

do $st$
declare
  rd text := '';
  has_reader boolean := false;
  reader text := null;
begin
  if to_regclass('storage.objects') is null or to_regclass('storage.buckets') is null then
    return;
  end if;
  insert into storage.buckets (id, name, public) values ('chat-media', 'chat-media', true) on conflict (id) do nothing;
  if not exists (select 1 from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and p.cmd in ('INSERT', 'ALL')
      and (coalesce(p.with_check, '') || ' ' || coalesce(p.qual, '')) like '%chat-media%') then
    execute $p$create policy "zchat media own upload" on storage.objects for insert to authenticated with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
  if not exists (select 1 from storage.buckets b where b.id = 'chat-private') then
    return;
  end if;
  if not exists (select 1 from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and p.cmd in ('INSERT', 'ALL')
      and (coalesce(p.with_check, '') || ' ' || coalesce(p.qual, '')) like '%chat-private%') then
    execute $p$create policy "zchat private own upload" on storage.objects for insert to authenticated with check (bucket_id = 'chat-private' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
  if not exists (select 1 from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and p.cmd in ('DELETE', 'ALL')
      and (coalesce(p.with_check, '') || ' ' || coalesce(p.qual, '')) like '%chat-private%') then
    execute $p$create policy "zchat private own delete" on storage.objects for delete to authenticated using (bucket_id = 'chat-private' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
  if not exists (select 1 from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and p.cmd in ('SELECT', 'ALL')
      and p.policyname <> 'zchat shared game photos'
      and (coalesce(p.with_check, '') || ' ' || coalesce(p.qual, '')) like '%chat-private%') then
    select n.nspname into reader from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where p.proname = 'zchat_can_read_media' and n.nspname in ('public', 'zchat_private') order by (n.nspname = 'public') desc limit 1;
    if reader is not null then
      execute format($p$create policy "zchat private read" on storage.objects for select to authenticated using (bucket_id = 'chat-private' and ((storage.foldername(name))[1] = (select auth.uid())::text or %I.zchat_can_read_media(name)))$p$, reader);
    else
      execute $p$create policy "zchat private read" on storage.objects for select to authenticated using (bucket_id = 'chat-private' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    end if;
  end if;
exception when others then
  raise notice 'zchat: storage rules were not changed: %', sqlerrm;
end $st$;

do $cv$
declare
  r record;
begin
  for r in
    select c.table_name, c.column_name from information_schema.columns c
    where c.table_schema = 'public'
      and ((c.table_name = 'conversations' and c.column_name in ('wallpaper_a', 'wallpaper_b')) or (c.table_name = 'groups' and c.column_name = 'wallpaper'))
      and c.data_type = 'character varying' and coalesce(c.character_maximum_length, 1000) < 600
  loop
    execute format('alter table public.%I alter column %I type text', r.table_name, r.column_name);
  end loop;
  if to_regclass('public.conversations') is not null
     and exists (select 1 from pg_class t where t.oid = 'public.conversations'::regclass and t.relrowsecurity)
     and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'conversations' and p.cmd in ('UPDATE', 'ALL')) then
    execute 'create policy "zchat chat members update" on public.conversations for update to authenticated using ((select auth.uid()) in (user_a, user_b)) with check ((select auth.uid()) in (user_a, user_b))';
  end if;
exception when others then
  raise notice 'zchat: chat wallpaper columns were not changed: %', sqlerrm;
end $cv$;

notify pgrst, 'reload schema';
commit;
