const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const DAILY_LIMIT_PER_USER = 50;
const HISTORY_LIMIT = 16;
const MAX_INLINE_BYTES = 15 * 1024 * 1024;

const SYSTEM_INSTRUCTION = `You are ZChat Bot, the official AI assistant built into the ZChat app. You were made by Zombie (@zombiedev), the creator of ZChat.
If someone asks who you are, what you are, or who made you, say you are ZChat Bot, an AI made by Zombie for ZChat - never say you are Gemini or mention Google.
If this conversation has no earlier messages below, greet the person warmly by their name and briefly introduce yourself as ZChat Bot before answering. If there is already earlier conversation below, skip the introduction and just continue naturally.
If someone sends you a photo or video, actually describe or react to what you see in it. If someone sends you a voice message, respond to what they actually said in it.
When you share code, put it in a code block and add one short plain sentence above it explaining what it does - don't write a long essay around it.
Never generate sexual, romantic-explicit, or adult content of any kind, even if asked directly or indirectly. If asked for that, politely decline and offer to help with something else instead.
Keep replies friendly, concise, and easy to read on a phone screen.
Always also suggest 2 or 3 very short follow-up replies the person could tap next, each under 6 words, relevant to what you just said.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['reply'],
};

async function fetchAsInlineData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = (res.headers.get('content-type') || '').split(';')[0] || 'application/octet-stream';
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_INLINE_BYTES) return null;
    return { mimeType: contentType, data: Buffer.from(buf).toString('base64') };
  } catch (err) {
    console.error('Could not fetch media for the bot to look at', err);
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let userId, botId, text, mediaType, mediaUrl;
  try {
    ({ userId, botId, text, mediaType, mediaUrl } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'Bad request' };
  }
  if (!userId || !botId || (!text && !mediaType)) {
    return { statusCode: 400, body: 'Missing fields' };
  }
  text = (text || '').trim().slice(0, 4000);

  supabase.from('messages').update({ read: true, delivered: true })
    .eq('sender_id', userId).eq('receiver_id', botId).eq('read', false)
    .then(() => {}).catch(() => {});

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count, error: countError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', botId)
    .eq('receiver_id', userId)
    .gte('created_at', dayStart.toISOString());

  if (!countError && (count || 0) >= DAILY_LIMIT_PER_USER) {
    await supabase.from('messages').insert({
      sender_id: botId,
      receiver_id: userId,
      type: 'text',
      content: "That's the most messages I can answer in one day. Try again tomorrow.",
    });
    return { statusCode: 200, body: 'limit reached' };
  }

  const { data: senderProfile } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle();
  const senderName = (senderProfile && senderProfile.name) || 'there';

  const { data: historyRows } = await supabase
    .from('messages')
    .select('sender_id, content, type')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${botId}),and(sender_id.eq.${botId},receiver_id.eq.${userId})`)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  const history = (historyRows || [])
    .filter((m) => m.type === 'text' && m.content)
    .reverse()
    .map((m) => ({ role: m.sender_id === botId ? 'model' : 'user', parts: [{ text: m.content }] }));
  if (history.length && history[history.length - 1].role === 'user' && history[history.length - 1].parts[0].text === text) {
    history.pop();
  }

  const currentParts = [];
  if (text) currentParts.push({ text });
  if (mediaType === 'image' || mediaType === 'video' || mediaType === 'audio') {
    if (mediaUrl) {
      const inline = await fetchAsInlineData(mediaUrl);
      if (inline) currentParts.push({ inlineData: inline });
      else currentParts.push({ text: `[The person sent a ${mediaType} that could not be loaded. Let them know you couldn't open it and ask them to try sending it again.]` });
    }
  } else if (mediaType === 'sticker') {
    currentParts.push({ text: "[The person sent a sticker. You can't see sticker art yet. Let them know that warmly, and that you can chat in words or look at real photos, videos and voice messages they send.]" });
  }
  if (!currentParts.length) currentParts.push({ text: '(no message)' });

  const contents = [...history, { role: 'user', parts: currentParts }];

  let reply = "Sorry, I couldn't come up with a reply just now. Try asking again in a moment.";
  let suggestions = [];
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${SYSTEM_INSTRUCTION}\nThe person you are talking to is named: ${senderName}.` }] },
        contents,
        safetySettings: [{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' }],
        generationConfig: { maxOutputTokens: 500, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
      }),
    });
    const json = await res.json();
    const rawText = json && json.candidates && json.candidates[0] && json.candidates[0].content
      && json.candidates[0].content.parts && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.reply && parsed.reply.trim()) reply = parsed.reply.trim();
        if (Array.isArray(parsed.suggestions)) suggestions = parsed.suggestions.filter((x) => typeof x === 'string' && x.trim()).slice(0, 3).map((x) => x.trim());
      } catch (parseErr) {
        console.error('Could not parse structured reply, using raw text', parseErr);
        reply = rawText.trim();
      }
    } else {
      console.error('Gemini returned no text', JSON.stringify(json).slice(0, 500));
    }
  } catch (err) {
    console.error('Gemini request failed', err);
  }

  const { error } = await supabase.from('messages').insert({
    sender_id: botId,
    receiver_id: userId,
    type: 'text',
    content: reply.slice(0, 4000),
    suggestions: suggestions.length ? suggestions : null,
  });
  if (error) {
    console.error('Could not save the bot reply', error);
    return { statusCode: 500, body: 'Could not save reply' };
  }
  return { statusCode: 200, body: 'ok' };
};
