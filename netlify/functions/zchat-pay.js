import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reply = (status, body) => ({ statusCode: status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });

function readJson(name) {
  try { const v = JSON.parse(process.env[name] || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
function cleanUrl(u) {
  try { const x = new URL(String(u || '')); return x.protocol === 'https:' && /(^|\.)lemonsqueezy\.com$/i.test(x.hostname) ? x.toString() : null; } catch { return null; }
}
function coinPacks() {
  const list = readJson('ZCHAT_COIN_PACKS');
  return (Array.isArray(list) ? list : []).map((p) => ({
    variant: String(p.variant || p.variant_id || ''),
    coins: Math.floor(Number(p.coins) || 0),
    price: String(p.price || '').slice(0, 24),
    url: cleanUrl(p.url),
    tag: p.tag ? String(p.tag).slice(0, 24) : null,
  })).filter((p) => p.variant && p.coins > 0 && p.coins <= 1000000 && p.url);
}
function verifiedPlan() {
  const v = readJson('ZCHAT_VERIFIED_PLAN');
  if (!v || Array.isArray(v)) return null;
  const url = cleanUrl(v.url);
  const variant = String(v.variant || v.variant_id || '');
  if (!url || !variant) return null;
  return { variant, url, price: String(v.price || '').slice(0, 32) };
}
function rawBody(event) {
  const b = event.body || '';
  return event.isBase64Encoded ? Buffer.from(b, 'base64').toString('utf8') : b;
}
function signatureOk(raw, given) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !given) return false;
  const want = createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  const a = Buffer.from(want, 'utf8');
  const b = Buffer.from(String(given).trim(), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

async function onOrder(payload, refunded) {
  const attrs = (payload.data && payload.data.attributes) || {};
  const orderId = String((payload.data && payload.data.id) || attrs.identifier || '');
  if (!orderId) return reply(200, { ok: true, skipped: 'no order id' });
  if (refunded || attrs.status === 'refunded') {
    await rpc('zchat_refund_order', { p_order: orderId });
    return reply(200, { ok: true, refunded: true });
  }
  if (attrs.status !== 'paid') return reply(200, { ok: true, skipped: attrs.status || 'no status' });
  if (!(Number(attrs.total) > 0) && process.env.ZCHAT_ALLOW_FREE_ORDERS !== '1') return reply(200, { ok: true, skipped: 'free order' });
  const custom = (payload.meta && payload.meta.custom_data) || {};
  const userId = String(custom.user_id || '');
  if (!UUID.test(userId)) return reply(200, { ok: true, skipped: 'no user' });
  const item = attrs.first_order_item || {};
  const variant = String(item.variant_id || '');
  const pack = coinPacks().find((p) => p.variant === variant);
  if (!pack) return reply(200, { ok: true, skipped: 'not a coin pack' });
  const out = await rpc('zchat_credit_order', { p_order: orderId, p_user: userId, p_coins: pack.coins, p_variant: variant, p_total: Number(attrs.total) || null });
  return reply(200, { ok: true, result: out });
}

async function onSubscription(payload) {
  const attrs = (payload.data && payload.data.attributes) || {};
  const plan = verifiedPlan();
  const custom = (payload.meta && payload.meta.custom_data) || {};
  const userId = String(custom.user_id || '');
  if (!plan || !UUID.test(userId)) return reply(200, { ok: true, skipped: 'no plan or user' });
  if (String(attrs.variant_id || '') !== plan.variant) return reply(200, { ok: true, skipped: 'other product' });
  const tier = String(process.env.ZCHAT_VERIFIED_TIER || 'blue').toLowerCase();
  const status = String(attrs.status || '');
  const live = ['active', 'on_trial', 'past_due'].includes(status);
  const endAt = attrs.renews_at || attrs.ends_at || null;
  let until = null;
  if (live && endAt) until = new Date(new Date(endAt).getTime() + 3 * 86400000).toISOString();
  else if (status === 'cancelled' && attrs.ends_at && new Date(attrs.ends_at).getTime() > Date.now()) until = new Date(attrs.ends_at).toISOString();
  const out = await rpc('zchat_set_verified_sub', { p_user: userId, p_until: until, p_tier: tier });
  return reply(200, { ok: true, result: out });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  const h = event.headers || {};
  const sig = h['x-signature'] || h['X-Signature'];
  const raw = rawBody(event);
  if (sig) {
    if (!signatureOk(raw, sig)) return reply(401, { error: 'Bad signature' });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not set up yet' });
    let payload = null;
    try { payload = JSON.parse(raw); } catch { return reply(400, { error: 'Bad body' }); }
    const name = String((payload.meta && payload.meta.event_name) || h['x-event-name'] || h['X-Event-Name'] || '');
    if (payload.meta && payload.meta.test_mode === true && process.env.ZCHAT_ALLOW_TEST_ORDERS !== '1') return reply(200, { ok: true, skipped: 'test mode' });
    const storeWanted = String(process.env.ZCHAT_LS_STORE_ID || '');
    const storeGot = String((payload.data && payload.data.attributes && payload.data.attributes.store_id) || '');
    if (storeWanted && storeGot !== storeWanted) return reply(200, { ok: true, skipped: 'other store' });
    try {
      if (name === 'order_created') return await onOrder(payload, false);
      if (name === 'order_refunded') return await onOrder(payload, true);
      if (/^subscription_/.test(name)) return await onSubscription(payload);
      return reply(200, { ok: true, skipped: name || 'unknown' });
    } catch (err) {
      console.error('zchat pay webhook failed', name, err && err.message);
      return reply(500, { error: 'Try again' });
    }
  }
  let body = {};
  try { body = JSON.parse(raw || '{}'); } catch { return reply(400, { error: 'Bad request' }); }
  if (body.action === 'packs') {
    const plan = verifiedPlan();
    return reply(200, {
      packs: coinPacks().map((p) => ({ id: p.variant, coins: p.coins, price: p.price, url: p.url, tag: p.tag })),
      verified: plan ? { price: plan.price, url: plan.url } : null,
    });
  }
  return reply(400, { error: 'Unknown action' });
};
