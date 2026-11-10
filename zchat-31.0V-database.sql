begin;

create table if not exists public.zchat_group_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (user_id, group_id)
);
alter table public.zchat_group_reads enable row level security;
revoke all on public.zchat_group_reads from public, anon, authenticated;
grant select on public.zchat_group_reads to authenticated;
grant all on public.zchat_group_reads to service_role;
drop policy if exists "zchat group reads own" on public.zchat_group_reads;
create policy "zchat group reads own" on public.zchat_group_reads for select to authenticated using (user_id = auth.uid());

create or replace function public.zchat_group_read_mark(p_group uuid, p_at timestamptz default null)
returns timestamptz
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := auth.uid();
  t timestamptz := least(coalesce(p_at, now()), now() + interval '1 minute');
  out_t timestamptz;
begin
  if me is null or p_group is null then
    return null;
  end if;
  if not exists (select 1 from public.group_members gm where gm.group_id = p_group and gm.user_id = me) then
    return null;
  end if;
  insert into public.zchat_group_reads as r (user_id, group_id, read_at)
  values (me, p_group, t)
  on conflict (user_id, group_id) do update set read_at = greatest(r.read_at, excluded.read_at)
  returning r.read_at into out_t;
  return out_t;
end $$;
revoke all on function public.zchat_group_read_mark(uuid, timestamptz) from public, anon;
grant execute on function public.zchat_group_read_mark(uuid, timestamptz) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'zchat_group_reads') then
      execute 'alter publication supabase_realtime add table public.zchat_group_reads';
    end if;
    if to_regclass('public.zchat_dm_reads') is not null and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'zchat_dm_reads') then
      execute 'alter publication supabase_realtime add table public.zchat_dm_reads';
    end if;
  end if;
end $$;

CREATE OR REPLACE FUNCTION public.zchat_chat_list(p_reads jsonb DEFAULT NULL::jsonb, p_window integer DEFAULT 400, p_per integer DEFAULT 4)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  me uuid := auth.uid();
  win integer := least(greatest(coalesce(p_window, 400), 50), 600);
  per integer := least(greatest(coalesce(p_per, 4), 2), 20);
  reads jsonb := case when jsonb_typeof(p_reads) = 'object' then p_reads else '{}'::jsonb end;
  hid jsonb := '{}'::jsonb;
  out_convs jsonb;
  out_msgs jsonb;
  out_sent jsonb;
  out_profiles jsonb;
  out_nicks jsonb;
  out_aliases jsonb;
  out_unread jsonb;
  out_members jsonb;
  out_groups jsonb;
  out_gmsgs jsonb;
  out_gunread jsonb;
  out_gnames jsonb;
  out_locks jsonb;
  out_blocks jsonb;
  out_blocked_by jsonb;
  out_dmreads jsonb;
  out_greads jsonb := '{}'::jsonb;
