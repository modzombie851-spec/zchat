begin;

create table if not exists public.zchat_dead_bank (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cash integer not null default 300 check (cash >= 0 and cash <= 999999),
  earned_day date not null default current_date,
  earned_today integer not null default 0 check (earned_today >= 0),
  last_gain timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.zchat_dead_bank enable row level security;
revoke all on table public.zchat_dead_bank from public, anon, authenticated;

create or replace function public.zchat_dead_cash()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_cash integer;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  insert into public.zchat_dead_bank (user_id) values (me) on conflict (user_id) do nothing;
  select b.cash into v_cash from public.zchat_dead_bank b where b.user_id = me;
  return jsonb_build_object('ok', true, 'cash', v_cash);
end;
$$;

create or replace function public.zchat_dead_cash_save(p_delta integer, p_wave integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_delta integer := greatest(-999999, least(coalesce(p_delta, 0), 999999));
  v_wave integer := greatest(0, least(coalesce(p_wave, 0), 200));
  v_row public.zchat_dead_bank%rowtype;
  v_today integer;
  v_got integer := 0;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  insert into public.zchat_dead_bank (user_id) values (me) on conflict (user_id) do nothing;
  select * into v_row from public.zchat_dead_bank where user_id = me for update;
  v_today := case when v_row.earned_day = current_date then v_row.earned_today else 0 end;
  if v_delta > 0 then
    if v_row.last_gain is null or v_row.last_gain < now() - interval '20 seconds' then
      v_got := greatest(0, least(v_delta, 600 + v_wave * 900, 60000 - v_today, 999999 - v_row.cash));
    end if;
  else
    v_got := greatest(v_delta, -v_row.cash);
  end if;
  update public.zchat_dead_bank
    set cash = cash + v_got,
        earned_day = current_date,
        earned_today = v_today + greatest(v_got, 0),
        last_gain = case when v_got > 0 then now() else last_gain end,
        updated_at = now()
    where user_id = me
    returning * into v_row;
  return jsonb_build_object('ok', true, 'cash', v_row.cash, 'got', v_got);
end;
$$;

revoke all on function public.zchat_dead_cash() from public, anon;
revoke all on function public.zchat_dead_cash_save(integer, integer) from public, anon;
grant execute on function public.zchat_dead_cash() to authenticated;
grant execute on function public.zchat_dead_cash_save(integer, integer) to authenticated;

commit;
