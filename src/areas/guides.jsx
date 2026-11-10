import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { FONT, Portal, appSnack, hapticTap, useBackClose, useTheme } from '../App.jsx';

function guidePlatform() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  let standalone = false;
  try { standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch {}
  const v = /Version\/(\d+)/.exec(ua);
  const safari26 = ios && !!v && Number(v[1]) >= 26;
  const iosOther = ios && /CriOS|FxiOS|EdgiOS/.test(ua);
  return { ios, android, standalone, safari26, iosOther, desktop: !ios && !android };
}

const BLUE = '#0A84FF';
const GREEN = '#34C759';

function Ring({ x, y, r = 22, label, side = 'top' }) {
  const ly = side === 'top' ? y - r - 18 : y + r + 26;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={BLUE} strokeWidth="3" className="zg-pulse" style={{ transformOrigin: `${x}px ${y}px` }} />
      <circle cx={x} cy={y} r={r} fill="rgba(10,132,255,0.12)" />
      {label && (
        <g>
          <rect x={x - label.length * 4.2 - 12} y={ly - 15} width={label.length * 8.4 + 24} height={24} rx={12} fill={BLUE} />
          <text x={x} y={ly + 1.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#FFFFFF" fontFamily={FONT}>{label}</text>
        </g>
      )}
    </g>
  );
}
function RowRing({ x, y, w, h }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="rgba(10,132,255,0.14)" />
      <rect x={x} y={y} width={w} height={h} rx={10} fill="none" stroke={BLUE} strokeWidth="2.6" className="zg-pulse" style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }} />
    </g>
  );
}
function Phone({ part = 'bottom', dark = false, children }) {
  const body = dark ? '#000000' : '#F2F2F7';
  const clip = `zgclip${part}`;
  return (
    <svg viewBox="0 0 300 250" width="100%" style={{ display: 'block', maxWidth: 340, margin: '0 auto' }} aria-hidden="true">
      <defs>
        <clipPath id={clip}>{part === 'top' ? <path d="M20 250V48a40 40 0 0 1 40-40h180a40 40 0 0 1 40 40v202z" /> : part === 'bottom' ? <path d="M20 0h260v202a40 40 0 0 1-40 40H60a40 40 0 0 1-40-40z" /> : <rect x="20" y="0" width="260" height="250" rx="34" />}</clipPath>
      </defs>
      {part === 'top' && <path d="M12 250V46a48 48 0 0 1 48-48h180a48 48 0 0 1 48 48v204" fill="#1C1C1E" />}
      {part === 'bottom' && <path d="M12 0v204a48 48 0 0 0 48 48h180a48 48 0 0 0 48-48V0" fill="#1C1C1E" />}
      {part === 'mid' && <rect x="12" y="-10" width="276" height="270" rx="40" fill="#1C1C1E" />}
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="300" height="250" fill={body} />
        {children}
      </g>
      {part === 'top' && <rect x="118" y="18" width="64" height="18" rx="9" fill="#000000" />}
    </svg>
  );
}
function T({ x, y, s = 13, w = 500, c = '#000000', a = 'start', children }) {
  return <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a} fontFamily={FONT}>{children}</text>;
}
function PageBits({ top = 20, h = 130, dark }) {
  const line = dark ? '#2C2C2E' : '#E5E5EA';
  return (
    <g>
      <rect x="20" y={top} width="260" height={h} fill={dark ? '#0B0B0E' : '#FFFFFF'} />
      <image href="/icon-192.png" x="40" y={top + 22} width="42" height="42" />
      <rect x="94" y={top + 28} width="110" height="10" rx="5" fill={line} />
      <rect x="94" y={top + 46} width="74" height="8" rx="4" fill={line} />
      <rect x="40" y={top + 82} width="220" height="9" rx="4.5" fill={line} />
      <rect x="40" y={top + 100} width="180" height="9" rx="4.5" fill={line} />
    </g>
  );
}
function ShareGlyph({ x, y, c = BLUE }) {
  return <path d={`M${x} ${y - 9}v12M${x - 4.5} ${y - 4.5}L${x} ${y - 9}l4.5 4.5M${x - 6} ${y - 2}h-2v12h16v-12h-2`} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}

