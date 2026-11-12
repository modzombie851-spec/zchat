begin;

create table if not exists public.zchat_siege_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  scrap integer not null default 0 check (scrap >= 0 and scrap <= 1000000),
  earned_day date not null default current_date,
  earned_today integer not null default 0 check (earned_today >= 0),
  last_award timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.zchat_siege_profile enable row level security;
revoke all on table public.zchat_siege_profile from public, anon, authenticated;

create table if not exists public.zchat_siege_heroes (
  user_id uuid not null references auth.users (id) on delete cascade,
  hero text not null check (hero in ('blaze', 'pip', 'boom', 'mira', 'rex', 'volt', 'kai', 'ivy')),
  level smallint not null default 1 check (level between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, hero)
);
alter table public.zchat_siege_heroes enable row level security;
revoke all on table public.zchat_siege_heroes from public, anon, authenticated;

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
      'levels', coalesce((select jsonb_object_agg(h.hero, h.level) from public.zchat_siege_heroes h where h.user_id = auth.uid()), '{}'::jsonb))
  end
$$;

create or replace function public.zchat_siege_award(p_wave integer, p_kills integer, p_won boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_wave integer := greatest(0, least(coalesce(p_wave, 0), 200));
  v_kills integer := greatest(0, least(coalesce(p_kills, 0), 3000));
  v_amt integer;
  v_row public.zchat_siege_profile%rowtype;
  v_today integer;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  insert into public.zchat_siege_profile (user_id) values (me) on conflict (user_id) do nothing;
  select * into v_row from public.zchat_siege_profile where user_id = me for update;
  if v_row.last_award is not null and v_row.last_award > now() - interval '90 seconds' then
    return jsonb_build_object('ok', false, 'reason', 'wait', 'scrap', v_row.scrap);
  end if;
  v_today := case when v_row.earned_day = current_date then v_row.earned_today else 0 end;
  v_amt := least(120, v_wave * 4 + v_kills / 3 + case when coalesce(p_won, false) and v_wave >= 15 then 30 else 0 end);
  v_amt := greatest(0, least(v_amt, 1500 - v_today));
  update public.zchat_siege_profile
    set scrap = least(1000000, scrap + v_amt),
        earned_day = current_date,
        earned_today = v_today + v_amt,
        last_award = now(),
        updated_at = now()
    where user_id = me
    returning * into v_row;
  return jsonb_build_object('ok', true, 'got', v_amt, 'scrap', v_row.scrap);
end;
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
  if p_hero is null or p_hero not in ('blaze', 'pip', 'boom', 'mira', 'rex', 'volt', 'kai', 'ivy') then
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

revoke all on function public.zchat_siege_state() from public, anon;
revoke all on function public.zchat_siege_award(integer, integer, boolean) from public, anon;
revoke all on function public.zchat_siege_level(text) from public, anon;
grant execute on function public.zchat_siege_state() to authenticated;
grant execute on function public.zchat_siege_award(integer, integer, boolean) to authenticated;
grant execute on function public.zchat_siege_level(text) to authenticated;

commit;
