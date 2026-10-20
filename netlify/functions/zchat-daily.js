import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const ZONE = process.env.ZCHAT_TZ || 'Asia/Colombo';
const BUDGET_MS = 22000;

export const config = { schedule: '0,30 3-15 * * *' };

const momentDay = (now) => Math.floor(now / 86400000);
const momentAt = (day) => day * 86400000 + (210 + 30 * ((day * 7919 + 1237) % 25)) * 60000;
const firstName = (n) => String(n || 'A friend').trim().split(/\s+/)[0] || 'A friend';
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

function zoneParts(now, zone) {
  try {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(f.formatToParts(new Date(now)).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, md: `${p.month}-${p.day}`, year: Number(p.year), hour: Number(p.hour) };
  } catch { return null; }
}

function nameList(names) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
}

async function sendAll(supabase, jobs, deadline) {
  let sent = 0;
  for (let i = 0; i < jobs.length; i += 20) {
    if (Date.now() > deadline) break;
    const chunk = jobs.slice(i, i + 20);
    const res = await Promise.allSettled(chunk.map((j) => supabase.functions.invoke('hyper-worker', { body: j })));
    sent += res.filter((r) => r.status === 'fulfilled' && r.value && !r.value.error).length;
  }
  return sent;
}

async function claim(supabase, job) {
  const { data, error } = await supabase.rpc('zchat_claim_job', { p_job: job });
  if (error) { console.error('Claim failed', job, error.message); return false; }
  return data === true;
}

async function momentJob(supabase, now, deadline) {
  const day = momentDay(now);
  const at = momentAt(day);
  if (now < at - 120000 || now > at + 20 * 60000) return 'not now';
  if (!(await claim(supabase, `moment-${day}`))) return 'already sent';
  const { data, error } = await supabase.rpc('zchat_moment_targets');
  if (error) { console.error('Moment targets failed', error.message); return 'no targets'; }
  const jobs = (data || []).filter((r) => r && r.user_id).map((r) => ({
    user_id: r.user_id,
    title: 'Time for your daily moment \u{1F4F8}',
    body: 'You have 2 minutes to post on time. Show your friends what you are up to.',
    url: `/?moment=1&acc=${r.user_id}`,
  }));
  return sendAll(supabase, jobs, deadline);
}

async function birthdayJob(supabase, now, deadline) {
  const z = zoneParts(now, ZONE) || zoneParts(now, 'UTC');
  if (!z || z.hour < 9 || z.hour >= 21) return 'not now';
  if (!(await claim(supabase, `bday-${z.date}`))) return 'already sent';
  const leap = (z.year % 4 === 0 && z.year % 100 !== 0) || z.year % 400 === 0;
  const mds = z.md === '02-28' && !leap ? ['02-28', '02-29'] : [z.md];
  const { data, error } = await supabase.rpc('zchat_birthday_targets', { p_mds: mds });
  if (error) { console.error('Birthday targets failed', error.message); return 'no targets'; }
  const by = new Map();
  (data || []).forEach((r) => {
    if (!r || !r.user_id || !r.friend_id) return;
    if (!by.has(r.user_id)) by.set(r.user_id, []);
    by.get(r.user_id).push(r);
  });
  const jobs = [...by.entries()].map(([uid, list]) => {
    if (list.length === 1) {
      return { user_id: uid, title: `It is ${firstName(list[0].friend_name)}'s birthday today \u{1F382}`, body: 'Send them a wish', url: `/?dm=${list[0].friend_id}&acc=${uid}` };
    }
    return { user_id: uid, title: `${list.length} friends have birthdays today \u{1F382}`, body: `${nameList(list.map((x) => firstName(x.friend_name)))}. Send them a wish`, url: `/?acc=${uid}` };
  });
  return sendAll(supabase, jobs, deadline);
}

export default async () => {
  const now = Date.now();
  const deadline = now + BUDGET_MS;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(503, { error: 'Not set up yet' });
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const out = {};
  try { out.moment = await momentJob(supabase, now, deadline); } catch (err) { out.moment = 'failed'; console.error('Moment job failed', err && err.message); }
  try { out.birthdays = await birthdayJob(supabase, now, deadline); } catch (err) { out.birthdays = 'failed'; console.error('Birthday job failed', err && err.message); }
  return json(200, out);
};
