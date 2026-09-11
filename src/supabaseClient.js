import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://etcmbghcmlgeezwgnwuz.supabase.co';
const supabaseKey = 'sb_publishable_Os7xmrZH1tLgo3yAb5Nqzw_RZIUygo9';

export const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------- Auth ---------------- */

export async function registerWithEmail(email) {
  const tempPassword = crypto.randomUUID();
  const { data, error } = await supabase.auth.signUp({ email, password: tempPassword });
  return { data, error };
}

export async function verifyOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  return { data, error };
}

export async function setPassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });
  return { data, error };
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function sendPasswordReset(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/* ---------------- Profiles ---------------- */

export async function createProfile(userId, username, name) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, username, name })
    .select()
    .single();
  return { data, error };
}

export async function checkUsernameTaken(username) {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();
  return { taken: !!data };
}

export async function searchByUsername(query) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${query}%`)
    .limit(20);
  return { data: data || [], error };
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return { data, error };
}

/* ---------------- Messages ---------------- */

export async function sendMessage(senderId, receiverId, type, content, mediaUrl) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, type, content: content || null, media_url: mediaUrl || null })
    .select()
    .single();
  return { data, error };
}

export async function getConversation(userId, otherUserId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

export function subscribeToMessages(userId, callback) {
  return supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

/* ---------------- Reports ---------------- */

export async function reportUser(reporterId, reportedId, reason) {
  const { data, error } = await supabase
    .from('reports')
    .insert({ reporter_id: reporterId, reported_id: reportedId, reason })
    .select()
    .single();
  return { data, error };
}

/* ---------------- Media storage ---------------- */

export async function uploadMedia(file, userId) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('chat-media').upload(path, file);
  if (error) return { url: null, error };
  const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
