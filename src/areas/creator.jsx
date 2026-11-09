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
  Avatar,
  BigButton,
  CR_SHARE,
  CoinIcon,
  ConfirmDialog,
  CrCard,
  CrGlyph,
  CrNote,
  CrPackTile,
  CrSheet,
  DetailRow,
  EmptyState,
  FONT,
  FullPage,
  LoadFail,
  NameBadge,
  PackIcon,
  Spinner,
  appSnack,
  coinsText,
  countWord,
  crCall,
  crCut,
  crDay,
  crErr,
  crFirst,
  crFresh,
  crOpen,
  crPatch,
  crPut,
  formatCount,
  hapticTap,
  inputStyle,
  kitOnInk,
  useBackClose,
  useCr,
  useTheme,
} from '../App.jsx';
import {
  CR_PRICES,
  CrPriceList,
  KitSection,
} from './shared.jsx';


export function CreatorPage({ profile, me, onClose, onOpenChat, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const page = useCr('page', profile.id);
  const bought = useCr('bought', me.id, 30000);
  const orders = useCr('orders', `out|${me.id}|${profile.id}`, 15000);
  const first = crFirst(profile);
  const [ask, setAsk] = useState(null);
  const ownedSet = new Set((Array.isArray(bought) ? bought : []).map((b) => b.id));
  const mine = page && page.mine && page.mine.status === 'active' ? page.mine : null;
  const cancel = async (on) => {
    setAsk(null);
    const before = page.mine;
    crPatch('page', profile.id, (p) => ({ ...p, mine: { ...p.mine, cancel_at_end: on } }));
    hapticTap();
    appSnack(on ? `Cancelled. You stay a member until ${crDay(before.period_end)}.` : 'Your membership will keep going.');
    const r = await crCall('zchat_cr_member_cancel', { p_creator: profile.id, p_cancel: on });
    if (!r.ok) { crPatch('page', profile.id, (p) => ({ ...p, mine: before })); appSnack(r.reason || 'That did not work. Try again.'); }
  };
  const pending = (Array.isArray(orders) ? orders : []).filter((o) => o.status === 'pending');
  const done = (Array.isArray(orders) ? orders : []).filter((o) => o.status !== 'pending').slice(0, 3);
  const perks = [['member', 'Members only posts and stories'], ['chat', `A members chat with ${first}`], ['badge', `A members badge in ${first}'s lives and comments`]];
  const loading = page === undefined;
  return (
    <FullPage title={profile.name || 'Creator'} subtitle={profile.username ? `@${profile.username}` : undefined} onBack={onClose} zIndex={705}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 2px 4px' }}>
        <div role="button" aria-label={`Open ${profile.name}'s profile`} onClick={() => onOpenProfile && onOpenProfile(profile)} style={{ cursor: 'pointer' }}><Avatar emoji={profile.avatar} name={profile.name} size={58} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}><NameBadge name={profile.name} verified={profile.verified} custom={profile.custom_badge} size={15} /></div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>{page && page.member_price ? countWord(Number(page.members) || 0, 'member', 'members') : 'Creator'}</div>
        </div>
      </div>
      {loading && crErr('page', profile.id) !== null && <LoadFail small code={crErr('page', profile.id)} onRetry={() => crFresh('page', profile.id)} />}
      {loading && crErr('page', profile.id) === null && <div style={{ padding: 30, display: 'flex', justifyContent: 'center' }}><Spinner size={20} color={theme.muted} /></div>}
      {page && !page.off && page.member_price && (
        <KitSection title="Membership" right={mine ? (mine.cancel_at_end ? `Ends ${crDay(mine.period_end)}` : `Renews ${crDay(mine.period_end)}`) : `${coinsText(page.member_price)} a month`}>
          {page.member_perks && <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.5, padding: '0 2px 10px', wordBreak: 'break-word' }}>{page.member_perks}</div>}
          <CrCard>
            {perks.map(([k, t], i) => (
              <div key={k} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '0 14px' }}>
                <span style={{ display: 'flex', color: kitOnInk(theme) }}>{k === 'chat' ? <Users size={20} /> : k === 'member' ? <Lock size={20} /> : <CrGlyph k="member" size={20} />}</span>
                <span style={{ flex: 1, fontSize: 14.5, color: theme.ink }}>{t}</span>
                {i < perks.length - 1 && <div style={{ position: 'absolute', left: 46, right: 0, bottom: 0, height: 1, background: theme.border }} />}
              </div>
            ))}
          </CrCard>
          <div style={{ marginTop: 12 }}>
            {mine ? (
              <div style={{ display: 'flex', gap: 8, flexDirection: mine.cancel_at_end ? 'column' : 'row' }}>
                {page.group_id && <BigButton label="Open members chat" onClick={() => { crOpen('group', { id: page.group_id }); onClose(); }} />}
                <BigButton tone="plain" label={mine.cancel_at_end ? 'Keep my membership' : 'Cancel'} onClick={() => (mine.cancel_at_end ? cancel(false) : setAsk('cancel'))} style={page.group_id && !mine.cancel_at_end ? { width: 132, flexShrink: 0 } : undefined} />
              </div>
            ) : <BigButton label={`Join for ${coinsText(page.member_price)} a month`} onClick={() => crOpen('join', { profile })} />}
          </div>
          <CrNote>{mine && mine.cancel_at_end ? `You stay a member until ${crDay(mine.period_end)}. It does not renew after that.` : mine ? 'Renews from your coins each month. We remind you 3 days before.' : 'Renews from your coins each month. We remind you 3 days before, and you can cancel any time.'}</CrNote>
        </KitSection>
      )}
      {page && !page.off && page.shout_price && (
        <KitSection title="Shoutout" right={coinsText(page.shout_price)}>
          <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.5, padding: '0 2px 12px' }}>{`A short video from ${first}, for a birthday or a message. Up to a minute long.`}</div>
          <BigButton label={`Order for ${coinsText(page.shout_price)}`} onClick={() => crOpen('shout', { profile })} />
          <CrNote>{`${first} has 7 days to send it. If they do not, your coins come back.`}</CrNote>
          {(pending.length > 0 || done.length > 0) && (
            <CrCard style={{ marginTop: 12 }}>
              {[...pending, ...done].map((o, i, all) => (
                <DetailRow key={o.id} icon={<CrGlyph k="shout" />} label={`For ${o.to_name}`} last={i === all.length - 1}
                  sub={o.status === 'pending' ? `Waiting, ${first} has until ${crDay(o.due_at)}` : o.status === 'delivered' ? 'Sent to your chat' : o.status === 'declined' ? `Declined: ${o.reason || 'no reason given'}. Coins back.` : 'Not sent in time. Coins back.'}
                  onClick={o.status === 'delivered' && onOpenChat ? () => { onOpenChat(profile); onClose(); } : undefined} />
              ))}
            </CrCard>
          )}
        </KitSection>
      )}
      {page && !page.off && page.msg_price && (
        <KitSection title="Messages" right={`${coinsText(page.msg_price)} each`}>
          <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.5, padding: '0 2px 12px' }}>{`If ${first} does not follow you, a message costs ${coinsText(page.msg_price)}. No reply in 3 days and your coins come back.`}</div>
          <BigButton tone="plain" label={`Message ${first}`} onClick={() => { if (onOpenChat) { onOpenChat(profile); onClose(); } }} />
        </KitSection>
      )}
      {page && !page.off && (page.packs || []).length > 0 && (
        <KitSection title="Sticker packs" right={countWord(page.packs.length, 'pack', 'packs')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {page.packs.map((pk) => <CrPackTile key={pk.id} pack={pk} owned={pk.mine || ownedSet.has(pk.id)} onOpen={() => crOpen('pack', { pack: { ...pk, owner_id: profile.id }, owner: profile })} />)}
          </div>
        </KitSection>
      )}
      {page && !page.off && !page.member_price && !page.shout_price && !page.msg_price && !(page.packs || []).length && (
        <EmptyState art="nothing" title="Nothing here yet" text={`When ${first} opens memberships, shoutouts or sticker packs, they show up here.`} />
      )}
      {page && page.off && <EmptyState art="nothing" title="Not ready yet" text="Creator pages switch on once the latest ZChat setup is finished." />}
      {ask === 'cancel' && mine && (
        <ConfirmDialog layer={790} title="Cancel your membership?" body={`You stay a member until ${crDay(mine.period_end)}. After that you will not be charged again.`} confirmLabel="Cancel membership" onCancel={() => setAsk(null)} onConfirm={() => cancel(true)} />
      )}
    </FullPage>
  );
}