function SceneIosShare() {
  return (
    <Phone part="bottom">
      <PageBits top={0} h={150} />
      <rect x="20" y="150" width="260" height="100" fill="#F7F7F8" />
      <rect x="36" y="160" width="228" height="34" rx="11" fill="#E9E9EE" />
      <T x={150} y={182} s={13} a="middle" c="#1C1C1E">getzchat.com</T>
      <path d="M58 213l-6 6 6 6" fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100 213l6 6-6 6" fill="none" stroke="#C7C7CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <ShareGlyph x={150} y={218} />
      <path d="M190 212c4-2 8-2 11 0v14c-3-2-7-2-11 0zM201 212c3-2 7-2 11 0v14c-4-2-8-2-11 0z" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="232" y="210" width="15" height="15" rx="3" fill="none" stroke={BLUE} strokeWidth="1.8" /><rect x="236" y="206" width="15" height="15" rx="3" fill="none" stroke={BLUE} strokeWidth="1.8" />
      <Ring x={150} y={217} r={20} label="Share" />
    </Phone>
  );
}
function SceneIosMore() {
  return (
    <Phone part="bottom">
      <PageBits top={0} h={170} />
      <rect x="20" y="170" width="260" height="80" fill="#F2F2F7" />
      <circle cx="52" cy="200" r="17" fill="#FFFFFF" />
      <path d="M55 193l-7 7 7 7" fill="none" stroke="#1C1C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="76" y="183" width="148" height="34" rx="17" fill="#FFFFFF" />
      <T x={150} y={205} s={13} a="middle" c="#1C1C1E">getzchat.com</T>
      <circle cx="248" cy="200" r="17" fill="#FFFFFF" />
      <circle cx="240" cy="200" r="2.2" fill="#1C1C1E" /><circle cx="248" cy="200" r="2.2" fill="#1C1C1E" /><circle cx="256" cy="200" r="2.2" fill="#1C1C1E" />
      <Ring x={248} y={200} r={21} label="More" />
    </Phone>
  );
}
function SceneIosMoreMenu() {
  const rows = ['Share', 'Add to Favourites', 'Add Bookmark', 'Find on Page'];
  return (
    <Phone part="bottom">
      <PageBits top={0} h={250} />
      <rect x="20" y="0" width="260" height="250" fill="rgba(0,0,0,0.18)" />
      <rect x="98" y="58" width="168" height={rows.length * 38 + 8} rx="14" fill="#FFFFFF" />
      {rows.map((r, i) => (
        <g key={r}>
          {i > 0 && <rect x="110" y={62 + i * 38} width="148" height="0.8" fill="#E5E5EA" />}
          <T x={114} y={86 + i * 38} s={13.5} c="#000000">{r}</T>
        </g>
      ))}
      <ShareGlyph x={244} y={83} c="#000000" />
      <RowRing x={100} y={62} w={164} h={36} />
    </Phone>
  );
}
function SceneIosSheet() {
  const rows = [['Copy', 'copy'], ['Add to Reading List', 'book'], ['Add Bookmark', 'book'], ['Add to Home Screen', 'plus'], ['Find on Page', 'find']];
  return (
    <Phone part="bottom">
      <rect x="20" y="0" width="260" height="250" fill="#F2F2F7" />
      <rect x="32" y="10" width="236" height="38" rx="12" fill="#FFFFFF" />
      <image href="/icon-192.png" x="42" y="16" width="26" height="26" />
      <T x={78} y={34} s={13} w={600}>ZChat</T>
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={58 + i * 46} cy={74} r={15} fill={['#34C759', '#0A84FF', '#FF9F0A', '#AF52DE', '#8E8E93'][i]} />)}
      <rect x="32" y="98" width="236" height={rows.length * 30} rx="12" fill="#FFFFFF" />
      {rows.map(([r, k], i) => (
        <g key={r}>
          {i > 0 && <rect x="44" y={98 + i * 30} width="212" height="0.8" fill="#E5E5EA" />}
          <T x={46} y={118 + i * 30} s={12.5} w={k === 'plus' ? 600 : 400}>{r}</T>
          {k === 'plus' && <g><rect x="236" y={105 + i * 30} width="16" height="16" rx="4" fill="none" stroke="#000000" strokeWidth="1.6" /><path d={`M244 ${109 + i * 30}v8M240 ${113 + i * 30}h8`} stroke="#000000" strokeWidth="1.6" strokeLinecap="round" /></g>}
        </g>
      ))}
      <RowRing x={34} y={98 + 3 * 30} w={232} h={30} />
    </Phone>
  );
}
function SceneIosAdd() {
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#F2F2F7" />
      <T x={36} y={78} s={12.5} c={BLUE}>Cancel</T>
      <T x={152} y={78} s={12} w={700} a="middle">Add to Home Screen</T>
      <T x={262} y={78} s={13} w={700} c={BLUE} a="end">Add</T>
      <rect x="32" y="98" width="236" height="62" rx="12" fill="#FFFFFF" />
      <image href="/icon-192.png" x="42" y="107" width="44" height="44" />
      <T x={98} y={126} s={14} w={600}>ZChat</T>
      <T x={98} y={145} s={11.5} c="#8E8E93">getzchat.com</T>
      <rect x="32" y="172" width="236" height="40" rx="12" fill="#FFFFFF" />
      <T x={46} y={197} s={13}>Open as Web App</T>
      <rect x="220" y="182" width="38" height="22" rx="11" fill={GREEN} /><circle cx="247" cy="193" r="9" fill="#FFFFFF" />
      <Ring x={250} y={73} r={19} />
    </Phone>
  );
}
function HomeGrid({ andr }) {
  const cols = ['#FF9F0A', '#34C759', '#0A84FF', '#FF375F', '#5E5CE6', '#64D2FF', '#FFD60A', '#BF5AF2', '#30D158', '#FF453A', '#AC8E68'];
  const tiles = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) tiles.push([r, c]);
  return (
    <g>
      <rect x="20" y="0" width="260" height="250" fill={andr ? '#1E2A3A' : '#5A6E9A'} />
      <rect x="20" y="0" width="260" height="250" fill="url(#zgwall)" />
      {tiles.map(([r, c], i) => {
        const x = 46 + c * 58;
        const y = 70 + r * 62;
        if (r === 1 && c === 1) return (
          <g key={i}>
            <clipPath id="zgicon"><rect x={x} y={y} width="42" height="42" rx={andr ? 21 : 10} /></clipPath>
            <image href="/icon-192.png" x={x} y={y} width="42" height="42" clipPath="url(#zgicon)" preserveAspectRatio="xMidYMid slice" />
            <T x={x + 21} y={y + 56} s={10.5} w={600} c="#FFFFFF" a="middle">ZChat</T>
          </g>
        );
        return <rect key={i} x={x} y={y} width="42" height="42" rx={andr ? 21 : 11} fill={cols[i % cols.length]} opacity="0.92" />;
      })}
      <Ring x={46 + 58 + 21} y={70 + 62 + 21} r={30} />
    </g>
  );
}
function SceneHome({ andr }) {
  return (
    <svg viewBox="0 0 300 250" width="100%" style={{ display: 'block', maxWidth: 340, margin: '0 auto' }} aria-hidden="true">
      <defs>
        <linearGradient id="zgwall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="rgba(255,255,255,0.12)" /><stop offset="1" stopColor="rgba(0,0,0,0.25)" /></linearGradient>
        <clipPath id="zghome"><rect x="20" y="10" width="260" height="240" rx="34" /></clipPath>
      </defs>
      <rect x="12" y="2" width="276" height="256" rx="42" fill="#1C1C1E" />
      <g clipPath="url(#zghome)"><HomeGrid andr={andr} /></g>
    </svg>
  );
}
function ChromeBar({ y = 40, dark = false, ring = 'menu' }) {
  const bg = dark ? '#202124' : '#FFFFFF';
  const pill = dark ? '#303134' : '#F1F3F4';
  const ink = dark ? '#E8EAED' : '#202124';
  return (
    <g>
      <rect x="20" y={y} width="260" height="52" fill={bg} />
      <path d={`M40 ${y + 20}l6-5 6 5v8h-12z`} fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="62" y={y + 9} width="150" height="34" rx="17" fill={pill} />
      <g transform={`translate(76 ${y + 19})`}><path d="M0 4h8M0 10h8M11 4h3M11 10h3" stroke={ink} strokeWidth="1.8" strokeLinecap="round" /><circle cx="9.5" cy="4" r="2" fill="none" stroke={ink} strokeWidth="1.6" /><circle cx="9.5" cy="10" r="2" fill="none" stroke={ink} strokeWidth="1.6" /></g>
      <T x={98} y={y + 31} s={13} c={ink}>getzchat.com</T>
      <rect x="222" y={y + 17} width="18" height="18" rx="4" fill="none" stroke={ink} strokeWidth="1.8" />
      <T x={231} y={y + 30} s={10} w={700} c={ink} a="middle">2</T>
      <circle cx="262" cy={y + 19} r="2.2" fill={ink} /><circle cx="262" cy={y + 26} r="2.2" fill={ink} /><circle cx="262" cy={y + 33} r="2.2" fill={ink} />
      {ring === 'menu' && <Ring x={262} y={y + 26} r={18} label="Menu" side="bottom" />}
      {ring === 'site' && <Ring x={81} y={y + 26} r={17} label="Site settings" side="bottom" />}
    </g>
  );
}
function SceneAndMenu({ ring = 'menu' }) {
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#FFFFFF" />
      <T x={44} y={30} s={11} w={600}>9:41</T>
      <PageBits top={92} h={158} />
      <ChromeBar y={40} ring={ring} />
    </Phone>
  );
}
function SceneAndList({ label }) {
  const rows = ['New tab', 'New Incognito tab', 'History', 'Downloads', 'Bookmarks', label, 'Settings'];
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#FFFFFF" />
      <ChromeBar y={40} ring="none" />
      <rect x="20" y="92" width="260" height="160" fill="#FFFFFF" />
      <rect x="104" y="38" width="170" height="222" rx="12" fill="#FFFFFF" stroke="#E0E0E0" />
      {rows.map((r, i) => <T key={r} x={120} y={68 + i * 27} s={12.5} w={r === label ? 700 : 400} c="#202124">{r}</T>)}
      <RowRing x={108} y={50 + 5 * 27} w={162} h={26} />
    </Phone>
  );
}
function SceneAndInstall() {
  return (
    <Phone part="mid">
      <PageBits top={0} h={250} />
      <rect x="20" y="0" width="260" height="250" fill="rgba(0,0,0,0.32)" />
      <rect x="40" y="52" width="220" height="146" rx="24" fill="#FFFFFF" />
      <T x={150} y={84} s={15} w={700} a="middle" c="#202124">Install app</T>
      <image href="/icon-192.png" x="62" y="100" width="38" height="38" />
      <T x={112} y={116} s={13} w={600} c="#202124">ZChat</T>
      <T x={112} y={133} s={11} c="#5F6368">getzchat.com</T>
      <T x={170} y={180} s={13.5} w={600} c="#1A73E8" a="middle">Cancel</T>
      <rect x="198" y="162" width="52" height="28" rx="14" fill="#1A73E8" />
      <T x={224} y={181} s={13} w={700} c="#FFFFFF" a="middle">Install</T>
      <Ring x={224} y={176} r={24} />
    </Phone>
  );
}
function SceneIosSettings({ step }) {
  const list = step === 1 ? [['General', '#8E8E93'], ['Notifications', '#FF3B30'], ['Privacy and Security', '#0A84FF'], ['Apps', '#5E5CE6']] : [['Camera', null], ['Microphone', null], ['Location', null]];
  const title = step === 1 ? 'Settings' : 'Safari';
  const hit = step === 1 ? 3 : 1;
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#F2F2F7" />
      <T x={150} y={78} s={15} w={700} a="middle">{title}</T>
      {step === 2 && <T x={36} y={110} s={11.5} c="#6D6D72">SETTINGS FOR WEBSITES</T>}
      <rect x="32" y={step === 1 ? 96 : 118} width="236" height={list.length * 34} rx="12" fill="#FFFFFF" />
      {list.map(([r, col], i) => {
        const y0 = (step === 1 ? 96 : 118) + i * 34;
        return (
          <g key={r}>
            {i > 0 && <rect x={col ? 76 : 46} y={y0} width={col ? 192 : 222} height="0.8" fill="#E5E5EA" />}
            {col && <rect x="44" y={y0 + 7} width="20" height="20" rx="5" fill={col} />}
            <T x={col ? 76 : 46} y={y0 + 22} s={13}>{r}</T>
            {step === 2 && <T x={244} y={y0 + 22} s={12.5} c="#8E8E93" a="end">{i === 1 ? 'Ask' : 'Ask'}</T>}
            <path d={`M254 ${y0 + 12}l5 5-5 5`} fill="none" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
      <RowRing x={34} y={(step === 1 ? 96 : 118) + hit * 34} w={232} h={34} />
    </Phone>
  );
}
function SceneIosAllow({ kind }) {
  const opts = ['Ask', 'Deny', 'Allow'];
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#F2F2F7" />
      <T x={150} y={78} s={15} w={700} a="middle">{kind === 'camera' ? 'Camera' : 'Microphone'}</T>
      <T x={36} y={112} s={11.5} c="#6D6D72">ACCESS ON ALL WEBSITES</T>
      <rect x="32" y="120" width="236" height={opts.length * 34} rx="12" fill="#FFFFFF" />
      {opts.map((o, i) => (
        <g key={o}>
          {i > 0 && <rect x="46" y={120 + i * 34} width="222" height="0.8" fill="#E5E5EA" />}
          <T x={46} y={142 + i * 34} s={13}>{o}</T>
          {i === 2 && <path d={`M244 ${136 + i * 34}l4 4 8-9`} fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      ))}
      <RowRing x={34} y={120 + 2 * 34} w={232} h={34} />
    </Phone>
  );
}
function SceneAndPerm({ kind }) {
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#FFFFFF" />
      <ChromeBar y={40} ring="none" />
      <rect x="28" y="96" width="244" height="150" rx="18" fill="#FFFFFF" stroke="#E0E0E0" />
      <T x={44} y={124} s={13.5} w={700} c="#202124">getzchat.com</T>
      <T x={44} y={154} s={12.5} w={600} c="#202124">Permissions</T>
      {kind === 'notif'
        ? <g fill="none" stroke="#5F6368" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"><path d="M49 182v-6a6 6 0 0 1 12 0v6l2 2H47z" /><path d="M53 187a2 2 0 0 0 4 0" /></g>
        : kind === 'camera'
        ? <g fill="none" stroke="#5F6368" strokeWidth="1.7" strokeLinejoin="round"><rect x="46" y="171" width="14" height="12" rx="2.5" /><path d="M60 175l5-3v10l-5-3" /></g>
        : <g fill="none" stroke="#5F6368" strokeWidth="1.7" strokeLinecap="round"><rect x="51" y="166" width="8" height="13" rx="4" /><path d="M47 175a8 8 0 0 0 16 0M55 183v3" /></g>}
      <T x={74} y={184} s={13} c="#202124">{kind === 'camera' ? 'Camera' : kind === 'notif' ? 'Notifications' : 'Microphone'}</T>
      <rect x="222" y="170" width="36" height="20" rx="10" fill="#1A73E8" /><circle cx="248" cy="180" r="8" fill="#FFFFFF" />
      <Ring x={240} y={180} r={22} />
    </Phone>
  );
}
function SceneAndSiteList({ kind }) {
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#FFFFFF" />
      <T x={150} y={76} s={15} w={700} a="middle" c="#202124">{kind === 'camera' ? 'Camera' : kind === 'notif' ? 'Notifications' : 'Microphone'}</T>
      <T x={40} y={110} s={11.5} w={700} c="#1A73E8">Blocked</T>
      <circle cx="54" cy="134" r="11" fill="#E8F0FE" /><T x={54} y={138} s={10} w={700} a="middle" c="#1A73E8">Z</T>
      <T x={74} y={139} s={13} c="#202124">getzchat.com</T>
      <RowRing x={30} y={118} w={240} h={34} />
      <rect x="46" y="170" width="208" height="62" rx="14" fill="#F8F9FA" stroke="#E0E0E0" />
      <T x={60} y={196} s={12.5} c="#202124">Allow</T>
      <T x={60} y={220} s={12.5} c="#5F6368">Block</T>
      <circle cx="236" cy="192" r="7" fill="none" stroke="#1A73E8" strokeWidth="2" /><circle cx="236" cy="192" r="3.5" fill="#1A73E8" />
    </Phone>
  );
}

function SceneIosNotif({ step }) {
  if (step === 1) {
    const apps = [['Messages', '#34C759'], ['Photos', '#FF9F0A'], ['Safari', '#0A84FF'], ['ZChat', null]];
    return (
      <Phone part="top">
        <rect x="20" y="0" width="260" height="250" fill="#F2F2F7" />
        <T x={150} y={78} s={15} w={700} a="middle">Notifications</T>
        <rect x="32" y="96" width="236" height={apps.length * 34} rx="12" fill="#FFFFFF" />
        {apps.map(([r, col], i) => (
          <g key={r}>
            {i > 0 && <rect x="76" y={96 + i * 34} width="192" height="0.8" fill="#E5E5EA" />}
            {col ? <rect x="44" y={103 + i * 34} width="20" height="20" rx="5" fill={col} /> : <image href="/icon-192.png" x="44" y={103 + i * 34} width="20" height="20" />}
            <T x={76} y={118 + i * 34} s={13}>{r}</T>
            <T x={244} y={118 + i * 34} s={11.5} c="#8E8E93" a="end">{r === 'ZChat' ? 'Off' : 'Banners'}</T>
            <path d={`M254 ${108 + i * 34}l5 5-5 5`} fill="none" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        <RowRing x={34} y={96 + 3 * 34} w={232} h={34} />
      </Phone>
    );
  }
  return (
    <Phone part="top">
      <rect x="20" y="0" width="260" height="250" fill="#F2F2F7" />
      <T x={150} y={78} s={15} w={700} a="middle">ZChat</T>
      <rect x="32" y="96" width="236" height="40" rx="12" fill="#FFFFFF" />
      <T x={46} y={121} s={13}>Allow Notifications</T>
      <rect x="220" y="105" width="38" height="22" rx="11" fill={GREEN} /><circle cx="247" cy="116" r="9" fill="#FFFFFF" />
      <rect x="32" y="148" width="236" height="62" rx="12" fill="#FFFFFF" />
      <T x={46} y={172} s={12} c="#8E8E93">ALERTS</T>
      <rect x="48" y="180" width="40" height="22" rx="5" fill="#E5E5EA" /><rect x="130" y="180" width="40" height="22" rx="5" fill="#E5E5EA" /><rect x="212" y="180" width="40" height="22" rx="5" fill="#E5E5EA" />
      <Ring x={239} y={116} r={21} />
    </Phone>
  );
}
function installSteps(p) {
  if (p.ios) {
    if (p.iosOther) {
      return [
        { art: <SceneIosShare />, title: 'Tap Share', text: 'Tap the Share button in the address bar. It is a square with an arrow pointing up.' },
        { art: <SceneIosSheet />, title: 'Tap Add to Home Screen', text: 'Scroll down the list if you do not see it straight away.' },
        { art: <SceneIosAdd />, title: 'Tap Add', text: 'Keep Open as Web App switched on, then tap Add at the top right.' },
        { art: <SceneHome />, title: 'Open ZChat from your home screen', text: 'It opens full screen like any other app, with notifications.' },
      ];
    }
    return [
      p.safari26
        ? { art: <SceneIosMore />, title: 'Tap the three dots', text: 'In Safari, tap the round button with three dots next to the address bar.' }
        : { art: <SceneIosShare />, title: 'Tap Share', text: 'In Safari, tap the Share button at the bottom. It is a square with an arrow pointing up.' },
      ...(p.safari26 ? [{ art: <SceneIosMoreMenu />, title: 'Tap Share', text: 'Share is at the top of the menu.' }] : []),
      { art: <SceneIosSheet />, title: 'Tap Add to Home Screen', text: 'Scroll down the list if you do not see it straight away.' },
      { art: <SceneIosAdd />, title: 'Tap Add', text: 'Keep Open as Web App switched on, then tap Add at the top right.' },
      { art: <SceneHome />, title: 'Open ZChat from your home screen', text: 'It opens full screen like any other app, with notifications.' },
    ];
  }
  return [
    { art: <SceneAndMenu />, title: 'Tap the menu', text: 'In Chrome, tap the three dots at the top right.' },
    { art: <SceneAndList label="Add to Home screen" />, title: 'Tap Add to Home screen', text: 'Some phones call it Install app. Both do the same thing.' },
    { art: <SceneAndInstall />, title: 'Tap Install', text: 'Your phone adds ZChat to your home screen and app list.' },
    { art: <SceneHome andr />, title: 'Open ZChat from your home screen', text: 'It opens full screen like any other app, with notifications.' },
  ];
}
function permSteps(p, kind) {
  const what = kind === 'camera' ? 'camera and microphone' : kind === 'notif' ? 'notifications' : 'microphone';
  const name = kind === 'camera' ? 'Camera' : kind === 'notif' ? 'Notifications' : 'Microphone';
  if (kind === 'notif' && p.ios) {
    return [
      { art: <SceneIosNotif step={1} />, title: 'Open Settings, then Notifications', text: 'Leave ZChat, open your iPhone Settings and tap Notifications. Find ZChat in the list.' },
      { art: <SceneIosNotif step={2} />, title: 'Turn on Allow Notifications', text: 'Then open ZChat again. New messages now reach you even when ZChat is closed.' },
    ];
  }
  if (p.ios) {
    return [
      { art: <SceneIosSettings step={1} />, title: 'Open the Settings app', text: 'Leave ZChat, open your iPhone Settings and tap Apps.' },
      { art: <SceneIosSettings step={2} />, title: `Tap Safari, then ${name}`, text: 'Scroll down inside Safari to Settings for Websites.' },
      { art: <SceneIosAllow kind={kind} />, title: 'Choose Allow', text: `Then close ZChat fully, open it again and tap the ${kind === 'camera' ? 'camera' : 'mic'} button.` },
    ];
  }
  if (p.android && !p.standalone) {
    return [
      { art: <SceneAndMenu ring="site" />, title: 'Tap the settings icon', text: 'Tap the small icon at the left of the address bar.' },
      { art: <SceneAndPerm kind={kind} />, title: `Turn on ${name}`, text: `Open Permissions and switch on ${what}. Then tap the button in ZChat again.` },
    ];
  }
  if (p.android) {
    return [
      { art: <SceneAndList label="Settings" />, title: 'Open Chrome settings', text: 'Open Chrome, tap the three dots at the top right, then Settings and Site settings.' },
      { art: <SceneAndSiteList kind={kind} />, title: `Tap ${name}, then getzchat.com`, text: 'ZChat is under Blocked. Tap it and choose Allow.' },
      { art: <SceneAndPerm kind={kind} />, title: 'Come back and try again', text: kind === 'notif' ? 'Open ZChat again. New messages now reach you.' : `Open ZChat again and tap the ${kind === 'camera' ? 'camera' : 'mic'} button.` },
    ];
  }
  return [
    { art: <SceneAndMenu ring="site" />, title: 'Click the icon next to the address', text: `Click the lock or settings icon at the left of the address bar and allow the ${what}.` },
    { art: <SceneAndPerm kind={kind} />, title: 'Reload and try again', text: 'Reload ZChat and try again.' },
  ];
}

function GuideShell({ title, sub, steps, onClose, footer }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [i, setI] = useState(0);
  const railRef = useRef(null);
  const go = (n) => {
    const el = railRef.current;
    const k = Math.max(0, Math.min(steps.length - 1, n));
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' });
    setI(k);
  };
  const last = i >= steps.length - 1;
  return (
    <Portal>
      <style>{'@keyframes zgpulse { 0% { transform: scale(1); opacity: 1 } 70% { transform: scale(1.25); opacity: 0 } 100% { transform: scale(1.25); opacity: 0 } } .zg-pulse { animation: zgpulse 1.6s ease-out infinite; } @media (prefers-reduced-motion: reduce) { .zg-pulse { animation: none; } }'}</style>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 760, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, maxHeight: '94%', background: theme.panelBg, borderRadius: '26px 26px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px 16px 6px 20px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>{title}</div>
              {sub && <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
            </div>
            <div role="button" aria-label="Close" onClick={onClose} className="zchat-press" style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
          </div>
          <div ref={railRef} onScroll={(e) => { const el = e.currentTarget; const n = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); if (n !== i) setI(n); }}
            style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}>
            {steps.map((st, k) => (
              <div key={k} style={{ flex: '0 0 100%', scrollSnapAlign: 'center', scrollSnapStop: 'always', padding: '8px 20px 0', boxSizing: 'border-box' }}>
                <div style={{ borderRadius: 22, background: theme.dark ? '#1A1A1F' : '#EEF1F6', padding: '14px 10px 6px' }}>{st.art}</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 14 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 14, background: BLUE, color: '#FFFFFF', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 800, color: theme.ink }}>{st.title}</div>
                    <div style={{ fontSize: 14, color: theme.muted, marginTop: 3, lineHeight: 1.45 }}>{st.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '14px 0 10px' }}>
            {steps.map((_, k) => <span key={k} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, background: k === i ? BLUE : theme.muted2, transition: 'width 0.2s ease' }} />)}
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
            {i > 0 && <button type="button" onClick={() => go(i - 1)} style={{ flex: '0 0 auto', height: 50, padding: '0 18px', borderRadius: 16, border: 'none', background: theme.soft, color: theme.ink, fontFamily: FONT, fontSize: 15.5, fontWeight: 700, cursor: 'pointer' }}>Back</button>}
            {!last && <button type="button" onClick={() => go(i + 1)} style={{ flex: 1, height: 50, borderRadius: 16, border: 'none', background: BLUE, color: '#FFFFFF', fontFamily: FONT, fontSize: 15.5, fontWeight: 800, cursor: 'pointer' }}>Next</button>}
            {last && (footer || <button type="button" onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 16, border: 'none', background: BLUE, color: '#FFFFFF', fontFamily: FONT, fontSize: 15.5, fontWeight: 800, cursor: 'pointer' }}>Done</button>)}
          </div>
        </div>
      </div>
    </Portal>
  );
}

