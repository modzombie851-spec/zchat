import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import {
  BirthdayPicker,
  FONT,
  HiddenPhotoIcon,
  IgToggle,
  LoadFail,
  PillButton,
  Portal,
  SegmentedControl,
  Spinner,
  TermsCheck,
  adminDate,
  ageFromBirth,
  ageHoldSet,
  appSnack,
  birthIso,
  formatCount,
  hapticTap,
  primaryBtn,
  rpcMissing,
  saveAgeTerms,
  useTheme,
  zchatSafety,
} from '../App.jsx';

const SR_ONLY = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
const STATUS = { green: '#0CA30C', amber: '#FAB219' };
const STATE_WORD = { green: 'Good', amber: 'Check', red: 'Problem', off: 'Off' };

export function LaunchTermsSheet({ need, onDone, onLeave }) {
  const { theme } = useTheme();
  const [dob, setDob] = useState({ d: '', m: '', y: '' });
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [young, setYoung] = useState(!!(need && need.young));
  const askAge = !!(need && need.age);
  const iso = askAge ? birthIso(dob) : null;
  const ready = (!askAge || !!iso) && terms && !busy;
  const save = async () => {
    if (!ready) return;
    if (askAge) {
      const a = ageFromBirth(iso);
      if (a == null || a < 0 || a > 120) { setErr('Check the date and try again.'); return; }
    }
    setBusy(true);
    setErr('');
    const r = await saveAgeTerms(iso, 'prompt');
    setBusy(false);
    if (r === 'young') { ageHoldSet(); setYoung(true); return; }
    if (r === 'error') { setErr('That did not save. Check your connection and try again.'); return; }
    hapticTap();
    onDone();
  };
  const look = { field: theme.soft, ink: theme.ink, muted: theme.muted, font: FONT };
  const tick = { ink: theme.ink, accent: theme.coral, box: theme.muted, font: FONT };
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 1900, background: 'rgba(5,8,16,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div role="dialog" aria-modal="true" aria-label={young ? 'ZChat is for people 13 and older' : 'Confirm your birthday and the terms'} className="zchat-sheet-up"
          style={{ width: '100%', maxWidth: 520, background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '22px 20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', boxSizing: 'border-box', maxHeight: '92%', overflowY: 'auto' }}>
          {young ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>Thanks for being here</div>
              <div style={{ fontSize: 14.5, color: theme.muted, lineHeight: 1.55, marginTop: 8 }}>ZChat is for people 13 and older, so this account cannot be used yet. If the date was a mistake, ask a parent or guardian to email support@getzchat.com.</div>
              <button type="button" onClick={onLeave} className="zchat-press" style={{ ...primaryBtn(theme, false), marginTop: 22 }}>Log out</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>{askAge ? 'A quick check' : 'We updated our terms'}</div>
              <div style={{ fontSize: 14.5, color: theme.muted, lineHeight: 1.55, marginTop: 8, marginBottom: askAge ? 18 : 4 }}>
                {askAge ? 'Add your birthday and agree to the Terms and the Privacy Policy to keep using ZChat. Your birthday stays private and never shows on your profile.' : 'Please read them and agree to keep using ZChat.'}
              </div>
              {askAge && <BirthdayPicker value={dob} onChange={(v) => { setErr(''); setDob(v); }} look={look} />}
              <TermsCheck on={terms} onChange={setTerms} look={tick} />
              {err && <div role="alert" style={{ color: theme.danger, fontSize: 13.5, fontWeight: 600, marginTop: 12, lineHeight: 1.45 }}>{err}</div>}
              <button type="button" onClick={save} disabled={!ready} className="zchat-press" style={{ ...primaryBtn(theme, !ready), marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{busy ? <Spinner /> : 'Continue'}</button>
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button type="button" onClick={onLeave} style={{ background: 'none', border: 'none', color: theme.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, padding: 6 }}>Log out</button>
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}

function statusColor(theme, s) {
  if (s === 'red') return theme.danger;
  if (s === 'amber') return STATUS.amber;
  if (s === 'green') return STATUS.green;
  return theme.muted;
}

function StateIcon({ state, size = 18 }) {
  const { theme } = useTheme();
  const c = statusColor(theme, state);
  const p = { width: size, height: size, viewBox: '0 0 20 20', 'aria-hidden': 'true', style: { flexShrink: 0, display: 'block' } };
  if (state === 'green') return <svg {...p}><circle cx="10" cy="10" r="9" fill={c} /><path d="M6 10.4l2.6 2.6L14.1 7.5" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (state === 'amber') return <svg {...p}><path d="M10 2.2l8.3 14.6H1.7z" fill={c} stroke={c} strokeWidth="1.8" strokeLinejoin="round" /><path d="M10 7.4v4.4" stroke="#0B0B0B" strokeWidth="2" strokeLinecap="round" /><circle cx="10" cy="14.4" r="1.1" fill="#0B0B0B" /></svg>;
  if (state === 'red') return <svg {...p}><circle cx="10" cy="10" r="9" fill={c} /><path d="M7 7l6 6M13 7l-6 6" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" /></svg>;
  return <svg {...p}><circle cx="10" cy="10" r="8.2" fill="none" stroke={c} strokeWidth="1.6" /><path d="M6.6 10h6.8" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>;
}

function fmtBytes(n) {
  const v = Number(n) || 0;
  if (v < 1024) return `${v} B`;
  const u = ['KB', 'MB', 'GB', 'TB'];
  let x = v / 1024;
  let i = 0;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i += 1; }
  return `${x >= 100 ? Math.round(x) : x.toFixed(1).replace(/\.0$/, '')} ${u[i]}`;
}
function fmtMs(ms) {
  const v = Number(ms) || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')} seconds` : `${Math.round(v)} ms`;
}
function count(n, one, more) {
  const v = Number(n) || 0;
  return `${formatCount(v)} ${v === 1 ? one : more}`;
}
function spanText(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s < 90) return count(s, 'second', 'seconds');
  const m = Math.round(s / 60);
  if (m < 90) return count(m, 'minute', 'minutes');
  return count(Math.round(m / 60), 'hour', 'hours');
}
function agoText(ts, now) {
  const t = Date.parse(ts || '');
  if (!t) return 'never';
  const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${count(Math.round(s / 60), 'minute', 'minutes')} ago`;
  if (s < 172800) return `${count(Math.round(s / 3600), 'hour', 'hours')} ago`;
  return `${count(Math.floor(s / 86400), 'day', 'days')} ago`;
}
function jobName(n) {
  return String(n || 'job').replace(/^zchat[-_ ]+/i, '').replace(/[-_]+/g, ' ').trim() || 'job';
}
const BLOCK_WORDS = { disposable: 'Temporary email', hook_disposable: 'Temporary email', profile_disposable: 'Temporary email', device: 'Busy phone', net: 'Busy network', net_hour: 'Busy network', hook_net: 'Busy network', bot: 'Hidden field filled', pass: 'Missed the quick check' };

function healthItems(h, now) {
  const out = [];
  const plan = h.db && h.db.plan === 'pro' ? 'pro' : 'free';
  const b = h.backups || {};
  const last = Date.parse(b.last || '') || 0;
  const days = last ? (now - last) / 86400000 : null;
  out.push({
    k: 'backup', title: 'Backups', state: b.error ? 'off' : !last || days > 8 ? 'red' : 'green',
    value: last ? `Last backup ${agoText(b.last, now)}${b.size ? `, ${fmtBytes(b.size)}` : ''}` : 'No backup yet',
    note: b.error ? 'Backups switch on once the latest ZChat setup is finished.'
      : !last ? 'No backup has been recorded. Run ZChat backup once from the Actions tab on GitHub. After that it runs every week.'
        : days > 8 ? `The newest backup is ${count(Math.floor(days), 'day', 'days')} old. Open the Actions tab on GitHub and check the ZChat backup run.`
          : `${count(b.month || 1, 'backup', 'backups')} in the last 30 days. Each one is kept for 30 days.`,
    foot: plan === 'pro' ? 'Supabase also keeps its own daily backups for 7 days on the Pro plan.' : 'On the Pro plan Supabase also keeps its own daily backups for 7 days. On the Free plan this weekly backup is your only copy.',
  });
  const dbLimit = plan === 'pro' ? 8 * 1024 ** 3 : 500 * 1024 ** 2;
  const dbBytes = Number(h.db && h.db.bytes) || 0;
  const dbPct = dbBytes / dbLimit;
  out.push({
    k: 'db', title: 'Database size', state: !h.db || h.db.error ? 'off' : dbPct >= 0.9 ? 'red' : dbPct >= 0.7 ? 'amber' : 'green',
    value: `${fmtBytes(dbBytes)} of ${fmtBytes(dbLimit)}`, pct: dbPct, plan,
    note: dbPct >= 0.9 ? (plan === 'free' ? 'The database is almost full. On the Free plan it stops taking new data when it is full. Clear old data or move to Pro.' : 'The database is close to the size included in Pro. More space costs extra.') : dbPct >= 0.7 ? `The database is ${Math.round(dbPct * 100)}% full.` : '',
  });
  const c = h.conn || {};
  const cPct = c.max ? (Number(c.total) || 0) / c.max : 0;
  let cState = c.error || !c.max ? 'off' : 'green';
  let cNote = '';
  if (cState === 'green') {
    if (cPct >= 0.85) { cState = 'red'; cNote = 'Almost every database connection is in use, so new requests may fail. Look for a stuck job or a sudden spike in traffic.'; }
    else if (c.long > 0) { cState = 'amber'; cNote = `${count(c.long, 'query has', 'queries have')} been running for more than a minute. The longest has run for ${spanText(c.longest_s)}.`; }
    else if (cPct >= 0.6) { cState = 'amber'; cNote = 'More than half of the connections are in use.'; }
    else if (c.idle_tx >= 5) { cState = 'amber'; cNote = `${count(c.idle_tx, 'connection is', 'connections are')} stuck in an open transaction.`; }
  }
  out.push({ k: 'conn', title: 'Connections', state: cState, value: c.max ? `${formatCount(c.total || 0)} of ${formatCount(c.max)} in use` : '', pct: cPct, note: cNote });
  const s = h.slow || {};
  const top = Array.isArray(s.top) ? s.top : [];
  const worst = top.reduce((m, q) => Math.max(m, Number(q.mean_ms) || 0), 0);
  out.push({
    k: 'slow', title: 'Slow queries', state: s.off || s.error ? 'off' : worst >= 2000 ? 'red' : worst >= 500 ? 'amber' : 'green',
    value: s.off || s.error ? '' : top.length ? `The slowest takes ${fmtMs(worst)} on average` : 'Nothing slow so far',
    note: s.off ? 'Turn on the query statistics extension in Supabase, under Database and then Extensions, to see slow queries here.' : s.error ? 'Query statistics could not be read.' : worst >= 500 ? 'Some queries are slow on average. The slowest are below and may need an index.' : '',
    list: worst >= 500 ? top.slice(0, 3) : [],
  });
  const j = h.jobs || {};
  const jobs = Array.isArray(j.list) ? j.list : [];
  const on = jobs.filter((x) => x.active !== false);
  const failing = on.filter((x) => x.last_error);
  const stale = on.filter((x) => !x.last_error && (!x.last_run || now - Date.parse(x.last_run) > 5 * 60000));
  out.push({
    k: 'jobs', title: 'Background jobs', state: j.off || j.error ? 'off' : failing.length ? 'red' : stale.length ? 'amber' : 'green',
    value: j.off || j.error ? '' : `${formatCount(on.length)} of ${count(jobs.length, 'job', 'jobs')} switched on`,
    note: j.off ? 'The background job table was not found.' : j.error ? 'The background job table could not be read.'
      : failing.length ? `${count(failing.length, 'job is', 'jobs are')} failing. The error is shown under each one.`
        : stale.length ? `${count(stale.length, 'job has', 'jobs have')} not run in the last 5 minutes.` : '',
    jobs: j.off || j.error ? [] : jobs,
  });
  const cr = h.cron || {};
  let crState = cr.off || cr.error ? 'off' : 'green';
  let crNote = cr.off ? 'Scheduled jobs were not found.' : cr.error ? 'The run history could not be read.' : '';
  if (crState === 'green') {
    if (cr.fail_hour > 0) { crState = 'red'; crNote = `${count(cr.fail_hour, 'run', 'runs')} failed in the last hour.`; }
    else if (cr.fail_day > 0) { crState = 'amber'; crNote = `${count(cr.fail_day, 'run', 'runs')} failed in the last 24 hours.`; }
    else if (cr.stuck > 0) { crState = 'amber'; crNote = `${count(cr.stuck, 'run has', 'runs have')} been going for more than 10 minutes.`; }
    else if (cr.rows > 2000000) { crState = 'amber'; crNote = `The run history holds about ${formatCount(cr.rows)} rows. Clearing rows older than a week keeps the database small.`; }
    if (crState !== 'green' && cr.last_fail && cr.last_fail.msg) crNote += ` Latest from ${jobName(cr.last_fail.job)}: ${cr.last_fail.msg}`;
  }
  out.push({ k: 'cron', title: 'Scheduled runs', state: crState, value: crState === 'off' ? '' : `${count(cr.runs_day || 0, 'run', 'runs')} in 24 hours`, note: crNote });
  const nt = h.net || {};
  const ntState = nt.off || nt.error ? 'off' : nt.fail_hour >= 10 ? 'red' : nt.fail > 0 ? 'amber' : 'green';
  const ntLast = nt.last_fail ? ` Latest: ${nt.last_fail.code ? `code ${nt.last_fail.code}, ` : ''}${nt.last_fail.msg || 'no reply'}` : '';
  out.push({
    k: 'net', title: 'Outgoing web calls', state: ntState,
    value: ntState === 'off' ? '' : `${formatCount(nt.fail || 0)} of ${formatCount(nt.total || 0)} failed in 6 hours`,
    note: nt.off ? 'Web calls from the database are not set up here.' : nt.error ? 'Web call results could not be read.' : nt.fail > 0 ? `Calls from the database to other services are failing.${ntLast}` : '',
  });
  const st = h.storage || {};
  const stLimit = plan === 'pro' ? 100 * 1024 ** 3 : 1024 ** 3;
  const stBytes = Number(st.bytes) || 0;
  const stPct = stBytes / stLimit;
  out.push({
    k: 'storage', title: 'File storage', state: st.off || st.error ? 'off' : stPct >= 0.9 ? 'red' : stPct >= 0.7 ? 'amber' : 'green',
    value: st.off || st.error ? '' : `${fmtBytes(stBytes)} of ${fmtBytes(stLimit)}`, pct: st.off || st.error ? null : stPct,
    note: st.off ? 'File storage was not found.' : st.error ? 'File storage could not be measured.' : stPct >= 0.9 ? 'Storage is almost full. New photos and videos may fail to upload.' : stPct >= 0.7 ? `Storage is ${Math.round(stPct * 100)}% full.` : '',
    buckets: Array.isArray(st.buckets) ? st.buckets.slice(0, 4) : [],
  });
  const sg = h.signups || {};
  const hours = Array.isArray(sg.hours) ? sg.hours.map((x) => ({ h: x.h, n: Number(x.n) || 0 })) : [];
  const lastN = hours.length ? hours[hours.length - 1].n : 0;
  const before = hours.slice(0, -1);
  const avg = before.length ? before.reduce((a, x) => a + x.n, 0) / before.length : 0;
  let sgState = sg.error ? 'off' : 'green';
  let sgNote = '';
  if (sgState === 'green' && lastN >= Math.max(60, avg * 8)) { sgState = 'red'; sgNote = 'Sign ups jumped a lot in the last hour. Check the newest people for fake accounts.'; }
  else if (sgState === 'green' && lastN >= Math.max(15, avg * 4)) { sgState = 'amber'; sgNote = 'More sign ups than usual this hour. Check the newest people for fake accounts.'; }
  const stopped = {};
  Object.entries(sg.blocked || {}).forEach(([k, n]) => { const w = BLOCK_WORDS[k]; if (w) stopped[w] = (stopped[w] || 0) + (Number(n) || 0); });
  out.push({
    k: 'signups', title: 'Sign ups', state: sgState, value: sg.error ? '' : `${count(hours.reduce((a, x) => a + x.n, 0), 'new account', 'new accounts')} in 24 hours`, note: sgNote,
    hours, stopped, human: Number(sg.human) || 0, passes: Number(sg.passes) || 0, passRule: sg.pass_rule === 'on',
  });
  const ph = h.photos || {};
  const waitMin = ph.oldest ? (now - Date.parse(ph.oldest)) / 60000 : 0;
  let phState = ph.error ? 'off' : 'green';
  let phNote = '';
  if (phState === 'green') {
    if (waitMin > 360) { phState = 'red'; phNote = 'Photo checks are not running. Check the Gemini key on Netlify and that the photo sweep function is deployed.'; }
    else if (waitMin > 30) { phState = 'amber'; phNote = 'Some photos have waited more than 30 minutes for a check.'; }
    else if (ph.stuck > 0) { phState = 'amber'; phNote = `${count(ph.stuck, 'photo', 'photos')} could not be checked after 5 tries.`; }
    else if (ph.waiting > 0) phNote = `${count(ph.waiting, 'photo is', 'photos are')} waiting for a check.`;
    if (phState !== 'green' && ph.last_error) phNote += ` Last error: ${ph.last_error}.`;
  }
  out.push({
    k: 'photos', title: 'Photo checks', state: phState,
    value: ph.error ? '' : `${formatCount(ph.checked_day || 0)} checked today, ${formatCount(ph.flagged_day || 0)} flagged`,
    note: ph.error ? 'Photo checks switch on once the latest ZChat setup is finished.' : phNote, open: Number(ph.open) || 0,
  });
  const cs = h.crashes || {};
  out.push({
    k: 'crashes', title: 'Crash reports', state: cs.off || cs.error ? 'off' : cs.hour >= 20 ? 'red' : cs.day >= 20 ? 'amber' : 'green',
    value: cs.off || cs.error ? '' : `${formatCount(cs.day || 0)} in 24 hours, ${formatCount(cs.hour || 0)} in the last hour`,
    note: cs.off ? 'Crash reports are not set up here.' : cs.error ? 'Crash reports could not be read.' : cs.hour >= 20 ? 'Many crashes in the last hour. The most common one is below.' : cs.day >= 20 ? 'More crashes than usual today. The most common one is below.' : '',
    top: cs.top && cs.top.msg ? cs.top : null,
  });
  return out;
}

function Meter({ pct, state }) {
  const { theme } = useTheme();
  const c = state === 'red' ? theme.danger : state === 'amber' ? STATUS.amber : theme.coral;
  return (
    <div aria-hidden="true" style={{ position: 'relative', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 10 }}>
      <div style={{ position: 'absolute', inset: 0, background: c, opacity: 0.18 }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(1.5, Math.min(100, (Number(pct) || 0) * 100))}%`, background: c, borderRadius: 3 }} />
    </div>
  );
}