export function CrPriceSheet({ kind, me, onClose }) {
  const { theme } = useTheme();
  const sum = useCr('me', me.id, 60000);
  const s = (sum && sum.settings) || {};
  const key = kind === 'member' ? 'member_price' : kind === 'message' ? 'msg_price' : 'shout_price';
  const textKey = kind === 'member' ? 'member_perks' : kind === 'shout' ? 'shout_note' : null;
  const [price, setPrice] = useState(s[key] == null ? null : Number(s[key]));
  const [text, setText] = useState((textKey && s[textKey]) || '');
  const title = kind === 'member' ? 'Membership' : kind === 'message' ? 'Paid messages' : 'Shoutouts';
  const save = async () => {
    const patch = { [key]: price, ...(textKey ? { [textKey]: text.trim() || null } : {}) };
    const before = sum;
    crPatch('me', me.id, (x) => ({ ...x, settings: { ...(x.settings || {}), ...patch } }));
    crPatch('page', me.id, (x) => ({ ...x, ...patch }));
    hapticTap();
    onClose();
    const r = await crCall('zchat_cr_settings_save', { p: patch });
    if (!r.ok) { if (before) crPut('me', me.id, before); crFresh('page', me.id); appSnack(r.reason || 'That did not save. Try again.'); return; }
    crPatch('me', me.id, (x) => ({ ...x, settings: r.settings || x.settings }));
    appSnack(price == null ? `${title} turned off` : `${title} saved`);
  };
  const intro = kind === 'member'
    ? 'Fans pay each month for your members only posts and stories, a members chat and a badge next to their name in your lives and comments.'
    : kind === 'message'
      ? 'People you do not follow pay to send you a message. You get the coins when you reply within 3 days. If you do not, they get their coins back. People you follow always message you for free.'
      : 'Fans order a short video for a birthday or a message. You record it in ZChat and send it within 7 days, or they get their coins back. You can turn down an order with a reason.';
  return (
    <CrSheet title={title} sub={`ZChat keeps ${CR_SHARE} percent`} onClose={onClose} z={780}
      avatar={<div style={{ width: 40, height: 40, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kitOnInk(theme) }}><CrGlyph k={kind === 'member' ? 'member' : kind === 'message' ? 'coinmsg' : 'shout'} size={21} /></div>}
      footer={<BigButton label="Save" onClick={save} />}>
      <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 12px' }}>{intro}</div>
      <CrPriceList list={CR_PRICES[kind]} value={price} onChange={setPrice} unit={kind === 'member' ? 'a month' : kind === 'message' ? 'a message' : ''} off="Off" />
      {textKey && price != null && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 2px 6px' }}>{kind === 'member' ? 'What members get' : 'What fans should tell you'}</div>
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, kind === 'member' ? 300 : 200))} rows={3} aria-label={kind === 'member' ? 'What members get' : 'What fans should tell you'}
            placeholder={kind === 'member' ? 'Early looks at new songs and a weekly voice note' : 'Their name, the day and anything I should know'}
            style={{ ...inputStyle(theme), height: 'auto', minHeight: 80, padding: '12px 14px', lineHeight: 1.45, resize: 'none', fontFamily: FONT }} />
        </>
      )}
    </CrSheet>
  );
}

