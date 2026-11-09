import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, ShieldOff, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon, Pin,
  Smile, ArrowLeft, Check, CheckCheck, Settings as SettingsIcon, Moon, Sun, UserPlus,
  FileText, HelpCircle, ChevronRight, ChevronLeft, Compass, Bell, Volume2, Volume1, VolumeX, Palette, Mic, Play, Pause, Download, Users, Camera, Reply, Forward, Ban, Edit3, Archive, Bookmark, Share2, Copy, Crop, Type, Pencil, Undo2, Scissors, BellOff, Link as LinkIcon, ShieldAlert, Heart, Repeat, PhoneOff, MicOff, VideoOff, SwitchCamera, Clock, Timer, Smartphone, Plus, ThumbsUp, ThumbsDown, LayoutDashboard, Megaphone, Database, Activity, MessageSquare,
} from 'lucide-react';
import {
  supabase, registerWithEmail, verifyOtp, setPassword, signInWithPassword,
  sendPasswordReset, signOut, getSession, checkUsernameTaken,
  sendMessage, getConversation,
  subscribeToMessages, reportUser, uploadMedia as uploadMediaRaw, deleteMessage,
} from '../supabaseClient.js';
import {
  AI_CHAR_TEMPLATES,
  AV_BG,
  AV_EXTRA,
  AV_EYES,
  AV_FACE,
  AV_GLASSES,
  AV_HAIR,
  AV_HAIRC,
  AV_MOUTH,
  AV_SHIRT,
  AV_SKIN,
  ActionSheet,
  AiCardsGlyph,
  AiStickerGlyph,
  AiTalkGlyph,
  BOT_PIC,
  BigButton,
  CharAvatar,
  ChatRowSheet,
  ChoiceList,
  ConfirmSheet,
  DiceLineIcon,
  EmptyState,
  FONT,
  FullPage,
  HeaderIconButton,
  KitGlyph,
  LineGlyph,
  LoadFail,
  PickTiles,
  PillButton,
  Portal,
  SegmentedControl,
  Spinner,
  StudioGlyph,
  WideDim,
  aiCanRecord,
  aiCharSaveMessage,
  aiCharSetupMessage,
  aiLang,
  aiSpeechRec,
  aiSpeechUnlock,
  aiVoiceOk,
  charById,
  charHidden,
  countWord,
  formatCount,
  formatListTime,
  friendlyError,
  hapticTap,
  igPalette,
  inputStyle,
  isPrivateMedia,
  kitOnInk,
  loadFailCode,
  loadImageElement,
  loadMissing,
  makeStickerBlob,
  playUiSound,
  readJsonLs,
  reducedMotion,
  resolveMedia,
  toolErrorText,
  tplChar,
  uploadMedia,
  useBackClose,
  useTheme,
  zchatAichat,
} from '../App.jsx';
import {
  AiSparkIcon,
  AiStyleThumb,
  AvatarMakerIcon,
  KitSection,
  StudioDark,
  StudioTool,
  aiToolOpen,
  aipDropJob,
  aipPack,
  aipStartJob,
  aipWaitJob,
  imageUrlToFile,
  makeWallPhoto,
  saveImageToDevice,
  shrinkToDataUrl,
} from './shared.jsx';


const AIP_STICKER_STYLES = [['cartoon', 'Cartoon'], ['sticker', 'Cute'], ['threed', '3D'], ['pixel', 'Pixel'], ['comic', 'Comic'], ['clay', 'Clay']];
const AIP_STICKER_IDEAS = ['A cat eating noodles', 'A sleepy panda hugging a pillow', 'A happy avocado waving', 'A corgi in sunglasses', 'A tiny dragon sipping tea', 'A frog under an umbrella', 'A penguin saying thanks', 'A cup of coffee with a big smile'];
const AIP_STICKER_WAIT = ['Reading your words', 'Sketching a few ideas', 'Drawing the outlines', 'Adding colour', 'Cutting them out'];
const AIP_UNSAFE = /\b(nude|nudes|naked|nsfw|porn\w*|sexy|boobs?|penis|vagina|gore|nazi\w*|swastika|suicide|self harm)\b/i;
const AIP_KIND_LINE = 'Let us keep stickers friendly. Try describing something else.';

async function aipStickerOf(url) {
  const src = isPrivateMedia(url) ? await resolveMedia(url) : url;
  const blob = await (await fetch(src)).blob();
  const temp = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(temp);
    const cut = window.ZAIP ? window.ZAIP.cutout(img, 512) : null;
    if (cut) return await new Promise((res, rej) => cut.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'));
    return await makeStickerBlob(blob);
  } finally { URL.revokeObjectURL(temp); }
}

export function AiStickerMaker({ userId, onClose, onDone }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [style, setStyle] = useState('cartoon');
  const [stage, setStage] = useState('form');
  const [step, setStep] = useState(0);
  const [results, setResults] = useState([]);
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');
  const aliveRef = useRef(true);
  const jobRef = useRef(null);
  const startedRef = useRef(null);
  const urlsRef = useRef([]);
  const ideaRef = useRef(Math.floor(Math.random() * AIP_STICKER_IDEAS.length));
  useEffect(() => { aipPack(); return () => { aliveRef.current = false; aipDropJob(jobRef.current || (startedRef.current ? { id: startedRef.current } : null)); const gone = urlsRef.current; setTimeout(() => gone.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} }), 1500); }; }, []);
  useEffect(() => {
    if (stage !== 'busy') return undefined;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(AIP_STICKER_WAIT.length - 1, s + 1)), 3200);
    return () => clearInterval(t);
  }, [stage]);
  const words = text.replace(/\s+/g, ' ').trim();
  const draw = async () => {
    if (stage === 'busy') return;
    if (words.length < 3) { setNote('Describe your sticker in a few words.'); return; }
    if (AIP_UNSAFE.test(words)) { setNote(AIP_KIND_LINE); return; }
    setNote('');
    hapticTap();
    playUiSound('tap');
    aipDropJob(jobRef.current);
    jobRef.current = null;
    setStage('busy');
    const started = await aipStartJob('sticker', { prompt: words, style });
    if (!aliveRef.current) return;
    if (started.error) { setStage('form'); setNote(started.error); return; }
    startedRef.current = started.id;
    const row = await aipWaitJob(started.id, aliveRef);
    if (!aliveRef.current || !row) return;
    jobRef.current = row;
    startedRef.current = null;
    if (row.status !== 'done' || !Array.isArray(row.urls) || !row.urls.length) { setStage('form'); setNote(row.error || 'The stickers could not be drawn. Try different words.'); return; }
    await aipPack();
    const made = (await Promise.all(row.urls.slice(0, 4).map((u) => aipStickerOf(u).catch(() => null)))).filter(Boolean);
    if (!aliveRef.current) return;
    if (!made.length) { setStage('form'); setNote('The stickers did not load. Try again.'); return; }
    urlsRef.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
    const list = made.map((blob) => ({ blob, url: URL.createObjectURL(blob) }));
    urlsRef.current = list.map((x) => x.url);
    setResults(list);
    setPick(0);
    setStage('pick');
    playUiSound('repost');
  };
  const save = async (send) => {
    const chosen = results[pick];
    if (!chosen || saving) return;
    setSaving(send ? 'send' : 'save');
    setNote('');
    try {
      const { url, error } = await uploadMedia(new File([chosen.blob], `ai-sticker-${Date.now()}.png`, { type: 'image/png' }), userId);
      if (error || !url) throw error || new Error('upload');
      let row = null;
      try {
        const { data, error: insertErr } = await supabase.from('user_stickers').insert({ user_id: userId, url }).select('id, url').single();
        if (!insertErr && data) row = { id: data.id, url: data.url };
      } catch {}
      aipDropJob(jobRef.current);
      jobRef.current = null;
      hapticTap();
      onDone(row || { id: `local-${Date.now()}`, url }, send);
    } catch {
      if (aliveRef.current) { setSaving(''); setNote("Couldn't save that sticker. Try again."); }
    }
  };
  const tileSize = Math.max(44, Math.min(58, Math.floor((Math.min(typeof window !== 'undefined' ? window.innerWidth : 390, 520) - 58) / AIP_STICKER_STYLES.length)));
  const tile = { position: 'relative', aspectRatio: '1 / 1', borderRadius: 18, background: 'rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
  return (
    <Portal>
      <div className="zchat-fade" role="dialog" aria-label="AI sticker" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 420, background: '#0E0C14', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 12px 6px' }}>
          <div role="button" aria-label="Close AI sticker" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={24} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>AI sticker</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.6)' }}>{stage === 'pick' ? 'Pick the one you like' : 'ZChat Bot draws it for you'}</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {stage === 'form' && (
            <div style={{ width: 'min(64vw, 260px, 34vh)', aspectRatio: '1 / 1', borderRadius: 28, border: '1.5px dashed rgba(255, 255, 255, 0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255, 255, 255, 0.55)', textAlign: 'center', padding: 18, boxSizing: 'border-box' }}>
              <AiStickerGlyph size={34} strokeWidth={1.5} />
              <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>Up to four stickers show up here</div>
            </div>
          )}
          {stage !== 'form' && (
            <div role={stage === 'pick' ? 'radiogroup' : undefined} aria-label={stage === 'pick' ? 'Stickers to pick from' : 'Drawing your stickers'} style={{ width: 'min(100%, 340px, 46vh)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {stage === 'busy' && [0, 1, 2, 3].map((i) => <div key={i} className="zmap-shimmer" style={{ ...tile, animationDelay: `${i * 120}ms` }} />)}
              {stage === 'pick' && results.map((r, i) => (
                <div key={r.url} role="radio" aria-checked={pick === i} aria-label={`Sticker ${i + 1}`} onClick={() => { hapticTap(); setPick(i); }} className="zchat-press"
                  style={{ ...tile, cursor: 'pointer', boxShadow: pick === i ? `0 0 0 2px #0E0C14, 0 0 0 4px ${theme.coral}` : 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)', transition: 'box-shadow 160ms ease' }}>
                  <img src={r.url} alt="" draggable={false} style={{ width: '86%', height: '86%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          )}
          {stage === 'busy' && (
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <div style={{ fontSize: 15.5, fontWeight: 800 }}>{AIP_STICKER_WAIT[step]}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 }}>This usually takes a few seconds</div>
            </div>
          )}
        </div>
        <div style={{ padding: '0 14px calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 520, margin: '0 auto', boxSizing: 'border-box' }}>
          {stage === 'form' && (
            <>
              <div style={{ position: 'relative' }}>
                <input value={text} onChange={(e) => { setText(e.target.value.slice(0, 120)); if (note) setNote(''); }} onKeyDown={(e) => { if (e.key === 'Enter') draw(); }} placeholder="A cat eating noodles, cartoon" aria-label="Describe a sticker" maxLength={120} enterKeyHint="go"
                  style={{ width: '100%', boxSizing: 'border-box', height: 48, borderRadius: 24, border: 'none', outline: 'none', padding: '0 52px 0 18px', background: 'rgba(255, 255, 255, 0.12)', color: 'white', fontFamily: FONT, fontSize: 16 }} />
                <div role="button" aria-label="Try an idea" onClick={() => { hapticTap(); ideaRef.current = (ideaRef.current + 1) % AIP_STICKER_IDEAS.length; setText(AIP_STICKER_IDEAS[ideaRef.current]); setNote(''); }}
                  style={{ position: 'absolute', right: 4, top: 4, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.75)' }}><DiceLineIcon size={20} /></div>
              </div>
              <StudioDark>
                <PickTiles label="Sticker style" size={tileSize} fit ringBg="#0E0C14" value={style} onChange={(k) => setStyle(k)}
                  options={AIP_STICKER_STYLES.map(([k, label]) => ({ k, label, aria: `Style ${label}`, art: <AiStyleThumb k={k} /> }))} />
              </StudioDark>
            </>
          )}
          {note && <div role="alert" style={{ fontSize: 13, fontWeight: 700, color: '#FF8A8A', textAlign: 'center', lineHeight: 1.45 }}>{note}</div>}
          {stage === 'form' && <BigButton label="Draw my stickers" disabled={words.length < 3} onClick={draw} style={{ height: 52, borderRadius: 16 }} />}
          {stage === 'busy' && <div role="button" aria-label="Cancel" onClick={() => { aliveRef.current = false; onClose(); }} className="zchat-press" style={{ alignSelf: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}>Cancel</div>}
          {stage === 'pick' && (
            <>
              <BigButton label={saving === 'save' ? 'Saving' : 'Save to My stickers'} disabled={!!saving} onClick={() => save(false)} style={{ height: 52, borderRadius: 16 }} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                <StudioDark>
                  <StudioTool label="Change words" glyph={<StudioGlyph k="edittext" />} disabled={!!saving} onClick={() => { setStage('form'); setNote(''); }} width={96} />
                  <StudioTool label="Try again" glyph={<StudioGlyph k="retry" />} disabled={!!saving} onClick={draw} width={84} />
                  <StudioTool label={saving === 'send' ? 'Sending' : 'Save and send'} glyph={<StudioGlyph k="send" />} disabled={!!saving} onClick={() => save(true)} width={96} />
                </StudioDark>
              </div>
            </>
          )}
          {stage === 'form' && <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.55)', textAlign: 'center' }}>You can make a few each day. The one you pick goes to My stickers.</div>}
        </div>
      </div>
    </Portal>
  );
}
const AI_STYLES = [
  ['cartoon', 'Cartoon'], ['anime', 'Anime'], ['threed', '3D'], ['comic', 'Comic'], ['watercolor', 'Watercolour'], ['sticker', 'Sticker'], ['clay', 'Clay'], ['pixel', 'Pixel art'],
  ['pop', 'Pop art'], ['sketch', 'Sketch'], ['oil', 'Oil paint'], ['neon', 'Neon'], ['dreamy', 'Dreamy'], ['minimal', 'Minimal'], ['realistic', 'Realistic'],
];
const AI_IDEAS = {
  picture: ['A tiny cat astronaut floating past Saturn', 'A rainy Tokyo street at night with neon reflections', 'A cosy reading nook with fairy lights', 'A dragon made of cherry blossoms', 'A retro robot serving ice cream', 'A lighthouse in a purple storm', 'A fox asleep in autumn leaves', 'A floating island with a waterfall', 'A paper boat sailing through a teacup', 'A city built inside a snow globe'],
  wallpaper: ['Soft violet clouds at dawn', 'A dark forest full of fireflies', 'Gentle ocean waves at sunset', 'Night sky over snowy mountains', 'A pastel gradient with paper texture', 'Rain on a window with city lights behind', 'A lavender field under a big moon', 'Black marble with thin gold veins', 'Cherry blossom petals drifting over water', 'Northern lights over a quiet lake'],
  profile: ['A smiling red panda with round glasses', 'A cool cat in a leather jacket', 'A friendly robot holding a flower', 'A koala astronaut', 'A fox in a hoodie with a sunset behind', 'A penguin holding a tiny coffee', 'A lion wearing sunglasses', 'A happy corgi with a bow tie'],
};
const AI_WAIT_LINES = ['Reading your words', 'Sketching the idea', 'Mixing colours', 'Adding the details', 'Almost there'];
const AI_KIND_LABEL = { picture: 'Picture', wallpaper: 'Wallpaper', profile: 'Profile photo', avatar: 'Avatar' };

function aiSetupMessage(error) {
  const msg = String((error && error.message) || '');
  if (/relation|schema cache|does not exist|permission denied|42P01|42501/i.test(msg)) return 'AI images switch on once the latest ZChat setup is finished.';
  return 'Could not start. Check your connection and try again.';
}

async function startAiImage(myId, job) {
  let id = '';
  try { id = crypto.randomUUID(); } catch { id = `${Date.now().toString(16)}-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`; }
  const row = { id, user_id: myId, kind: job.kind, prompt: (job.prompt || '').slice(0, 600), style: job.style || 'cartoon', ratio: job.ratio || (job.kind === 'wallpaper' ? '9:16' : '1:1'), status: 'queued' };
  const { error } = await supabase.from('ai_images').insert(row);
  if (error) return { error: aiSetupMessage(error) };
  let token = '';
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; } catch {}
  if (!token) return { error: 'Please log in again.' };
  try {
    const res = await fetch('/.netlify/functions/zchat-image-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, photo: job.photo || undefined }),
    });
    if (!res.ok && res.status !== 202) {
      supabase.from('ai_images').delete().eq('id', id).then(() => {}, () => {});
      return { error: res.status === 404 ? 'AI images are not switched on for this ZChat yet.' : 'AI images are not available right now. Try again soon.' };
    }
  } catch {
    supabase.from('ai_images').delete().eq('id', id).then(() => {}, () => {});
    return { error: 'Could not reach ZChat. Check your connection and try again.' };
  }
  return { id, row };
}

async function waitAiImage(id, aliveRef) {
  const started = Date.now();
  while (aliveRef.current && Date.now() - started < 150000) {
    await new Promise((r) => setTimeout(r, 2200));
    if (!aliveRef.current) return null;
    const { data } = await supabase.from('ai_images').select('id, kind, prompt, style, ratio, status, url, error, created_at').eq('id', id).maybeSingle();
    if (data && (data.status === 'done' || data.status === 'failed')) return data;
  }
  return aliveRef.current ? { id, status: 'failed', error: 'This one is taking too long. Try again in a minute.' } : null;
}

function AiStyleChips({ value, onChange }) {
  const { theme } = useTheme();
  const rowRef = useRef(null);
  useEffect(() => {
    const wrap = rowRef.current;
    const row = wrap && wrap.firstElementChild;
    const el = row && row.querySelector('[aria-checked="true"]');
    if (row && el && el.offsetLeft > row.clientWidth - 70) row.scrollLeft = el.offsetLeft - 20;
  }, []);
  return (
    <div ref={rowRef}>
      <PickTiles label="Style" size={66} bleed={20} ringBg={theme.bgGradient} value={value} onChange={onChange}
        options={AI_STYLES.map(([k, l]) => ({ k, label: l, aria: `Style ${l}`, art: <AiStyleThumb k={k} /> }))} />
    </div>
  );
}

function AiBusyCard({ ratio, round }) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(AI_WAIT_LINES.length - 1, s + 1)), 3200);
    return () => clearInterval(t);
  }, []);
  const aspect = round ? '1 / 1' : ratio === '9:16' ? '9 / 16' : ratio === '16:9' ? '16 / 9' : ratio === '4:5' ? '4 / 5' : '1 / 1';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '22px 0 10px' }}>
      <div className="zmap-shimmer" style={{ width: round ? 200 : '100%', maxWidth: round ? 200 : 300, aspectRatio: aspect, maxHeight: '48vh', borderRadius: round ? '50%' : 22, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coral }}>
        <AiSparkIcon size={34} strokeWidth={1.6} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>{AI_WAIT_LINES[step]}</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>This usually takes a few seconds</div>
      </div>
    </div>
  );
}