begin
  if me is null then
    return jsonb_build_object('v', 1, 'ok', false);
  end if;
  if (select count(*) from jsonb_object_keys(reads)) > 500 then
    reads := '{}'::jsonb;
  end if;

  if to_regclass('public.hidden_messages') is not null then
    select coalesce(jsonb_object_agg(h.message_id, true), '{}'::jsonb) into hid
    from (select distinct h0.message_id from public.hidden_messages h0 where h0.user_id = me and h0.message_id not like 'chat:%' limit 20000) h;
  end if;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.last_message_at desc nulls first), '[]'::jsonb) into out_convs
  from public.conversations c
  where c.user_a = me or c.user_b = me;

  with mine as (
    select m.id, m.sender_id, m.receiver_id, m.type, m.content, m.deleted, m.created_at, m.read, m.delivered, m.story_id, m.expires_at, m.media_url
    from public.messages m
    where m.sender_id = me and m.group_id is null
    order by m.created_at desc
    limit win
  ), theirs as (
    select m.id, m.sender_id, m.receiver_id, m.type, m.content, m.deleted, m.created_at, m.read, m.delivered, m.story_id, m.expires_at, m.media_url
    from public.messages m
    where m.receiver_id = me and m.group_id is null and m.sender_id is distinct from me
    order by m.created_at desc
    limit win
  ), w as (
    select u.* from (select * from mine union all select * from theirs) u
    order by u.created_at desc
    limit win
  ), tagged as (
    select w.*,
      case when w.sender_id = me then w.receiver_id else w.sender_id end as other,
      (hid ? w.id::text) as is_hidden,
      (w.expires_at is not null and w.expires_at <= now()) as is_gone
    from w
  ), ranked as (
    select t.*,
      row_number() over (partition by t.other order by t.created_at desc, t.id desc) as rn_any,
      row_number() over (partition by t.other, (not t.is_hidden and not t.is_gone) order by t.created_at desc, t.id desc) as rn_ok
    from tagged t
    where t.other is not null
  )
  select
    coalesce(jsonb_agg(
      jsonb_strip_nulls(jsonb_build_object('id', r.id, 'sender_id', r.sender_id, 'receiver_id', r.receiver_id, 'type', r.type, 'content', r.content,
        'deleted', r.deleted, 'created_at', r.created_at, 'read', r.read, 'delivered', r.delivered, 'story_id', r.story_id,
        'expires_at', r.expires_at,
        'media_url', case when r.media_url ~* '^https://[a-z0-9.]*giphy\.com/' then r.media_url end,
        'hid', case when r.is_hidden then true end))
      order by r.created_at desc
    ) filter (where r.rn_any = 1 or (not r.is_hidden and not r.is_gone and r.rn_ok <= per)), '[]'::jsonb),
    coalesce(jsonb_agg(distinct r.other) filter (where r.sender_id = me), '[]'::jsonb)
  into out_msgs, out_sent
  from ranked r;

  out_profiles := public.zchat_profile_view(array(
    select distinct case when c.user_a = me then c.user_b else c.user_a end
    from public.conversations c
    where c.user_a = me or c.user_b = me
  ));

  if to_regclass('public.contact_nicknames') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(n)), ''[]''::jsonb) from public.contact_nicknames n where n.owner_id = $1' into out_nicks using me;
  end if;
  if to_regclass('public.self_aliases') is not null then
    execute 'select coalesce(jsonb_agg(to_jsonb(a)), ''[]''::jsonb) from public.self_aliases a where a.viewer_id = $1' into out_aliases using me;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', u.id, 'sender_id', u.sender_id)), '[]'::jsonb) into out_unread
  from (
    select m.id, m.sender_id
    from public.messages m
    where m.receiver_id = me and m.group_id is null and m.read = false and m.deleted is not true
      and not exists (select 1 from public.zchat_dm_reads r where r.user_id = me and r.other_id = m.sender_id and r.last_id >= m.id)
    order by m.created_at desc
    limit 1000
  ) u;

  select coalesce(jsonb_agg(to_jsonb(gm)), '[]'::jsonb) into out_members
  from public.group_members gm
  where gm.user_id = me;

  select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb) into out_groups
  from public.groups g
  where g.id in (select gm.group_id from public.group_members gm where gm.user_id = me);

  select coalesce(jsonb_agg(
      jsonb_strip_nulls(jsonb_build_object('id', x.id, 'group_id', x.group_id, 'sender_id', x.sender_id, 'type', x.type, 'content', x.content,
        'created_at', x.created_at, 'deleted', x.deleted, 'expires_at', x.expires_at, 'story_id', x.story_id,
        'media_url', case when x.media_url ~* '^https://[a-z0-9.]*giphy\.com/' then x.media_url end))
      order by x.created_at desc), '[]'::jsonb),
    coalesce(jsonb_agg(distinct x.sender_id) filter (where x.sender_id is distinct from me and x.type is distinct from 'system' and x.sender_id is not null), '[]'::jsonb)
  into out_gmsgs, out_gnames
  from public.group_members gm
  cross join lateral (
    select m.id, m.group_id, m.sender_id, m.type, m.content, m.created_at, m.deleted, m.expires_at, m.story_id, m.media_url
    from public.messages m
    where m.group_id = gm.group_id
      and not (hid ? m.id::text)
      and (m.expires_at is null or m.expires_at > now())
    order by m.created_at desc
    limit per
  ) x
  where gm.user_id = me;

  select coalesce(jsonb_object_agg(p.id, p.name), '{}'::jsonb) into out_gnames
  from public.profiles p
  where p.id in (select (jsonb_array_elements_text(out_gnames))::uuid);

  if to_regclass('public.zchat_group_reads') is not null then
    select coalesce(jsonb_object_agg(r.group_id::text, to_char(r.read_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')), '{}'::jsonb) into out_greads
    from public.zchat_group_reads r
    where r.user_id = me and r.group_id in (select gm.group_id from public.group_members gm where gm.user_id = me);
    select reads || coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) into reads
    from jsonb_each(out_greads) e
    where public.zchat_core_ts(reads ->> e.key) is null
       or public.zchat_core_ts(reads ->> e.key) < public.zchat_core_ts(e.value #>> '{}');
  end if;

  select coalesce(jsonb_object_agg(k.group_id, k.n), '{}'::jsonb) into out_gunread
  from (
    select gm.group_id, (
      select count(*) from (
        select 1
        from public.messages m
        where m.group_id = gm.group_id
          and m.created_at > public.zchat_core_ts(reads ->> gm.group_id::text)
          and m.sender_id is distinct from me
          and m.type is distinct from 'system'
          and m.deleted is not true
          and (m.expires_at is null or m.expires_at > now())
          and not (hid ? m.id::text)
        limit 100
      ) z
    ) as n
    from public.group_members gm
    where gm.user_id = me
      and public.zchat_core_ts(reads ->> gm.group_id::text) is not null
  ) k;

  if to_regclass('public.chat_locks') is not null then
    execute 'select coalesce(jsonb_agg(l.conversation_id), ''[]''::jsonb) from public.chat_locks l where l.owner_id = $1' into out_locks using me;
  end if;

  select coalesce(jsonb_object_agg(r.other_id, r.last_id), '{}'::jsonb) into out_dmreads from public.zchat_dm_reads r where r.user_id = me;

  select coalesce(jsonb_agg(b.blocked_id), '[]'::jsonb) into out_blocks from public.blocks b where b.blocker_id = me;
  select coalesce(jsonb_agg(b.blocker_id), '[]'::jsonb) into out_blocked_by from public.blocks b where b.blocked_id = me;

  return jsonb_build_object(
    'v', 1, 'ok', true, 'me', me,
    'convs', out_convs, 'msgs', out_msgs, 'sent', out_sent, 'profiles', out_profiles,
    'nicks', out_nicks, 'aliases', out_aliases, 'unread', out_unread,
    'members', out_members, 'groups', out_groups, 'gmsgs', out_gmsgs, 'gunread', out_gunread, 'gnames', out_gnames,
    'locks', out_locks, 'blocks', out_blocks, 'blocked_by', out_blocked_by, 'dmreads', out_dmreads, 'greads', out_greads
  );
end $function$;

revoke all on function public.zchat_chat_list(jsonb, integer, integer) from public, anon;
grant execute on function public.zchat_chat_list(jsonb, integer, integer) to authenticated, service_role;

create or replace function public.zchat_g1_check_update(p_old text, p_new text, p_old_deleted boolean, p_new_deleted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ost jsonb;
  nst jsonb;
  gn integer;
  ga uuid;
  gdone boolean;
  fresh boolean := false;
begin
  if pg_trigger_depth() < 1 then perform public.zchat_g1_bad('Not allowed'); end if;
  if left(coalesce(p_old, ''), 6) = 'zgame:' then
    ost := public.zchat_try_jsonb(substr(p_old, 7));
    if ost is not null and (ost ->> 'g') = any (public.zchat_g1_kinds()) and (p_new is distinct from p_old or p_new_deleted is distinct from p_old_deleted) then
      if (ost ->> 'g') in ('chess', 'ckr', 'pool', 'golf') then
        select gm.n, gm.a, gm.done into gn, ga, gdone from public.zchat_g1_games gm where gm.game_id = ost ->> 'id';
        if found then
          fresh := coalesce(public.zchat_g1_int(ost -> 'n'), -1) = 0 and gn = 0 and ga = auth.uid()
            and coalesce(p_new_deleted, false) and p_new is null;
          if not gdone and not fresh then
            perform public.zchat_g1_bad('Moves of a running game are not allowed to be removed');
          end if;
          if fresh then
            update public.zchat_g1_games set done = true, updated_at = now() where game_id = ost ->> 'id' and n = 0;
          end if;
        end if;
      end if;
      if not (coalesce(p_new_deleted, false) and p_new is null) then perform public.zchat_g1_bad('Game cards are not allowed to be changed'); end if;
    end if;
  end if;
  if left(coalesce(p_new, ''), 6) = 'zgame:' and p_new is distinct from p_old then
    nst := public.zchat_try_jsonb(substr(p_new, 7));
    if nst is not null and (nst ->> 'g') = any (public.zchat_g1_kinds()) then perform public.zchat_g1_bad('Game cards are not allowed to be changed'); end if;
  end if;
end $$;
revoke all on function public.zchat_g1_check_update(text, text, boolean, boolean) from public, anon;
grant execute on function public.zchat_g1_check_update(text, text, boolean, boolean) to authenticated;

create or replace function public.zchat_gb_check_update(p_old text, p_new text, p_old_deleted boolean, p_new_deleted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ost jsonb;
  nst jsonb;
  gn integer;
  ga uuid;
  gdone boolean;
  fresh boolean := false;
begin
  if pg_trigger_depth() < 1 then perform public.zchat_gb_bad('Not allowed'); end if;
  if left(coalesce(p_old, ''), 6) = 'zgame:' then
    ost := public.zchat_gb_json(substr(p_old, 7));
    if ost is not null and (ost ->> 'g') in ('crm', 'zap') and (p_new is distinct from p_old or p_new_deleted is distinct from p_old_deleted) then
      if (ost ->> 'g') = 'crm' then
        select gm.n, gm.a, gm.done into gn, ga, gdone from public.zchat_gb_games gm where gm.game_id = ost ->> 'id';
        if found then
          fresh := coalesce(public.zchat_gb_int(ost -> 'n'), -1) = 0 and gn = 0 and ga = auth.uid() and coalesce(p_new_deleted, false);
          if not gdone and not fresh then
            perform public.zchat_gb_bad('Moves of a running game are not allowed to be removed');
          end if;
          if fresh then
            update public.zchat_gb_games set done = true, updated_at = now() where game_id = ost ->> 'id' and n = 0;
          end if;
        end if;
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

create or replace function public.zchat_gh_title(p_kind text)
returns text
language sql
immutable
as $$
  select case p_kind
    when 'ttt' then 'Tic tac toe' when 'fade' then 'Fade tac toe' when 'c4' then 'Four in a row'
    when 'gomoku' then 'Five in a row' when 'reversi' then 'Reversi' when 'dots' then 'Dots and boxes'
    when 'mancala' then 'Mancala' when 'nim' then 'Nim sticks' when 'paint' then 'Paint war'
    when 'ship' then 'Sea battle' when 'hang' then 'Hangman'
    else 'Game' end
$$;

create or replace function public.zchat_game_pair_counts(p_peer uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row record;
  v_st jsonb;
  v_g text;
  v_w text;
  v_me text;
  v_win integer;
  v_lose integer;
  v_cur jsonb;
  v_id text;
  v_seen text[] := '{}';
  v_out jsonb := '{}'::jsonb;
begin
  if v_uid is null or p_peer is null or p_peer = v_uid then
    return v_out;
  end if;
  if public.zchat_blocked_with(p_peer) then
    return v_out;
  end if;
  for v_row in
    select m.content
    from public.messages m
    where m.group_id is null
      and coalesce(m.deleted, false) = false
      and ((m.sender_id = v_uid and m.receiver_id = p_peer) or (m.sender_id = p_peer and m.receiver_id = v_uid))
      and m.content like 'zgame:%'
      and m.content ~ '"w"\s*:\s*"'
    order by m.id desc
    limit 3000
  loop
    begin
      v_st := substr(v_row.content, 7)::jsonb;
    exception when others then
      continue;
    end;
    if jsonb_typeof(v_st) is distinct from 'object' then
      continue;
    end if;
    v_id := v_st->>'id';
    if v_id is null or v_id = any (v_seen) then
      continue;
    end if;
    v_seen := v_seen || v_id;
    v_g := v_st->>'g';
    if v_g = 'sd' then
      v_g := 'sd:' || coalesce(v_st->>'k', '');
    end if;
    v_w := v_st->>'w';
    if v_g is null or length(v_g) > 24 or v_g = 'score' or v_w is null then
      continue;
    end if;
    v_win := 0;
    v_lose := 0;
    if v_w = v_uid::text then
      v_win := 1;
    elsif v_w = p_peer::text then
      v_lose := 1;
    elsif v_w in ('x', 'o') then
      v_me := case when v_st->>'x' = v_uid::text then 'x' when v_st->>'o' = v_uid::text then 'o' else null end;
      if v_me is not null then
        if v_w = v_me then v_win := 1; else v_lose := 1; end if;
      end if;
    end if;
    v_cur := coalesce(v_out->v_g, '{"n":0,"w":0,"l":0}'::jsonb);
    v_out := v_out || jsonb_build_object(v_g, jsonb_build_object('n', (v_cur->>'n')::integer + 1, 'w', (v_cur->>'w')::integer + v_win, 'l', (v_cur->>'l')::integer + v_lose));
  end loop;
  return v_out;
end;
$$;

revoke all on function public.zchat_game_pair_counts(uuid) from public;
grant execute on function public.zchat_game_pair_counts(uuid) to authenticated, service_role;

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
  stt numeric;
  was numeric;
  now_left numeric;
  claim numeric;
begin
  if jsonb_typeof(pck) <> 'array' or jsonb_array_length(pck) <> 2 or jsonb_typeof(sck) <> 'array' or jsonb_array_length(sck) <> 2 then return null; end if;
  if jsonb_typeof(sck -> 0) <> 'number' or jsonb_typeof(sck -> 1) <> 'number' or jsonb_typeof(st -> 'tt') <> 'number' then return null; end if;
  stt := (st ->> 'tt')::numeric;
  if stt <> trunc(stt) or abs(stt - v_now) > 15000 then return null; end if;
  if (sck ->> j)::numeric <> (pck ->> j)::numeric then return null; end if;
  was := (pck ->> i)::numeric;
  claim := (sck ->> i)::numeric;
  if claim <> trunc(claim) or claim < 0 or claim > was then return null; end if;
  if jsonb_typeof(prev -> 'tt') = 'number' then
    now_left := was - (v_now - (prev ->> 'tt')::numeric);
    if now_left < -5000 or claim > now_left + 5000 then return null; end if;
  elsif claim <> was then
    return null;
  end if;
  return nx || jsonb_build_object('ck', sck, 'tt', st -> 'tt');
end $$;

create or replace function public.zchat_g1_clock_flag(prev jsonb, nn integer)
returns jsonb
language plpgsql
stable
as $$
declare
  v_now bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  pck jsonb := prev -> 'ck';
  i integer;
begin
  if public.zchat_g1_int(prev -> 'tc') is null or jsonb_typeof(prev -> 'tt') <> 'number' or jsonb_typeof(pck) <> 'array' or jsonb_array_length(pck) <> 2 then return null; end if;
  i := case when (prev ->> 't') = (prev ->> 'x') then 0 else 1 end;
  if (pck ->> i)::numeric - (v_now - (prev ->> 'tt')::numeric) > 0 then return null; end if;
  return prev || jsonb_build_object('n', nn, 'w', case when i = 0 then 'o' else 'x' end, 'why', 'time', 'a', 'flag', 'dr', null);
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
  nine boolean := false;
begin
  if k = 'chess' then
    if wh is null or wh not in (st ->> 'x', st ->> 'o') then return null; end if;
    ex := base || jsonb_build_object('wh', wh, 't', wh, 'b', public.zchat_g1_ch_start(), 'c', 'KQkq', 'e', -1, 'h', 0, 'k', '',
      'r', jsonb_build_array(public.zchat_g1_fnv(public.zchat_g1_ch_start() || 'wKQkq-1')), 'm', null, 'why', null, 'dr', null, 'a', 'start');
    if st ? 'tc' then
      tc := public.zchat_g1_int(st -> 'tc');
      if tc is null or tc not in (180, 300, 600) then return null; end if;
      ex := ex || jsonb_build_object('tc', tc, 'ck', jsonb_build_array(tc * 1000, tc * 1000), 'tt', null);
    end if;
    return ex;
  elsif k = 'ckr' then
    if wh is null or wh not in (st ->> 'x', st ->> 'o') then return null; end if;
    return base || jsonb_build_object('wh', wh, 't', wh, 'b', public.zchat_g1_ck_start(), 'h', 0, 'm', null, 'why', null, 'dr', null, 'a', 'start');
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
    if a = 'flag' and k = 'chess' then return public.zchat_g1_clock_flag(prev, nn); end if;
    if a = 'mv' and (prev ->> 't') = me then
      if k = 'chess' then
        pv := public.zchat_g1_ch_next(prev, st ->> 'm', sender);
        if pv is null or (prev ->> 'tc') is null then return pv; end if;
        return public.zchat_g1_clock_apply(prev, st, pv, mark);
      end if;
      return public.zchat_g1_ck_next(prev, st -> 'm', sender);
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