function CrMembersPage({ me, onClose, onOpenProfile }) {
  useBackClose(true, onClose);
  const list = useCr('members', me.id, 15000);
  const { theme } = useTheme();
  return (
    <FullPage title="Members" subtitle={Array.isArray(list) ? countWord(list.length, 'member', 'members') : undefined} onBack={onClose} zIndex={745}>
      {list === undefined && crErr('members', me.id) !== null && <LoadFail small code={crErr('members', me.id)} onRetry={() => crFresh('members', me.id)} />}
      {list === undefined && crErr('members', me.id) === null && <div style={{ padding: 30, display: 'flex', justifyContent: 'center' }}><Spinner size={20} color={theme.muted} /></div>}
      {Array.isArray(list) && !list.length && <EmptyState art="friends" title="No members yet" text="When someone joins, they show up here and in your members chat." />}
      {Array.isArray(list) && list.map((r) => (
        <div key={r.id} role="button" aria-label={`Open ${(r.profile && r.profile.name) || 'member'}`} onClick={() => r.profile && onOpenProfile && onOpenProfile(r.profile)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 2px', cursor: 'pointer' }}>
          <Avatar emoji={r.profile && r.profile.avatar} name={(r.profile && r.profile.name) || '?'} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(r.profile && r.profile.name) || 'Member'}</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{`${r.cancel_at_end ? 'Leaving' : 'Renews'} ${crDay(r.period_end)} · since ${crDay(r.started_at)}`}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: theme.muted }}><CoinIcon size={14} />{formatCount(r.price)}</span>
        </div>
      ))}
    </FullPage>
  );
}

