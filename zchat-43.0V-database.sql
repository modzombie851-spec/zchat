begin;

create table if not exists public.zchat_game_privacy (
  user_id uuid primary key references auth.users (id) on delete cascade,
  show_playing boolean not null default true,
  allow_watch boolean not null default true,
  allow_join boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.zchat_game_privacy enable row level security;
revoke all on table public.zchat_game_privacy from public, anon, authenticated;

create or replace function public.zchat_game_privacy_get()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then jsonb_build_object('ok', false)
    else coalesce(
      (select jsonb_build_object('ok', true, 'show', p.show_playing, 'watch', p.allow_watch, 'join', p.allow_join)
         from public.zchat_game_privacy p where p.user_id = auth.uid()),
      jsonb_build_object('ok', true, 'show', true, 'watch', true, 'join', true))
  end
$$;

create or replace function public.zchat_game_privacy_set(p_show boolean, p_watch boolean, p_join boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_show boolean := coalesce(p_show, true);
  v_watch boolean := coalesce(p_watch, true);
  v_join boolean := coalesce(p_join, true);
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  insert into public.zchat_game_privacy (user_id, show_playing, allow_watch, allow_join, updated_at)
  values (me, v_show, v_watch, v_join, now())
  on conflict (user_id) do update
    set show_playing = excluded.show_playing, allow_watch = excluded.allow_watch, allow_join = excluded.allow_join, updated_at = now();
  if not v_show then
    delete from public.zchat_live_now where user_id = me;
  else
    update public.zchat_live_now
      set info = info || jsonb_build_object('w', v_watch and coalesce(info -> 'w', 'true'::jsonb) not in ('false'::jsonb, '0'::jsonb), 'j', v_join and coalesce(info -> 'j', 'true'::jsonb) not in ('false'::jsonb, '0'::jsonb))
      where user_id = me;
  end if;
  return jsonb_build_object('ok', true, 'show', v_show, 'watch', v_watch, 'join', v_join);
end;
$$;

create or replace function public.zchat_live_set(p_game text, p_room text, p_watch boolean, p_info jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_info jsonb := coalesce(p_info, '{}'::jsonb);
  v_show boolean := true;
  v_watch boolean := true;
  v_join boolean := true;
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_game is null or p_game !~ '^[a-z0-9]{2,12}$' then raise exception 'unknown game'; end if;
  if p_room is null or char_length(p_room) < 3 or char_length(p_room) > 80 then raise exception 'bad room'; end if;
  if jsonb_typeof(v_info) <> 'object' or pg_column_size(v_info) > 1500 then v_info := '{}'::jsonb; end if;
  select p.show_playing, p.allow_watch, p.allow_join into v_show, v_watch, v_join
    from public.zchat_game_privacy p where p.user_id = me;
  if not found then v_show := true; v_watch := true; v_join := true; end if;
  if not v_show then
    delete from public.zchat_live_now where user_id = me;
    return;
  end if;
  v_info := v_info || jsonb_build_object(
    'w', v_watch and coalesce(p_watch, true) and coalesce(v_info -> 'w', 'true'::jsonb) not in ('false'::jsonb, '0'::jsonb),
    'j', v_join and coalesce(v_info -> 'j', 'true'::jsonb) not in ('false'::jsonb, '0'::jsonb));
  insert into public.zchat_live_now (user_id, game, room, watch, info, updated_at)
  values (me, p_game, p_room, true, v_info, now())
  on conflict (user_id) do update set game = excluded.game, room = excluded.room, watch = true, info = excluded.info, updated_at = now();
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

revoke all on function public.zchat_game_privacy_get() from public, anon;
revoke all on function public.zchat_game_privacy_set(boolean, boolean, boolean) from public, anon;
revoke all on function public.zchat_live_set(text, text, boolean, jsonb) from public, anon;
revoke all on function public.zchat_live_friends() from public, anon;
grant execute on function public.zchat_game_privacy_get() to authenticated;
grant execute on function public.zchat_game_privacy_set(boolean, boolean, boolean) to authenticated;
grant execute on function public.zchat_live_set(text, text, boolean, jsonb) to authenticated;
grant execute on function public.zchat_live_friends() to authenticated;

commit;
