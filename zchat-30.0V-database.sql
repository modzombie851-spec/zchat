begin;

grant select, insert, update, delete on public.shop_listings to authenticated;

do $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select distinct pr.oid, ns.nspname, pr.proname, pg_get_function_identity_arguments(pr.oid) as args
      from pg_policy pol
      join pg_class c on c.oid = pol.polrelid
      join pg_namespace cn on cn.oid = c.relnamespace
      join pg_depend d on d.classid = 'pg_policy'::regclass and d.objid = pol.oid and d.refclassid = 'pg_proc'::regclass
      join pg_proc pr on pr.oid = d.refobjid
      join pg_namespace ns on ns.oid = pr.pronamespace
     where cn.nspname = 'public'
       and ns.nspname in ('public', 'zchat_private')
       and not has_function_privilege('authenticated', pr.oid, 'execute')
  loop
    execute format('grant execute on function %I.%I(%s) to authenticated', r.nspname, r.proname, r.args);
    n := n + 1;
  end loop;
  raise notice 'zchat: % helpers used by table rules were opened for signed in people', n;
end $$;

create or replace function public.zchat_shop_list(p_owner uuid)
returns setof public.shop_listings
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_owner is null then
    return;
  end if;
  if p_owner <> me then
    if public.zchat_blocked_pair(me, p_owner) then
      return;
    end if;
    if not public.zchat_owner_visible(p_owner, 'posts') then
      return;
    end if;
  end if;
  return query
    select l.*
      from public.shop_listings l
     where l.owner_id = p_owner
     order by l.created_at desc
     limit 50;
end $$;
revoke all on function public.zchat_shop_list(uuid) from public, anon;
grant execute on function public.zchat_shop_list(uuid) to authenticated, service_role;

do $$
declare
  n integer := 0;
  sets text[] := array['spirit_wolf','candy_land','festival_elephant','jellyfish_glow','autumn_fox','unicorn_dream','lava_island','butterfly_garden','ninja_cat','surf_day','royal_crown','mushroom_grove','pirate_cove','love_letters','dino_park','fireworks_night','panda_bamboo','origami_cranes','goal_rush','desert_oasis','koi_pond','neon_city','dragon_hoard','snow_globe','lofi_beats','space_explorer','sakura_shrine','campfire_night','bubble_tea','ocean_reef','pixel_quest','midnight_ramen','cozy_rain','robot_buddy','honey_bees','witch_brew','hot_air_balloon','jungle_swing','spooky_pumpkin','race_track','cricket_match','crystal_phoenix','fire_phoenix','sun_half','moon_half','lock_half','key_half','koi_gold','koi_ink','koi_pond_night','sakura_shrine_night','snow_globe_night','hot_air_balloon_dusk','bubble_tea_matcha','ocean_reef_night','candy_land_mint','robot_buddy_gold']::text[];
begin
  if to_regclass('public.user_rewards') is null then
    return;
  end if;
  with owners as (
    select distinct r.user_id, r.reward_key
      from public.user_rewards r
     where r.kind in ('frame', 'nameplate', 'effect')
       and r.expires_at is null
       and r.user_id is not null
       and r.reward_key = any (sets)
  ), want as (
    select o.user_id, o.reward_key, k.kind
      from owners o
      cross join (values ('frame'), ('nameplate'), ('effect')) as k(kind)
  ), added as (
    insert into public.user_rewards (user_id, kind, reward_key, seen, granted_at, expires_at)
    select w.user_id, w.kind, w.reward_key, false, now(), null
      from want w
     where not exists (
       select 1 from public.user_rewards r
        where r.user_id = w.user_id and r.kind = w.kind and r.reward_key = w.reward_key and r.expires_at is null
     )
    on conflict do nothing
    returning 1
  )
  select count(*) into n from added;
  raise notice 'zchat: % missing pieces were added so everyone who had part of a set now has the full set', n;
end $$;

do $$ begin
  if to_regclass('public.shop_items') is not null then
    insert into public.shop_items (kind, key, label, rarity, price, active) values
      ('gamekit', 'cue-ember', 'Ember cue', 'rare', 250, true),
      ('gamekit', 'cue-ocean', 'Deep sea cue', 'rare', 250, true),
      ('gamekit', 'cue-neon', 'Neon cue', 'epic', 450, true),
      ('gamekit', 'cue-dragon', 'Dragon gold cue', 'legendary', 900, true),
      ('gamekit', 'cue-galaxy', 'Galaxy cue', 'mythic', 1400, true),
      ('gamekit', 'striker-ruby', 'Ruby striker', 'rare', 200, true),
      ('gamekit', 'striker-ocean', 'Ocean striker', 'rare', 200, true),
      ('gamekit', 'striker-galaxy', 'Galaxy striker', 'epic', 450, true),
      ('gamekit', 'striker-gold', 'Royal gold striker', 'legendary', 900, true)
    on conflict (kind, key) do update set label = excluded.label, rarity = excluded.rarity, price = excluded.price, active = true;
  end if;
end $$;

create or replace function public.zchat_game_kit_set(p_game text, p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  k text := nullif(btrim(coalesce(p_key, '')), '');
  cur jsonb;
begin
  if me is null then return jsonb_build_object('ok', false); end if;
  if p_game is null or p_game not in ('chess', 'ckr', 'pool', 'crm', 'cue', 'striker') then return jsonb_build_object('ok', false, 'why', 'game'); end if;
  if k is not null then
    if left(k, length(p_game) + 1) <> p_game || '-' or length(k) > 40 then return jsonb_build_object('ok', false, 'why', 'key'); end if;
    if not exists (select 1 from public.user_rewards r where r.user_id = me and r.kind = 'gamekit' and r.reward_key = k and (r.expires_at is null or r.expires_at > now())) then
      return jsonb_build_object('ok', false, 'why', 'own');
    end if;
  end if;
  select g.kit into cur from public.zchat_game_kits g where g.user_id = me;
  cur := coalesce(cur, '{}'::jsonb) || jsonb_build_object(p_game, coalesce(k, ''));
  insert into public.zchat_game_kits (user_id, kit, updated_at) values (me, cur, now())
  on conflict (user_id) do update set kit = excluded.kit, updated_at = now();
  return jsonb_build_object('ok', true, 'kit', cur);
end $$;
revoke all on function public.zchat_game_kit_set(text, text) from public, anon;
grant execute on function public.zchat_game_kit_set(text, text) to authenticated;

create or replace function public.zchat_game_kit_of(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  cur jsonb;
  out jsonb := '{}'::jsonb;
  s text;
  k text;
begin
  if me is null or p_user is null then return out; end if;
  select g.kit into cur from public.zchat_game_kits g where g.user_id = p_user;
  if cur is null then return out; end if;
  foreach s in array array['cue', 'striker', 'chess', 'ckr', 'pool', 'crm'] loop
    k := cur ->> s;
    if k is not null and k <> '' and left(k, length(s) + 1) = s || '-'
       and exists (select 1 from public.user_rewards r where r.user_id = p_user and r.kind = 'gamekit' and r.reward_key = k and (r.expires_at is null or r.expires_at > now())) then
      out := out || jsonb_build_object(s, k);
    end if;
  end loop;
  return out;
end $$;
revoke all on function public.zchat_game_kit_of(uuid) from public, anon;
grant execute on function public.zchat_game_kit_of(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
