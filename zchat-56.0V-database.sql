begin;

create table if not exists public.zchat_game_config (
  k text primary key check (char_length(k) between 1 and 40),
  v jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.zchat_game_config enable row level security;
revoke all on table public.zchat_game_config from public, anon, authenticated;

create or replace function public.zchat_game_config_get(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_val jsonb;
begin
  if auth.uid() is null then return null; end if;
  if p_key is null or p_key not in ('dead_hud') then return null; end if;
  select c.v into v_val from public.zchat_game_config c where c.k = p_key;
  return v_val;
end;
$$;

create or replace function public.zchat_game_config_set(p_key text, p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or not coalesce(public.zchat_is_admin_id(me), false) then
    return jsonb_build_object('ok', false, 'reason', 'admin');
  end if;
  if p_key is null or p_key not in ('dead_hud') then
    return jsonb_build_object('ok', false, 'reason', 'key');
  end if;
  if p_value is null or jsonb_typeof(p_value) <> 'object' or octet_length(p_value::text) > 8000 then
    return jsonb_build_object('ok', false, 'reason', 'value');
  end if;
  insert into public.zchat_game_config (k, v, updated_by, updated_at)
    values (p_key, p_value, me, now())
    on conflict (k) do update set v = excluded.v, updated_by = excluded.updated_by, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.zchat_game_config_get(text) from public, anon;
revoke all on function public.zchat_game_config_set(text, jsonb) from public, anon;
grant execute on function public.zchat_game_config_get(text) to authenticated;
grant execute on function public.zchat_game_config_set(text, jsonb) to authenticated;

commit;
