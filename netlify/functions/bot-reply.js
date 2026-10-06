const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const DAILY_LIMIT_PER_USER = 50;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let userId, botId, text;
  try {
    ({ userId, botId, text } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'Bad request' };
  }
  if (!userId || !botId || typeof text !== 'string' || !text.trim()) {
    return { statusCode: 400, body: 'Missing fields' };
  }
  text = text.trim().slice(0, 4000);

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

  let reply = "Sorry, I couldn't come up with a reply just now. Try asking again in a moment.";
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { maxOutputTokens: 400 },
      }),
    });
    const json = await res.json();
    const candidateText = json && json.candidates && json.candidates[0] && json.candidates[0].content
      && json.candidates[0].content.parts && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
    if (candidateText && candidateText.trim()) reply = candidateText.trim();
    else console.error('Gemini returned no text', JSON.stringify(json).slice(0, 500));
  } catch (err) {
    console.error('Gemini request failed', err);
  }

  const { error } = await supabase.from('messages').insert({
    sender_id: botId,
    receiver_id: userId,
    type: 'text',
    content: reply.slice(0, 4000),
  });
  if (error) {
    console.error('Could not save the bot reply', error);
    return { statusCode: 500, body: 'Could not save reply' };
  }
  return { statusCode: 200, body: 'ok' };
};
