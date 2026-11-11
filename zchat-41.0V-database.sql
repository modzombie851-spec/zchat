begin;

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
  if p_game is null or p_game not in ('duo', 'gulp', 'roll', 'race') then raise exception 'unknown game'; end if;
  if p_room is null or char_length(p_room) < 3 or char_length(p_room) > 80 then raise exception 'bad room'; end if;
  if jsonb_typeof(v_info) <> 'object' or pg_column_size(v_info) > 1500 then v_info := '{}'::jsonb; end if;
  insert into public.zchat_live_now (user_id, game, room, watch, info, updated_at)
  values (me, p_game, p_room, coalesce(p_watch, true), v_info, now())
  on conflict (user_id) do update set game = excluded.game, room = excluded.room, watch = excluded.watch, info = excluded.info, updated_at = now();
end;
$$;

revoke all on function public.zchat_live_set(text, text, boolean, jsonb) from public, anon;
grant execute on function public.zchat_live_set(text, text, boolean, jsonb) to authenticated;

commit;