export function InstallGuideSheet({ onClose }) {
  const p = guidePlatform();
  if (p.desktop) {
    return <GuideShell title="Install ZChat" sub="Click the install icon at the right of the address bar, or open the browser menu and choose Install ZChat." steps={installSteps({ ...p, android: true })} onClose={onClose} />;
  }
  return <GuideShell title="Install ZChat" sub="Add ZChat to your home screen so it opens like an app, full screen and fast." steps={installSteps(p)} onClose={onClose} />;
}

export function PermGuideSheet({ kind = 'mic', onClose }) {
  const { theme } = useTheme();
  const p = guidePlatform();
  const [busy, setBusy] = useState(false);
  const [still, setStill] = useState(false);
  const what = kind === 'camera' ? 'camera' : kind === 'notif' ? 'notifications' : 'microphone';
  const retry = async () => {
    if (busy) return;
    setBusy(true);
    setStill(false);
    if (kind === 'notif') {
      let st = 'denied';
      try { st = typeof Notification !== 'undefined' ? (Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()) : 'denied'; } catch {}
      setBusy(false);
      if (st === 'granted') { hapticTap(); appSnack('Notifications are on'); try { window.dispatchEvent(new Event('focus')); } catch {} onClose(); } else setStill(true);
      return;
    }
    try {
      const st = await navigator.mediaDevices.getUserMedia(kind === 'camera' ? { audio: true, video: true } : { audio: true });
      st.getTracks().forEach((t) => t.stop());
      hapticTap();
      appSnack(kind === 'camera' ? 'Camera and microphone are on' : 'Microphone is on. Tap the mic to record.');
      onClose();
    } catch { setStill(true); }
    setBusy(false);
  };
  useEffect(() => {
    let alive = true;
    let st = null;
    const on = () => { if (alive && st && st.state === 'granted') { appSnack(kind === 'camera' ? 'Camera and microphone are on' : kind === 'notif' ? 'Notifications are on' : 'Microphone is on. Tap the mic to record.'); onClose(); } };
    try {
      if (navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name: kind === 'camera' ? 'camera' : kind === 'notif' ? 'notifications' : 'microphone' }).then((s) => { st = s; try { s.addEventListener('change', on); } catch {} }, () => {});
    } catch {}
    return () => { alive = false; try { if (st) st.removeEventListener('change', on); } catch {} };
  }, []);
  const footer = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button type="button" onClick={retry} disabled={busy} style={{ width: '100%', height: 50, borderRadius: 16, border: 'none', background: BLUE, color: '#FFFFFF', fontFamily: FONT, fontSize: 15.5, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>{busy ? 'Checking' : 'Try again'}</button>
      {still && <div role="alert" style={{ fontSize: 13, color: theme.danger, textAlign: 'center', fontWeight: 600 }}>{`The ${what} is still off. Follow the steps above, then try again.`}</div>}
    </div>
  );
  return (
    <GuideShell title={kind === 'camera' ? 'Turn on your camera' : kind === 'notif' ? 'Turn on notifications' : 'Turn on your microphone'} sub={kind === 'notif' ? 'Notifications were blocked for ZChat, so new messages cannot reach you. It takes a few seconds to fix.' : `ZChat cannot use your ${what} because it was blocked. It takes a few seconds to fix.`} steps={permSteps(p, kind)} onClose={onClose} footer={footer} />
  );
}