const AI_USE_LOOK = { avatar: ['avatar', 'My photo'], wallpaper: ['wallpaper', 'Wallpaper'], chat: ['send', 'Send'], story: ['story', 'Story'], save: ['save', 'Save'] };
export function AiStudioPage({ myId, mode = 'image', startKind, chatTitle, onClose, onUseAvatar, onUseWallpaper, onShareStory, onSendInChat, onSnack, onLegacy, initialPrompt, avatarLabel }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const avatarMode = mode === 'avatar';
  const kinds = [['picture', 'Picture'], ['wallpaper', 'Wallpaper'], ...(onUseAvatar ? [['profile', 'Profile photo']] : [])];
  const [kind, setKind] = useState(avatarMode ? 'avatar' : (startKind && kinds.some(([k]) => k === startKind) ? startKind : 'picture'));
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [style, setStyle] = useState(avatarMode ? 'threed' : 'dreamy');
  const [ratio, setRatio] = useState('1:1');
  const [photo, setPhoto] = useState(null);
  const [ideaSeed, setIdeaSeed] = useState(0);
  const [stage, setStage] = useState('form');
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState(null);
  const [saving, setSaving] = useState('');
  const [note, setNote] = useState('');
  const aliveRef = useRef(true);
  const photoRef = useRef(null);
  useEffect(() => () => { aliveRef.current = false; }, []);
  useEffect(() => {
    let alive = true;
    supabase.from('ai_images').select('id, kind, prompt, style, ratio, status, url, created_at').eq('user_id', myId).eq('status', 'done').order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => { if (alive) setRecent((data || []).filter((r) => r.url && (avatarMode ? r.kind === 'avatar' || r.kind === 'profile' : r.kind !== 'avatar'))); }, () => { if (alive) setRecent([]); });
    return () => { alive = false; };
  }, []);
  const ideas = useMemo(() => {
    const list = AI_IDEAS[kind === 'avatar' ? 'profile' : kind] || AI_IDEAS.picture;
    const start = (ideaSeed * 3) % list.length;
    return [0, 1, 2].map((i) => list[(start + i) % list.length]);
  }, [kind, ideaSeed]);
  const pickPhoto = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      let data = await shrinkToDataUrl(f, 512, 0.84);
      if (data.length > 230000) data = await shrinkToDataUrl(f, 400, 0.72);
      setPhoto(data); setNote(''); hapticTap();
    } catch { setNote('That photo could not be opened. Try another one.'); }
  };
  const create = async () => {
    if (stage === 'busy') return;
    const words = prompt.trim();
    if (kind === 'avatar' && !photo) { setNote('Add a photo of you first.'); return; }
    if (kind !== 'avatar' && !words) { setNote('Describe what you want to see.'); return; }
    setNote('');
    playUiSound('tap');
    setStage('busy');
    const job = { kind, prompt: words, style, ratio: kind === 'wallpaper' ? '9:16' : kind === 'picture' ? ratio : '1:1', photo: kind === 'avatar' ? photo : null };
    const started = await startAiImage(myId, job);
    if (!aliveRef.current) return;
    if (started.error) { setStage('form'); setNote(started.error); return; }
    const row = await waitAiImage(started.id, aliveRef);
    if (!aliveRef.current || !row) return;
    if (row.status === 'done' && row.url) {
      setResult({ ...row, fresh: true });
      setRecent((list) => [row, ...(list || []).filter((r) => r.id !== row.id)].slice(0, 12));
      setStage('result');
      playUiSound('repost');
    } else {
      setStage('form');
      setNote(row.error || 'The picture could not be made. Try different words.');
    }
  };
  const useResult = async (how) => {
    if (!result || saving) return;
    setSaving(how);
    try {
      if (how === 'avatar') {
        const file = await imageUrlToFile(result.url, 'avatar.png', 640, 'image/png', 0.92, true);
        const ok = await onUseAvatar(file);
        if (ok !== false) { onClose(); return; }
        setNote('Your photo did not save. Try again.');
      } else if (how === 'wallpaper') {
        const file = await imageUrlToFile(result.url, 'wallpaper.jpg', 1440, 'image/jpeg', 0.86);
        const key = await makeWallPhoto(file, myId);
        if (key) { onUseWallpaper(key); onClose(); return; }
        setNote('The wallpaper could not be saved. Try again.');
      } else if (how === 'story') {
        const file = await imageUrlToFile(result.url, `made-${Date.now()}.jpg`, 1600, 'image/jpeg', 0.9);
        onShareStory(file); onClose(); return;
      } else if (how === 'chat') {
        const file = await imageUrlToFile(result.url, `made-${Date.now()}.jpg`, 1600, 'image/jpeg', 0.9);
        onSendInChat(file); onClose(); return;
      } else if (how === 'save') {
        const done = await saveImageToDevice(result.url, `zchat-${Date.now()}.jpg`);
        if (done === 'saved' && onSnack) onSnack('Image saved');
      }
    } catch { setNote('That did not work. Check your connection and try again.'); }
    setSaving('');
  };
  const again = () => { setResult(null); setStage('form'); create(); };
  const openRecent = (r) => { setResult({ ...r, fresh: false }); setKind(avatarMode ? 'avatar' : (r.kind === 'avatar' ? 'profile' : r.kind)); if (r.style) setStyle(r.style); if (r.prompt) setPrompt(r.prompt); setStage('result'); };
  const resultRound = result && (result.kind === 'avatar' || result.kind === 'profile');
  const title = avatarMode ? 'AI avatar' : 'Create with AI';
  const subtitle = stage === 'busy' ? 'Making it' : stage === 'result' ? AI_KIND_LABEL[(result && result.kind) || kind] : avatarMode ? 'Your real look, drawn your way' : chatTitle ? `For your chat with ${chatTitle}` : 'Describe it and ZChat draws it';
  const actions = (() => {
    if (!result) return [];
    const list = [];
    const add = (how, label, ok) => { if (ok && !list.some((a) => a.how === how)) list.push({ how, label }); };
    const face = result.kind === 'avatar' || result.kind === 'profile';
    add('avatar', avatarLabel || 'Use as my photo', face && !!onUseAvatar);
    add('wallpaper', 'Use as wallpaper', result.kind === 'wallpaper' && !!onUseWallpaper);
    add('chat', chatTitle ? `Send to ${chatTitle}` : 'Send in a chat', !face && !!onSendInChat && !!chatTitle);
    add('story', 'Share to story', !!onShareStory && result.kind !== 'avatar');
    add('chat', 'Send in a chat', !!onSendInChat && !chatTitle && result.kind !== 'avatar');
    add('wallpaper', 'Use as wallpaper', result.kind === 'picture' && !!onUseWallpaper);
    add('save', 'Save image', true);
    return list;
  })();
  const primary = actions[0] || null;
  const secondary = actions.slice(1);
  const footer = stage === 'form'
    ? <BigButton label={avatarMode ? 'Create my avatar' : 'Create'} onClick={create} ariaLabel={avatarMode ? 'Create my avatar' : 'Create image'} />
    : stage === 'result' && primary
      ? <BigButton label={saving === primary.how ? 'Saving' : primary.label} disabled={!!saving} onClick={() => useResult(primary.how)} />
      : stage === 'result' ? <BigButton label="Make another" tone="plain" onClick={() => { setResult(null); setStage('form'); }} /> : null;
  return (
    <FullPage title={title} subtitle={subtitle} onBack={stage === 'result' ? () => { setResult(null); setStage('form'); } : onClose} zIndex={720} pad={false} footer={footer}
      right={stage === 'form' && !avatarMode ? <HeaderIconButton label="More ideas" onClick={() => { hapticTap(); setIdeaSeed((s) => s + 1); }}><DiceLineIcon size={20} /></HeaderIconButton> : null}>
      {stage === 'busy' && (
        <div style={{ padding: '0 20px' }}>
          <AiBusyCard ratio={kind === 'wallpaper' ? '9:16' : kind === 'picture' ? ratio : '1:1'} round={kind === 'avatar' || kind === 'profile'} />
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 6 }}><div role="button" aria-label="Cancel" onClick={() => { aliveRef.current = false; onClose(); }} className="zchat-press" style={{ padding: '10px 18px', fontSize: 15, fontWeight: 600, color: theme.muted, cursor: 'pointer' }}>Cancel</div></div>
        </div>
      )}
      {stage === 'result' && result && (
        <div style={{ padding: '14px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <img src={result.url} alt="Your creation" draggable={false} style={{ width: resultRound ? 220 : '100%', maxWidth: resultRound ? 220 : 340, maxHeight: '54vh', objectFit: 'cover', aspectRatio: resultRound ? '1 / 1' : undefined, borderRadius: resultRound ? '50%' : 22, boxShadow: '0 16px 40px rgba(0,0,0,0.22)', background: theme.rowBg }} />
          {result.prompt && !avatarMode && <div style={{ fontSize: 14, color: theme.muted, textAlign: 'center', lineHeight: 1.45, maxWidth: 340 }}>{result.prompt}</div>}
          <div role="toolbar" aria-label="More ways to use it" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {result.fresh && <StudioTool label="Try again" glyph={<StudioGlyph k="retry" />} disabled={!!saving} onClick={again} width={74} />}
            {secondary.map((a) => <StudioTool key={a.how} label={saving === a.how ? 'Working' : AI_USE_LOOK[a.how][1]} aria={a.label} glyph={<StudioGlyph k={AI_USE_LOOK[a.how][0]} />} disabled={!!saving} onClick={() => useResult(a.how)} width={74} />)}
          </div>
          {note && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, textAlign: 'center' }}>{note}</div>}
        </div>
      )}
      {stage === 'form' && (
        <div style={{ padding: '6px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {avatarMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8 }}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />
              <div role="button" aria-label={photo ? 'Change your photo' : 'Add a photo of you'} onClick={() => photoRef.current && photoRef.current.click()} className="zchat-press" style={{ width: 148, height: 148, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', background: theme.rowBg, border: photo ? `3px solid ${theme.coral}` : `2px dashed ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, boxSizing: 'border-box' }}>
                {photo ? <img src={photo} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={34} strokeWidth={1.6} />}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink }}>{photo ? 'Looking good' : 'Add a photo of you'}</div>
              <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 1.45, maxWidth: 300 }}>Use a clear photo of your face. The avatar keeps your real look and only the style changes. The photo is not saved.</div>
            </div>
          ) : (
            <>
              {kinds.length > 1 && !startKind && (
                <div role="radiogroup" aria-label="What to make" style={{ display: 'flex', height: 38, borderRadius: 11, background: theme.rowBg, padding: 3, marginTop: 6 }}>
                  {kinds.map(([k, l]) => (
                    <div key={k} role="radio" aria-checked={kind === k} aria-label={l} onClick={() => { hapticTap(); setKind(k); setNote(''); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: kind === k ? theme.panelBg : 'transparent', color: kind === k ? theme.ink : theme.muted, boxShadow: kind === k ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', transition: 'background 140ms' }}>{l}</div>
                  ))}
                </div>
              )}
              <div>
                <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value.slice(0, 300)); if (note) setNote(''); }} placeholder={kind === 'wallpaper' ? 'Soft violet clouds at dawn' : kind === 'profile' ? 'A smiling red panda with round glasses' : 'A tiny cat astronaut floating past Saturn'} aria-label="Describe your picture" rows={3} style={{ ...inputStyle(theme), resize: 'none', minHeight: 84, lineHeight: 1.4, marginTop: kinds.length > 1 && !startKind ? 0 : 6 }} />
                <div role="list" aria-label="Ideas" style={{ display: 'flex', flexDirection: 'column', paddingTop: 6 }}>
                  {ideas.map((t, i) => (
                    <div key={t} role="listitem" aria-label={`Idea ${t}`} onClick={() => { hapticTap(); setPrompt(t); setNote(''); }} className="zchat-row-press"
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, padding: '2px 4px', borderRadius: 10, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{ display: 'flex', color: theme.muted }}><StudioGlyph k="idea" size={21} /></span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: theme.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
                      <span style={{ display: 'flex', color: theme.muted2 }}><StudioGlyph k="insert" size={18} /></span>
                      {i < ideas.length - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 37, right: 4, bottom: 0, height: 1, background: theme.hair }} />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <KitSection title="Style" style={{ marginTop: 0 }}>
            <AiStyleChips value={style} onChange={setStyle} />
          </KitSection>
          {kind === 'picture' && (
            <KitSection title="Shape" style={{ marginTop: 0 }}>
              <PickTiles label="Shape" size={58} fit ringBg={theme.bgGradient} value={ratio} onChange={setRatio}
                options={[['1:1', 'Square', 'size_square'], ['4:5', 'Portrait', 'size_portrait'], ['16:9', 'Wide', 'size_wide']].map(([k, l, g]) => ({ k, label: l, sub: k, aria: `Shape ${l}`, art: g === 'size_wide' ? <StudioGlyph k="size_wide" size={34} /> : <KitGlyph k={g} size={34} /> }))} />
            </KitSection>
          )}
          {avatarMode && (
            <KitSection title="Anything extra" style={{ marginTop: 0 }}>
              <input value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, 160))} placeholder="Wearing sunglasses, a crown, a space suit" aria-label="Extra wishes" style={inputStyle(theme)} />
            </KitSection>
          )}
          {note && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, lineHeight: 1.45 }}>{note}</div>}
          {recent && recent.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, letterSpacing: '-0.01em', paddingBottom: 8 }}>Made before</div>
              <div role="list" aria-label="Made before" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
                {recent.map((r) => (
                  <div key={r.id} role="listitem" aria-label={`Open creation ${r.prompt || r.kind}`} onClick={() => openRecent(r)} className="zchat-press" style={{ flexShrink: 0, width: 92, height: 92, borderRadius: r.kind === 'avatar' || r.kind === 'profile' ? '50%' : 14, overflow: 'hidden', cursor: 'pointer', background: theme.rowBg }}>
                    <img src={r.url} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {avatarMode && onLegacy && (
            <div role="button" aria-label="Build a cartoon avatar instead" onClick={onLegacy} style={{ alignSelf: 'center', fontSize: 13.5, fontWeight: 700, color: theme.coral, cursor: 'pointer', padding: '4px 8px' }}>Build a cartoon avatar instead</div>
          )}
        </div>
      )}
    </FullPage>
  );
}
const AI_CHAR_PERSONALITY_IDEAS = ['Cheerful and curious, loves bad puns', 'Calm and wise, speaks in short sentences', 'Dramatic and funny, treats every chat like a movie', 'Shy at first, then very sweet and helpful', 'Sarcastic but kind underneath'];
function randomCharCfg() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return { skin: Math.floor(Math.random() * AV_SKIN.length), face: Math.floor(Math.random() * AV_FACE.length), hair: pick(AV_HAIR.filter((h) => h !== 'none')), hairColor: Math.floor(Math.random() * AV_HAIRC.length), eyes: pick(AV_EYES), mouth: pick(AV_MOUTH), glasses: Math.random() < 0.25 ? pick(AV_GLASSES) : 'none', extra: Math.random() < 0.35 ? pick(AV_EXTRA) : 'none', shirt: Math.floor(Math.random() * AV_SHIRT.length), bg: Math.floor(Math.random() * AV_BG.length), cheeks: Math.random() < 0.6 };
}

