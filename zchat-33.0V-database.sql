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