function SignupBars({ hours }) {
  const { theme } = useTheme();
  const [active, setActive] = useState(null);
  const n = hours.length;
  if (!n) return null;
  const W = 340;
  const H = 98;
  const top = 16;
  const base = 76;
  const slot = W / n;
  const bw = Math.min(24, Math.max(3, slot - 2));
  const max = Math.max(1, ...hours.map((x) => x.n));
  const y = (v) => base - (v / max) * (base - top);
  const hourOf = (i) => { const d = new Date(hours[i].h); return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:00`; };
  let peak = 0;
  hours.forEach((x, i) => { if (x.n > hours[peak].n) peak = i; });
  const total = hours.reduce((a, x) => a + x.n, 0);
  const marks = [...new Set([peak, n - 1])].filter((i) => hours[i].n > 0);
  return (
    <div style={{ position: 'relative', marginTop: 12 }} onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(null); }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`New accounts each hour for the last 24 hours, ${total} in total`} style={{ display: 'block', overflow: 'visible', fontFamily: FONT }}>
        <line x1="0" x2={W} y1={base + 0.5} y2={base + 0.5} stroke={theme.border} strokeWidth="1" />
        {hours.map((x, i) => {
          const left = i * slot + (slot - bw) / 2;
          const yt = y(x.n);
          const r = Math.min(4, bw / 2, base - yt);
          const d = x.n > 0 ? `M${left},${base}V${yt + r}Q${left},${yt} ${left + r},${yt}H${left + bw - r}Q${left + bw},${yt} ${left + bw},${yt + r}V${base}Z` : null;
          return (
            <g key={x.h || i}>
              {d && <path d={d} fill={theme.coral} opacity={i === n - 1 || i === active ? 1 : 0.42} />}
              <rect x={i * slot} y="0" width={slot} height={base + 4} fill="transparent" style={{ cursor: 'pointer' }}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setActive(i); }} onClick={() => setActive(active === i ? null : i)} />
            </g>
          );
        })}
        {marks.map((i) => <text key={`v${i}`} x={i * slot + slot / 2} y={y(hours[i].n) - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={theme.ink}>{formatCount(hours[i].n)}</text>)}
        <text x="0" y={H - 2} fontSize="10.5" fill={theme.muted}>24 hours ago</text>
        <text x={W / 2} y={H - 2} fontSize="10.5" fill={theme.muted} textAnchor="middle">12 hours ago</text>
        <text x={W} y={H - 2} fontSize="10.5" fill={theme.muted} textAnchor="end">Now</text>
      </svg>
      {active != null && (
        <div role="status" style={{ position: 'absolute', top: -34, left: `${((active + 0.5) / n) * 100}%`, transform: `translateX(${active < 4 ? '-12%' : active > n - 5 ? '-88%' : '-50%'})`, background: theme.panelBg, color: theme.ink, borderRadius: 10, padding: '6px 10px', fontSize: 12.5, whiteSpace: 'nowrap', boxShadow: '0 6px 18px rgba(0,0,0,0.18)', pointerEvents: 'none' }}>
          <b style={{ fontWeight: 800 }}>{formatCount(hours[active].n)}</b>
          <span style={{ color: theme.muted, fontWeight: 600 }}>{` ${hours[active].n === 1 ? 'sign up' : 'sign ups'} from ${hourOf(active)}`}</span>
        </div>
      )}
      <table style={SR_ONLY}>
        <caption>New accounts each hour</caption>
        <tbody>{hours.map((x, i) => <tr key={x.h || i}><th scope="row">{hourOf(i)}</th><td>{x.n}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function HealthCard({ item, children }) {
  const { theme } = useTheme();
  const warn = item.state === 'red' || item.state === 'amber';
  return (
    <section aria-label={`${item.title}, ${STATE_WORD[item.state]}`} style={{ background: theme.rowBg, borderRadius: 16, padding: '14px 14px 14px', marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StateIcon state={item.state} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, color: theme.ink }}>{item.title}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: warn ? theme.ink : theme.muted }}>{STATE_WORD[item.state]}</div>
      </div>
      <div style={{ paddingLeft: 28 }}>
        {item.value && <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>}
        {item.pct != null && item.state !== 'off' && <Meter pct={item.pct} state={item.state} />}
        {item.note && <div style={{ fontSize: 13, color: warn ? theme.ink : theme.muted, lineHeight: 1.5, marginTop: 7, wordBreak: 'break-word' }}>{item.note}</div>}
        {children}
        {item.foot && <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, marginTop: 8 }}>{item.foot}</div>}
      </div>
    </section>
  );
}

const healthMem = { data: null, at: 0 };
export function AdminHealth({ onOpenPhotos }) {
  const { theme } = useTheme();
  const [h, setH] = useState(() => healthMem.data);
  const [at, setAt] = useState(() => healthMem.at || Date.now());
  const [fail, setFail] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    setFail(null);
    const { data, error } = await supabase.rpc('zchat_admin_health');
    setBusy(false);
    if (error) { setFail(rpcMissing(error) ? 'setup' : String(error.code || 'error')); return; }
    healthMem.data = data || {};
    healthMem.at = Date.now();
    setAt(healthMem.at);
    setH(healthMem.data);
  };
  useEffect(() => { load(); }, []);
  const setKey = async (k, v) => {
    hapticTap();
    if (healthMem.data) {
      const next = JSON.parse(JSON.stringify(healthMem.data));
      if (k === 'plan' && next.db) next.db.plan = v;
      if (k === 'signup_pass' && next.signups) next.signups.pass_rule = v;
      healthMem.data = next;
      setH(next);
    }
    const { data, error } = await supabase.rpc('zchat_admin_health_set', { p_key: k, p_value: v });
    if (error || !data || !data.ok) { appSnack('That setting did not save. Try again.'); load(); }
  };
  if (fail === 'setup') {
    return <div style={{ padding: '40px 8px', textAlign: 'center', fontSize: 14, color: theme.muted, lineHeight: 1.55 }}>Health checks switch on once the latest ZChat setup is finished.</div>;
  }
  if (fail && !h) return <LoadFail code={fail} onRetry={load} small />;
  if (!h) return <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}><Spinner size={22} color={theme.coral} /></div>;
  const items = healthItems(h, at);
  const reds = items.filter((x) => x.state === 'red').length;
  const ambers = items.filter((x) => x.state === 'amber').length;
  const overall = reds ? 'red' : ambers ? 'amber' : 'green';
  const headline = reds ? (reds === 1 ? '1 problem needs attention' : `${reds} problems need attention`) : ambers ? (ambers === 1 ? '1 thing needs a look' : `${ambers} things need a look`) : 'Everything looks good';
  const ordered = [...items].sort((a, b) => ({ red: 0, amber: 1, green: 2, off: 3 }[a.state] - { red: 0, amber: 1, green: 2, off: 3 }[b.state]));
  const mono = { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 11.5 };
  const row = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: theme.muted, padding: '5px 0' };
  return (
    <div style={{ paddingBottom: 8, opacity: busy && h ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, marginTop: 6, background: theme.rowBg }}>
        <StateIcon state={overall} size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>{headline}</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>{`Checked ${agoText(new Date(at).toISOString(), Date.now())}`}</div>
        </div>
        <div role="button" aria-label="Check again" onClick={() => { if (!busy) load(); }} className="zchat-press" style={{ fontSize: 13.5, fontWeight: 800, color: theme.coral, cursor: 'pointer', padding: '6px 2px' }}>{busy ? <Spinner size={14} color={theme.coral} /> : 'Check again'}</div>
      </div>
      {fail && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 600, padding: '10px 4px 0' }}>The newest check did not load. These are the last results.</div>}
      {ordered.map((it) => (
        <HealthCard key={it.k} item={it}>
          {it.k === 'db' && (
            <div style={{ marginTop: 12 }}>
              <SegmentedControl dense value={it.plan} onChange={(v) => { if (v !== it.plan) setKey('plan', v); }} options={[['free', 'Free plan'], ['pro', 'Pro plan']]} />
            </div>
          )}
          {it.k === 'slow' && it.list.map((q, i) => (
            <div key={i} style={{ marginTop: 8, padding: '8px 10px', borderRadius: 12, background: theme.soft }}>
              <div style={{ ...mono, color: theme.ink, wordBreak: 'break-word', lineHeight: 1.45 }}>{q.q}</div>
              <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 4 }}>{`${fmtMs(q.mean_ms)} on average, ${count(q.calls, 'call', 'calls')}`}</div>
            </div>
          ))}
          {it.k === 'jobs' && it.jobs.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {it.jobs.map((jb) => {
                const st = jb.active === false ? 'off' : jb.last_error ? 'red' : !jb.last_run || at - Date.parse(jb.last_run) > 5 * 60000 ? 'amber' : 'green';
                return (
                  <div key={jb.name} style={{ padding: '7px 0', borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StateIcon state={st} size={14} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: theme.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jobName(jb.name)}</div>
                      <div style={{ fontSize: 12, color: theme.muted, flexShrink: 0 }}>{jb.active === false ? 'Off' : `${agoText(jb.last_run, at)}${jb.last_ms != null ? `, ${fmtMs(jb.last_ms)}` : ''}`}</div>
                    </div>
                    {jb.last_error && <div style={{ ...mono, color: theme.ink, marginTop: 4, paddingLeft: 22, wordBreak: 'break-word', lineHeight: 1.45 }}>{String(jb.last_error).slice(0, 220)}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {it.k === 'storage' && it.buckets.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {it.buckets.map((bk) => (
                <div key={bk.bucket} style={row}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jobName(bk.bucket)}</span>
                  <span style={{ color: theme.ink, fontWeight: 700, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{`${fmtBytes(bk.bytes)}, ${count(bk.files, 'file', 'files')}`}</span>
                </div>
              ))}
            </div>
          )}
          {it.k === 'signups' && (
            <>
              <SignupBars hours={it.hours} />
              <div style={{ marginTop: 10 }}>
                {Object.keys(it.stopped).length === 0 ? (
                  <div style={{ fontSize: 12.5, color: theme.muted }}>No sign ups were stopped in the last 24 hours.</div>
                ) : Object.entries(it.stopped).map(([w, v]) => (
                  <div key={w} style={row}><span>{`Stopped: ${w.toLowerCase()}`}</span><span style={{ color: theme.ink, fontWeight: 700 }}>{formatCount(v)}</span></div>
                ))}
                <div style={row}><span>Passed the sign up check</span><span style={{ color: theme.ink, fontWeight: 700 }}>{formatCount(it.passes)}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${theme.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink }}>Require the sign up check</div>
                  <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.45, marginTop: 2 }}>New accounts need a fresh check from the ZChat server. Turn it on once people are passing it.</div>
                </div>
                <IgToggle on={it.passRule} onClick={() => setKey('signup_pass', it.passRule ? 'off' : 'on')} />
              </div>
            </>
          )}
          {it.k === 'photos' && onOpenPhotos && (
            <div role="button" onClick={onOpenPhotos} className="zchat-press" style={{ display: 'inline-block', marginTop: 10, fontSize: 13.5, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>
              {it.open ? `Review ${count(it.open, 'flagged photo', 'flagged photos')}` : 'Open flagged photos'}
            </div>
          )}
          {it.k === 'crashes' && it.top && (
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 12, background: theme.soft }}>
              <div style={{ ...mono, color: theme.ink, wordBreak: 'break-word', lineHeight: 1.45 }}>{it.top.msg}</div>
              <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 4 }}>{count(it.top.n, 'time', 'times')} today</div>
            </div>
          )}
        </HealthCard>
      ))}
    </div>
  );
}

const KIND_WORDS = { post: 'Post', posts: 'Post', story: 'Story', stories: 'Story', avatar: 'Profile photo', profiles: 'Profile photo', group: 'Group photo', groups: 'Group photo', message: 'Chat photo', messages: 'Chat photo' };
const REASON_WORDS = { nudity: 'nudity', sexual: 'sexual content', gore: 'graphic injury', violence: 'violence', unsafe: 'unsafe content' };
function flagKind(r) {
  const t = (r.targets || [])[0];
  if (t && t.tbl === 'profiles' && t.col === 'cover_url') return 'Cover photo';
  return KIND_WORDS[(t && t.tbl) || r.kind] || 'Photo';
}
function flagWhat(r) {
  const ts = r.targets || [];
  if (r.review === 'allow') return 'Allowed by an admin';
  if (r.review === 'hide') return 'Hidden by an admin';
  if (ts.some((t) => t.applied === 'hidden')) return 'Hidden after a later check';
  if (ts.some((t) => t.applied === 'blurred')) return 'Shown blurred to others';
  if (!ts.length) return 'Stopped before it was shared';
  return 'Flagged';
}
const flagsMem = {};
function FlagThumb({ url, open, onToggle }) {
  const { theme } = useTheme();
  const [gone, setGone] = useState(false);
  useEffect(() => { setGone(false); }, [url]);
  const box = { width: 76, height: 76, borderRadius: 12, overflow: 'hidden', flexShrink: 0, position: 'relative', background: theme.soft };
  if (!url || gone) {
    return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: theme.muted, padding: 6, boxSizing: 'border-box' }}>Removed</div>;
  }
  return (
    <div role="button" aria-label={open ? 'Blur photo' : 'Show photo'} onClick={onToggle} style={{ ...box, cursor: 'pointer' }}>
      <img src={url} alt="" onError={() => setGone(true)} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: open ? 'none' : 'blur(14px)', transform: open ? 'none' : 'scale(1.15)' }} />
      {!open && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'rgba(0,0,0,0.25)', color: '#FFFFFF' }}>
          <HiddenPhotoIcon size={18} color="#FFFFFF" />
          <div style={{ fontSize: 10.5, fontWeight: 800 }}>Tap to view</div>
        </div>
      )}
    </div>
  );
}

export function AdminPhotoFlags({ onOpenProfile }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('open');
  const [rows, setRows] = useState(() => flagsMem.open || null);
  const [fail, setFail] = useState(null);
  const [shown, setShown] = useState(() => new Set());
  const [signed, setSigned] = useState({});
  const [busy, setBusy] = useState('');
  const load = async (f) => {
    setFail(null);
    const { data, error } = await supabase.rpc('zchat_admin_photo_flags', { p_filter: f, p_limit: 60 });
    if (error) { setFail(rpcMissing(error) ? 'setup' : String(error.code || 'error')); return; }
    const list = Array.isArray(data) ? data : [];
    flagsMem[f] = list;
    setRows(list);
    const priv = list.map((r) => String(r.path || '')).filter((p) => p.indexOf('chat-private/') === 0);
    if (priv.length) {
      const r = await zchatSafety('photo_admin_urls', { paths: priv });
      if (r.status === 200 && r.data && r.data.urls) setSigned((m) => ({ ...m, ...r.data.urls }));
    }
  };
  useEffect(() => { setRows(flagsMem[filter] || null); load(filter); }, [filter]);
  const urlOf = (r) => {
    const p = String(r.path || '');
    if (p.indexOf('chat-private/') === 0) return signed[p] || null;
    const t = (r.targets || []).find((x) => /^https?:/.test(String(x.url || '')));
    if (t) return t.url;
    try { return supabase.storage.from('chat-media').getPublicUrl(p.slice('chat-media/'.length)).data.publicUrl || null; } catch { return null; }
  };
  const act = async (r, action) => {
    if (busy) return;
    hapticTap();
    setBusy(`${r.id}:${action}`);
    const { data, error } = await supabase.rpc('zchat_admin_photo_review', { p_id: r.id, p_action: action });
    setBusy('');
    if (error || !data || !data.ok) { appSnack('That did not work. Try again in a moment.'); return; }
    try { Promise.resolve(supabase.rpc('admin_log_action', { p_action: action === 'allow' ? 'Allowed a flagged photo' : action === 'hide' ? 'Hid a flagged photo' : 'Reviewed a flagged photo', p_target: r.user_id || null, p_detail: flagKind(r) })).catch(() => {}); } catch {}
    appSnack(action === 'allow' ? 'Allowed. Everyone can see it again.' : action === 'hide' ? 'Hidden from everyone else' : 'Marked as reviewed');
    load(filter);
  };
  const toggle = (id) => setShown((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, margin: '8px 2px 12px' }}>Photos the safety check flagged. Blocked photos never went public. Photos are blurred here until you tap them.</div>
      <SegmentedControl dense value={filter} onChange={setFilter} options={[['open', 'To review'], ['all', 'All']]} />
      {fail === 'setup' && <div style={{ padding: '36px 8px', textAlign: 'center', fontSize: 14, color: theme.muted, lineHeight: 1.55 }}>Photo checks switch on once the latest ZChat setup is finished.</div>}
      {fail && fail !== 'setup' && !rows && <LoadFail code={fail} onRetry={() => load(filter)} small />}
      {!fail && rows === null && <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner size={20} color={theme.coral} /></div>}
      {rows && rows.length === 0 && !fail && <div style={{ padding: '36px 8px', textAlign: 'center', fontSize: 14, color: theme.muted }}>{filter === 'open' ? 'Nothing to review right now.' : 'No flagged photos yet.'}</div>}
      {rows && rows.map((r) => {
        const ts = r.targets || [];
        const canAllow = r.review !== 'allow' && ts.some((t) => t.applied);
        const canHide = r.review !== 'hide' && (ts.some((t) => t.applied === 'blurred') || (r.review === 'allow' && ts.length > 0));
        return (
          <div key={r.id} style={{ display: 'flex', gap: 12, padding: 12, background: theme.rowBg, borderRadius: 16, marginTop: 10 }}>
            <FlagThumb url={urlOf(r)} open={shown.has(r.id)} onToggle={() => toggle(r.id)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: theme.ink }}>{`${flagKind(r)}, ${REASON_WORDS[r.reason] || (r.verdict === 'block' ? 'unsafe content' : 'borderline')}`}</div>
              <div style={{ fontSize: 12.5, color: theme.ink, marginTop: 3 }}>{flagWhat(r)}</div>
              <div role={r.user_id && onOpenProfile ? 'button' : undefined} onClick={() => { if (r.user_id && onOpenProfile) onOpenProfile({ id: r.user_id, username: r.username, name: r.name }); }}
                style={{ fontSize: 12.5, color: theme.muted, marginTop: 3, cursor: r.user_id && onOpenProfile ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {`${r.username ? `@${r.username}` : 'Unknown person'}, ${adminDate(r.created_at)}`}
              </div>
              {(canAllow || canHide || !r.review) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {canAllow && <PillButton small label={busy === `${r.id}:allow` ? 'Allowing' : 'Allow'} onClick={() => act(r, 'allow')} />}
                  {canHide && <PillButton small danger label={busy === `${r.id}:hide` ? 'Hiding' : 'Hide'} onClick={() => act(r, 'hide')} />}
                  {!r.review && <PillButton small label={busy === `${r.id}:dismiss` ? 'Saving' : 'Done'} onClick={() => act(r, 'dismiss')} />}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