async function loadCharChats(myId) {
  const { data, error } = await supabase.from('ai_character_messages').select('character_id, role, content, created_at').eq('user_id', myId).order('created_at', { ascending: false }).limit(300);
  if (error) return { list: [], error };
  const seen = new Map();
  (data || []).forEach((r) => { if (!seen.has(r.character_id)) seen.set(r.character_id, r); });
  const ids = [...seen.keys()].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const byId = {};
  if (ids.length) {
    const { data: rows } = await supabase.from('ai_characters').select('*').in('id', ids);
    (rows || []).forEach((r) => { byId[r.id] = r; });
  }
  const list = [...seen.entries()].map(([id, last]) => ({ ch: byId[id] || charById(id), last })).filter((x) => x.ch);
  return { list };
}

const aiCharsMem = { uid: null, chats: null, mine: null, popular: null, fresh: null };
function aiCharsRemember(uid, k, v) {
  if (aiCharsMem.uid !== uid) Object.assign(aiCharsMem, { uid, chats: null, mine: null, popular: null, fresh: null });
  aiCharsMem[k] = v;
}
const PRACTICE_CHAR = { id: 'practice', name: 'Practice English', tagline: 'A friendly partner with gentle fixes' };
const aiCharsOff = (e) => loadMissing(e) || /relation|schema cache|does not exist|42P01/i.test(String((e && e.message) || ''));

