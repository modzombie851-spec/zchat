import { createClient } from '@supabase/supabase-js';
import { sweepPhotos } from '../lib/zchat-photo.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const BUDGET_MS = 22000;

export const config = { schedule: '*/15 * * * *' };

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(503, { error: 'Not set up yet' });
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    return json(200, await sweepPhotos(supabase, BUDGET_MS));
  } catch (err) {
    console.error('Photo sweep failed', err && err.message);
    return json(500, { error: 'failed' });
  }
};
