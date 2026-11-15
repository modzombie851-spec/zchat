begin;

create table if not exists public.zchat_word_rules (
  word text primary key check (char_length(word) between 2 and 60),
  tier text not null default 'none' check (tier in ('severe', 'strong', 'mild', 'paired', 'allow', 'none')),
  names text not null default 'none' check (names in ('none', 'token', 'inside')),
  pat text,
  created_at timestamptz not null default now()
);
alter table public.zchat_word_rules add column if not exists pat text;
alter table public.zchat_word_rules enable row level security;
revoke all on table public.zchat_word_rules from public, anon, authenticated;
grant all on table public.zchat_word_rules to service_role;

create or replace function public.zchat_word_fold(p text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s text := coalesce(p, '');
begin
  if current_setting('server_encoding') = 'UTF8' then
    s := normalize(s, nfkc);
  end if;
  s := lower(s);
  s := translate(s, (select string_agg(chr(u.c), '' order by u.o) from unnest('{1072,1077,1086,1088,1089,1091,1093,1082,1084,1090,1074,1085,1109,1110,1112,1281,609,1231,1211,1307,1309,1199,959,945,961,964,965,957,954,956,967,953,949,951,946,947,1409,1413,1405,1392,1400,224,225,226,227,228,229,257,259,261,231,263,269,271,232,233,234,235,275,279,281,283,287,236,237,238,239,299,303,305,318,322,241,324,328,242,243,244,245,246,248,333,337,345,347,353,351,357,249,250,251,252,363,367,369,371,253,255,382,378,380,65345,65346,65347,65348,65349,65350,65351,65352,65353,65354,65355,65356,65357,65358,65359,65360,65361,65362,65363,65364,65365,65366,65367,65368,65369,65370}'::int[]) with ordinality as u(c, o)), 'aeopcyxkmtbhsijdglhqwyoaptuvkmxienbygouhnaaaaaaaaacccdeeeeeeeegiiiiiiillnnnoooooooorssstuuuuuuuuyyzzzabcdefghijklmnopqrstuvwxyz');
  s := translate(s, (select string_agg(chr(u.c), '' order by u.o) from unnest('{8203,8204,8205,8288,65279,173,39,8216,8217,96}'::int[]) with ordinality as u(c, o)), '');
  return translate(s, 'l', 'i');
end $$;
revoke all on function public.zchat_word_fold(text) from public;
grant execute on function public.zchat_word_fold(text) to authenticated, service_role;

create or replace function public.zchat_word_pat(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select string_agg(case when t.ch ~ '[[:space:]]' then '[[:space:]._*-]*' when t.ch ~ '[[:alnum:]]' then t.ch || '+' when t.ch in ('^', ']', '[', '-', '\') then '[\' || t.ch || ']+' else '[' || t.ch || ']+' end, '' order by t.i)
  from regexp_split_to_table(public.zchat_word_fold(btrim(p)), '') with ordinality as t(ch, i)
$$;
revoke all on function public.zchat_word_pat(text) from public;
grant execute on function public.zchat_word_pat(text) to service_role;

create or replace function public.zchat_word_rules_pat()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.word := lower(btrim(new.word));
  new.pat := public.zchat_word_pat(new.word);
  return new;
end $$;
revoke all on function public.zchat_word_rules_pat() from public, anon, authenticated;
drop trigger if exists zchat_word_rules_pat on public.zchat_word_rules;
create trigger zchat_word_rules_pat before insert or update of word on public.zchat_word_rules
  for each row execute function public.zchat_word_rules_pat();

insert into public.zchat_word_rules (word, tier, names) values
  ('kill yourself', 'severe', 'inside'),
  ('kill urself', 'severe', 'inside'),
  ('hope you die', 'severe', 'inside'),
  ('end yourself', 'severe', 'inside'),
  ('end urself', 'severe', 'inside'),
  ('hang yourself', 'severe', 'inside'),
  ('neck yourself', 'severe', 'inside'),
  ('drink bleach', 'severe', 'inside'),
  ('you should die', 'severe', 'inside'),
  ('gonna kill you', 'severe', 'inside'),
  ('kys', 'severe', 'token'),
  ('go die', 'severe', 'token'),
  ('hope u die', 'severe', 'token'),
  ('u should die', 'severe', 'token'),
  ('i will kill you', 'severe', 'token'),
  ('ill kill you', 'severe', 'token'),
  ('nobody would miss you', 'severe', 'none'),
  ('no one would miss you', 'severe', 'none'),
  ('the world is better without you', 'severe', 'none'),
  ('i will find you', 'severe', 'none'),
  ('i know where you live', 'severe', 'none'),
  ('i will hurt you', 'severe', 'none'),
  ('watch your back', 'severe', 'none'),
  ('maranawa', 'severe', 'none'),
  ('marala dannam', 'severe', 'none'),
  ('kolluven', 'severe', 'none'),
  ('konnuduven', 'severe', 'none'),
  ('kolla poren', 'severe', 'none'),
  ('whore', 'strong', 'inside'),
  ('slut', 'strong', 'inside'),
  ('bitch', 'strong', 'inside'),
  ('cunt', 'strong', 'inside'),
  ('skank', 'strong', 'inside'),
  ('faggot', 'strong', 'inside'),
  ('nigger', 'strong', 'inside'),
  ('nigga', 'strong', 'inside'),
  ('thevidiya', 'strong', 'inside'),
  ('thevdiya', 'strong', 'inside'),
  ('wesiya', 'strong', 'inside'),
  ('vesiya', 'strong', 'inside'),
  ('huththa', 'strong', 'inside'),
  ('huththo', 'strong', 'inside'),
  ('hukanna', 'strong', 'inside'),
  ('hukapan', 'strong', 'inside'),
  ('pakaya', 'strong', 'inside'),
  ('pakayo', 'strong', 'inside'),
  ('ommala', 'strong', 'inside'),
  ('sakkiliya', 'strong', 'inside'),
  ('kalla thoni', 'strong', 'inside'),
  ('chutiya', 'strong', 'inside'),
  ('madarchod', 'strong', 'inside'),
  ('behenchod', 'strong', 'inside'),
  ('bhenchod', 'strong', 'inside'),
  ('bhosdike', 'strong', 'inside'),
  ('wetback', 'strong', 'inside'),
  ('send nudes', 'strong', 'inside'),
  ('retard', 'strong', 'token'),
  ('retarded', 'strong', 'token'),
  ('fag', 'strong', 'token'),
  ('tranny', 'strong', 'token'),
  ('chink', 'strong', 'token'),
  ('paki', 'strong', 'token'),
  ('hutta', 'strong', 'token'),
  ('hutto', 'strong', 'token'),
  ('paka', 'strong', 'token'),
  ('ponnaya', 'strong', 'token'),
  ('punda', 'strong', 'token'),
  ('pundai', 'strong', 'token'),
  ('kariya', 'strong', 'token'),
  ('kariyo', 'strong', 'token'),
  ('keriya', 'strong', 'token'),
  ('wesi', 'strong', 'token'),
  ('vesi', 'strong', 'token'),
  ('gandu', 'strong', 'token'),
  ('spic', 'strong', 'token'),
  ('gook', 'strong', 'token'),
  ('beaner', 'strong', 'token'),
  ('dyke', 'strong', 'none'),
  ('otha', 'strong', 'none'),
  ('coon', 'strong', 'none'),
  ('හුත්ත', 'strong', 'inside'),
  ('හුකන්න', 'strong', 'inside'),
  ('හුකපන්', 'strong', 'inside'),
  ('පකයා', 'strong', 'inside'),
  ('පකයෝ', 'strong', 'inside'),
  ('වේසි', 'strong', 'inside'),
  ('කැරියා', 'strong', 'inside'),
  ('පොන්නයා', 'strong', 'inside'),
  ('தேவடியா', 'strong', 'inside'),
  ('தேவிடியா', 'strong', 'inside'),
  ('புண்டை', 'strong', 'inside'),
  ('ஓத்தா', 'strong', 'inside'),
  ('ஓம்மால', 'strong', 'inside'),
  ('கூதி', 'strong', 'inside'),
  ('சுன்னி', 'strong', 'inside'),
  ('ugly', 'mild', 'none'),
  ('fat', 'mild', 'none'),
  ('fatty', 'mild', 'none'),
  ('fatso', 'mild', 'none'),
  ('stupid', 'mild', 'none'),
  ('idiot', 'mild', 'none'),
  ('dumb', 'mild', 'none'),
  ('moron', 'mild', 'none'),
  ('loser', 'mild', 'none'),
  ('pathetic', 'mild', 'none'),
  ('worthless', 'mild', 'none'),
  ('useless', 'mild', 'none'),
  ('disgusting', 'mild', 'none'),
  ('gross', 'mild', 'none'),
  ('freak', 'mild', 'none'),
  ('creep', 'mild', 'none'),
  ('weirdo', 'mild', 'none'),
  ('cringe', 'mild', 'none'),
  ('shut up', 'mild', 'none'),
  ('stfu', 'mild', 'none'),
  ('nobody likes you', 'mild', 'none'),
  ('no one likes you', 'mild', 'none'),
  ('nobody cares', 'mild', 'none'),
  ('no one cares', 'mild', 'none'),
  ('nobody asked', 'mild', 'none'),
  ('no one asked', 'mild', 'none'),
  ('you suck', 'mild', 'none'),
  ('u suck', 'mild', 'none'),
  ('waste of space', 'mild', 'none'),
  ('waste of air', 'mild', 'none'),
  ('hate you', 'mild', 'none'),
  ('everyone hates you', 'mild', 'none'),
  ('liar', 'mild', 'none'),
  ('modaya', 'mild', 'none'),
  ('gona', 'mild', 'none'),
  ('pissu', 'mild', 'none'),
  ('kalakanni', 'mild', 'none'),
  ('balla', 'mild', 'none'),
  ('haraka', 'mild', 'none'),
  ('booruwa', 'mild', 'none'),
  ('loosu', 'mild', 'none'),
  ('naaye', 'mild', 'none'),
  ('mokkai', 'mild', 'none'),
  ('paithiyam', 'mild', 'none'),
  ('dumbass', 'mild', 'inside'),
  ('fuck', 'mild', 'inside'),
  ('fucking', 'mild', 'inside'),
  ('fucker', 'mild', 'inside'),
  ('motherfucker', 'mild', 'inside'),
  ('bullshit', 'mild', 'inside'),
  ('asshole', 'mild', 'inside'),
  ('dickhead', 'mild', 'inside'),
  ('shit', 'mild', 'token'),
  ('bastard', 'mild', 'token'),
  ('trash', 'paired', 'none'),
  ('garbage', 'paired', 'none'),
  ('pig', 'paired', 'none'),
  ('cow', 'paired', 'none'),
  ('whale', 'paired', 'none'),
  ('monkey', 'paired', 'none'),
  ('donkey', 'paired', 'none'),
  ('dog', 'paired', 'none'),
  ('clown', 'paired', 'none'),
  ('joke', 'paired', 'none'),
  ('disgrace', 'paired', 'none'),
  ('failure', 'paired', 'none'),
  ('mistake', 'paired', 'none'),
  ('nobody', 'paired', 'none'),
  ('porn', 'none', 'token'),
  ('xxx', 'none', 'token'),
  ('sex', 'none', 'token'),
  ('nude', 'none', 'token'),
  ('nudes', 'none', 'token'),
  ('naked', 'none', 'token'),
  ('boobs', 'none', 'token'),
  ('tits', 'none', 'token'),
  ('dick', 'none', 'token'),
  ('cock', 'none', 'token'),
  ('cum', 'none', 'token'),
  ('horny', 'none', 'token'),
  ('milf', 'none', 'token'),
  ('rape', 'none', 'token'),
  ('pedo', 'none', 'token'),
  ('kkk', 'none', 'token'),
  ('ass', 'none', 'token'),
  ('anal', 'none', 'token'),
  ('porno', 'none', 'inside'),
  ('pornhub', 'none', 'inside'),
  ('pornstar', 'none', 'inside'),
  ('xvideos', 'none', 'inside'),
  ('xnxx', 'none', 'inside'),
  ('onlyfans', 'none', 'inside'),
  ('brazzers', 'none', 'inside'),
  ('sexchat', 'none', 'inside'),
  ('freesex', 'none', 'inside'),
  ('sextape', 'none', 'inside'),
  ('boobies', 'none', 'inside'),
  ('titties', 'none', 'inside'),
  ('penis', 'none', 'inside'),
  ('vagina', 'none', 'inside'),
  ('bigdick', 'none', 'inside'),
  ('mydick', 'none', 'inside'),
  ('bigcock', 'none', 'inside'),
  ('cocksucker', 'none', 'inside'),
  ('pussy', 'none', 'inside'),
  ('jizz', 'none', 'inside'),
  ('blowjob', 'none', 'inside'),
  ('handjob', 'none', 'inside'),
  ('rimjob', 'none', 'inside'),
  ('dildo', 'none', 'inside'),
  ('hentai', 'none', 'inside'),
  ('rapist', 'none', 'inside'),
  ('pedophile', 'none', 'inside'),
  ('paedophile', 'none', 'inside'),
  ('hitler', 'none', 'inside'),
  ('jackass', 'none', 'inside'),
  ('scunthorpe', 'allow', 'none'),
  ('therapist', 'allow', 'none'),
  ('pussycat', 'allow', 'none'),
  ('penistone', 'allow', 'none')
on conflict (word) do nothing;
update public.zchat_word_rules set pat = public.zchat_word_pat(word) where pat is distinct from public.zchat_word_pat(word);

create or replace function public.zchat_word_res()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'severe', string_agg(w.pat, '|') filter (where w.tier = 'severe'),
    'strong', string_agg(w.pat, '|') filter (where w.tier = 'strong'),
    'mild', string_agg(w.pat, '|') filter (where w.tier = 'mild'),
    'paired', string_agg(w.pat, '|') filter (where w.tier = 'paired'),
    'allow', string_agg(w.pat, '|') filter (where w.tier = 'allow'),
    'token', string_agg(w.pat, '|') filter (where w.names = 'token'),
    'inside', string_agg(w.pat, '|') filter (where w.names = 'inside'))
  from public.zchat_word_rules w
  where w.pat is not null and w.pat <> ''
$$;
revoke all on function public.zchat_word_res() from public, anon, authenticated;
grant execute on function public.zchat_word_res() to service_role;

create or replace function public.zchat_name_bad(p text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  f text := public.zchat_word_fold(left(coalesce(p, ''), 200));
  a text;
  j text;
  r jsonb;
  tok text;
  ins text;
  alw text;
begin
  if btrim(f) = '' then
    return false;
  end if;
  r := public.zchat_word_res();
  tok := r ->> 'token';
  ins := r ->> 'inside';
  alw := r ->> 'allow';
  a := translate(f, '0@41!|35$79', 'oaaiiiesstg');
  if tok is not null then
    tok := '(^|[^a-z])(' || tok || ')($|[^a-z])';
    if f ~ tok or a ~ tok then
      return true;
    end if;
  end if;
  if ins is not null then
    if alw is not null then
      a := regexp_replace(a, alw, ' ', 'g');
    end if;
    j := regexp_replace(a, '[^a-z' || chr(2944) || '-' || chr(3071) || chr(3456) || '-' || chr(3583) || ']', '', 'g');
    if j ~ ins then
      return true;
    end if;
  end if;
  return false;
end $$;
revoke all on function public.zchat_name_bad(text) from public, anon, authenticated;
grant execute on function public.zchat_name_bad(text) to service_role;

create or replace function public.zchat_comment_score(p text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  raw text := left(coalesce(p, ''), 2000);
  s text;
  r jsonb;
  tgt text := '(^|[^a-z])(you|u|ur|your|youre|yours|yourseif|ya|oya|oyaa|umba|umbe|thoo|nee|unaku|unakku|neenga|ninga)([^a-z]|$)';
  re text;
  score integer := 0;
  loose integer := 0;
  n integer;
  a integer;
  b integer;
  near boolean;
  pinged boolean;
  modern boolean := current_setting('server_version_num')::integer >= 150000;
  letters text;
begin
  if btrim(raw) = '' or raw ~ '^(sticker|gif):' then
    return 0;
  end if;
  pinged := raw ~ '@[A-Za-z0-9._]{3,}';
  s := translate(public.zchat_word_fold(raw), '0@41!|35$7', 'oaaiiiesst');
  r := public.zchat_word_res();
  re := r ->> 'severe';
  if re is not null then
    score := score + 3 * least(4, (select count(*) from regexp_matches(s, '(^|[^a-z])(' || re || ')(?=$|[^a-z])', 'g'))::integer);
  end if;
  re := r ->> 'strong';
  if re is not null then
    re := '(^|[^a-z])(' || re || ')(?=$|[^a-z])';
    if modern then
      for n in 1..2 loop
        a := regexp_instr(s, re, 1, n, 0, '', 2);
        exit when a = 0;
        b := regexp_instr(s, re, 1, n, 1, '', 2);
        near := pinged or substr(s, greatest(1, a - 18), b + 12 - greatest(1, a - 18)) ~ tgt;
        score := score + case when near then 3 else 2 end;
      end loop;
    else
      score := score + (case when pinged or s ~ tgt then 3 else 2 end) * least(2, (select count(*) from regexp_matches(s, re, 'g'))::integer);
    end if;
  end if;
  re := r ->> 'paired';
  if re is not null then
    re := '(^|[^a-z])((?:(?:you|u|youre|ya|oya|umba)[[:space:]]+(?:are[[:space:]]+|r[[:space:]]+|re[[:space:]]+|such[[:space:]]+an?[[:space:]]+|such[[:space:]]+|so[[:space:]]+|just[[:space:]]+|reaiiy[[:space:]]+|a[[:space:]]+|an[[:space:]]+|iook[[:space:]]+iike[[:space:]]+an?[[:space:]]+){0,3}|ur[[:space:]]+(?:are[[:space:]]+|r[[:space:]]+|re[[:space:]]+|such[[:space:]]+an?[[:space:]]+|such[[:space:]]+|so[[:space:]]+|just[[:space:]]+|reaiiy[[:space:]]+|a[[:space:]]+|an[[:space:]]+|iook[[:space:]]+iike[[:space:]]+an?[[:space:]]+){1,3})(?:' || re || '))(?=$|[^a-z])';
    score := score + 2 * least(2, (select count(*) from regexp_matches(s, re, 'g'))::integer);
  end if;
  re := r ->> 'mild';
  if re is not null then
    re := '(^|[^a-z])(' || re || ')(?=$|[^a-z])';
    if modern then
      for n in 1..3 loop
        a := regexp_instr(s, re, 1, n, 0, '', 2);
        exit when a = 0;
        b := regexp_instr(s, re, 1, n, 1, '', 2);
        near := pinged or substr(s, greatest(1, a - 18), b + 12 - greatest(1, a - 18)) ~ tgt;
        if near then
          score := score + 2;
        else
          loose := 1;
        end if;
      end loop;
    elsif s ~ re then
      if pinged or s ~ tgt then
        score := score + 2 * least(3, (select count(*) from regexp_matches(s, re, 'g'))::integer);
      else
        loose := 1;
      end if;
    end if;
  end if;
  score := score + loose;
  if score > 0 then
    letters := regexp_replace(raw, '[^A-Za-z]', '', 'g');
    if length(letters) >= 12 and length(regexp_replace(letters, '[^A-Z]', '', 'g'))::numeric / length(letters) > 0.7 then
      score := score + 1;
    end if;
  end if;
  return score;
end $$;
revoke all on function public.zchat_comment_score(text) from public, anon, authenticated;
grant execute on function public.zchat_comment_score(text) to service_role;

create or replace function public.zchat_text_offensive(p text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.zchat_comment_score(p) >= 2
$$;
revoke all on function public.zchat_text_offensive(text) from public, anon, authenticated;
grant execute on function public.zchat_text_offensive(text) to service_role;

create or replace function public.zchat_name_check(p_name text default null, p_username text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  return jsonb_build_object(
    'name', p_name is not null and public.zchat_name_bad(left(p_name, 120)),
    'username', p_username is not null and public.zchat_name_bad(left(p_username, 60)));
end $$;
revoke all on function public.zchat_name_check(text, text) from public, anon;
grant execute on function public.zchat_name_check(text, text) to authenticated;

create or replace function public.zchat_name_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.zchat_request_role() not in ('authenticated', 'anon') then
    return new;
  end if;
  if (tg_op = 'INSERT' or new.name is distinct from old.name) and public.zchat_name_bad(new.name) then
    raise exception using errcode = 'P0001', message = 'That name has a word we don''t allow. Try another one.', hint = 'zchat_bad_name';
  end if;
  if (tg_op = 'INSERT' or new.username is distinct from old.username) and public.zchat_name_bad(new.username) then
    raise exception using errcode = 'P0001', message = 'That username has a word we don''t allow. Try another one.', hint = 'zchat_bad_username';
  end if;
  return new;
end $$;
revoke all on function public.zchat_name_guard() from public, anon, authenticated;
drop trigger if exists zchat_name_guard on public.profiles;
create trigger zchat_name_guard before insert or update of name, username on public.profiles
  for each row execute function public.zchat_name_guard();

commit;

begin;

alter table public.profiles add column if not exists comment_filter boolean not null default true;
grant update (comment_filter) on public.profiles to authenticated;
do $pg$
begin
  if to_regprocedure('public.zchat_profile_grants()') is not null then
    perform public.zchat_profile_grants();
  end if;
end $pg$;

do $cf$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'post_comments' and column_name = 'filtered') then
    alter table public.post_comments add column filtered boolean not null default false;
    update public.post_comments c set filtered = true
      where public.zchat_text_offensive(c.content)
        and c.user_id is distinct from (select p.user_id from public.posts p where p.id = c.post_id);
  end if;
end $cf$;

create or replace function public.zchat_comment_mark()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if tg_op = 'UPDATE' and new.content is not distinct from old.content then
    if new.filtered is distinct from old.filtered and coalesce(current_setting('zchat.comment_show', true), '') <> 'on'
       and public.zchat_request_role() in ('authenticated', 'anon') then
      new.filtered := old.filtered;
    end if;
    return new;
  end if;
  select p.user_id into v_owner from public.posts p where p.id = new.post_id;
  new.filtered := new.user_id is distinct from v_owner and public.zchat_text_offensive(new.content);
  return new;
end $$;
revoke all on function public.zchat_comment_mark() from public, anon, authenticated;
drop trigger if exists zchat_comment_mark on public.post_comments;
create trigger zchat_comment_mark before insert or update on public.post_comments
  for each row execute function public.zchat_comment_mark();

create or replace function public.zchat_comment_visible(p_post uuid, p_author uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_author = auth.uid(), false) or exists (
    select 1 from public.posts p
    left join public.profiles pr on pr.id = p.user_id
    where p.id = p_post and (p.user_id = auth.uid() or pr.comment_filter is false))
$$;
revoke all on function public.zchat_comment_visible(uuid, uuid) from public;
grant execute on function public.zchat_comment_visible(uuid, uuid) to anon, authenticated, service_role;

drop policy if exists "zchat filtered comments" on public.post_comments;
create policy "zchat filtered comments" on public.post_comments as restrictive for select to anon, authenticated
  using (not filtered or public.zchat_comment_visible(post_id, user_id));

create or replace function public.zchat_comment_show(p_post uuid, p_comment text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  n integer := 0;
begin
  if me is null or not exists (select 1 from public.posts p where p.id = p_post and p.user_id = me) then
    return jsonb_build_object('ok', false);
  end if;
  perform set_config('zchat.comment_show', 'on', true);
  update public.post_comments c set filtered = false where c.post_id = p_post and c.id::text = p_comment and c.filtered;
  get diagnostics n = row_count;
  perform set_config('zchat.comment_show', '', true);
  return jsonb_build_object('ok', n > 0);
end $$;
revoke all on function public.zchat_comment_show(uuid, text) from public, anon;
grant execute on function public.zchat_comment_show(uuid, text) to authenticated;

create or replace function public.zchat_comment_notify()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  owner uuid;
  par_user uuid;
  body text;
  snippet text;
  meta jsonb;
  mid uuid;
  par_id text;
begin
  begin
    if tg_op = 'DELETE' then
      delete from public.notifications n where n.meta ->> 'comment_id' = old.id::text;
      return null;
    end if;
    if coalesce((to_jsonb(new) ->> 'filtered')::boolean, false) then
      return null;
    end if;
    body := coalesce(to_jsonb(new) ->> 'content', to_jsonb(new) ->> 'text', '');
    snippet := case when body like 'sticker:%' or body like 'gif:%' then null else left(body, 120) end;
    meta := jsonb_build_object('comment_id', new.id::text);
    select p.user_id into owner from public.posts p where p.id = new.post_id;
    par_id := to_jsonb(new) ->> 'parent_id';
    if par_id is not null then
      execute 'select user_id from public.post_comments where id::text = $1' into par_user using par_id;
    end if;
    if par_user is not null and par_user <> new.user_id then
      perform public.zchat_notify(par_user, new.user_id, 'reply', new.post_id, snippet, meta);
    end if;
    if owner is not null and owner <> new.user_id and owner is distinct from par_user then
      perform public.zchat_notify(owner, new.user_id, 'comment', new.post_id, snippet, meta);
    end if;
    for mid in select * from public.zchat_mentioned_users(body, 5) loop
      if mid <> new.user_id and mid is distinct from owner and mid is distinct from par_user
        and public.zchat_can_interact_as(new.user_id, 'mention', mid) then
        perform public.zchat_notify(mid, new.user_id, 'mention', new.post_id, snippet, meta);
      end if;
    end loop;
  exception when others then
    raise notice 'comment notify skipped: %', sqlerrm;
  end;
  return null;
end $function$;

commit;

begin;

create or replace function public.zchat_mfa_pending()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  claims jsonb;
begin
  if me is null then
    return false;
  end if;
  begin
    claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    claims := null;
  end;
  if coalesce(claims ->> 'aal', 'aal1') = 'aal2' then
    return false;
  end if;
  if to_regclass('auth.mfa_factors') is null then
    return false;
  end if;
  return exists (select 1 from auth.mfa_factors f where f.user_id = me and f.status::text = 'verified');
end $$;
revoke all on function public.zchat_mfa_pending() from public;
grant execute on function public.zchat_mfa_pending() to anon, authenticated, service_role;

create or replace function public.zchat_apply_mfa_gate()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select c.relname from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and c.relrowsecurity
      and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname and p.policyname = 'zchat 2fa')
  loop
    execute format('create policy "zchat 2fa" on public.%I as restrictive for all to authenticated using ((select not public.zchat_mfa_pending())) with check ((select not public.zchat_mfa_pending()))', r.relname);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.zchat_apply_mfa_gate() from public, anon, authenticated;
grant execute on function public.zchat_apply_mfa_gate() to service_role;

select public.zchat_apply_mfa_gate();

do $st$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;
  if not exists (select 1 from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and p.policyname = 'zchat 2fa files') then
    execute 'create policy "zchat 2fa files" on storage.objects as restrictive for all to authenticated using ((select not public.zchat_mfa_pending())) with check ((select not public.zchat_mfa_pending()))';
  end if;
exception when others then
  raise notice 'zchat: file rules for 2FA were not added: %', sqlerrm;
end $st$;

do $pr$
declare
  cur text;
  inner_fn text;
  src text;
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    return;
  end if;
  select substring(c from '^pgrst\.db_pre_request=(.*)$') into cur
    from pg_db_role_setting d, unnest(coalesce(d.setconfig, '{}'::text[])) c
    where c like 'pgrst.db_pre_request=%'
      and d.setrole in (0, (select oid from pg_roles where rolname = 'authenticator'))
      and d.setdatabase in (0, (select oid from pg_database where datname = current_database()))
    order by (d.setrole <> 0) desc, (d.setdatabase <> 0) desc
    limit 1;
  cur := nullif(btrim(coalesce(cur, ''), ' "'''), '');
  if cur is not null and lower(cur) in ('public.zchat_mfa_gate', 'zchat_mfa_gate') then
    select pg_get_functiondef(p.oid) into src from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'zchat_mfa_gate' limit 1;
    inner_fn := substring(coalesce(src, '') from 'perform ([A-Za-z0-9_."]+)\(\);');
  else
    inner_fn := cur;
  end if;
  if inner_fn is not null and to_regprocedure(inner_fn || '()') is null then
    raise notice 'zchat: the current pre request check % was not found, so 2FA runs on its own', inner_fn;
    inner_fn := null;
  end if;
  execute format($f$
create or replace function public.zchat_mfa_gate()
returns void
language plpgsql
set search_path = public
as $b$
begin
  if public.zchat_mfa_pending() and coalesce(current_setting('request.path', true), '') not in ('/rpc/zchat_session_state', '/rpc/zchat_session_claim') then
    raise exception using errcode = '42501', message = 'Enter your 2FA code to continue.', hint = 'zchat_mfa';
  end if;
  %s
end $b$
$f$, case when inner_fn is not null then format('perform %s();', inner_fn) else '' end);
  revoke all on function public.zchat_mfa_gate() from public;
  grant execute on function public.zchat_mfa_gate() to anon, authenticated, service_role;
  execute 'alter role authenticator set pgrst.db_pre_request = ''public.zchat_mfa_gate''';
  notify pgrst, 'reload config';
exception when others then
  raise notice 'zchat: the 2FA request check was not switched on: %', sqlerrm;
end $pr$;

commit;

notify pgrst, 'reload schema';