export function AiCharactersPage({ myId, onClose, onOpenChar, onCreate }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const mem = aiCharsMem.uid === myId ? aiCharsMem : null;
  const [chats, setChats] = useState(mem ? mem.chats : null);
  const [mine, setMine] = useState(mem ? mem.mine : null);
  const [popular, setPopular] = useState(mem ? mem.popular : null);
  const [fresh, setFresh] = useState(mem ? mem.fresh : null);
  const [sort, setSort] = useState('popular');
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [hidden, setHidden] = useState(() => charHidden(myId));
  const [setupNote, setSetupNote] = useState('');
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  const [again, setAgain] = useState(0);
  const freshAsked = useRef(false);
  const loadMine = () => supabase.from('ai_characters').select('*').eq('owner_id', myId).order('updated_at', { ascending: false }).limit(50);
  useEffect(() => {
    let alive = true;
    loadCharChats(myId).then((c) => { if (!alive) return; if (c.error) { if (!aiCharsOff(c.error)) setFail(loadFailCode(c.error)); return; } setChats(c.list); aiCharsRemember(myId, 'chats', c.list); }, () => { if (alive) setFail(''); });
    loadMine().then((m) => {
      if (!alive) return;
      if (m.error && aiCharsOff(m.error)) setSetupNote('AI characters switch on once the latest ZChat setup is finished.');
      else if (m.error) setFail(loadFailCode(m.error));
      if (m.error) setMine((p) => p || []); else { setMine(m.data || []); aiCharsRemember(myId, 'mine', m.data || []); }
    }, () => { if (alive) { setMine((p) => p || []); setFail(''); } });
    supabase.from('ai_characters').select('*').eq('visibility', 'public').neq('owner_id', myId).order('chats', { ascending: false }).limit(30).then((pop) => {
      if (!alive) return;
      if (pop.error) { if (!aiCharsOff(pop.error)) setFail(loadFailCode(pop.error)); setPopular((p) => p || []); } else { setPopular(pop.data || []); aiCharsRemember(myId, 'popular', pop.data || []); }
    }, () => { if (alive) { setPopular((p) => p || []); setFail(''); } });
    const on = () => {
      setHidden(charHidden(myId));
      loadCharChats(myId).then((c) => { if (alive) { setChats(c.list); aiCharsRemember(myId, 'chats', c.list); } });
      loadMine().then(({ data }) => { if (alive && data) { setMine(data); aiCharsRemember(myId, 'mine', data); } });
    };
    window.addEventListener('zchat-chars-changed', on);
    return () => { alive = false; window.removeEventListener('zchat-chars-changed', on); };
  }, [tick]);
  useEffect(() => {
    if (sort !== 'new' || freshAsked.current) return undefined;
    freshAsked.current = true;
    let alive = true;
    let done = false;
    supabase.from('ai_characters').select('*').eq('visibility', 'public').neq('owner_id', myId).order('published_at', { ascending: false, nullsFirst: false }).limit(30)
      .then(({ data, error }) => { done = true; if (!alive) return; if (error && !aiCharsOff(error)) { freshAsked.current = false; setFail(loadFailCode(error)); return; } if (error) { setFresh((p) => p || []); return; } setFresh(data || []); aiCharsRemember(myId, 'fresh', data || []); }, () => { done = true; if (alive) { freshAsked.current = false; setFail(''); } });
    return () => { alive = false; if (!done) freshAsked.current = false; };
  }, [sort, tick]);
  const term = q.replace(/[%,()*:"\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  useEffect(() => {
    if (term.length < 2) { setFound(null); return undefined; }
    let alive = true;
    const t = setTimeout(() => {
      supabase.from('ai_characters').select('*').eq('visibility', 'public').or(`name.ilike.%${term}%,tagline.ilike.%${term}%`).order('chats', { ascending: false }).limit(30)
        .then(({ data, error }) => { if (alive) setFound({ term, rows: data || [], fail: error && !aiCharsOff(error) ? loadFailCode(error) : null }); }, () => { if (alive) setFound({ term, rows: [], fail: '' }); });
    }, 280);
    return () => { alive = false; clearTimeout(t); };
  }, [term, again]);
  const practice = { ...PRACTICE_CHAR, avatar: `${window.location.origin}${BOT_PIC}` };
  const card = (ch, sub, onTap) => (
    <div key={ch.id} role="button" aria-label={onTap ? ch.name : `Chat with ${ch.name}`} onClick={onTap || (() => onOpenChar(ch))} className="zchat-press" style={{ minWidth: 0, padding: '14px 12px 13px', borderRadius: 18, background: theme.rowBg, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 9 }}>
      <CharAvatar ch={ch} size={52} />
      <div style={{ minWidth: 0, width: '100%' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.35, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 34 }}>{ch.tagline || 'Tap to chat'}</div>
        {sub && <div style={{ fontSize: 11.5, color: theme.muted, fontWeight: 600, marginTop: 6 }}>{sub}</div>}
      </div>
    </div>
  );
  const openPractice = () => { hapticTap(); aiToolOpen('practice'); };
  const chatsSub = (ch) => (ch.chats ? `${formatCount(ch.chats)} ${ch.chats === 1 ? 'chat' : 'chats'}` : null);
  const heading = (t) => <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink, padding: '20px 16px 10px', letterSpacing: '-0.01em' }}>{t}</div>;
  const grid = (children) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, padding: '0 16px' }}>{children}</div>;
  const visible = (list) => (list || []).filter((ch) => !hidden.has(String(ch.id)));
  const searching = term.length >= 2;
  const low = term.toLowerCase();
  const localHits = searching ? [
    ...(`${practice.name} ${practice.tagline} english`.toLowerCase().includes(low) ? [practice] : []),
    ...AI_CHAR_TEMPLATES.filter((t) => `${t.name} ${t.tagline}`.toLowerCase().includes(low)).map(tplChar),
  ] : [];
  const foundRows = found && found.term === term ? visible(found.rows) : null;
  const people = visible(sort === 'new' ? fresh : popular);
  const freshWait = sort === 'new' && fresh === null && !!(popular && popular.length);
  const retry = () => { setFail(null); setTick((n) => n + 1); };
  return (
    <FullPage title="AI characters" subtitle="Make one or chat with one" onBack={onClose} zIndex={74} pad={false}
      right={<HeaderIconButton label="Create a character" onClick={onCreate}><Plus size={22} /></HeaderIconButton>}>
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
          <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 40))} type="search" enterKeyHint="search" placeholder="Search characters" aria-label="Search characters" style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 14 }} />
        </div>
      </div>
      {setupNote && <div role="alert" style={{ margin: '12px 16px 0', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{setupNote}</div>}
      {fail !== null && !searching && !freshWait && <LoadFail small code={fail} onRetry={retry} />}
      {searching ? (
        <>
          {heading('Results')}
          {foundRows === null && !localHits.length ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.muted} /></div>
          ) : found && found.term === term && found.fail != null && !localHits.length ? (
            <LoadFail small code={found.fail} onRetry={() => { setFound(null); setAgain((n) => n + 1); }} />
          ) : (localHits.length + (foundRows || []).length) === 0 ? (
            <EmptyState art="search" title="No characters found" text="Try another name or word." />
          ) : grid([
            ...localHits.map((ch) => card(ch, null, ch.id === 'practice' ? openPractice : null)),
            ...(foundRows || []).map((ch) => card(ch, ch.owner_id === myId ? 'Made by you' : chatsSub(ch))),
          ])}
        </>
      ) : (
        <>
          {chats && chats.length > 0 && (
            <>
              {heading('Chats')}
              <div role="list" aria-label="Character chats">
                {chats.slice(0, 8).map(({ ch, last }) => (
                  <div key={ch.id} role="listitem" aria-label={`Open chat with ${ch.name}`} onClick={() => onOpenChar(ch)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', cursor: 'pointer' }}>
                    <CharAvatar ch={ch} size={50} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{ch.name}</div>
                      <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last.role === 'user' ? `You: ${last.content}` : last.content}</div>
                    </div>
                    <span style={{ fontSize: 11.5, color: theme.muted, flexShrink: 0 }}>{formatListTime(last.created_at)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {heading('Yours')}
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px 4px' }}>
            <div role="button" aria-label="Create a character" onClick={onCreate} className="zchat-press" style={{ flexShrink: 0, width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: `1.5px dashed ${theme.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, boxSizing: 'border-box' }}><Plus size={24} /></div>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>Create</span>
            </div>
            {(mine || []).map((ch) => (
              <div key={ch.id} role="button" aria-label={`Chat with ${ch.name}`} onClick={() => onOpenChar(ch)} className="zchat-press" style={{ flexShrink: 0, width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <CharAvatar ch={ch} size={64} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.ink, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</span>
              </div>
            ))}
          </div>
          {heading('Try one')}
          {grid([card(practice, null, openPractice), ...AI_CHAR_TEMPLATES.map((t) => card(tplChar(t)))])}
          {((popular && popular.length > 0) || (fresh && fresh.length > 0)) && (
            <>
              {heading('From people on ZChat')}
              <div style={{ padding: '0 16px 12px' }}>
                <SegmentedControl dense value={sort} onChange={(k) => { if (k !== sort) { hapticTap(); setSort(k); } }} options={[['popular', 'Popular'], ['new', 'New']]} />
              </div>
              {sort === 'new' && fresh === null ? (
                fail !== null ? <LoadFail small code={fail} onRetry={retry} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.muted} /></div>
              ) : people.length === 0 ? (
                <div style={{ fontSize: 13.5, color: theme.muted, padding: '4px 16px 0' }}>Nothing here yet.</div>
              ) : grid(people.map((ch) => card(ch, sort === 'new' ? `Shared ${formatListTime(ch.published_at || ch.updated_at)}` : chatsSub(ch))))}
            </>
          )}
        </>
      )}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '18px 16px calc(28px + env(safe-area-inset-bottom))' }}>Characters are made up and replies come from AI, so they can be wrong. Your chats with them are only visible to you.</div>
    </FullPage>
  );
}
export function AiCharacterEditor({ myId, initial, onClose, onSaved, onDeleted }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rowNow, setRowNow] = useState(initial && initial.id ? initial : null);
  const editing = !!rowNow;
  const [name, setName] = useState((initial && initial.name) || '');
  const [tagline, setTagline] = useState((initial && initial.tagline) || '');
  const [personality, setPersonality] = useState((initial && initial.personality) || '');
  const [greeting, setGreeting] = useState((initial && initial.greeting) || '');
  const [avatar, setAvatar] = useState(() => (initial && initial.avatar) || `cfg:${JSON.stringify(randomCharCfg())}`);
  const [visibility, setVisibility] = useState((initial && initial.visibility) || 'private');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [avatarSheet, setAvatarSheet] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photoRef = useRef(null);
  const noteRef = useRef(null);
  useEffect(() => { if (note && noteRef.current) { try { noteRef.current.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch {} } }, [note]);
  const preview = { id: (rowNow && rowNow.id) || name || 'new', name: name || 'New character', avatar };
  const uploadAvatarFile = async (file) => {
    setPhotoBusy(true);
    try {
      const url = URL.createObjectURL(file);
      const sq = await imageUrlToFile(url, 'character.jpg', 640, 'image/jpeg', 0.88, true);
      URL.revokeObjectURL(url);
      const { url: up, error } = await uploadMedia(sq, myId);
      if (error || !up) { setNote('That picture did not upload. Try again.'); return false; }
      setAvatar(up);
      return true;
    } catch { setNote('That picture could not be used. Try another one.'); return false; } finally { setPhotoBusy(false); }
  };
  const pickPhoto = async (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) await uploadAvatarFile(f); };
  const save = async () => {
    if (busy) return;
    const n = name.trim();
    const pers = personality.trim();
    if (!n) { setNote('Give your character a name.'); return; }
    if (pers.length < 10) { setNote('Describe the personality in a sentence or two.'); return; }
    setBusy(true); setNote('');
    const row = { name: n.slice(0, 40), tagline: tagline.trim().slice(0, 120), personality: pers.slice(0, 1500), greeting: greeting.trim().slice(0, 400), avatar: avatar || null };
    const wantPublic = visibility === 'public';
    const done = (data) => {
      setBusy(false);
      hapticTap();
      try { window.dispatchEvent(new Event('zchat-chars-changed')); } catch {}
      onSaved(data);
    };
    let cur = rowNow;
    const madeNow = !cur;
    if (!cur) {
      const ins = await supabase.from('ai_characters').insert({ ...row, owner_id: myId, visibility: 'private' }).select().single();
      if (ins.error || !ins.data) { setBusy(false); setNote(aiCharSetupMessage(ins.error)); return; }
      cur = ins.data;
      setRowNow(cur);
      if (!wantPublic) { done(cur); return; }
    }
    const same = cur.visibility === 'public' && ['name', 'tagline', 'personality', 'greeting'].every((k) => String(cur[k] || '').trim() === String(row[k] || '').trim()) && (cur.avatar || null) === row.avatar;
    if (wantPublic && !same) {
      const chk = await zchatAichat('publish', { id: cur.id, ...row }, 25000);
      if (!chk.data || chk.data.ok !== true) {
        setBusy(false);
        const why = chk.data && chk.data.reason ? `This character cannot be public: ${chk.data.reason}. Change it or keep it as Only me.` : `${chk.error || 'Could not check this character right now.'} Keep it as Only me or try again.`;
        setNote(madeNow ? `Saved as Only me. ${why}` : why);
        if (madeNow) { try { window.dispatchEvent(new Event('zchat-chars-changed')); } catch {} }
        return;
      }
    }
    const up = await supabase.from('ai_characters').update({ ...row, visibility: wantPublic ? 'public' : 'private', updated_at: new Date().toISOString() }).eq('id', cur.id).eq('owner_id', myId).select().single();
    if (up.error || !up.data) { setBusy(false); setNote(aiCharSaveMessage(up.error)); return; }
    done(up.data);
  };
  const remove = async () => {
    setConfirmDelete(false);
    setBusy(true);
    await supabase.from('ai_character_messages').delete().eq('user_id', myId).eq('character_id', rowNow.id);
    const { error } = await supabase.from('ai_characters').delete().eq('id', rowNow.id).eq('owner_id', myId);
    setBusy(false);
    if (error) { setNote('That did not delete. Try again.'); return; }
    try { window.dispatchEvent(new Event('zchat-chars-changed')); } catch {}
    onDeleted();
  };
  const field = (label, value, set, max, placeholder, aria, rows) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.muted }}>{label}</span>
        {value.length > max * 0.8 && <span style={{ fontSize: 11.5, color: theme.muted }}>{max - value.length}</span>}
      </div>
      {rows ? (
        <textarea value={value} onChange={(e) => { set(e.target.value.slice(0, max)); if (note) setNote(''); }} placeholder={placeholder} aria-label={aria} rows={rows} style={{ ...inputStyle(theme), resize: 'none', lineHeight: 1.4 }} />
      ) : (
        <input value={value} onChange={(e) => { set(e.target.value.slice(0, max)); if (note) setNote(''); }} placeholder={placeholder} aria-label={aria} style={inputStyle(theme)} />
      )}
    </div>
  );
  return (
    <FullPage title={editing ? 'Edit character' : 'New character'} onBack={onClose} zIndex={760} pad={false}
      footer={<BigButton label={busy ? 'Saving' : editing ? 'Save changes' : 'Create character'} disabled={busy} onClick={save} />}>
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />
      <div style={{ padding: '14px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div role="button" aria-label="Change character picture" onClick={() => setAvatarSheet(true)} className="zchat-press" style={{ position: 'relative', cursor: 'pointer' }}>
            <CharAvatar ch={preview} size={104} />
            {photoBusy && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={22} /></div>}
          </div>
          <div role="button" aria-label="Edit picture" onClick={() => setAvatarSheet(true)} style={{ fontSize: 14, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>Edit picture</div>
        </div>
        {field('Name', name, setName, 40, 'Luna', 'Character name')}
        {field('Short line', tagline, setTagline, 120, 'Astronaut on a long trip home', 'Character short line')}
        <div>
          {field('Personality', personality, setPersonality, 1500, 'How they talk, what they love, how they act', 'Character personality', 5)}
          <div style={{ paddingTop: 10 }}>
            <div style={{ fontSize: 12.5, color: theme.muted, paddingBottom: 2 }}>Tap an idea to add it</div>
            {AI_CHAR_PERSONALITY_IDEAS.map((t, i) => {
              const used = personality.includes(t);
              return (
                <div key={t} role="button" aria-label={`Personality idea ${t}`} onClick={() => { hapticTap(); setPersonality((p) => (p.trim() ? `${p.trim()} ${t}.` : `${t}.`).slice(0, 1500)); }} className="zchat-row-press" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '4px 2px', cursor: 'pointer' }}>
                  {i > 0 && <span aria-hidden="true" style={{ position: 'absolute', left: 38, right: 2, top: 0, height: 1, background: theme.hair }} />}
                  <span style={{ display: 'flex', color: used ? kitOnInk(theme) : theme.ink2, flexShrink: 0 }}><LineGlyph k={['cheer', 'calm', 'clap', 'shy', 'smirk'][i] || 'smile'} size={24} /></span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, lineHeight: 1.3, color: theme.ink }}>{t}</span>
                  <span style={{ display: 'flex', color: used ? kitOnInk(theme) : theme.muted, flexShrink: 0 }}><LineGlyph k={used ? 'check' : 'plus'} size={18} sw={2.6} /></span>
                </div>
              );
            })}
          </div>
        </div>
        {field('First message', greeting, setGreeting, 400, 'Hi! What is the weather like on Earth today?', 'Character first message', 2)}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, paddingBottom: 8 }}>Who can chat with them</div>
          <div role="radiogroup" aria-label="Who can chat with them" style={{ display: 'flex', height: 38, borderRadius: 11, background: theme.rowBg, padding: 3 }}>
            {[['private', 'Only me'], ['public', 'Everyone']].map(([k, l]) => (
              <div key={k} role="radio" aria-checked={visibility === k} aria-label={l} onClick={() => { hapticTap(); setVisibility(k); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: visibility === k ? theme.panelBg : 'transparent', color: visibility === k ? theme.ink : theme.muted, boxShadow: visibility === k ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}>{l}</div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, paddingTop: 8 }}>{visibility === 'public' ? "Anyone on ZChat can find and chat with them. Each person's chat stays private. ZChat checks a character before it is shared." : 'Only you can see and chat with them.'} Characters must be made up, not real people.</div>
        </div>
        {note && <div ref={noteRef} role="alert" style={{ fontSize: 13.5, color: theme.danger, lineHeight: 1.45 }}>{note}</div>}
        {editing && <div role="button" aria-label="Delete character" onClick={() => setConfirmDelete(true)} style={{ alignSelf: 'center', fontSize: 14.5, fontWeight: 700, color: theme.danger, cursor: 'pointer', padding: '6px 10px' }}>Delete character</div>}
      </div>
      {avatarSheet && (
        <ActionSheet title="Character picture" zIndex={800} onClose={() => setAvatarSheet(false)} items={[
          { k: 'ai', label: 'Create with AI', icon: <AiSparkIcon />, on: () => { setAvatarSheet(false); setAiOpen(true); } },
          { k: 'photo', label: 'Choose a photo', icon: <ImageIcon />, on: () => { setAvatarSheet(false); if (photoRef.current) photoRef.current.click(); } },
          { k: 'drawn', label: avatar && avatar.indexOf('cfg:') === 0 ? 'Try another drawn look' : 'Use a drawn look', icon: <AvatarMakerIcon />, on: () => { setAvatarSheet(false); hapticTap(); setAvatar(`cfg:${JSON.stringify(randomCharCfg())}`); } },
        ]} />
      )}
      {aiOpen && (
        <AiStudioPage myId={myId} mode="image" startKind="profile" initialPrompt={[name.trim(), tagline.trim()].filter(Boolean).join(', ')} avatarLabel="Use for character"
          onClose={() => setAiOpen(false)} onUseAvatar={(file) => uploadAvatarFile(file)} />
      )}
      {confirmDelete && <ConfirmSheet title={`Delete ${name || 'this character'}?`} text="Your chat with them is deleted too. People who chatted with them lose access." confirmLabel="Delete" zIndex={820} onCancel={() => setConfirmDelete(false)} onConfirm={remove} />}
    </FullPage>
  );
}
let aiVoicesMem = null;
function aiVoices() {
  try {
    const s = window.speechSynthesis;
    const v = (s && s.getVoices()) || [];
    if (v.length) aiVoicesMem = v;
    return aiVoicesMem || v;
  } catch { return []; }
}
function aiPickVoice(lang) {
  const want = String(lang || 'en-US').toLowerCase().replace('_', '-');
  const pool = aiVoices().filter((v) => v && v.lang && v.lang.toLowerCase().replace('_', '-').slice(0, 2) === want.slice(0, 2));
  const score = (v) => {
    const n = String(v.name || '');
    return (/natural|neural|premium|enhanced|wavenet/i.test(n) ? 6 : 0) + (/google/i.test(n) ? 3 : 0) + (/samantha|ava|allison|serena|karen|daniel|moira|tessa|aria|jenny/i.test(n) ? 2 : 0)
      + (v.lang.toLowerCase().replace('_', '-') === want ? 2 : 0) - (/compact|eloquence|espeak/i.test(n) ? 5 : 0);
  };
  return pool.length ? pool.slice().sort((a, b) => score(b) - score(a))[0] : null;
}
function aiSpeechChunks(text) {
  const clean = String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/[*_`#>~|]+/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  const parts = clean.match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [clean];
  const out = [];
  let cur = '';
  parts.forEach((p) => { if (cur && (cur + p).length > 220) { out.push(cur.trim()); cur = p; } else cur += p; });
  if (cur.trim()) out.push(cur.trim());
  return out.slice(0, 30);
}
function aiBlobB64(blob) {
  return new Promise((resolve) => {
    try {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || '').replace(/^data:[^,]*,/, ''));
      fr.onerror = () => resolve('');
      fr.readAsDataURL(blob);
    } catch { resolve(''); }
  });
}
function aiCloseCtx(m) {
  const ctx = m && m.ctx;
  if (!ctx) return;
  m.ctx = null;
  try { if (ctx.state !== 'closed') ctx.close().catch(() => {}); } catch {}
}
const AI_VOICE_CSS = '@keyframes zai-ring{0%{transform:scale(1);opacity:.42}100%{transform:scale(1.6);opacity:0}}@keyframes zai-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}.zai-ring{position:absolute;inset:0;border-radius:50%;pointer-events:none;animation:zai-ring 1.8s cubic-bezier(0.2,0.8,0.2,1) infinite}.zai-breathe{animation:zai-breathe 2.6s ease-in-out infinite}';

export function AiVoiceSheet({ title, sub, avatar, lang, ask, onClose, z = 790 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [phase, setPhase] = useState('idle');
  const [heard, setHeard] = useState('');
  const [said, setSaid] = useState('');
  const [answer, setAnswer] = useState('');
  const [fix, setFix] = useState(null);
  const [note, setNote] = useState('');
  const recRef = useRef(null);
  const mediaRef = useRef(null);
  const tokRef = useRef(0);
  const aliveRef = useRef(true);
  const missRef = useRef(0);
  const askRef = useRef(ask);
  askRef.current = ask;
  const lng = lang || aiLang();
  const motion = !reducedMotion();
  const stopAll = () => {
    tokRef.current += 1;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch {}
    const r = recRef.current;
    recRef.current = null;
    if (r) { try { r.onresult = null; r.onend = null; r.onerror = null; r.abort(); } catch {} }
    const m = mediaRef.current;
    mediaRef.current = null;
    if (m) {
      m.cancelled = true;
      try { if (m.rec && m.rec.state !== 'inactive') m.rec.stop(); } catch {}
      try { m.stream.getTracks().forEach((t) => t.stop()); } catch {}
      aiCloseCtx(m);
      cancelAnimationFrame(m.raf);
      clearTimeout(m.cap);
    }
  };
  const speakOut = (text, my) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') { setPhase('idle'); return; }
    const chunks = aiSpeechChunks(text);
    const voice = aiPickVoice(lng);
    let i = 0;
    setPhase('speaking');
    try { synth.cancel(); } catch {}
    const next = () => {
      if (!aliveRef.current || my !== tokRef.current) return;
      if (i >= chunks.length) { listen(); return; }
      const chunk = chunks[i++];
      const u = new SpeechSynthesisUtterance(chunk);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = lng;
      let done = false;
      const guard = setTimeout(() => fin(), 2500 + chunk.length * 95);
      function fin() { if (done) return; done = true; clearTimeout(guard); next(); }
      u.onend = fin;
      u.onerror = fin;
      try { synth.speak(u); } catch { fin(); }
    };
    next();
  };
  const handleText = async (text) => {
    const t = String(text || '').trim();
    if (!aliveRef.current) return;
    if (!t) { missRef.current += 1; setPhase('idle'); setHeard(''); setNote(missRef.current > 2 ? '' : 'I did not catch that. Tap the circle and try again.'); return; }
    missRef.current = 0;
    setSaid(t); setHeard(''); setFix(null); setAnswer(''); setNote(''); setPhase('thinking');
    const my = ++tokRef.current;
    const r = await askRef.current(t);
    if (!aliveRef.current || my !== tokRef.current) return;
    if (!r || r.error || !r.reply) { setPhase('idle'); setNote((r && r.error) || 'That did not work this time. Tap the circle to try again.'); return; }
    setAnswer(r.reply);
    setFix(r.fix || null);
    speakOut(r.reply, my);
  };
  const recordAudio = async () => {
    if (!aiCanRecord()) { setPhase('idle'); setNote('Voice does not work in this browser.'); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { if (aliveRef.current) { setPhase(e && e.name === 'NotAllowedError' ? 'denied' : 'idle'); if (!(e && e.name === 'NotAllowedError')) setNote('The microphone did not start. Tap the circle to try again.'); } return; }
    if (!aliveRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch { return false; } }) || '';
    let rec;
    try { rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined); } catch { stream.getTracks().forEach((t) => t.stop()); setPhase('idle'); setNote('Voice does not work in this browser.'); return; }
    const m = { rec, stream, chunks: [], ctx: null, raf: 0, cap: 0, cancelled: false };
    mediaRef.current = m;
    rec.ondataavailable = (e) => { if (e.data && e.data.size) m.chunks.push(e.data); };
    rec.onstop = async () => {
      try { stream.getTracks().forEach((t) => t.stop()); } catch {}
      aiCloseCtx(m);
      cancelAnimationFrame(m.raf);
      clearTimeout(m.cap);
      if (m.cancelled || !aliveRef.current) return;
      if (mediaRef.current === m) mediaRef.current = null;
      const blob = new Blob(m.chunks, { type: rec.mimeType || type || 'audio/webm' });
      if (blob.size < 1200) { handleText(''); return; }
      setPhase('hearing');
      const my = tokRef.current;
      const b64 = await aiBlobB64(blob);
      const r = await zchatAichat('hear', { audio: b64, mime: blob.type, lang: lng }, 30000);
      if (!aliveRef.current || my !== tokRef.current) return;
      if (r.data) handleText(r.data.text || '');
      else { setPhase('idle'); setNote(toolErrorText(r, 'Voice')); }
    };
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        m.ctx = ctx;
        const an = ctx.createAnalyser();
        an.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        const t0 = performance.now();
        let spoke = false;
        let quiet = 0;
        const tick = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / buf.length);
          const now = performance.now();
          if (rms > 0.045) { spoke = true; quiet = 0; } else if (spoke) { if (!quiet) quiet = now; else if (now - quiet > 1400) { if (rec.state === 'recording') rec.stop(); return; } }
          if (!spoke && now - t0 > 8000) { if (rec.state === 'recording') rec.stop(); return; }
          m.raf = requestAnimationFrame(tick);
        };
        m.raf = requestAnimationFrame(tick);
      }
    } catch {}
    m.cap = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 20000);
    try { rec.start(250); setPhase('listening'); } catch { stopAll(); setPhase('idle'); setNote('Voice does not work in this browser.'); }
  };
  function listen() {
    if (!aliveRef.current) return;
    stopAll();
    setHeard('');
    setNote('');
    const SR = aiSpeechRec();
    if (!SR) { recordAudio(); return; }
    let rec;
    try { rec = new SR(); } catch { recordAudio(); return; }
    rec.lang = lng;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let fin = '';
    let mid = '';
    let failed = '';
    rec.onresult = (e) => {
      mid = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) fin = `${fin} ${x[0].transcript}`.trim(); else mid += x[0].transcript; }
      setHeard(`${fin} ${mid}`.trim());
    };
    rec.onerror = (e) => { failed = (e && e.error) || 'failed'; };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      recRef.current = null;
      if (failed === 'not-allowed' || failed === 'service-not-allowed') { setPhase('denied'); return; }
      const t = `${fin} ${mid}`.trim();
      if (!t && failed && failed !== 'no-speech' && failed !== 'aborted' && aiCanRecord()) { recordAudio(); return; }
      handleText(t);
    };
    recRef.current = rec;
    try { rec.start(); setPhase('listening'); } catch { recRef.current = null; recordAudio(); }
  }
  const stopListening = () => {
    const r = recRef.current;
    if (r) { try { r.stop(); } catch {} return; }
    const m = mediaRef.current;
    if (m && m.rec && m.rec.state === 'recording') { try { m.rec.stop(); } catch {} }
  };
  useEffect(() => {
    aiVoices();
    const s = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const onVoices = () => aiVoices();
    try { if (s && s.addEventListener) s.addEventListener('voiceschanged', onVoices); } catch {}
    listen();
    return () => { aliveRef.current = false; stopAll(); try { if (s && s.removeEventListener) s.removeEventListener('voiceschanged', onVoices); } catch {} };
  }, []);
  const tapOrb = () => {
    hapticTap();
    aiSpeechUnlock();
    if (phase === 'listening') { stopListening(); return; }
    if (phase === 'thinking' || phase === 'hearing') return;
    missRef.current = 0;
    listen();
  };
  const status = { idle: 'Tap the circle to talk', listening: 'Listening', hearing: 'Getting your words', thinking: 'Thinking', speaking: 'Speaking. Tap to cut in', denied: 'Allow the microphone to talk' }[phase] || '';
  const live = phase === 'listening' || phase === 'speaking';
  const ink = igPalette(theme);
  return (
    <Portal>
      <style>{AI_VOICE_CSS}</style>
      <div className="zchat-fade" role="dialog" aria-label={`${title} voice chat`} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: z, background: ink.bg, color: theme.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 'calc(8px + env(safe-area-inset-top)) 8px 4px', flexShrink: 0 }}>
          <div role="button" aria-label="Close voice chat" onClick={onClose} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><X size={24} /></div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{sub}</div>}
          </div>
          <div style={{ width: 44 }} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 18 }}>
          <div role="button" aria-label={phase === 'listening' ? 'Stop listening' : phase === 'speaking' ? 'Cut in and talk' : 'Talk'} onClick={tapOrb} className="zchat-press" style={{ position: 'relative', width: 156, height: 156, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {live && motion && [0, 0.6, 1.2].map((d) => <span key={d} aria-hidden="true" className="zai-ring" style={{ background: theme.coral, animationDelay: `${d}s`, animationDuration: phase === 'speaking' ? '2.4s' : '1.8s' }} />)}
            <div className={phase === 'thinking' && motion ? 'zai-breathe' : undefined} style={{ position: 'relative', width: 132, height: 132, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 4px ${live ? theme.coral : theme.border}`, transition: 'box-shadow 200ms ease', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{avatar}</div>
          </div>
          <div aria-live="polite" style={{ minHeight: 22, fontSize: 15, fontWeight: 700, color: phase === 'denied' ? theme.danger : live ? kitOnInk(theme) : theme.muted, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
            {(phase === 'thinking' || phase === 'hearing') && <Spinner size={15} color={theme.muted} />}{status}
          </div>
          <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '34vh', overflowY: 'auto', overscrollBehavior: 'contain', textAlign: 'center' }}>
            {(heard || said) && <div style={{ fontSize: 15, lineHeight: 1.45, color: theme.muted, wordBreak: 'break-word' }}>{heard || said}</div>}
            {fix && !heard && (
              <div style={{ fontSize: 14, lineHeight: 1.45, color: theme.ink, wordBreak: 'break-word' }}><span style={{ color: kitOnInk(theme), fontWeight: 700 }}>Better: </span>{fix.better}{fix.why ? <span style={{ color: theme.muted }}>{` ${fix.why}`}</span> : null}</div>
            )}
            {answer && !heard && <div style={{ fontSize: 18, lineHeight: 1.45, fontWeight: 600, color: theme.ink, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{answer}</div>}
            {note && <div role="alert" style={{ fontSize: 13.5, lineHeight: 1.45, color: theme.muted }}>{note}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 calc(22px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div role="button" aria-label="End voice chat" onClick={() => { hapticTap(); onClose(); }} className="zchat-press" style={{ width: 64, height: 64, borderRadius: '50%', background: theme.danger, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><PhoneOff size={26} /></div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.muted }}>End</span>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const EP_LEVELS = [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']];
const EP_TOPICS = [
  { k: 'any', label: 'Anything', sub: 'Chat about whatever comes up', g: 'chat', open: ['Hi, I am happy to practise with you. How are you today?', 'Hi there. Let us chat in English. What have you been up to today?'] },
  { k: 'day', label: 'Your day', sub: 'Plans, weather and how you feel', g: 'coffee', open: ['Good to see you. What did you do this morning?', 'How is your day going so far? Anything good happen?'] },
  { k: 'food', label: 'Food', sub: 'Cooking, eating out and favourites', g: 'food', open: ['Let us talk about food. What did you eat today?', 'Food time. What is a dish you could eat every week?'] },
  { k: 'travel', label: 'Travel', sub: 'Places, trips and directions', g: 'travel', open: ['Let us talk about travel. Where do you want to go?', 'Tell me about a place you visited and loved.'] },
  { k: 'work', label: 'Work and study', sub: 'School, jobs and goals', g: 'study', open: ['Do you work or study? Tell me a little about it.', 'What are you working on or studying these days?'] },
  { k: 'fun', label: 'Movies and music', sub: 'Shows, songs and games', g: 'movie', open: ['What music do you like? Who is your favourite singer?', 'Seen a good movie or show lately? What was it about?'] },
  { k: 'interview', label: 'Job interview', sub: 'Practise friendly interview questions', g: 'work', open: ['Welcome to your practice interview. Can you tell me a little about yourself?', 'Thanks for coming in. To start, tell me about yourself and what you do.'] },
];
const epMem = { s: null, past: null };
function epOpener(topic, level) {
  const t = EP_TOPICS.find((x) => x.k === topic) || EP_TOPICS[0];
  return t.open[level === 'beginner' ? 0 : 1];
}

export function EnglishPracticePage({ myId, onClose, onSnack }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const saved = epMem.s && epMem.s.uid === myId ? epMem.s : null;
  const [phase, setPhase] = useState(saved ? 'chat' : 'setup');
  const [level, setLevel] = useState(() => (saved && saved.level) || readJsonLs('zchat-ep-level', 'intermediate'));
  const [topic, setTopic] = useState((saved && saved.topic) || 'any');
  const [turns, setTurns] = useState((saved && saved.turns) || []);
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [err, setErr] = useState('');
  const [openFix, setOpenFix] = useState(null);
  const [voice, setVoice] = useState(false);
  const [summary, setSummary] = useState(null);
  const [past, setPast] = useState(() => (epMem.past && epMem.past.uid === myId ? epMem.past.rows : null));
  const listRef = useRef(null);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const aliveRef = useRef(true);
  const canVoice = aiVoiceOk();
  useEffect(() => () => { aliveRef.current = false; }, []);
  useEffect(() => {
    supabase.from('ai_practice_sessions').select('id, level, topic, good, next, created_at').eq('user_id', myId).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { if (!aliveRef.current || !data) return; epMem.past = { uid: myId, rows: data }; setPast(data); }, () => {});
  }, []);
  useEffect(() => { if (phase === 'chat') epMem.s = { uid: myId, level, topic, turns }; }, [phase, level, topic, turns]);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [turns.length, waiting, phase, openFix]);
  const levelLabel = (EP_LEVELS.find(([k]) => k === level) || EP_LEVELS[1])[1];
  const topicRow = EP_TOPICS.find((x) => x.k === topic) || EP_TOPICS[0];
  const focus = past && past[0] && Array.isArray(past[0].next) ? past[0].next.join(' ') : '';
  const start = (withVoice) => {
    hapticTap();
    if (withVoice) aiSpeechUnlock();
    try { localStorage.setItem('zchat-ep-level', JSON.stringify(level)); } catch {}
    setTurns([{ id: `b${Date.now()}`, r: 'bot', t: epOpener(topic, level) }]);
    setPhase('chat');
    if (withVoice) setVoice(true);
  };
  const sendTurn = async (textIn) => {
    const text = String(textIn || '').trim().slice(0, 600);
    if (!text) return { error: 'Say something first.' };
    const mine = { id: `m${Date.now()}`, r: 'me', t: text };
    const next = [...turnsRef.current, mine];
    turnsRef.current = next;
    setTurns(next);
    setErr('');
    setWaiting(true);
    const r = await zchatAichat('practice', { level, topic, focus, turns: next.slice(-16).map((x) => ({ r: x.r, t: x.t })) }, 30000);
    if (!aliveRef.current) return { error: '' };
    setWaiting(false);
    if (!(r.data && r.data.reply)) { const e = toolErrorText(r, 'Practice'); setErr(e); return { error: e }; }
    const fix = r.data.fix && r.data.fix.better ? { better: String(r.data.fix.better), why: String(r.data.fix.why || '') } : null;
    const withFix = turnsRef.current.map((x) => (x.id === mine.id ? { ...x, fix } : x));
    const done = [...withFix, { id: `b${Date.now()}`, r: 'bot', t: String(r.data.reply) }];
    turnsRef.current = done;
    setTurns(done);
    playUiSound('receive');
    return { reply: String(r.data.reply), fix };
  };
  const send = () => {
    const t = draft.trim();
    if (!t || waiting) return;
    setDraft('');
    playUiSound('send');
    sendTurn(t);
  };
  const retry = async () => {
    const list = turnsRef.current;
    const last = list[list.length - 1];
    if (!last || last.r !== 'me' || waiting) return;
    turnsRef.current = list.slice(0, -1);
    setTurns(turnsRef.current);
    sendTurn(last.t);
  };
  const finish = () => { epMem.s = null; onClose(); };
  const end = async () => {
    const mineCount = turnsRef.current.filter((x) => x.r === 'me').length;
    if (mineCount < 2) { finish(); return; }
    setSummary({ busy: true });
    const list = turnsRef.current;
    const r = await zchatAichat('practice_end', { level, topic, turns: list.slice(-40).map((x) => ({ r: x.r, t: x.t })), fixes: list.filter((x) => x.fix).slice(-20).map((x) => ({ from: x.t, to: x.fix.better })) }, 30000);
    if (!aliveRef.current) return;
    if (!(r.data && (r.data.good || r.data.next))) { setSummary({ error: toolErrorText(r, 'Session notes') }); return; }
    const good = (r.data.good || []).slice(0, 3).map(String);
    const nextUp = (r.data.next || []).slice(0, 2).map(String);
    setSummary({ good, next: nextUp });
    const row = { user_id: myId, level, topic, good, next: nextUp, turns: Math.min(400, list.length) };
    supabase.from('ai_practice_sessions').insert(row).select('id, level, topic, good, next, created_at').single().then(({ data }) => {
      if (!data) return;
      const rows = [data, ...((epMem.past && epMem.past.uid === myId && epMem.past.rows) || [])].slice(0, 5);
      epMem.past = { uid: myId, rows };
      if (aliveRef.current) setPast(rows);
    }, () => {});
  };
  if (phase === 'setup') {
    return (
      <FullPage title="Practice English" subtitle="With ZChat Bot" onBack={onClose} zIndex={78}
        footer={(
          <div style={{ display: 'flex', gap: 8 }}>
            {canVoice && <div style={{ flex: 1 }}><BigButton label="Talk out loud" tone="plain" onClick={() => start(true)} /></div>}
            <div style={{ flex: 1 }}><BigButton label="Start chatting" onClick={() => start(false)} /></div>
          </div>
        )}>
        <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.55, padding: '8px 4px 2px' }}>Chat in English at your own pace. ZChat Bot keeps the talk going and shows small fixes under your messages. Tap a fix to see why.</div>
        <KitSection title="Your level">
          <SegmentedControl dense value={level} onChange={(k) => { hapticTap(); setLevel(k); }} options={EP_LEVELS} />
        </KitSection>
        <KitSection title="Talk about">
          <ChoiceList label="Talk about" value={topic} onChange={setTopic} options={EP_TOPICS.map((t) => ({ k: t.k, label: t.label, sub: t.sub, icon: <LineGlyph k={t.g} size={24} /> }))} />
        </KitSection>
        {past && past[0] && (past[0].next || []).length > 0 && (
          <KitSection title="Last time" right={formatListTime(past[0].created_at)}>
            {past[0].next.slice(0, 2).map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '6px 2px', fontSize: 14.5, lineHeight: 1.45, color: theme.ink }}>
                <span style={{ display: 'flex', color: kitOnInk(theme), flexShrink: 0, paddingTop: 1 }}><LineGlyph k="arrowup" size={20} /></span>
                <span>{t}</span>
              </div>
            ))}
          </KitSection>
        )}
      </FullPage>
    );
  }
  const bubble = (m, i) => {
    const mine = m.r === 'me';
    const prev = turns[i - 1];
    const first = !prev || prev.r !== m.r;
    const open = openFix === m.id;
    return (
      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', marginTop: first ? 10 : 3 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '100%', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
          {!mine && <img src={BOT_PIC} alt="" draggable={false} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: theme.rowBg }} />}
          <div style={{ maxWidth: '76%', padding: '9px 13px', borderRadius: 19, ...(mine ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }), background: mine ? theme.bubbleMe : theme.bubbleThem, color: theme.ink, fontSize: 15.5, lineHeight: 1.38, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.t}</div>
        </div>
        {mine && m.fix && (
          <div role="button" aria-expanded={open} aria-label={open ? 'Hide why' : 'See why this is better'} onClick={() => { hapticTap(); setOpenFix(open ? null : m.id); }} className="zchat-press"
            style={{ maxWidth: '82%', marginTop: 5, padding: '7px 11px', borderRadius: 14, background: theme.rowBg, cursor: 'pointer', fontSize: 13.5, lineHeight: 1.42, color: theme.ink, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', color: kitOnInk(theme), flexShrink: 0, paddingTop: 1 }}><LineGlyph k="check" size={16} sw={2.6} /></span>
              <span style={{ minWidth: 0, wordBreak: 'break-word' }}><span style={{ color: theme.muted }}>Better: </span>{m.fix.better}</span>
            </div>
            {open ? (m.fix.why ? <div className="zchat-fade" style={{ marginTop: 5, paddingLeft: 23, color: theme.muted, fontSize: 13 }}>{m.fix.why}</div> : null)
              : <div style={{ marginTop: 2, paddingLeft: 23, fontSize: 12, fontWeight: 700, color: kitOnInk(theme) }}>Why</div>}
          </div>
        )}
      </div>
    );
  };
  const lastMine = turns.length && turns[turns.length - 1].r === 'me';
  return (
    <Portal>
      <WideDim onClose={onClose} z={78} />
      <div className="zchat-panel-open zchat-wide-page" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 78, background: igPalette(theme).bg, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(6px + env(safe-area-inset-top)) 8px 8px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <div role="button" aria-label="Back" onClick={onClose} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><ArrowLeft size={24} /></div>
          <img src={BOT_PIC} alt="" draggable={false} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: theme.rowBg }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Practice English</div>
            <div style={{ fontSize: 12.5, color: waiting ? theme.coral : theme.muted, fontWeight: waiting ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{waiting ? 'typing' : `${levelLabel}, ${topicRow.label}`}</div>
          </div>
          <div role="button" aria-label="End practice" onClick={end} className="zchat-press" style={{ height: 40, padding: '0 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: kitOnInk(theme) }}>End</div>
        </div>
        <div ref={listRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '8px 12px 12px' }}>
          <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', lineHeight: 1.5, padding: '14px 24px 4px' }}>Fixes show under your messages. Replies come from AI and can be wrong.</div>
          {turns.map(bubble)}
          {waiting && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 10 }}>
              <img src={BOT_PIC} alt="" draggable={false} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ background: theme.bubbleThem, borderRadius: 19, borderBottomLeftRadius: 6, padding: '13px 15px', display: 'flex', gap: 5 }}>
                {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: theme.muted, animation: 'zchat-dots 1.2s infinite ease-in-out', animationDelay: `${i * 0.18}s` }} />)}
              </div>
            </div>
          )}
          {err && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 8px 4px', fontSize: 13, color: theme.danger, textAlign: 'center', flexWrap: 'wrap' }}>
              <span>{err}</span>
              {lastMine && !waiting && <span role="button" aria-label="Try again" onClick={retry} style={{ fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>Try again</span>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '8px 10px calc(8px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 600))} placeholder="Write in English" aria-label="Write in English" rows={1} autoCapitalize="sentences" spellCheck={false}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia && window.matchMedia('(hover: hover)').matches) { e.preventDefault(); send(); } }}
            style={{ flex: 1, minWidth: 0, resize: 'none', maxHeight: 120, minHeight: 42, padding: '11px 16px', borderRadius: 21, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink, fontSize: 16, fontFamily: FONT, outline: 'none', lineHeight: 1.3, boxSizing: 'border-box' }} />
          {canVoice && !draft.trim() ? (
            <div role="button" aria-label="Talk out loud" onClick={() => { hapticTap(); aiSpeechUnlock(); setVoice(true); }} className="zchat-press" style={{ width: 42, height: 42, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#FFFFFF' }}><AiTalkGlyph size={21} /></div>
          ) : (
            <div role="button" aria-label="Send" onClick={send} style={{ width: 42, height: 42, borderRadius: '50%', background: draft.trim() && !waiting ? theme.coral : theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: draft.trim() && !waiting ? 'pointer' : 'default', flexShrink: 0, transition: 'background 140ms' }}>
              <Send size={19} color={draft.trim() && !waiting ? '#FFFFFF' : theme.muted} />
            </div>
          )}
        </div>
      </div>
      {voice && <AiVoiceSheet title="Practice English" sub={`${levelLabel}, ${topicRow.label}`} lang={/^en[-_]/i.test(aiLang()) ? aiLang() : 'en-US'} avatar={<img src={BOT_PIC} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />} ask={sendTurn} onClose={() => setVoice(false)} />}
      {summary && (
        <ChatRowSheet title={summary.busy ? 'Writing your notes' : summary.error ? 'Session notes' : 'Nice practice'} subtitle={`${levelLabel}, ${topicRow.label}`} zIndex={800} portal onClose={() => { if (!summary.busy) setSummary(null); }}
          peek={(
            <div style={{ padding: '12px 20px 4px' }}>
              {summary.busy ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.muted, fontSize: 14, padding: '10px 0' }}><Spinner size={16} color={theme.muted} />Looking back at your chat</div>
                : summary.error ? <div role="alert" style={{ fontSize: 14, color: theme.danger, fontWeight: 700, lineHeight: 1.5, padding: '6px 0' }}>{summary.error}</div>
                  : [['What went well', summary.good, 'check'], ['Next time', summary.next, 'arrowup']].filter(([, list]) => list && list.length).map(([h, list, g]) => (
                    <div key={h} style={{ paddingBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, paddingBottom: 4 }}>{h}</div>
                      {list.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '4px 0', fontSize: 15, lineHeight: 1.45, color: theme.ink }}>
                          <span style={{ display: 'flex', color: kitOnInk(theme), flexShrink: 0, paddingTop: 2 }}><LineGlyph k={g} size={18} /></span><span>{t}</span>
                        </div>
                      ))}
                    </div>
                  ))}
            </div>
          )}
          actions={summary.busy ? [] : [
            { icon: <Check size={18} />, label: 'Done', onClick: finish },
            { icon: <MessageSquare size={18} />, label: 'Keep chatting', onClick: () => {} },
          ]} />
      )}
    </Portal>
  );
}

const flashMem = { uid: null, list: null };
function flashKnown(deck) {
  const n = Array.isArray(deck.cards) ? deck.cards.length : 0;
  return new Set((Array.isArray(deck.known) ? deck.known : []).filter((i) => Number.isInteger(i) && i >= 0 && i < n));
}
function flashSub(deck) {
  const n = (deck.cards || []).length;
  const left = n - flashKnown(deck).size;
  return `${countWord(n, 'card', 'cards')}${n && left === 0 ? ', all known' : left < n ? `, ${left} still learning` : ''}`;
}
function flashCardContent(deck) {
  const cards = (deck.cards || []).slice(0, 40).map((c) => [String(c.q || '').slice(0, 200), String(c.a || '').slice(0, 400)]);
  return `zcards:${JSON.stringify({ t: String(deck.title || 'Flashcards').slice(0, 80), c: cards })}`;
}
function flashSaveList(uid, list) {
  flashMem.uid = uid;
  flashMem.list = list;
}

export function FlashDecksPage({ myId, onClose, onShare, onSnack }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [list, setList] = useState(() => (flashMem.uid === myId ? flashMem.list : null));
  const [err, setErr] = useState('');
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  const [make, setMake] = useState(false);
  const [study, setStudy] = useState(null);
  const [menu, setMenu] = useState(null);
  const [askDelete, setAskDelete] = useState(null);
  const goneRef = useRef(new Set());
  useEffect(() => {
    let alive = true;
    supabase.from('ai_flash_decks').select('*').eq('owner_id', myId).order('updated_at', { ascending: false }).limit(200).then(({ data, error }) => {
      if (!alive) return;
      if (error) { setErr(friendlyError(error, 'Your decks did not load. Try again.')); setFail(loadFailCode(error)); return; }
      setErr('');
      setFail(null);
      const fresh = (data || []).filter((d) => !goneRef.current.has(d.id));
      const temps = (flashMem.uid === myId && flashMem.list ? flashMem.list : []).filter((d) => String(d.id).startsWith('temp-'));
      const next = [...temps, ...fresh];
      flashSaveList(myId, next);
      setList(next);
    }, () => { if (alive) setFail(''); });
    const on = () => { if (flashMem.uid === myId && flashMem.list) setList(flashMem.list); };
    window.addEventListener('zchat-flash-changed', on);
    return () => { alive = false; window.removeEventListener('zchat-flash-changed', on); };
  }, [tick]);
  const remove = async (deck) => {
    setAskDelete(null);
    goneRef.current.add(deck.id);
    const before = list || [];
    const next = before.filter((d) => d.id !== deck.id);
    flashSaveList(myId, next);
    setList(next);
    const { error } = await supabase.from('ai_flash_decks').delete().eq('id', deck.id).eq('owner_id', myId);
    if (error) { goneRef.current.delete(deck.id); flashSaveList(myId, before); setList(before); if (onSnack) onSnack(friendlyError(error, 'That deck did not delete. Try again.')); }
  };
  return (
    <FullPage title="Flashcards" onBack={onClose} zIndex={78}
      right={<HeaderIconButton label="Make flashcards" onClick={() => { hapticTap(); setMake(true); }}><Plus size={22} /></HeaderIconButton>}>
      {err && list !== null && <div role="alert" style={{ fontSize: 13, color: theme.danger, padding: '8px 4px 0' }}>{err}</div>}
      {list === null ? (
        fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.muted} /></div>
      ) : list.length === 0 ? (
        <EmptyState art="saved" title="No decks yet" text="Paste your notes and ZChat Bot turns them into cards you can study." action={<PillButton primary label="Make flashcards" onClick={() => setMake(true)} />} />
      ) : (
        <div role="list" aria-label="Your decks" style={{ paddingTop: 6 }}>
          {list.map((d, i) => (
            <div key={d.id} role="listitem" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, minHeight: 64, padding: '6px 2px' }}>
              {i > 0 && <span aria-hidden="true" style={{ position: 'absolute', left: 58, right: 0, top: 0, height: 1, background: theme.hair }} />}
              <div role="button" aria-label={`Study ${d.title}`} onClick={() => { hapticTap(); setStudy(d); }} className="zchat-row-press" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kitOnInk(theme), flexShrink: 0 }}><AiCardsGlyph size={22} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                  <div style={{ fontSize: 13, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{flashSub(d)}, {formatListTime(d.updated_at || d.created_at)}</div>
                </div>
              </div>
              <div role="button" aria-label={`Options for ${d.title}`} onClick={() => setMenu(d)} className="zchat-press" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><MoreVertical size={19} /></div>
            </div>
          ))}
        </div>
      )}
      {menu && (
        <ActionSheet title={menu.title} zIndex={760} onClose={() => setMenu(null)} items={[
          { k: 'study', label: 'Study', icon: <AiCardsGlyph />, on: () => { const d = menu; setMenu(null); setStudy(d); } },
          onShare ? { k: 'share', label: 'Share in a chat', icon: <Share2 />, on: () => { const d = menu; setMenu(null); onShare(flashCardContent(d), `Shared flashcards: ${d.title}`); } } : null,
          String(menu.id).startsWith('temp-') ? null : { k: 'del', label: 'Delete deck', icon: <Trash2 />, danger: true, on: () => { const d = menu; setMenu(null); setAskDelete(d); } },
        ]} />
      )}
      {askDelete && <ConfirmSheet title={`Delete ${askDelete.title}?`} text="This deck and your progress are removed." confirmLabel="Delete" zIndex={770} onCancel={() => setAskDelete(null)} onConfirm={() => remove(askDelete)} />}
      {make && <FlashMakePage myId={myId} onClose={() => setMake(false)} onShare={onShare} onSnack={onSnack} />}
      {study && <FlashStudyPage myId={myId} deck={(list || []).find((x) => x.id === study.id) || study} onClose={() => setStudy(null)} onShare={onShare} onSnack={onSnack} />}
    </FullPage>
  );
}

async function flashStore(myId, deck) {
  const temp = { ...deck, id: `temp-${Date.now()}`, owner_id: myId, known: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  flashSaveList(myId, [temp, ...((flashMem.uid === myId && flashMem.list) || [])]);
  try { window.dispatchEvent(new Event('zchat-flash-changed')); } catch {}
  const { data, error } = await supabase.from('ai_flash_decks').insert({ owner_id: myId, title: temp.title, cards: temp.cards, known: [], source: deck.source || null, updated_at: temp.updated_at }).select().single();
  const cur = (flashMem.uid === myId && flashMem.list) || [];
  if (error || !data) { flashSaveList(myId, cur.filter((d) => d.id !== temp.id)); try { window.dispatchEvent(new Event('zchat-flash-changed')); } catch {} return { temp, error: error || new Error('save failed') }; }
  flashSaveList(myId, cur.map((d) => (d.id === temp.id ? data : d)));
  try { window.dispatchEvent(new Event('zchat-flash-changed')); } catch {}
  return { temp, data };
}

export function FlashMakePage({ myId, text, source, onClose, onShare, onSnack }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [notes, setNotes] = useState(String(text || '').slice(0, 8000));
  const [n, setN] = useState('10');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [made, setMade] = useState(null);
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);
  const go = async () => {
    if (busy) return;
    const t = notes.trim();
    if (t.length < 40) { setNote('Add a few more lines of notes first.'); return; }
    setBusy(true);
    setNote('');
    const r = await zchatAichat('flashcards', { text: t, n: Number(n) }, 45000);
    if (!aliveRef.current) return;
    setBusy(false);
    if (r.data && r.data.refused) { setNote(String(r.data.error || 'There was not enough here to make cards.')); return; }
    if (!(r.data && Array.isArray(r.data.cards) && r.data.cards.length)) { setNote(toolErrorText(r, 'Flashcards')); return; }
    const deck = { title: String(r.data.title || 'My cards').slice(0, 80), cards: r.data.cards.slice(0, 60).map((c) => ({ q: String(c.q).slice(0, 200), a: String(c.a).slice(0, 400) })), source: source || 'notes' };
    hapticTap();
    playUiSound('receive');
    const job = flashStore(myId, deck);
    const shown = { ...deck, id: `temp-${Date.now()}`, known: [] };
    setMade(shown);
    job.then((res) => {
      if (res.data) { if (aliveRef.current) setMade((cur) => (cur && cur.id === shown.id ? res.data : cur)); return; }
      if (onSnack) onSnack(friendlyError(res.error, 'This deck did not save. It stays open until you close it.'));
    });
  };
  return (
    <FullPage title="Make flashcards" onBack={onClose} zIndex={80}
      footer={<BigButton label={busy ? 'Making your cards' : 'Make flashcards'} disabled={busy} onClick={go} />}>
      <div style={{ padding: '10px 2px 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.muted }}>Your notes</span>
            {notes.length > 6400 && <span style={{ fontSize: 11.5, color: theme.muted }}>{8000 - notes.length}</span>}
          </div>
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value.slice(0, 8000)); if (note) setNote(''); }} placeholder="Paste or type what you want to learn" aria-label="Your notes" rows={9}
            style={{ ...inputStyle(theme), resize: 'none', lineHeight: 1.45, minHeight: 190 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, paddingBottom: 8 }}>How many cards</div>
          <SegmentedControl value={n} onChange={(k) => { hapticTap(); setN(k); }} options={[['5', '5'], ['10', '10'], ['15', '15'], ['20', '20']]} />
        </div>
        {note && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, lineHeight: 1.45 }}>{note}</div>}
        <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>ZChat Bot only reads the notes on this page. Cards come from AI, so check anything important.</div>
      </div>
      {made && <FlashStudyPage myId={myId} deck={made} onClose={onClose} onShare={onShare} onSnack={onSnack} />}
    </FullPage>
  );
}

export function FlashStudyPage({ myId, deck, onClose, onShare, onSnack, shared }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const cards = Array.isArray(deck.cards) ? deck.cards : [];
  const owned = !shared && !!deck.id && !String(deck.id).startsWith('temp-') && (!deck.owner_id || deck.owner_id === myId);
  const [known, setKnown] = useState(() => flashKnown(deck));
  const [queue, setQueue] = useState(() => { const k = flashKnown(deck); const rest = cards.map((_, i) => i).filter((i) => !k.has(i)); return rest.length ? rest : cards.map((_, i) => i); });
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [savedCopy, setSavedCopy] = useState(false);
  const saveTimer = useRef(0);
  const motion = !reducedMotion();
  const deckIdRef = useRef(deck.id);
  deckIdRef.current = deck.id;
  useEffect(() => () => clearTimeout(saveTimer.current), []);
  const persist = (set) => {
    if (!owned) return;
    clearTimeout(saveTimer.current);
    const id = deckIdRef.current;
    const arr = [...set].sort((a, b) => a - b);
    const cur = (flashMem.uid === myId && flashMem.list) || null;
    if (cur) { flashSaveList(myId, cur.map((d) => (d.id === id ? { ...d, known: arr, updated_at: new Date().toISOString() } : d))); try { window.dispatchEvent(new Event('zchat-flash-changed')); } catch {} }
    saveTimer.current = setTimeout(() => { supabase.from('ai_flash_decks').update({ known: arr, updated_at: new Date().toISOString() }).eq('id', id).eq('owner_id', myId).then(() => {}, () => {}); }, 600);
  };
  const done = pos >= queue.length;
  const idx = done ? -1 : queue[pos];
  const card = idx >= 0 ? cards[idx] : null;
  const sort = (knewIt) => {
    if (done) return;
    hapticTap();
    const next = new Set(known);
    if (knewIt) next.add(idx); else next.delete(idx);
    setKnown(next);
    persist(next);
    setFlipped(false);
    setPos((p) => p + 1);
    if (pos + 1 >= queue.length) playUiSound(cards.every((_, i) => next.has(i)) ? 'win' : 'point');
  };
  const again = (onlyLeft) => {
    const rest = cards.map((_, i) => i).filter((i) => !known.has(i));
    setQueue(onlyLeft && rest.length ? rest : cards.map((_, i) => i));
    setPos(0);
    setFlipped(false);
  };
  const saveCopy = async () => {
    if (savedCopy) return;
    setSavedCopy(true);
    const res = await flashStore(myId, { title: deck.title, cards, source: 'chat' });
    if (res.error) { setSavedCopy(false); if (onSnack) onSnack(friendlyError(res.error, 'This deck did not save. Try again.')); return; }
    if (onSnack) onSnack('Saved to your flashcards');
  };
  const leftCount = cards.length - known.size;
  const sessionKnew = queue.filter((i) => known.has(i)).length;
  return (
    <Portal>
      <WideDim onClose={onClose} z={82} />
      <div className="zchat-panel-open zchat-wide-page" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 82, background: igPalette(theme).bg, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 'calc(6px + env(safe-area-inset-top)) 6px 6px', flexShrink: 0 }}>
          <div role="button" aria-label="Back" onClick={onClose} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><ArrowLeft size={24} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deck.title || 'Flashcards'}</div>
            <div style={{ fontSize: 12.5, color: theme.muted }}>{done ? countWord(cards.length, 'card', 'cards') : `Card ${pos + 1} of ${queue.length}`}</div>
          </div>
          {shared && <div role="button" aria-label={savedCopy ? 'Saved' : 'Save deck'} onClick={saveCopy} className="zchat-press" style={{ height: 40, padding: '0 10px', display: 'flex', alignItems: 'center', cursor: savedCopy ? 'default' : 'pointer', fontSize: 15, fontWeight: 700, color: savedCopy ? theme.muted : kitOnInk(theme) }}>{savedCopy ? 'Saved' : 'Save'}</div>}
          {onShare && cards.length > 0 && <div role="button" aria-label="Share in a chat" onClick={() => onShare(flashCardContent(deck), `Shared flashcards: ${deck.title}`)} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><Share2 size={21} /></div>}
        </div>
        <div style={{ height: 3, margin: '0 16px', borderRadius: 2, background: theme.rowBg, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${queue.length ? Math.min(100, (pos / queue.length) * 100) : 0}%`, background: theme.coral, transition: motion ? 'width 240ms ease-out' : 'none' }} />
        </div>
        {!done && card ? (
          <>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 20px', perspective: 1200 }}>
              <div role="button" aria-label={flipped ? 'Show the question' : 'Show the answer'} onClick={() => { hapticTap(); setFlipped((f) => !f); }}
                style={{ position: 'relative', width: '100%', maxWidth: 440, height: 'min(56vh, 380px)', cursor: 'pointer', transformStyle: 'preserve-3d', transition: motion ? 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none', transform: motion && flipped ? 'rotateY(180deg)' : 'none' }}>
                {[false, true].map((back) => (
                  <div key={String(back)} aria-hidden={back !== flipped} style={{ position: 'absolute', inset: 0, borderRadius: 24, background: theme.dark ? '#1C1B22' : '#FFFFFF', border: `1px solid ${theme.border}`, boxShadow: theme.dark ? 'none' : '0 10px 30px rgba(20,16,40,0.08)', display: motion || back === flipped ? 'flex' : 'none', flexDirection: 'column', padding: '18px 20px', boxSizing: 'border-box', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: motion && back ? 'rotateY(180deg)' : 'none' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: back ? kitOnInk(theme) : theme.muted }}>{back ? 'Answer' : 'Question'}</div>
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: (back ? card.a : card.q).length > 140 ? 17 : 21, fontWeight: back ? 600 : 700, lineHeight: 1.4, color: theme.ink, wordBreak: 'break-word', padding: '8px 0' }}>{back ? card.a : card.q}</div>
                    <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center' }}>{back ? 'Tap to see the question' : 'Tap to flip'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '6px 16px calc(14px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
              <div style={{ flex: 1 }}><BigButton label="Not yet" tone="plain" onClick={() => sort(false)} /></div>
              <div style={{ flex: 1 }}><BigButton label="I knew it" onClick={() => sort(true)} /></div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 20px calc(16px + env(safe-area-inset-bottom))', gap: 10 }}>
            <div className="zchat-pop" style={{ textAlign: 'center', padding: '0 10px 14px' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 14px', borderRadius: 20, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kitOnInk(theme) }}><AiCardsGlyph size={30} /></div>
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>{cards.length && leftCount === 0 ? 'You knew every card' : `You went through ${countWord(queue.length, 'card', 'cards')}`}</div>
              <div style={{ fontSize: 14.5, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>{leftCount === 0 ? 'Come back any time for a quick look.' : `${sessionKnew ? `You knew ${sessionKnew}, and` : 'No worries,'} ${leftCount === 1 ? 'one needs' : `${leftCount} need`} another look.`}</div>
            </div>
            {leftCount > 0 && <BigButton label={`Go over ${leftCount === 1 ? 'that card' : `those ${leftCount}`} again`} onClick={() => again(true)} />}
            <BigButton label="Start over" tone="plain" onClick={() => again(false)} />
            <BigButton label="Done" tone="plain" onClick={onClose} />
          </div>
        )}
      </div>
    </Portal>
  );
}
