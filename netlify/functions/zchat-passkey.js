import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify as verifySignature, constants as cryptoConstants } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing', { auth: { persistSession: false, autoRefreshToken: false } });
const B64U = /^[A-Za-z0-9_-]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHALLENGE = /^[A-Za-z0-9_-]{43}$/;
const TIMEOUT = 60000;

const reply = (status, body) => ({ statusCode: status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(value, maxBytes) {
  if (typeof value !== 'string' || !value || !B64U.test(value) || value.length > Math.ceil((maxBytes * 4) / 3) + 4) return null;
  const buf = Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return buf.length && buf.length <= maxBytes ? buf : null;
}
function sha256(data) {
  return createHash('sha256').update(data).digest();
}
function same(a, b) {
  return !!a && !!b && a.length === b.length && timingSafeEqual(a, b);
}
function header(event, name) {
  const h = event.headers || {};
  const want = name.toLowerCase();
  const key = Object.keys(h).find((k) => k.toLowerCase() === want);
  return key ? String(h[key] || '') : '';
}
function clientIp(event) {
  const direct = header(event, 'x-nf-client-connection-ip').trim();
  if (direct) return direct.slice(0, 64);
  const fwd = header(event, 'x-forwarded-for').split(',')[0].trim();
  return (fwd || 'unknown').slice(0, 64);
}
function cleanOrigin(value) {
  try {
    const u = new URL(String(value || '').trim());
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1'))) return null;
    return u.origin;
  } catch { return null; }
}
function allowedOrigins() {
  const listed = String(process.env.ZCHAT_ORIGINS || '').split(',').map(cleanOrigin).filter(Boolean);
  if (listed.length) return listed;
  return [process.env.URL, 'https://getzchat.com'].map(cleanOrigin).filter(Boolean);
}
function rpIdFor(origin) {
  const host = new URL(origin).hostname;
  const wanted = String(process.env.ZCHAT_RP_ID || '').trim().toLowerCase();
  if (wanted && (host === wanted || host.endsWith(`.${wanted}`))) return wanted;
  return host;
}
function pickOrigin(event) {
  const allowed = allowedOrigins();
  const given = header(event, 'origin');
  if (!given) return allowed[0] || null;
  const o = cleanOrigin(given);
  return o && allowed.includes(o) ? o : null;
}
function hostFits(origin, rpId) {
  try {
    const host = new URL(origin).hostname;
    return host === rpId || host.endsWith(`.${rpId}`);
  } catch { return false; }
}
function uuidBytes(id) {
  return Buffer.from(String(id).replace(/-/g, ''), 'hex');
}
function jwtSessionId(token) {
  try {
    const part = String(token || '').split('.')[1] || '';
    const claims = JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return UUID.test(String(claims.session_id || '')) ? claims.session_id : null;
  } catch { return null; }
}
async function callerFrom(event) {
  try {
    const token = header(event, 'authorization').replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return null;
    return { user: data.user, sid: jwtSessionId(token) };
  } catch { return null; }
}
async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}
function readClientData(raw) {
  const bytes = unb64u(raw, 4096);
  if (!bytes) return null;
  try {
    const json = JSON.parse(bytes.toString('utf8'));
    if (!json || typeof json !== 'object' || typeof json.type !== 'string' || typeof json.challenge !== 'string' || typeof json.origin !== 'string') return null;
    if (!CHALLENGE.test(json.challenge) || json.crossOrigin === true) return null;
    return { bytes, json };
  } catch { return null; }
}
function readAuthData(raw, maxBytes) {
  const buf = unb64u(raw, maxBytes);
  if (!buf || buf.length < 37) return null;
  const flags = buf[32];
  return { buf, rpIdHash: buf.subarray(0, 32), up: !!(flags & 0x01), uv: !!(flags & 0x04), backedUp: !!(flags & 0x10), attested: !!(flags & 0x40), signCount: buf.readUInt32BE(33) };
}
function loadKey(spki, alg) {
  try {
    const key = createPublicKey({ key: spki, format: 'der', type: 'spki' });
    if (alg === -7) {
      const d = key.asymmetricKeyDetails || {};
      return key.asymmetricKeyType === 'ec' && d.namedCurve === 'prime256v1' ? key : null;
    }
    if (alg === -257) {
      const d = key.asymmetricKeyDetails || {};
      return key.asymmetricKeyType === 'rsa' && Number(d.modulusLength) >= 2048 ? key : null;
    }
    return null;
  } catch { return null; }
}
function signatureOk(key, alg, data, signature) {
  try {
    if (alg === -7) return verifySignature('sha256', data, { key, dsaEncoding: 'der' }, signature);
    if (alg === -257) return verifySignature('sha256', data, { key, padding: cryptoConstants.RSA_PKCS1_PADDING }, signature);
    return false;
  } catch { return false; }
}

async function regOptions(event) {
  const caller = await callerFrom(event);
  if (!caller) return reply(401, { error: 'Please log in again.' });
  const origin = pickOrigin(event);
  if (!origin) return reply(403, { error: 'Passkeys do not work on this address.' });
  const rpId = rpIdFor(origin);
  const challenge = b64u(randomBytes(32));
  const made = await rpc('zchat_passkey_challenge_new', { p_kind: 'reg', p_challenge: challenge, p_user: caller.user.id, p_session: caller.sid, p_ip: clientIp(event), p_rp_id: rpId });
  if (!made || !made.ok) {
    if (made && made.reason === 'approval') return reply(403, { error: 'Approve this login first, then add a passkey.' });
    if (made && made.reason === 'limited') return reply(429, { error: 'Too many tries. Wait a while and try again.' });
    return reply(400, { error: 'Could not start. Try again.' });
  }
  const ids = await rpc('zchat_passkey_ids', { p_user: caller.user.id });
  let label = 'ZChat account';
  let shown = 'ZChat';
  try {
    const { data } = await supabase.from('profiles').select('username, name').eq('id', caller.user.id).maybeSingle();
    if (data && data.username) label = `@${String(data.username).slice(0, 40)}`;
    if (data && data.name) shown = String(data.name).slice(0, 60);
  } catch {}
  return reply(200, {
    publicKey: {
      challenge,
      rp: { id: rpId, name: 'ZChat' },
      user: { id: b64u(uuidBytes(caller.user.id)), name: label, displayName: shown },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      timeout: TIMEOUT,
      attestation: 'none',
      authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
      excludeCredentials: (Array.isArray(ids) ? ids : []).filter((id) => typeof id === 'string' && B64U.test(id)).map((id) => ({ type: 'public-key', id })),
    },
  });
}

async function regVerify(event, body) {
  const caller = await callerFrom(event);
  if (!caller) return reply(401, { error: 'Please log in again.' });
  const cd = readClientData(body.clientDataJSON);
  if (!cd || cd.json.type !== 'webauthn.create') return reply(400, { error: 'That did not work. Try again.' });
  if (!allowedOrigins().includes(cleanOrigin(cd.json.origin))) return reply(403, { error: 'Passkeys do not work on this address.' });
  const taken = await rpc('zchat_passkey_challenge_take', { p_challenge: cd.json.challenge, p_kind: 'reg' });
  if (!taken) return reply(400, { error: 'That took too long. Try again.' });
  if (taken.user_id !== caller.user.id || (taken.session_id || null) !== (caller.sid || null)) return reply(403, { error: 'That did not work. Try again.' });
  if (!hostFits(cd.json.origin, taken.rp_id)) return reply(403, { error: 'Passkeys do not work on this address.' });
  const ad = readAuthData(body.authenticatorData, 4096);
  if (!ad || !same(ad.rpIdHash, sha256(Buffer.from(taken.rp_id, 'utf8')))) return reply(400, { error: 'That did not work. Try again.' });
  if (!ad.up || !ad.uv || !ad.attested) return reply(400, { error: 'Your phone needs a screen lock, fingerprint or face unlock for passkeys.' });
  const credId = unb64u(body.id, 1023);
  if (!credId || ad.buf.length < 55) return reply(400, { error: 'That did not work. Try again.' });
  const idLen = ad.buf.readUInt16BE(53);
  if (idLen !== credId.length || ad.buf.length < 55 + idLen || !same(ad.buf.subarray(55, 55 + idLen), credId)) return reply(400, { error: 'That did not work. Try again.' });
  const alg = Number(body.publicKeyAlgorithm);
  const spki = unb64u(body.publicKey, 1200);
  if (!spki || !loadKey(spki, alg)) return reply(400, { error: 'This device makes a kind of passkey ZChat cannot use yet.' });
  const transports = (Array.isArray(body.transports) ? body.transports : []).filter((t) => typeof t === 'string').map((t) => t.slice(0, 20)).slice(0, 8);
  const name = typeof body.name === 'string' ? body.name.slice(0, 60) : null;
  const added = await rpc('zchat_passkey_add', {
    p_user: caller.user.id, p_session: caller.sid, p_cred_id: b64u(credId), p_public_key: b64u(spki), p_alg: alg, p_sign_count: ad.signCount,
    p_transports: transports, p_name: name, p_rp_id: taken.rp_id, p_backed_up: ad.backedUp,
  });
  if (!added || !added.ok) {
    if (added && added.reason === 'exists') return reply(409, { error: 'This passkey is already saved.' });
    if (added && added.reason === 'full') return reply(400, { error: 'You have 10 passkeys already. Remove one first.' });
    if (added && added.reason === 'approval') return reply(403, { error: 'Approve this login first, then add a passkey.' });
    return reply(400, { error: 'That did not work. Try again.' });
  }
  return reply(200, { ok: true, id: added.id });
}

async function loginOptions(event) {
  const origin = pickOrigin(event);
  if (!origin) return reply(403, { error: 'Passkeys do not work on this address.' });
  const rpId = rpIdFor(origin);
  const challenge = b64u(randomBytes(32));
  const made = await rpc('zchat_passkey_challenge_new', { p_kind: 'login', p_challenge: challenge, p_user: null, p_session: null, p_ip: clientIp(event), p_rp_id: rpId });
  if (!made || !made.ok) {
    if (made && made.reason === 'limited') return reply(429, { error: 'Too many tries. Wait a few minutes and try again.' });
    return reply(400, { error: 'Could not start. Try again.' });
  }
  return reply(200, { publicKey: { challenge, rpId, timeout: TIMEOUT, userVerification: 'required', allowCredentials: [] } });
}

async function loginVerify(event, body) {
  const ip = clientIp(event);
  const cd = readClientData(body.clientDataJSON);
  if (!cd || cd.json.type !== 'webauthn.get') return reply(400, { error: 'That did not work. Try again.' });
  if (!allowedOrigins().includes(cleanOrigin(cd.json.origin))) return reply(403, { error: 'Passkeys do not work on this address.' });
  const taken = await rpc('zchat_passkey_challenge_take', { p_challenge: cd.json.challenge, p_kind: 'login' });
  if (!taken) return reply(400, { error: 'That took too long. Try again.' });
  const fail = async (passkeyId, status, error) => {
    try { await rpc('zchat_passkey_fail', { p_challenge: taken.id, p_passkey: passkeyId || null }); } catch {}
    return reply(status, { error });
  };
  const credId = unb64u(body.id, 1023);
  if (!credId) return fail(null, 400, 'That did not work. Try again.');
  const found = await rpc('zchat_passkey_lookup', { p_cred_id: b64u(credId), p_ip: ip });
  if (found && found.limited) return reply(429, { error: 'Too many tries. Wait a few minutes and try again.' });
  if (!found || !found.found) return fail(null, 404, 'That passkey is not set up for ZChat. Log in with your email, then add one in Settings.');
  if (found.banned) return reply(403, { error: 'This account is blocked.' });
  if (found.rp_id !== taken.rp_id || !hostFits(cd.json.origin, found.rp_id)) return fail(found.id, 403, 'That passkey belongs to another address.');
  const ad = readAuthData(body.authenticatorData, 2048);
  if (!ad || !same(ad.rpIdHash, sha256(Buffer.from(found.rp_id, 'utf8')))) return fail(found.id, 400, 'That did not work. Try again.');
  if (!ad.up || !ad.uv) return fail(found.id, 401, 'Unlock with your fingerprint, face or screen lock to use your passkey.');
  if (body.userHandle) {
    const handle = unb64u(body.userHandle, 64);
    if (!handle || !same(handle, uuidBytes(found.user_id))) return fail(found.id, 401, 'That passkey did not work. Try again.');
  }
  const signature = unb64u(body.signature, 1024);
  const spki = unb64u(found.public_key, 1200);
  const key = spki ? loadKey(spki, Number(found.alg)) : null;
  if (!signature || !key || !signatureOk(key, Number(found.alg), Buffer.concat([ad.buf, sha256(cd.bytes)]), signature)) return fail(found.id, 401, 'That passkey did not work. Try again.');
  const nonce = b64u(randomBytes(32));
  const used = await rpc('zchat_passkey_used', { p_passkey: found.id, p_sign_count: ad.signCount, p_nonce_hash: createHash('sha256').update(nonce, 'utf8').digest('hex') });
  if (!used || !used.ok) return fail(found.id, 401, 'That passkey did not work. Try again.');
  const { data: got, error: userErr } = await supabase.auth.admin.getUserById(found.user_id);
  const email = !userErr && got && got.user ? got.user.email : null;
  if (!email) return reply(400, { error: 'This account cannot use passkeys yet.' });
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = !linkErr && link && link.properties ? link.properties.hashed_token : null;
  if (!tokenHash) return reply(503, { error: 'Could not log you in right now. Try again soon.' });
  return reply(200, { token_hash: tokenHash, nonce });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Passkeys are not set up yet.' });
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : String(event.body || '');
  if (raw.length > 20000) return reply(413, { error: 'Too big' });
  let body = {};
  try { body = JSON.parse(raw || '{}') || {}; } catch { return reply(400, { error: 'Bad request' }); }
  if (typeof body !== 'object' || Array.isArray(body)) return reply(400, { error: 'Bad request' });
  try {
    if (body.action === 'reg_options') return await regOptions(event);
    if (body.action === 'reg_verify') return await regVerify(event, body);
    if (body.action === 'login_options') return await loginOptions(event);
    if (body.action === 'login_verify') return await loginVerify(event, body);
    return reply(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('zchat passkey failed', body.action, err && err.message);
    return reply(500, { error: 'Something went wrong. Try again.' });
  }
};
