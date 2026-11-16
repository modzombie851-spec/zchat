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
    check (hero in ('blaze', 'pip', 'boom', 'mira', 'rex', 'volt', 'kai', 'ivy', 'nyx', 'arlo', 'wren'));
end $hero$;

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
  if p_hero is null or p_hero not in ('blaze', 'pip', 'boom', 'mira', 'rex', 'volt', 'kai', 'ivy', 'nyx', 'arlo', 'wren') then
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

revoke all on function public.zchat_siege_level(text) from public, anon;
grant execute on function public.zchat_siege_level(text) to authenticated;

commit;

select
  (select pg_get_constraintdef(con.oid) from pg_constraint con where con.conrelid = 'public.zchat_siege_heroes'::regclass and con.conname = 'zchat_siege_heroes_hero_check') as hero_check,
  (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'zchat_siege_level') as level_function;
