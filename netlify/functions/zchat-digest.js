import { createHash } from 'node:crypto';

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co').replace(/\/+$/, '');
const RESEND_URL = (process.env.RESEND_API_URL || 'https://api.resend.com').replace(/\/+$/, '');
const SITE = (process.env.ZCHAT_SITE_URL || 'https://getzchat.com').replace(/\/+$/, '');
const FROM = process.env.RESEND_FROM || process.env.ZCHAT_MAIL_FROM || 'ZChat <hello@getzchat.com>';
const PURPLE = '#7C5CFC';
const BATCH = 50;
const warned = { key: false, db: false };

async function rpc(name, args) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} answered ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';
const cleanName = (name) => String(name || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 60) || 'Someone';

function whoLine(senders) {
  const a = firstName(senders[0].name);
  if (senders.length === 1) return a;
  if (senders.length === 2) return `${a} and ${firstName(senders[1].name)}`;
  return `${a} and ${senders.length - 1} others`;
}

export function composeDigest(row) {
  const senders = (Array.isArray(row.senders) ? row.senders : []).map((s) => ({ name: cleanName(s && s.name), n: Math.max(1, Number(s && s.n) || 1) }));
  const shown = senders.slice(0, 6);
  const more = senders.length - shown.length;
  const total = senders.reduce((t, s) => t + s.n, 0);
  const unsub = `${SITE}/.netlify/functions/zchat-appux?unsub=${encodeURIComponent(row.token)}`;
  const open = `${SITE}/`;
  const hi = firstName(row.name);
  const subject = `${whoLine(senders)} wrote to you on ZChat`;
  const lead = `You have ${plural(total, 'message', 'messages')} waiting in ZChat. Here is who wrote while you were away.`;
  const rows = shown.map((s) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #EEEBF7;font-size:15px;color:#17151F;font-weight:600">${esc(s.name)}</td>
              <td style="padding:10px 0;border-bottom:1px solid #EEEBF7;font-size:14px;color:#6C6A78;text-align:right;white-space:nowrap">${plural(s.n, 'message', 'messages')}</td>
            </tr>`).join('');
  const moreRow = more > 0 ? `
            <tr><td colspan="2" style="padding:10px 0 0;font-size:14px;color:#6C6A78">and ${plural(more, 'more person', 'more people')}</td></tr>` : '';
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F2FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2FA;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#FFFFFF;border-radius:20px;padding:28px 26px">
        <tr><td>
          <img src="${SITE}/icon-192.png" width="44" height="44" alt="ZChat" style="display:block;border-radius:12px;border:0">
          <h1 style="margin:20px 0 6px;font-size:21px;line-height:1.3;color:#17151F;font-weight:700">Hi ${esc(hi)},</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#3C3A47">${esc(lead)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${moreRow}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 6px">
            <tr><td style="border-radius:12px;background:${PURPLE}">
              <a href="${open}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:12px">Open ZChat</a>
            </td></tr>
          </table>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.55;color:#8A8796">We only write when messages have waited a day and you have not opened ZChat since, and never more than once a day. Nothing anyone wrote is in this email.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#9A97A6;max-width:460px">You get this because Email me about missed messages is on in your ZChat settings. <a href="${unsub}" style="color:${PURPLE}">Turn these emails off</a></p>
    </td></tr>
  </table>
</body>
</html>`;
  const text = [
    `Hi ${hi},`,
    '',
    lead,
    '',
    ...shown.map((s) => `${s.name}: ${plural(s.n, 'message', 'messages')}`),
    ...(more > 0 ? [`and ${plural(more, 'more person', 'more people')}`] : []),
    '',
    `Open ZChat: ${open}`,
    '',
    'We only write when messages have waited a day and you have not opened ZChat since, and never more than once a day.',
    `Turn these emails off: ${unsub}`,
  ].join('\n');
  return {
    from: FROM,
    to: [row.email],
    subject,
    html,
    text,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

async function sendBatch(rows) {
  const hour = new Date().toISOString().slice(0, 13);
  const idem = createHash('sha256').update(`${hour}|${rows.map((r) => r.user_id).join(',')}`).digest('hex').slice(0, 40);
  const res = await fetch(`${RESEND_URL}/emails/batch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `zchat-digest-${idem}` },
    body: JSON.stringify(rows.map(composeDigest)),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`zchat digest: Resend answered ${res.status}`, body.slice(0, 300));
    return false;
  }
  return true;
}

export async function runDigest() {
  if (!process.env.RESEND_API_KEY) {
    if (!warned.key) { console.log('zchat digest: RESEND_API_KEY is not set, so no emails go out'); warned.key = true; }
    return { sent: 0, off: true };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (!warned.db) { console.log('zchat digest: SUPABASE_SERVICE_ROLE_KEY is not set, so no emails go out'); warned.db = true; }
    return { sent: 0, off: true };
  }
  let due = [];
  try {
    due = await rpc('zchat_digest_due', { p_limit: 200 });
  } catch (err) {
    console.error('zchat digest: could not read who to email', err && err.message);
    return { sent: 0, error: true };
  }
  const rows = (Array.isArray(due) ? due : []).filter((r) => r && r.user_id && r.token && typeof r.email === 'string' && r.email.includes('@') && Array.isArray(r.senders) && r.senders.length);
  let sent = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    let ok = false;
    try { ok = await sendBatch(chunk); } catch (err) { console.error('zchat digest: send failed', err && err.message); }
    if (!ok) continue;
    try { await rpc('zchat_digest_mark', { p_users: chunk.map((r) => r.user_id) }); } catch (err) { console.error('zchat digest: could not mark as sent', err && err.message); }
    sent += chunk.length;
  }
  if (rows.length) console.log(`zchat digest: ${sent} of ${rows.length} sent`);
  return { sent };
}

export default async () => {
  const out = await runDigest();
  return new Response(JSON.stringify(out), { status: 200, headers: { 'content-type': 'application/json' } });
};

export const config = { schedule: '@hourly' };