export function CreatorHub({ me, onClose, onPostMembers, onStoryMembers, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const sum = useCr('me', me.id, 15000);
  const orders = useCr('orders', `in|${me.id}`, 15000);
  const packs = useCr('mine', me.id, 20000);
  const [sheet, setSheet] = useState(null);
  const [page, setPage] = useState(null);
  const postRef = useRef(null);
  const storyRef = useRef(null);
  const s = (sum && sum.settings) || {};
  const eligible = !!(sum && sum.eligible);
  const pending = (Array.isArray(orders) ? orders : []).filter((o) => o.status === 'pending');
  const recent = (Array.isArray(orders) ? orders : []).filter((o) => o.status !== 'pending').slice(0, 4);
  const offTool = (label) => (eligible ? 'Off' : label);
  const packSub = (p) => (p.status === 'live' ? `${countWord(Number(p.sales) || 0, 'sale', 'sales')} · ${coinsText(p.price)}` : p.status === 'review' ? 'Waiting for a quick check by the ZChat team' : p.status === 'off' ? 'Off sale. People who bought it keep it.' : `Not approved: ${p.note || 'it looks like art you did not make'}`);
  return (
    <FullPage title="Creator tools" onBack={onClose} zIndex={705}>
      {sum === undefined && crErr('me', me.id) !== null && <LoadFail small code={crErr('me', me.id)} onRetry={() => crFresh('me', me.id)} />}
      {sum === undefined && crErr('me', me.id) === null && <div style={{ padding: 30, display: 'flex', justifyContent: 'center' }}><Spinner size={20} color={theme.muted} /></div>}
      {sum && sum.off && <EmptyState art="coins" title="Not ready yet" text="Creator tools switch on once the latest ZChat setup is finished." />}
      {sum && !sum.off && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            {[['This month', sum.month], ['All time', sum.total]].map(([l, v]) => (
              <CrCard key={l} style={{ padding: '14px 14px 12px' }}>
                <div style={{ fontSize: 12.5, color: theme.muted, fontWeight: 600 }}>{l}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><CoinIcon size={20} /><span style={{ fontSize: 22, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{formatCount(Number(v) || 0)}</span></div>
              </CrCard>
            ))}
          </div>
          <CrNote>{`ZChat keeps ${CR_SHARE} percent of what fans pay. The rest goes straight to your coins.`}</CrNote>
          {!eligible && (
            <CrCard style={{ marginTop: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Users size={20} color={theme.muted} />
              <div style={{ flex: 1, fontSize: 13.5, color: theme.ink, lineHeight: 1.45 }}>{`Memberships, paid messages and shoutouts open up once ${sum.need || 50} people follow you. You have ${formatCount(Number(sum.followers) || 0)}.`}</div>
            </CrCard>
          )}
          <KitSection title="Membership" right={s.member_price ? `${coinsText(s.member_price)} a month` : null}>
            <CrCard>
              <DetailRow icon={<CrGlyph k="member" />} label="Monthly price" value={s.member_price ? coinsText(s.member_price) : offTool('Locked')} onClick={eligible ? () => setSheet('member') : undefined} last={!s.member_price} />
              {s.member_price ? <DetailRow icon={<Users />} label="Members" onClick={() => setPage('members')} /> : null}
              {s.member_price ? <DetailRow icon={<ImageIcon />} label="Post for members" sub="Only members see it on your profile and in their feed" onClick={() => postRef.current && postRef.current.click()} /> : null}
              {s.member_price ? <DetailRow icon={<Camera />} label="Story for members" sub="Only members see it" onClick={() => storyRef.current && storyRef.current.click()} last /> : null}
            </CrCard>
          </KitSection>
          <KitSection title="Paid messages" right={s.msg_price ? `${coinsText(s.msg_price)} each` : null}>
            <CrCard>
              <DetailRow icon={<CrGlyph k="coinmsg" />} label="Price per message" sub="People you follow message you for free" value={s.msg_price ? coinsText(s.msg_price) : offTool('Locked')} onClick={eligible ? () => setSheet('message') : undefined} last />
            </CrCard>
          </KitSection>
          <KitSection title="Shoutouts" right={pending.length ? countWord(pending.length, 'to record', 'to record') : null}>
            <CrCard>
              <DetailRow icon={<CrGlyph k="shout" />} label="Price" value={s.shout_price ? coinsText(s.shout_price) : offTool('Locked')} onClick={eligible ? () => setSheet('shout') : undefined} last={!pending.length && !recent.length} />
              {[...pending, ...recent].map((o, i, all) => (
                <DetailRow key={o.id} icon={o.status === 'pending' ? <Clock /> : o.status === 'delivered' ? <Check /> : <Undo2 />} label={`For ${o.to_name}${o.occasion === 'birthday' ? ', birthday' : ''}`}
                  sub={o.status === 'pending' ? `Send by ${crDay(o.due_at)} to get ${coinsText(o.cut || crCut(o.price))}` : o.status === 'delivered' ? `Sent ${crDay(o.settled_at)}` : o.status === 'declined' ? 'You turned it down. Coins went back.' : 'Not sent in time. Coins went back.'}
                  onClick={o.status === 'pending' ? () => crOpen('order', { order: o }) : undefined} last={i === all.length - 1} />
              ))}
            </CrCard>
          </KitSection>
          <KitSection title="Sticker packs">
            {Array.isArray(packs) && packs.length > 0 ? (
              <CrCard>
                {packs.map((p, i) => <DetailRow key={p.id} icon={<PackIcon size={22} />} label={p.name} sub={packSub(p)} last={i === packs.length - 1} />)}
              </CrCard>
            ) : null}
            <CrNote style={{ paddingTop: Array.isArray(packs) && packs.length ? 10 : 0 }}>To sell a pack, open stickers in any chat, go to one of your packs and tap Sell. The ZChat team checks every pack before it goes on sale.</CrNote>
          </KitSection>
          <KitSection title="More ways to earn">
            <CrCard>
              <DetailRow icon={<CrGlyph k="shop" />} label="Your shop" sub="Show things you sell on your profile" onClick={() => crOpen('shop', { profile: me })} />
              <DetailRow icon={<Users />} label="Paid groups" sub="Set an entry price in the settings of a group you own" last />
            </CrCard>
          </KitSection>
          <input ref={postRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => { const f = Array.from(e.target.files || []).slice(0, 10); e.target.value = ''; if (f.length && onPostMembers) { onPostMembers(f); onClose(); } }} />
          <input ref={storyRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => { const f = Array.from(e.target.files || []).slice(0, 10); e.target.value = ''; if (f.length && onStoryMembers) { onStoryMembers(f); onClose(); } }} />
        </>
      )}
      {sheet && <CrPriceSheet kind={sheet} me={me} onClose={() => setSheet(null)} />}
      {page === 'members' && <CrMembersPage me={me} onClose={() => setPage(null)} onOpenProfile={onOpenProfile} />}
    </FullPage>
  );
}
