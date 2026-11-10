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

create or replace function public.zchat_mail_self_gift_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := auth.uid();
  j jsonb := to_jsonb(new);
begin
  if me is null then
    return new;
  end if;
  if (j ->> 'recipient_id') is distinct from me::text then
    return new;
  end if;
  if coalesce(j ->> 'title', '') ~* 'gift' or coalesce(j ->> 'type', '') ~* 'gift' or coalesce(j ->> 'body', '') ~* '^(a |you got a |here is a )?gift' then
    if coalesce(j ->> 'sender_id', '') <> '' and (j ->> 'sender_id') <> me::text then
      return new;
    end if;
    return null;
  end if;
  return new;
end $$;
revoke all on function public.zchat_mail_self_gift_guard() from public, anon, authenticated;

do $$
begin
  if to_regclass('public.mails') is not null then
    execute 'drop trigger if exists zchat_mail_self_gift_guard on public.mails';
    execute 'create trigger zchat_mail_self_gift_guard before insert on public.mails for each row execute function public.zchat_mail_self_gift_guard()';
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
