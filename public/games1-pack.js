(()=>{var To=Object.defineProperty;var et=(t,n)=>{for(var e in n)To(t,e,{get:n[e],enumerable:!0})};var _t={};et(_t,{PIECE_VALUE:()=>So,START:()=>jt,applyMove:()=>mt,attacked:()=>lt,fnv:()=>Be,fromFen:()=>Oo,hasMove:()=>Ye,inCheck:()=>Lt,initial:()=>Io,insufficient:()=>Ge,isBlack:()=>Qt,isWhite:()=>Ct,kingAt:()=>Fe,legalMoves:()=>Nt,moveText:()=>Ue,parseMove:()=>Ro,perft:()=>Ke,play:()=>Mo,posKey:()=>Xt,sqIndex:()=>kt,sqName:()=>Jt});var jt="rnbqkbnrpppppppp"+".".repeat(32)+"PPPPPPPPRNBQKBNR",He=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],De=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],zt=[[-1,-1],[-1,1],[1,-1],[1,1]],$t=[[-1,0],[1,0],[0,-1],[0,1]],Ct=t=>t>="A"&&t<="Z",Qt=t=>t>="a"&&t<="z",Jt=t=>String.fromCharCode(97+(t&7))+(8-(t>>3)),kt=t=>(8-Number(t[1]))*8+(t.charCodeAt(0)-97);function Be(t){let n=2166136261;for(let e=0;e<t.length;e++)n^=t.charCodeAt(e),n=Math.imul(n,16777619)>>>0;return n.toString(16)}function ve(t,n){return n?Ct(t):Qt(t)}function xe(t,n){return n?Qt(t):Ct(t)}function lt(t,n,e){let o=n>>3,r=n&7,l=e?"P":"p",s=e?"N":"n",a=e?"B":"b",c=e?"R":"r",i=e?"Q":"q",h=e?"K":"k",u=e?o+1:o-1;if(u>=0&&u<8&&(r>0&&t[u*8+r-1]===l||r<7&&t[u*8+r+1]===l))return!0;for(let[p,g]of He){let d=o+p,A=r+g;if(d>=0&&d<8&&A>=0&&A<8&&t[d*8+A]===s)return!0}for(let[p,g]of De){let d=o+p,A=r+g;if(d>=0&&d<8&&A>=0&&A<8&&t[d*8+A]===h)return!0}for(let[p,g]of zt){let d=o+p,A=r+g;for(;d>=0&&d<8&&A>=0&&A<8;){let f=t[d*8+A];if(f!=="."){if(f===a||f===i)return!0;break}d+=p,A+=g}}for(let[p,g]of $t){let d=o+p,A=r+g;for(;d>=0&&d<8&&A>=0&&A<8;){let f=t[d*8+A];if(f!=="."){if(f===c||f===i)return!0;break}d+=p,A+=g}}return!1}function Fe(t,n){return t.indexOf(n?"K":"k")}function Lt(t,n){let e=Fe(t,n);return e>=0&&lt(t,e,!n)}function We(t,n,e,o){for(let r=0;r<64;r++){let l=t[r];if(l==="."||!ve(l,e))continue;let s=r>>3,a=r&7,c=l.toUpperCase();if(c==="P"){let i=e?-1:1,h=e?6:1,u=e?0:7,p=s+i;if(p>=0&&p<8){let g=p*8+a;if(t[g]==="."){if(p===u)for(let d of"qrbn")o.push([r,g,d]);else o.push([r,g,""]);if(s===h){let d=(s+2*i)*8+a;t[d]==="."&&o.push([r,d,""])}}for(let d of[-1,1]){let A=a+d;if(A<0||A>7)continue;let f=p*8+A;if(xe(t[f],e)||f===n)if(p===u)for(let E of"qrbn")o.push([r,f,E]);else o.push([r,f,""])}}}else if(c==="N"||c==="K")for(let[i,h]of c==="N"?He:De){let u=s+i,p=a+h;if(u<0||u>7||p<0||p>7)continue;let g=u*8+p;ve(t[g],e)||o.push([r,g,""])}else{let i=c==="B"?zt:c==="R"?$t:zt.concat($t);for(let[h,u]of i){let p=s+h,g=a+u;for(;p>=0&&p<8&&g>=0&&g<8;){let d=p*8+g;if(t[d]===".")o.push([r,d,""]);else{xe(t[d],e)&&o.push([r,d,""]);break}p+=h,g+=u}}}}return o}function mt(t,n,e,o){let r=t.b.split(""),l=r[n],s=Ct(l),a=l.toUpperCase(),c=r[e]!=="."?r[e]:"",i=-1;if(a==="P"){if(e===t.e&&r[e]==="."){let g=s?e+8:e-8;c=r[g],r[g]="."}Math.abs(e-n)===16&&(i=(e+n)/2)}r[e]=o?s?o.toUpperCase():o:l,r[n]=".",a==="K"&&Math.abs(e-n)===2&&(e===n+2?(r[n+1]=r[n+3],r[n+3]="."):(r[n-1]=r[n-4],r[n-4]="."));let h=t.c,u=g=>{h=h.replace(g,"")};a==="K"&&(s?(u("K"),u("Q")):(u("k"),u("q")));for(let g of[n,e])g===63&&u("K"),g===56&&u("Q"),g===7&&u("k"),g===0&&u("q");let p=a==="P"||c?0:t.h+1;return{b:r.join(""),c:h,e:i,h:p,cap:c}}function Nt(t,n){let e=[],o=We(t.b,t.e,n,[]);for(let[s,a,c]of o){let i=mt(t,s,a,c).b;Lt(i,n)||e.push([s,a,c])}let r=n?60:4,l=t.b;if(l[r]===(n?"K":"k")&&!lt(l,r,!n)){let s=n?"R":"r";t.c.includes(n?"K":"k")&&l[r+3]===s&&l[r+1]==="."&&l[r+2]==="."&&!lt(l,r+1,!n)&&!lt(l,r+2,!n)&&e.push([r,r+2,""]),t.c.includes(n?"Q":"q")&&l[r-4]===s&&l[r-1]==="."&&l[r-2]==="."&&l[r-3]==="."&&!lt(l,r-1,!n)&&!lt(l,r-2,!n)&&e.push([r,r-2,""])}return e}function Ye(t,n){let e=We(t.b,t.e,n,[]);for(let[o,r,l]of e)if(!Lt(mt(t,o,r,l).b,n))return!0;return Nt(t,n).length>0}function Ge(t){let n=[];for(let e=0;e<64;e++){let o=t[e];if(o==="."||o==="K"||o==="k")continue;let r=o.toUpperCase();if(r!=="B"&&r!=="N")return!1;n.push([r,((e>>3)+(e&7))%2])}return!!(n.length<=1||n.every(e=>e[0]==="B")&&n.every(e=>e[1]===n[0][1]))}function Xt(t,n,e,o){return Be(`${t}${n?"w":"b"}${e}${o}`)}function Ue(t,n,e){return Jt(t)+Jt(n)+(e||"")}function Ro(t){return typeof t!="string"||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(t)?null:[kt(t.slice(0,2)),kt(t.slice(2,4)),t[4]||""]}function Io(t){return{...t,b:jt,c:"KQkq",e:-1,h:0,k:"",r:[Xt(jt,!0,"KQkq",-1)],m:null,w:null,why:null,dr:null,a:"start"}}function Mo(t,n,e,o,r){let l=t.t===t.wh;if(!Nt(t,l).some(d=>d[0]===n&&d[1]===e&&d[2]===(o||"")))return null;let a=mt(t,n,e,o||""),c=t.t===t.x?t.o:t.x,i=Xt(a.b,!l,a.c,a.e),h=a.h===0?[i]:(t.r||[]).concat([i]),u={...t,b:a.b,c:a.c,e:a.e,h:a.h,k:(t.k||"")+a.cap,r:h,m:Ue(n,e,o),t:c,n:(t.n||0)+1,dr:null,a:"mv",w:null,why:null},p={b:a.b,c:a.c,e:a.e,h:a.h},g=r===t.x?"x":"o";return Ye(p,!l)?Ge(a.b)?(u.w="d",u.why="mat"):h.filter(d=>d===i).length>=3?(u.w="d",u.why="rep"):a.h>=100&&(u.w="d",u.why="fifty"):Lt(a.b,!l)?(u.w=g,u.why="mate"):(u.w="d",u.why="stale"),u}function Ke(t,n,e){if(e===0)return 1;let o=0;for(let[r,l,s]of Nt(t,n)){let a=mt(t,r,l,s);o+=e===1?1:Ke({b:a.b,c:a.c,e:a.e,h:a.h},!n,e-1)}return o}function Oo(t){let[n,e,o,r]=t.split(" "),l="";for(let s of n.replace(/\//g,""))l+=/\d/.test(s)?".".repeat(Number(s)):s;return{b:l,white:e==="w",c:o==="-"?"":o,e:r==="-"?-1:kt(r),h:0}}var So={p:1,n:3,b:3,r:5,q:9,k:0};var oe={};et(oe,{START:()=>Ze,applyMove:()=>ze,count:()=>Co,initial:()=>Lo,legalMoves:()=>ee,play:()=>No});var Ze=(()=>{let t="";for(let n=0;n<8;n++)for(let e=0;e<8;e++){let o=(n+e)%2===1;t+=o?n<3?"b":n>4?"w":".":"."}return t})(),je=[[-1,-1],[-1,1],[1,-1],[1,1]],qe=(t,n)=>n?t==="w"||t==="W":t==="b"||t==="B",Ve=(t,n)=>n?t==="b"||t==="B":t==="w"||t==="W",te=t=>t==="W"||t==="B";function ko(t,n,e,o){let r=[],l=(s,a,c)=>{let i=!1,h=s>>3,u=s&7;for(let[p,g]of je)if(o){let d=h+p,A=u+g;for(;d>=0&&d<8&&A>=0&&A<8&&(t[d*8+A]==="."||d*8+A===n);)d+=p,A+=g;if(!(d>=0&&d<8&&A>=0&&A<8))continue;let f=d*8+A;if(!Ve(t[f],e)||c.includes(f))continue;let E=d+p,m=A+g;for(;E>=0&&E<8&&m>=0&&m<8&&(t[E*8+m]==="."||E*8+m===n);)i=!0,l(E*8+m,a.concat([E*8+m]),c.concat([f])),E+=p,m+=g}else{let d=h+p,A=u+g,f=d+p,E=A+g;if(f<0||f>7||E<0||E>7)continue;let m=d*8+A,w=f*8+E;if(!Ve(t[m],e)||c.includes(m)||!(t[w]==="."||w===n))continue;i=!0,l(w,a.concat([w]),c.concat([m]))}!i&&c.length&&r.push({path:a,taken:c})};return l(n,[n],[]),r}function ee(t,n){let e=[];for(let r=0;r<64;r++)qe(t[r],n)&&(e=e.concat(ko(t,r,n,te(t[r]))));if(e.length){let r=Math.max(...e.map(s=>s.taken.length)),l=new Set;return e.filter(s=>s.taken.length===r).filter(s=>{let a=s.path.join(",");return l.has(a)?!1:(l.add(a),!0)})}let o=[];for(let r=0;r<64;r++){if(!qe(t[r],n))continue;let l=r>>3,s=r&7;if(te(t[r]))for(let[a,c]of je){let i=l+a,h=s+c;for(;i>=0&&i<8&&h>=0&&h<8&&t[i*8+h]===".";)o.push({path:[r,i*8+h],taken:[]}),i+=a,h+=c}else{let a=n?-1:1;for(let c of[-1,1]){let i=l+a,h=s+c;i<0||i>7||h<0||h>7||t[i*8+h]==="."&&o.push({path:[r,i*8+h],taken:[]})}}}return o}function ze(t,n){let e=t.split(""),o=n.path[0],r=n.path[n.path.length-1],l=e[o];e[o]=".",n.taken.forEach(a=>{e[a]="."});let s=l;return l==="w"&&r>>3===0&&(s="W"),l==="b"&&r>>3===7&&(s="B"),e[r]=s,e.join("")}function Co(t){let n=0,e=0;for(let o of t)o==="w"||o==="W"?n+=1:(o==="b"||o==="B")&&(e+=1);return{w:n,b:e}}function Lo(t){return{...t,b:Ze,h:0,m:null,w:null,why:null,dr:null,a:"start"}}function No(t,n,e){let o=t.t===t.wh,r=ee(t.b,o),l=n.join(","),s=r.find(p=>p.path.join(",")===l);if(!s)return null;let a=t.b[n[0]],c=ze(t.b,s),i=s.taken.length||!te(a)?0:(t.h||0)+1,h=t.t===t.x?t.o:t.x,u={...t,b:c,h:i,m:n,t:h,n:(t.n||0)+1,dr:null,a:"mv",w:null,why:null};return ee(c,!o).length?i>=50&&(u.w="d",u.why="kings"):(u.w=e===t.x?"x":"o",u.why="stuck"),u}var ne={};et(ne,{LEVELS:()=>Fo,countSolutions:()=>vo,make:()=>Do,peers:()=>Po,solve:()=>xo,valid:()=>Bo});function Q(t){let n=String(t||"z"),e=1779033703^n.length;for(let o=0;o<n.length;o++)e=Math.imul(e^n.charCodeAt(o),3432918353),e=e<<13|e>>>19;return()=>(e=Math.imul(e^e>>>16,2246822507),e=Math.imul(e^e>>>13,3266489909),e^=e>>>16,(e>>>0)/4294967296)}function tt(t,n){let e=t.slice();for(let o=e.length-1;o>0;o--){let r=Math.floor(n()*(o+1)),l=e[o];e[o]=e[r],e[r]=l}return e}var V=(t,n,e)=>t<n?n:t>e?e:t;function ot(t,n){let e=document.createElement("canvas");return e.width=Math.max(1,Math.ceil(t)),e.height=Math.max(1,Math.ceil(n)),e}function $(){return Math.min(2.5,typeof window!="undefined"&&window.devicePixelRatio||1)}function J(t,n,e){let o=$(),r=Math.round(n*o),l=Math.round(e*o);(t.width!==r||t.height!==l)&&(t.width=r,t.height=l),t.style.width=`${n}px`,t.style.height=`${e}px`;let s=t.getContext("2d");return s.setTransform(o,0,0,o,0,0),s}function $e(t){let n=parseInt(String(t).slice(1),16);return[n>>16&255,n>>8&255,n&255]}function ct(t,n,e){let o=$e(t),r=$e(n);return`#${o.map((l,s)=>Math.round(l+(r[s]-l)*e).toString(16).padStart(2,"0")).join("")}`}function ut(t,n,e,o,r,l){let s=Math.min(l,o/2,r/2);t.beginPath(),t.moveTo(n+s,e),t.arcTo(n+o,e,n+o,e+r,s),t.arcTo(n+o,e+r,n,e+r,s),t.arcTo(n,e+r,n,e,s),t.arcTo(n,e,n+o,e,s),t.closePath()}function Pt(){let t={frames:0,dur:0,last:0,worst:0,gaps:[],work:[]},n=(e,o)=>{if(!e.length)return 0;let r=e.slice().sort((l,s)=>l-s);return Math.round(r[Math.min(r.length-1,Math.floor(r.length*o))]*10)/10};return{begin(){t.last=0},tick(e){if(!t.last){t.last=e;return}let o=e-t.last;t.last=e,t.frames+=1,t.dur+=o,o>t.worst&&(t.worst=o),t.gaps.length<4e3&&t.gaps.push(o)},work(e){t.work.length<4e3&&t.work.push(e)},report(){return{frames:t.frames,ms:Math.round(t.dur),fps:t.dur>0?Math.round(t.frames*1e3/t.dur*10)/10:0,worst:Math.round(t.worst*10)/10,p95:n(t.gaps,.95),drawMs:n(t.work,.5),drawP95:n(t.work,.95)}}}}var nt=[],rt=[],st=[];for(let t=0;t<81;t++)nt.push(Math.floor(t/9)),rt.push(t%9),st.push(Math.floor(t/27)*3+Math.floor(t%9/3));var Je=[];for(let t=0;t<512;t++){let n=0;for(let e=0;e<9;e++)t&1<<e&&(n+=1);Je.push(n)}function Po(t){let n=[];for(let e=0;e<81;e++)e!==t&&(nt[e]===nt[t]||rt[e]===rt[t]||st[e]===st[t])&&n.push(e);return n}function vt(t,n,e,o){let r=new Array(9).fill(0),l=new Array(9).fill(0),s=new Array(9).fill(0);for(let i=0;i<81;i++){let h=t[i];if(!h)continue;let u=1<<h-1;if((r[nt[i]]|l[rt[i]]|s[st[i]])&u)return 0;r[nt[i]]|=u,l[rt[i]]|=u,s[st[i]]|=u}let a=0,c=()=>{if(o&&(o.n+=1,o.n>o.max))return!0;let i=-1,h=0,u=10;for(let d=0;d<81;d++){if(t[d])continue;let A=~(r[nt[d]]|l[rt[d]]|s[st[d]])&511,f=Je[A];if(f<u&&(i=d,h=A,u=f,f<=1))break}if(i<0)return a+=1,a>=n;if(!u)return!1;let p=[];for(let d=0;d<9;d++)h&1<<d&&p.push(d+1);let g=e?tt(p,e):p;for(let d of g){let A=1<<d-1;if(t[i]=d,r[nt[i]]|=A,l[rt[i]]|=A,s[st[i]]|=A,c())return!0;r[nt[i]]&=~A,l[rt[i]]&=~A,s[st[i]]&=~A,t[i]=0}return!1};return c(),a}function vo(t,n=2){let e=typeof t=="string"?t.split("").map(Number):t.slice();return vt(e,n,null,null)}function xo(t){let n=typeof t=="string"?t.split("").map(Number):t.slice();return vt(n,1,null,null)?n.join(""):null}var Ho={1:40,2:33,3:28,4:25};function Do(t,n){let e=Q(`sudoku:${t}:${n}`),o=new Array(81).fill(0);vt(o,1,e,null);let r=o.slice(),l=Ho[n]||33,s=tt(Array.from({length:41},(c,i)=>i),e),a=81;for(let c of s){if(a<=l)break;let i=80-c,h=r[c],u=r[i];if(!h)continue;r[c]=0,r[i]=0;let p={n:0,max:2e4},g=r.slice();if(vt(g,2,null,p)!==1||p.n>p.max){r[c]=h,r[i]=u;continue}a-=c===i?1:2}return{givens:r.join(""),sol:o.join(""),level:n}}function Bo(t,n){if(typeof t!="string"||t.length!==81||!/^[1-9]{81}$/.test(t))return!1;for(let e=0;e<81;e++)if(n[e]!=="0"&&n[e]!==t[e])return!1;for(let e=0;e<9;e++){let o=new Set,r=new Set,l=new Set;for(let s=0;s<9;s++)o.add(t[e*9+s]),r.add(t[s*9+e]),l.add(t[(Math.floor(e/3)*3+Math.floor(s/3))*9+e%3*3+s%3]);if(o.size!==9||r.size!==9||l.size!==9)return!1}return!0}var Fo=[[1,"Easy"],[2,"Medium"],[3,"Hard"],[4,"Expert"]];var re={};et(re,{cluesAt:()=>Uo,make:()=>Go,wordCells:()=>Xe});var Wo=`ACE|A playing card with a single pip
ACT|One part of a play
ADD|Put numbers together
AGE|How old you are
AIR|What we breathe
ANT|A tiny insect that lives in a colony
APE|A big primate like a gorilla
ARM|It joins your hand to your shoulder
ART|Paintings and drawings
ASH|Grey dust left after a fire
ASK|Put a question to someone
BAG|You carry things in it
BAT|It flies at night and hangs upside down
BED|Where you sleep
BEE|It makes honey
BIG|Not small
BOX|A container with flat sides
BUS|A big vehicle that carries many people
CAP|A hat with a peak
CAR|You drive it on the road
CAT|A pet that purrs
COW|A farm animal that gives milk
CRY|Shed tears
CUP|You drink tea from it
DAY|Twenty four hours
DEN|A wild animal's home
DEW|Morning drops on the grass
DIG|Make a hole in the ground
DOG|A pet that barks
DRY|Not wet
EAR|You hear with it
EAT|Have a meal
EGG|A hen lays it
ELF|A small magical helper
END|The last part
EYE|You see with it
FAN|It keeps you cool
FIG|A sweet fruit full of tiny seeds
FIN|A fish uses it to swim
FLY|Move through the air
FOX|A clever animal with a bushy tail
FUN|A good time
GEM|A precious stone
GUM|You chew it
HAT|You wear it on your head
HEN|A female chicken
HOP|Jump on one foot
HOT|Very warm
HUG|Hold someone close
ICE|Frozen water
INK|A pen is full of it
JAM|Fruit spread for toast
JAR|A glass pot with a lid
JOY|Great happiness
KEY|It opens a lock
KID|A child
KIT|A set of tools
LAP|Once around a track
LEG|You stand on it
LID|It covers a pot
LOG|A piece of a tree trunk
MAP|It shows you the way
MAT|You wipe your feet on it
MIX|Stir together
MUD|Wet soil
NAP|A short sleep
NET|Used to catch fish
NUT|A seed with a hard shell
OAK|A tree that grows acorns
OAR|You row a boat with it
OIL|Used for frying food
OWL|A bird that hoots at night
PAN|You fry eggs in it
PEA|A small round green vegetable
PEN|You write with it
PET|An animal you keep at home
PIE|A baked dish with a crust
PIG|A pink farm animal
POT|You cook soup in it
RAY|A beam of light
RED|The colour of a ripe tomato
RUG|A small carpet
RUN|Move fast on foot
SAD|Not happy
SEA|A big body of salt water
SKY|It is blue on a sunny day
SON|A boy in the family
SUN|It shines in the day
TAP|Water comes out of it
TEA|A hot drink made from leaves
TEN|Two times five
TOE|You have ten of them on your feet
TOP|The highest part
TOY|A child plays with it
VAN|A small truck
WAX|Candles are made of it
WEB|A spider spins it
WIN|Come first
YAK|A hairy ox from the mountains
YES|The opposite of no
ZIP|A fastener on a jacket
ZOO|A place to see wild animals
ARK|Noah's big boat
BUN|A small bread roll
COD|A white sea fish
DIP|A sauce for chips
FOG|Thick mist
GYM|A place to exercise
HAM|Meat from a pig
HUM|Sing with your lips closed
JOG|Run slowly
KIN|Your family
LAB|A room for experiments
MOP|Used to clean floors
NOD|Move your head to say yes
OAT|A grain for porridge
PAW|A dog's foot
RAT|A rodent bigger than a mouse
RIB|A bone in your chest
SAW|A tool for cutting wood
SOW|Plant seeds
TUB|A bath
URN|A big vase
VET|An animal doctor
WAG|What a happy dog does with its tail
YAM|A sweet root vegetable
OWE|Need to pay back
POD|Peas grow in it
RIM|The edge of a cup
SPY|A secret agent
TIN|A metal can
WIG|Hair you can take off
ROW|A line of seats
SIP|Drink a little at a time
TAG|A playground chasing game
BOW|A ribbon tied in loops
COT|A small bed for a baby
FIX|Repair
GAP|A space between two things
HIP|Where your leg joins your body
JET|A fast plane
LIP|Part of your mouth
MUG|A big cup
NEW|Not old
OLD|Not new
PIN|A small sharp fastener
RAG|An old cloth for cleaning
SET|A group of things that go together
WET|Covered in water
ABLE|Having the skill to do something
ACHE|A dull pain
AREA|The size of a surface
ATOM|The tiny building block of everything
AUNT|Your parent's sister
BABY|A very young child
BAKE|Cook in an oven
BALL|A round thing you throw
BAND|A group of musicians
BARN|A farm building for animals
BATH|You wash in it
BEAR|A big furry animal that loves honey
BELL|It rings
BIRD|It has feathers and wings
BOAT|It floats on water
BONE|Part of your skeleton
BOOK|You read it
BOOT|A shoe that covers the ankle
BOWL|A deep dish for soup
BUSY|Having lots to do
CAKE|A sweet treat for birthdays
CALM|Peaceful and quiet
CAMP|Stay in tents
CARD|You send one on a birthday
CAVE|A hollow in a hill
CHIN|The bottom of your face
CITY|A big town
CLAP|Hit your hands together
COAT|You wear it when it is cold
COIN|A round piece of money
COLD|Not hot
COOK|Make a meal
CORN|Yellow kernels on a cob
CRAB|It walks sideways on the beach
DARK|Without light
DAWN|The start of the day
DEER|A forest animal with antlers
DESK|A table for work
DISH|A plate
DOOR|You open it to go in
DOVE|A white bird of peace
DRUM|You hit it to make a beat
DUCK|It quacks
DUST|Fine dry dirt
EAST|Where the sun rises
EASY|Not hard
ECHO|A sound that comes back
EDGE|The outside line of something
FACE|Your eyes, nose and mouth are on it
FARM|Where crops are grown
FAST|Quick
FISH|It swims and has gills
FLAG|A country's coloured cloth
FOOD|What you eat
FOOT|You walk on it
FORK|You eat with it
FROG|It jumps and croaks
GAME|Something you play
GATE|A door in a fence
GIFT|A present
GOAT|A farm animal with a beard
GOLD|A shiny yellow metal
GOLF|A sport with clubs and holes
GOOD|Not bad
GRIN|A big smile
HAIR|It grows on your head
HAND|It has five fingers
HARP|A big string instrument
HEAT|Warmth
HELP|Give a hand
HERO|A brave person
HILL|A small mountain
HIVE|Where bees live
HOME|Where you live
HOOK|Used to catch a fish
HOPE|Wish for something good
HORN|A car beeps with it
IDEA|A thought or a plan
IRON|It smooths clothes
JUMP|Leap into the air
KIND|Nice and caring
KING|A ruler with a crown
KITE|It flies on a string in the wind
KNEE|It bends in the middle of your leg
LAKE|A body of fresh water
LAMB|A baby sheep
LAMP|It gives light
LEAF|It grows on a tree
LIME|A small green citrus fruit
LION|A big cat with a mane
LOCK|You open it with a key
MAIL|Letters and parcels
MASK|It covers your face
MEAL|Breakfast, lunch or dinner
MILK|A white drink from cows
MINT|A fresh tasting herb
MOON|It lights up the night sky
MOTH|An insect drawn to lamps
NAME|What people call you
NEST|A bird's home
NOSE|You smell with it
NOTE|A short written message
OVEN|You bake in it
PARK|A green place to play
PATH|A narrow way to walk
PEAR|A fruit shaped like a bell
PINK|A light red colour
PLAY|Have fun
PLUM|A small purple fruit
POEM|Words written in verse
POND|A small lake
POOL|A place to swim
RAIN|Water falling from clouds
RICE|Small white grains for dinner
RING|Jewellery for your finger
ROAD|Cars drive on it
ROCK|A big stone
ROOF|The top of a house
ROOM|A space inside a house
ROSE|A red flower with thorns
SAIL|A boat moves with it
SALT|It makes food salty
SAND|You find it on a beach
SEED|A plant grows from it
SHIP|A big boat
SHOE|You wear it on your foot
SING|Make music with your voice
SNOW|White flakes in winter
SOAP|You wash with it
SOCK|You wear it inside a shoe
SOFA|A comfy seat for two or more
SOUP|A hot liquid meal
STAR|It twinkles at night
SWAN|A graceful white bird
TAIL|A dog wags it
TENT|You sleep in it when camping
TIDE|The rise and fall of the sea
TIME|Clocks measure it
TOAD|A warty cousin of the frog
TREE|It has a trunk and leaves
TUNA|A big sea fish
VASE|You put flowers in it
WAVE|Water moving on the sea
WIND|Moving air
WING|A bird flies with it
WOLF|A wild dog that howls
WOOD|It comes from trees
WORD|Letters that make sense
YARD|The ground around a house
YAWN|You do it when you are tired
ZERO|Nothing at all
ZOOM|Move very fast
BEAN|A seed you can eat
BIKE|It has two wheels and pedals
BLUE|The colour of the sky
CLUE|A hint
CUBE|A shape with six square faces
DATE|A day on the calendar
FERN|A green plant with feathery leaves
FIRE|It is hot and it burns
GLUE|It makes things stick
HALF|One of two equal parts
JUNE|The sixth month
LOAF|Bread in one piece
MAZE|A puzzle of paths
NAIL|You hit it with a hammer
OPEN|Not closed
PAGE|One side of a sheet in a book
QUIZ|A short test
RAFT|A flat boat
SEAL|A sea animal that barks
TAXI|A car you pay to ride in
VIEW|What you can see
WALL|A side of a room
YOLK|The yellow part of an egg
ZONE|An area
TOWN|A place smaller than a city
TEAM|A group that plays together
SHOP|A place to buy things
SILK|A smooth shiny fabric
RUBY|A red gem
PIPE|A tube for water
MENU|A list of food in a cafe
LOVE|A deep caring feeling
LEFT|Not right
JOKE|Something funny
FILM|A movie
EXIT|The way out
DIVE|Jump in head first
COPY|Make the same again
BARK|The sound a dog makes
ARCH|A curved shape over a door
AXLE|A rod that wheels turn on
BEEF|Meat from a cow
CHEF|A cook in a restaurant
DECK|The floor of a ship
FAIR|Just and equal
HUSH|Be quiet
INCH|A small unit of length
JAZZ|Music with a swing
LAVA|Hot liquid rock from a volcano
NEAR|Close by
OBOE|A wooden wind instrument
PALM|The inside of your hand
RACE|A contest of speed
SOIL|Plants grow in it
TRIP|A journey
VOTE|Choose in an election
YOGA|Stretching exercise
ZINC|A bluish metal
WISH|Hope for something
BOLD|Brave and confident
CORE|The middle of an apple
DUNE|A hill of sand
FOAM|Bubbles on top of a drink
GLOW|Shine softly
HIKE|A long walk in nature
KNOT|A tie in a rope
MILD|Gentle, not strong
NOON|Twelve in the day
OPAL|A milky gem
PEAK|The top of a mountain
REEF|A ridge of coral in the sea
SHED|A small hut in the garden
TUNE|A melody
VINE|A climbing plant
WAND|A magician waves it
ACORN|The nut of an oak tree
ADULT|A grown up
ALARM|It wakes you up
ALBUM|A book for photos
APPLE|A red or green fruit
APRON|You wear it while cooking
ARROW|It points the way
BACON|Crispy strips of pork
BADGE|A pin you wear on your shirt
BAKER|Someone who makes bread
BEACH|Sand by the sea
BEARD|Hair on a man's chin
BENCH|A long seat in a park
BERRY|A small juicy fruit
BLOOM|Open up like a flower
BOARD|A flat piece of wood
BRAIN|You think with it
BRAVE|Not afraid
BREAD|Toast is made from it
BRICK|A block for building walls
BROOM|You sweep with it
BRUSH|Used for painting or for hair
CABIN|A small wooden house
CAMEL|An animal with a hump
CANDY|Sweets
CANOE|A narrow boat you paddle
CHAIR|You sit on it
CHALK|You write on a board with it
CHEST|A box for treasure
CHILD|A young person
CLOCK|It tells the time
CLOUD|A white puff in the sky
COCOA|Hot chocolate powder
CORAL|It grows in warm seas
COUCH|A sofa
CROWN|A king wears it
DAISY|A white flower with a yellow middle
DANCE|Move to music
DIARY|A book for your daily thoughts
DREAM|What you see in your sleep
DRESS|A one piece outfit
EAGLE|A big bird of prey
EARTH|Our planet
ELBOW|The joint in the middle of your arm
FAIRY|A tiny magical being with wings
FEAST|A big meal
FENCE|It goes around a garden
FIELD|An open area of grass
FLAME|The bright part of a fire
FLOOR|You walk on it indoors
FLOUR|Used to bake bread
FOCUS|Pay close attention
FRESH|Just made
FROST|Ice on the grass in winter
FRUIT|Apples and bananas
GHOST|A spooky spirit
GIANT|Very big
GLASS|A window is made of it
GLOBE|A round map of the world
GLOVE|You wear it on your hand
GRAPE|A small fruit that grows in bunches
GRASS|Green plants on a lawn
GUEST|A visitor
HAPPY|Full of joy
HEART|It pumps blood
HONEY|Sweet food made by bees
HORSE|An animal you can ride
HOTEL|A place to stay on holiday
HOUSE|A building where people live
JEANS|Denim trousers
JELLY|A wobbly dessert
JUICE|A drink squeezed from fruit
KOALA|A furry animal that eats leaves
LADLE|A big spoon for soup
LAUGH|What you do at a joke
LEMON|A sour yellow fruit
LIGHT|The opposite of dark
LUNCH|A meal in the middle of the day
MAGIC|Tricks that seem impossible
MANGO|A sweet tropical fruit
MAPLE|A tree with sweet sap
MELON|A big juicy fruit
MONEY|Coins and notes
MOUSE|A small animal that squeaks
MUSIC|Songs and tunes
NIGHT|When it is dark
NOISE|A loud sound
NURSE|Someone who cares for patients
OCEAN|A huge body of salt water
OLIVE|A small green or black fruit
ONION|A vegetable that can make you cry
OTTER|A playful river animal
PAINT|Colour you put on walls
PANDA|A black and white bear
PAPER|You write on it
PARTY|A fun gathering
PASTA|Spaghetti or penne
PEACH|A soft fuzzy fruit
PEARL|A gem found in an oyster
PHONE|You call people with it
PIANO|It has black and white keys
PILOT|Someone who flies a plane
PIZZA|A flat bread with cheese on top
PLANE|It flies in the sky
PLANT|A living thing that grows in soil
PLATE|A flat dish
POWER|Strength or energy
PRIZE|What a winner gets
QUEEN|A female ruler
QUIET|Not loud
RADIO|You listen to it
RIVER|Flowing fresh water
ROBOT|A machine that can move on its own
SALAD|A dish of fresh vegetables
SAUCE|A liquid served with food
SCARF|You wear it around your neck
SHARK|A big fish with sharp teeth
SHEEP|A woolly farm animal
SHELL|A snail carries it
SHIRT|A top with buttons
SKIRT|Clothing that hangs from the waist
SLEEP|Rest at night
SMILE|A happy face
SNAKE|A long reptile with no legs
SPOON|You eat soup with it
STAGE|Where actors perform
STONE|A small rock
STORM|Bad weather with thunder
STORY|A tale
SUGAR|It makes tea sweet
SWING|A seat that moves back and forth
TABLE|You eat at it
TEETH|You brush them
TIGER|A big striped cat
TOAST|Crispy bread
TOWEL|You dry yourself with it
TOWER|A tall building
TRAIN|It runs on rails
TRUCK|A big vehicle for goods
TRUTH|What is real and correct
UNCLE|Your parent's brother
VOICE|The sound you make when you speak
WATCH|A clock on your wrist
WATER|You drink it
WHALE|The biggest sea animal
WHEEL|It turns on a car
WORLD|The whole planet
ZEBRA|A horse with stripes
SPICE|It adds flavour to food
TULIP|A spring flower
OASIS|A green spot in a desert
LLAMA|A woolly animal from South America
IGLOO|A house made of snow
HIPPO|A big river animal
CRANE|A tall machine that lifts things
BLADE|The sharp part of a knife
AMBER|A yellow orange colour
CHESS|A board game with kings and queens
CLOWN|A funny circus performer
DRAIN|Water goes down it
FLUTE|A thin wind instrument
GRAIN|A small seed like wheat
IVORY|A creamy white colour
KNIFE|You cut food with it
LEARN|Gain new knowledge
METAL|Iron and steel
NOVEL|A long book
ORBIT|The path of a planet around the sun
PRINT|Put words on paper
RHYME|Words that sound alike at the end
SCALE|Used to weigh things
TOPIC|What something is about
VALUE|How much something is worth
WHEAT|A grain for flour
YEAST|It makes bread rise
BASIL|A green herb for pasta
CLIFF|A steep rock face
DWARF|Much smaller than usual
EMBER|A glowing piece of coal
FERRY|A boat that carries cars
GECKO|A small lizard that climbs walls
HAZEL|A light brown colour
JOLLY|Cheerful
LEMUR|An animal with a long striped tail
MOOSE|A large deer with wide antlers
NOODLE|A long thin strip of pasta
PEDAL|You push it with your foot
RAVEN|A large black bird
SKATE|Glide on ice
TORCH|A light you hold in your hand
ANCHOR|It keeps a ship in place
ANIMAL|A living creature
ARTIST|Someone who paints
AUTUMN|The season when leaves fall
BANANA|A long yellow fruit
BASKET|You carry fruit in it
BEETLE|An insect with a hard shell
BOTTLE|A container for drinks
BREEZE|A gentle wind
BRIDGE|It goes over a river
BUBBLE|A ball of soap and air
BUTTER|You spread it on bread
BUTTON|It fastens a shirt
CAMERA|You take photos with it
CANDLE|It has a wick and a flame
CANYON|A deep valley with steep sides
CARROT|An orange vegetable rabbits love
CASTLE|A big stone home for a king
CHEESE|Made from milk, mice love it
CHERRY|A small red fruit with a stone
CIRCLE|A round shape
CIRCUS|A show with clowns and acrobats
COFFEE|A morning drink made from beans
COOKIE|A sweet baked treat
COTTON|A soft fabric from a plant
DESERT|A dry sandy place
DINNER|The evening meal
DOCTOR|Someone who treats the sick
DRAGON|A fire breathing creature from stories
FAMILY|Parents and children
FLOWER|A rose or a daisy
FOREST|A place full of trees
FRIDGE|It keeps food cold
FRIEND|Someone you like and trust
GARDEN|Where flowers grow at home
GINGER|A spicy root
GUITAR|An instrument with six strings
HAMMER|A tool for hitting nails
HELMET|A hard hat for safety
INSECT|An ant or a bee
ISLAND|Land with water all around
JACKET|A short coat
JUNGLE|A thick tropical forest
KETTLE|It boils water for tea
KITTEN|A baby cat
LADDER|You climb it
LIZARD|A small reptile
MARKET|A place to buy and sell
MIRROR|You see yourself in it
MONKEY|An animal that swings in trees
NEEDLE|Used for sewing
ORANGE|A fruit and a colour
OYSTER|A shellfish that may hold a pearl
PALACE|A royal home
PARROT|A bright bird that can talk
PENCIL|You draw with it
PEPPER|A spice that makes you sneeze
PICNIC|A meal outdoors
PILLOW|You rest your head on it
PLANET|Mars or Venus
POCKET|A small pouch in your trousers
POTATO|A vegetable for chips
PUZZLE|A game that makes you think
RABBIT|An animal with long ears
RIBBON|A strip used for tying gifts
ROCKET|It flies to space
SADDLE|A seat on a horse
SAILOR|Someone who works on a ship
SCHOOL|Where children learn
SHADOW|A dark shape made by blocking light
SHOWER|A spray of water to wash in
SILVER|A shiny grey metal
SISTER|A girl in your family
SPIDER|It has eight legs
SPRING|The season after winter
SQUARE|A shape with four equal sides
STREET|A road in a town
SUMMER|The warmest season
TICKET|You need one for a train
TOMATO|A red fruit used in salads
TRAVEL|Go on a journey
TURTLE|A reptile with a shell
VIOLIN|A string instrument played with a bow
WALNUT|A nut with a wrinkly shell
WINDOW|You look out of it
WINTER|The coldest season
WIZARD|A man who does magic
YELLOW|The colour of a banana
ZIPPER|A fastener with teeth
PEANUT|A nut that grows underground
MEADOW|A field of grass and flowers
LOCKET|A small case on a necklace
HONEST|Telling the truth
FOSSIL|Old remains found in rock
CEREAL|Breakfast in a bowl with milk
BOUNCE|Jump back up
ACTION|Doing something
NATURE|Trees, rivers and animals
SECRET|Something kept hidden
TEACUP|A small cup for tea
VELVET|A soft fabric
WONDER|A feeling of amazement
SPONGE|It soaks up water
SUNSET|The end of the day
PIRATE|A sailor who hunts for treasure
NAPKIN|You wipe your mouth with it
MUFFIN|A small cake
LETTER|A written message
JIGSAW|A puzzle of pieces that lock together
GALAXY|A huge group of stars
FINGER|One of five on your hand
DONKEY|An animal with long ears that brays
COMEDY|Something funny to watch
BALLET|A graceful dance
ALMOND|An oval nut
CRAYON|A wax stick for colouring
NEPHEW|Your brother's or sister's son
PARADE|A march through the streets
PIGEON|A grey city bird
SALMON|A pink fish that swims upriver
TEMPLE|A place of worship
VOYAGE|A long trip by sea
WALRUS|A sea animal with long tusks
BREATH|Air in and out of your lungs
CHERUB|A cute angel
DIMPLE|A small dent in your cheek
ENGINE|It makes a car go
FLIGHT|A trip on a plane
GOBLET|A cup with a stem
HARBOUR|Boats are safe there
LAGOON|A calm pool by the sea
MITTEN|A glove without fingers
ORCHID|An exotic flower
PEBBLE|A small smooth stone
RIDDLE|A tricky question
SLEDGE|You ride it down a snowy hill
THRONE|A king sits on it
ACROBAT|A circus performer who does flips
AIRPORT|Where planes take off
ANTIQUE|Very old and valuable
BALLOON|It floats when filled with air
BATTERY|It powers a torch
BEDROOM|The room where you sleep
BICYCLE|It has two wheels and pedals
BLANKET|It keeps you warm in bed
CABBAGE|A leafy green vegetable
CAPTAIN|The leader of a ship
CARAVAN|A home on wheels
CHICKEN|A farm bird
CLIMATE|Weather over a long time
COMPASS|It points north
CONCERT|A live music show
CUSHION|A soft pillow for a chair
DIAMOND|A sparkling gem
DOLPHIN|A clever sea mammal
EARRING|Jewellery for your ear
FEATHER|A bird is covered in them
FREEDOM|Being free
GIRAFFE|The tallest animal
HARVEST|Gathering crops
HOLIDAY|A break from school or work
HORIZON|Where the sky meets the land
KITCHEN|The room where you cook
LANTERN|A lamp you carry
LIBRARY|A place full of books
MACHINE|Something with moving parts
MERMAID|Half woman, half fish, from stories
MORNING|The start of the day
MUSICAL|A show with songs
MYSTERY|Something hard to explain
OCTOPUS|A sea animal with eight arms
ORCHARD|A field of fruit trees
PANCAKE|A flat cake made in a pan
PENGUIN|A bird that cannot fly but swims
PICTURE|A drawing or a photo
POPCORN|A snack at the cinema
PRESENT|A gift
PUMPKIN|A big orange vegetable
RAINBOW|Colours in the sky after rain
SCIENCE|The study of how the world works
SHELTER|A place that keeps you safe
SNOWMAN|A figure made of snow
SPINACH|A leafy green vegetable
STATION|Where trains stop
SUNRISE|When the sun comes up
TEACHER|Someone who helps you learn
THUNDER|The loud sound in a storm
TRUMPET|A brass instrument
UNICORN|A horse with one horn, from stories
VILLAGE|A small town in the country
VOLCANO|A mountain that can erupt
WEATHER|Sun, rain or snow
WHISPER|Talk very quietly
COUNTRY|A nation
CRYSTAL|A clear shiny stone
DRAWING|A picture made with a pencil
FIREFLY|An insect that glows at night
GALLERY|A place to see art
JOURNEY|A long trip
LETTUCE|Salad leaves
MONSTER|A scary creature from stories
SAUSAGE|A tube of meat
SHAMPOO|You wash your hair with it
TORNADO|A spinning storm
BLOSSOM|Flowers on a tree in spring
CHAPTER|A part of a book
CURTAIN|It covers a window
DESSERT|The sweet course after dinner
FACTORY|A building where things are made
HAMSTER|A small furry pet
MESSAGE|Words sent to someone
PATIENT|Calm while waiting
QUARTER|One of four equal parts
SPARROW|A small brown bird
VITAMIN|Good stuff in fruit and vegetables
WHISTLE|A high sound made by blowing
GRANITE|A hard grey rock
KINGDOM|A land ruled by a king or queen
MARBLES|Little glass balls for a game
NETWORK|Things linked together
OSTRICH|A big bird that runs fast
PYRAMID|A shape with a square base and a point
SUPPORT|Help and hold up
TRACTOR|A farm vehicle
ALPHABET|A to Z
BIRTHDAY|The day you were born
CALENDAR|It shows the days of the year
CHAMPION|The winner
CUPBOARD|A cabinet for cups and plates
DAUGHTER|A girl child
DINOSAUR|A giant reptile from long ago
ELEPHANT|A huge animal with a trunk
EXERCISE|Activity to stay fit
FESTIVAL|A big celebration
FIREWORK|It bursts with colour in the night sky
FOOTBALL|A game with a round ball and two goals
HEDGEHOG|A small animal covered in spikes
HOMEWORK|School work done at home
KANGAROO|An animal that hops and has a pouch
LAUGHTER|The sound of laughing
LEMONADE|A sweet lemon drink
MAGAZINE|A thin book with pictures
MOUNTAIN|A very high hill
NOTEBOOK|A book for writing notes
PAINTING|A picture made with paint
PEACEFUL|Calm and quiet
PRINCESS|A king's daughter
RAINCOAT|A coat for wet weather
SANDWICH|Bread with a filling
SCISSORS|A tool for cutting paper
SEASHELL|You find it on the beach
SKELETON|All the bones in your body
SNOWBALL|You throw it in winter
SQUIRREL|It gathers nuts
SUNSHINE|Light from the sun
SURPRISE|Something you did not expect
SWIMMING|Moving through water
TREASURE|Gold and jewels in a chest
UMBRELLA|It keeps you dry in the rain
WARDROBE|A cupboard for clothes
HOSPITAL|Where doctors care for patients
SUITCASE|You pack it for a trip
TRIANGLE|A shape with three sides
UNIVERSE|Everything that exists
BACKPACK|A bag you carry on your back
DOORBELL|It rings when visitors arrive
EXPLORER|Someone who travels to find new places
MOONBEAM|A ray of light from the moon
OVERCOAT|A warm coat worn on top
PLAYTIME|A break for fun at school
STARFISH|A sea animal with five arms
TOMORROW|The day after today
ADVENTURE|An exciting journey
ASTRONAUT|Someone who travels to space
BUTTERFLY|An insect with colourful wings
CHOCOLATE|A sweet treat made from cocoa
CROCODILE|A big reptile with strong jaws
DANDELION|A yellow flower that turns into fluff
DETECTIVE|Someone who solves mysteries
FIREPLACE|Where a fire burns inside a house
HAPPINESS|The feeling of being happy
LIGHTNING|A flash in a storm
NEWSPAPER|Daily printed news
PINEAPPLE|A spiky tropical fruit
SNOWFLAKE|A tiny piece of falling snow
SUNFLOWER|A tall yellow flower that follows the sun
TELESCOPE|You look at stars with it
WATERFALL|Water dropping from a cliff
CROSSWORD|A puzzle of words in a grid
BREAKFAST|The first meal of the day
CARPENTER|Someone who makes things from wood
LIBRARIAN|Someone who looks after books
MICROWAVE|It heats food quickly
SCARECROW|It keeps birds away from crops
SUBMARINE|A ship that travels under water
TREEHOUSE|A playhouse up in the branches
VEGETABLE|A carrot or a pea
HANDSHAKE|A greeting with your hands
MOONLIGHT|Light at night from the moon
NIGHTFALL|When it gets dark
RASPBERRY|A soft red berry
SPACESHIP|A craft that flies to space
STARLIGHT|Light from the stars
WONDERFUL|Very good`,Qe=Wo.split(`
`).map(t=>t.split("|")).filter(t=>t.length===2&&/^[A-Z]{3,9}$/.test(t[0]));function Yo(t,n,e,o){let r=Array.from({length:t},()=>new Array(t).fill("")),l=Array.from({length:t},()=>Array.from({length:t},()=>0)),s=[],a=new Set,c=(E,m)=>E<0||m<0||E>=t||m>=t?null:r[E][m],i=(E,m,w,y)=>{let b=y?1:0,R=y?0:1,S=m+b*(E.length-1),C=w+R*(E.length-1);if(m<0||w<0||S>=t||C>=t||c(m-b,w-R)||c(S+b,C+R))return-1;let I=0;for(let M=0;M<E.length;M++){let N=m+b*M,P=w+R*M,Y=r[N][P];if(Y){if(Y!==E[M]||l[N][P]&(y?2:1))return-1;I+=1}else if(c(N+R,P+b)||c(N-R,P-b))return-1}return I===E.length?-1:I},h=(E,m,w,y,b)=>{let R=b?1:0,S=b?0:1;for(let C=0;C<E.length;C++)r[w+R*C][y+S*C]=E[C],l[w+R*C][y+S*C]|=b?2:1;s.push({w:E,clue:m,r:w,c:y,d:b}),a.add(E)},u=e.filter(([E])=>E.length>=Math.max(4,t-2)),[p,g]=u[Math.floor(n()*u.length)]||e[0],d=Math.floor(n()*t),A=Math.floor(n()*(t-p.length+1));n()<.5?h(p,g,d,A,0):h(p,g,A,d,1);for(let E=0;E<3&&s.length<o;E++)for(let[m,w]of tt(e,n)){if(s.length>=o)break;if(a.has(m))continue;let y=null;for(let b=0;b<t;b++)for(let R=0;R<t;R++)for(let S of[0,1]){let C=i(m,b,R,S);C>0&&(!y||C>y.x||C===y.x&&n()<.35)&&(y={r:b,c:R,d:S,x:C})}y&&h(m,w,y.r,y.c,y.d)}let f=0;for(let E=0;E<t;E++)for(let m=0;m<t;m++)r[E][m]&&(f+=1);return{g:r,placed:s,filled:f}}function Go(t,n){let e=Math.max(5,Math.min(9,n|0)),o=Q(`xw:${t}:${e}`),r=Qe.filter(([w])=>w.length<=e),l={5:6,6:8,7:10,8:12,9:14}[e],s=null;for(let w=0;w<36;w++){let y=Yo(e,o,r,l+2),b=e,R=-1,S=e,C=-1;for(let N=0;N<e;N++)for(let P=0;P<e;P++)y.g[N][P]&&(b=Math.min(b,N),R=Math.max(R,N),S=Math.min(S,P),C=Math.max(C,P));let I=(R-b+1)*(C-S+1),M=y.placed.length*10+y.filled+(I>=e*(e-1)?20:0);if((!s||M>s.score)&&(s={...y,score:M,r0:b,r1:R,c0:S,c1:C}),y.placed.length>=l&&I>=e*(e-1))break}let{g:a,placed:c,r0:i,r1:h,c0:u,c1:p}=s,g=p-u+1,d=h-i+1,A="";for(let w=i;w<=h;w++)for(let y=u;y<=p;y++)A+=a[w][y]||"#";let f=new Map,E=c.map(w=>({...w,r:w.r-i,c:w.c-u}));E.slice().sort((w,y)=>w.r-y.r||w.c-y.c).forEach(w=>{let y=w.r*g+w.c;f.has(y)||f.set(y,f.size+1)});let m=E.map(w=>({n:f.get(w.r*g+w.c),d:w.d?"d":"a",r:w.r,c:w.c,l:w.w.length,q:w.clue})).sort((w,y)=>w.d===y.d?w.n-y.n:w.d==="a"?-1:1);return{w:g,h:d,cells:A,clues:m}}function Xe(t,n){let e=[];for(let o=0;o<n.l;o++)e.push(n.d==="d"?(n.r+o)*t.w+n.c:n.r*t.w+n.c+o);return e}function Uo(t,n){return t.clues.filter(e=>Xe(t,e).includes(n))}var ue={};et(ue,{COLORS:()=>to,FELT:()=>Dt,FOOT:()=>ht,H:()=>W,HEAD_Y:()=>Tt,R:()=>F,W:()=>G,canPlace:()=>yt,draw:()=>he,findPot:()=>Xo,groupOf:()=>Ft,initial:()=>zo,judge:()=>no,kindOf:()=>bt,layout:()=>fe,mount:()=>Qo,play:()=>ce,preview:()=>Jo,rack:()=>eo,rayHit:()=>ro,simulate:()=>Bt});var G=1270,W=2540,F=28.6,at=72,xt=62,se=1/480,Et=8,Ko=300,qo=.6,Vo=.95,Ht=.74,Zo=Math.sqrt(3),ie=[[-10,-10,50],[G+10,-10,50],[-14,W/2,38],[G+14,W/2,38],[-10,W+10,50],[G+10,W+10,50]],le=[[at,0,G-at,0,0,1],[at,W,G-at,W,0,-1],[0,at,0,W/2-xt,1,0],[0,W/2+xt,0,W-at,1,0],[G,at,G,W/2-xt,-1,0],[G,W/2+xt,G,W-at,-1,0]],wt=[];le.forEach(t=>{wt.push([t[0],t[1]]),wt.push([t[2],t[3]])});var Tt=W*.75,ht=[G/2,W/4],to={1:"#F5C518",2:"#2563EB",3:"#E11D48",4:"#7C3AED",5:"#F97316",6:"#16A34A",7:"#9F1239",8:"#15121F"},bt=t=>t===0?"cue":t===8?"eight":t<8?"s":"t",dt=t=>Math.round(t*100)/100;function eo(t){let n=Q(`pool:${t}`),e=tt([1,2,3,4,5,6,7,9,10,11,12,13,14,15],n),o=e.find(i=>i<8),r=e.find(i=>i>8),l=e.filter(i=>i!==o&&i!==r),s=[],a=0,c=n()<.5;for(let i=0;i<5;i++)for(let h=0;h<=i;h++){let u;i===2&&h===1?u=8:i===4&&h===0?u=c?r:o:i===4&&h===4?u=c?o:r:u=l[a++];let p=ht[0]+(h-i/2)*(2*F+.2),g=ht[1]-i*(F+.1)*Zo;s.push([u,dt(p),dt(g)])}return[[0,G/2,W*.82]].concat(s)}function Bt(t,n){let e=t.map(([d,A,f])=>({id:d,x:A,y:f,vx:0,vy:0,on:!0})),o=e.find(d=>d.id===0);o||(o={id:0,x:n.cx!=null?n.cx:G/2,y:n.cy!=null?n.cy:W*.82,vx:0,vy:0,on:!0},e.unshift(o)),n.cx!=null&&n.cy!=null&&(o.x=n.cx,o.y=n.cy);let r=Math.sqrt(n.dx*n.dx+n.dy*n.dy)||1,l=300+V(n.p,1,1e3)/1e3*6700;o.vx=n.dx/r*l,o.vy=n.dy/r*l;let s=V(n.s||0,-100,100)/100,a={f:null,pt:[],cush:0,hits:[]},c=[],i=!1,h=()=>c.push(e.map(d=>d.on?[d.id,d.x,d.y]:null).filter(Boolean));h();let u=e.length,p=0;for(;p<20*480;p++){let d=!1;for(let A=0;A<u;A++){let f=e[A];if(!f.on)continue;let E=f.vx*f.vx+f.vy*f.vy;if(E===0)continue;let m=Math.sqrt(E),w=m-(Ko+qo*m)*se;if(w<=4){f.vx=0,f.vy=0;continue}let y=w/m;f.vx*=y,f.vy*=y,f.x+=f.vx*se,f.y+=f.vy*se,d=!0}for(let A=0;A<u;A++){let f=e[A];if(f.on)for(let E=A+1;E<u;E++){let m=e[E];if(!m.on||f.vx===0&&f.vy===0&&m.vx===0&&m.vy===0)continue;let w=m.x-f.x,y=m.y-f.y,b=w*w+y*y;if(b>=4*F*F||b===0)continue;let R=Math.sqrt(b),S=w/R,C=y/R,I=(m.vx-f.vx)*S+(m.vy-f.vy)*C,M=(2*F-R)/2;if(f.x-=S*M,f.y-=C*M,m.x+=S*M,m.y+=C*M,I>=0)continue;let N=f.id===0?f:m.id===0?m:null,P=null;if(N&&!i){let x=Math.sqrt(N.vx*N.vx+N.vy*N.vy);x>0&&(P=[N.vx/x,N.vy/x,x])}let Y=-(1+Vo)*I/2;if(f.vx-=Y*S,f.vy-=Y*C,m.vx+=Y*S,m.vy+=Y*C,a.hits.push([Math.floor(p/Et),Math.min(1,-I/5e3)]),N){let x=N===f?m:f;a.f===null&&(a.f=x.id),P&&!i&&(i=!0,N.vx+=s*P[2]*.55*P[0],N.vy+=s*P[2]*.55*P[1])}}}for(let A=0;A<u;A++){let f=e[A];if(!(!f.on||f.vx===0&&f.vy===0)){for(let E=0;E<le.length;E++){let m=le[E];if(m[4]===0){if(f.x<m[0]||f.x>m[2])continue;let w=m[5]>0?F-(f.y-m[1]):F-(m[1]-f.y);w>0&&f.vy*m[5]<0&&(f.y+=m[5]*w,f.vy=-f.vy*Ht,f.vx*=.96,a.cush+=1,a.hits.push([Math.floor(p/Et),.25]))}else{if(f.y<m[1]||f.y>m[3])continue;let w=m[4]>0?F-(f.x-m[0]):F-(m[0]-f.x);w>0&&f.vx*m[4]<0&&(f.x+=m[4]*w,f.vx=-f.vx*Ht,f.vy*=.96,a.cush+=1,a.hits.push([Math.floor(p/Et),.25]))}}for(let E=0;E<wt.length;E++){let m=wt[E][0],w=wt[E][1],y=f.x-m,b=f.y-w,R=y*y+b*b;if(R>=F*F||R===0)continue;let S=Math.sqrt(R),C=y/S,I=b/S,M=f.vx*C+f.vy*I;f.x=m+C*F,f.y=w+I*F,M<0&&(f.vx-=(1+Ht)*M*C,f.vy-=(1+Ht)*M*I)}for(let E=0;E<ie.length;E++){let m=ie[E],w=f.x-m[0],y=f.y-m[1];if(w*w+y*y<m[2]*m[2]){f.on=!1,f.vx=0,f.vy=0,a.pt.push(f.id);break}}f.on&&(f.x<-2*F||f.x>G+2*F||f.y<-2*F||f.y>W+2*F)&&(f.on=!1,a.pt.push(f.id))}}if(p%Et===Et-1&&h(),!d)break}h();let g=e.filter(d=>d.on).map(d=>[d.id,dt(d.x),dt(d.y)]);return{frames:c,final:g,ev:a}}function jo(t,n,e,o){let r=e;for(let l=0;l<80;l++){if(!t.some(([,s,a])=>(s-n)*(s-n)+(a-r)*(a-r)<4*F*F))return[n,r];r+=o*F*.5}return[n,e]}function Ft(t,n){return t.gx?n==="x"?t.gx:t.gx==="s"?"t":"s":null}var oo=(t,n)=>t.filter(([e])=>n==="s"?e>=1&&e<=7:e>=9&&e<=15).length;function no(t,n,e,o){let r=o===t.x?"x":"o",l=o===t.x?t.o:t.x,s=(t.n||0)===0,a=Ft(t,r),c=a?oo(t.b,a)===0:!1,i=null,h=e.ev.pt;if(h.includes(0))i="scratch";else if(e.ev.f===null)i="miss";else if(!s){let y=e.ev.f;a?(c?y!==8:bt(y)!==a)&&(i="wrong"):y===8&&(i="wrong")}let u=e.final.slice(),p=t.gx||null,g=null,d=null,A=!1;if(h.includes(8))if(s){A=!0;let[y,b]=jo(u,ht[0],ht[1],-1);u.push([8,dt(y),dt(b)])}else i||!c?(g=r==="x"?"o":"x",d="eight"):(g=r,d="eight");let f=h.filter(y=>y!==0&&y!==8);if(!s&&!p&&!i&&f.length){let y=bt(f[0]);p=r==="x"?y:y==="s"?"t":"s"}let E=Ft({gx:p},r),m=!i&&f.length>0&&(s||f.some(y=>bt(y)===E));i&&(u=u.filter(([y])=>y!==0));let w=g?t.t:m?o:l;return{...t,b:u,gx:p,bih:!!i&&!g,t:w,n:(t.n||0)+1,w:g,why:d,lb:o,ls:{dx:n.dx,dy:n.dy,p:n.p,s:n.s||0,...n.cx!=null?{cx:n.cx,cy:n.cy}:{}},ev:{f:e.ev.f,pt:h,fl:i,r8:A}}}function ce(t,n,e){let o=Bt(t.b,n);return{next:no(t,n,o,e),res:o}}function zo(t,n){return{...t,b:eo(n),gx:null,bih:!0,ls:null,ev:null,w:null,why:null}}function yt(t,n,e,o){return n<F||n>G-F||e<F||e>W-F||o&&e<Tt?!1:!t.some(([r,l,s])=>r!==0&&(l-n)*(l-n)+(s-e)*(s-e)<4*F*F+1)}var ae=new Map;function _e(t,n){let e=`${t}:${n}`;if(ae.has(e))return ae.get(e);let o=Math.ceil(n*2+4),r=ot(o,o),l=r.getContext("2d"),s=o/2,a=n;l.save(),l.beginPath(),l.arc(s,s,a,0,Math.PI*2),l.clip();let c=t===0?"#F8F6EE":to[t>8?t-8:t];l.fillStyle=t>8?"#F8F6EE":c,l.fillRect(0,0,o,o),t>8&&(l.fillStyle=c,l.fillRect(0,s-a*.56,o,a*1.12)),t>0&&(l.fillStyle="#FFFFFF",l.beginPath(),l.arc(s,s,a*.46,0,Math.PI*2),l.fill(),l.fillStyle="#1B1630",l.font=`800 ${Math.round(a*(t>9?.5:.6))}px -apple-system, system-ui, sans-serif`,l.textAlign="center",l.textBaseline="middle",l.fillText(String(t),s,s+a*.04));let i=l.createRadialGradient(s-a*.35,s-a*.4,a*.05,s,s,a*1.05);return i.addColorStop(0,"rgba(255,255,255,0.7)"),i.addColorStop(.25,"rgba(255,255,255,0.12)"),i.addColorStop(.7,"rgba(0,0,0,0.05)"),i.addColorStop(1,"rgba(0,0,0,0.42)"),l.fillStyle=i,l.fillRect(0,0,o,o),l.restore(),ae.set(e,r),r}var Dt="#3E2D86";function $o(t,n,e,o,r){let l=ot(t*$(),n*$()),s=l.getContext("2d");s.scale($(),$());let a=60*e,c=o-a,i=r-a,h=G*e+a*2,u=W*e+a*2;s.fillStyle="rgba(0,0,0,0.35)",s.beginPath(),s.roundRect?s.roundRect(c+2,i+6,h,u,18*e+8):s.rect(c+2,i+6,h,u),s.fill();let p=s.createLinearGradient(c,i,c+h,i+u);p.addColorStop(0,"#5B3A22"),p.addColorStop(.5,"#3F2616"),p.addColorStop(1,"#2C1A0F"),s.fillStyle=p,s.beginPath(),s.roundRect?s.roundRect(c,i,h,u,18*e+8):s.rect(c,i,h,u),s.fill(),s.strokeStyle="rgba(255,255,255,0.12)",s.lineWidth=1.5,s.beginPath(),s.roundRect?s.roundRect(c+1.5,i+1.5,h-3,u-3,18*e+6):s.rect(c,i,h,u),s.stroke();let g=22*e;s.fillStyle=ct(Dt,"#000000",.32),s.fillRect(o-g,r-g,G*e+g*2,W*e+g*2);let d=s.createRadialGradient(o+G*e*.5,r+W*e*.45,10,o+G*e*.5,r+W*e*.5,W*e*.75);d.addColorStop(0,ct(Dt,"#FFFFFF",.1)),d.addColorStop(1,ct(Dt,"#000000",.18)),s.fillStyle=d,s.fillRect(o,r,G*e,W*e),s.fillStyle="rgba(0,0,0,0.18)",s.fillRect(o,r,G*e,3),s.fillRect(o,r,3,W*e),s.strokeStyle="rgba(255,255,255,0.13)",s.lineWidth=1,s.beginPath(),s.moveTo(o,r+Tt*e),s.lineTo(o+G*e,r+Tt*e),s.stroke(),s.fillStyle="rgba(255,255,255,0.35)",s.beginPath(),s.arc(o+ht[0]*e,r+ht[1]*e,2.2,0,Math.PI*2),s.fill(),s.fillStyle="#E9D8A6";for(let A=1;A<4;A++){let f=o+G*e*A/4;[r-a*.55,r+W*e+a*.55].forEach(E=>{s.beginPath(),s.arc(f,E,2.2,0,Math.PI*2),s.fill()})}for(let A=1;A<8;A++){if(A===4)continue;let f=r+W*e*A/8;[o-a*.55,o+G*e+a*.55].forEach(E=>{s.beginPath(),s.arc(E,f,2.2,0,Math.PI*2),s.fill()})}return ie.forEach(([A,f,E])=>{let m=(E+14)*e,w=s.createRadialGradient(o+A*e,r+f*e,m*.2,o+A*e,r+f*e,m);w.addColorStop(0,"#000000"),w.addColorStop(.8,"#0B0814"),w.addColorStop(1,"#2A1B10"),s.fillStyle=w,s.beginPath(),s.arc(o+A*e,r+f*e,m,0,Math.PI*2),s.fill()}),l}function ro(t,n,e,o,r){let l=null;for(let[c,i,h]of t){if(c===0)continue;let u=i-n,p=h-e,g=u*o+p*r;if(g<=0)continue;let d=u*u+p*p-g*g,A=4*F*F;if(d>A)continue;let f=g-Math.sqrt(A-d);(!l||f<l.t)&&(l={t:f,id:c,bx:i,by:h})}let s=[];o>0&&s.push((G-F-n)/o),o<0&&s.push((F-n)/o),r>0&&s.push((W-F-e)/r),r<0&&s.push((F-e)/r);let a=Math.min(...s.filter(c=>c>=0));return l&&l.t<=a?l:{t:a,id:null}}function he(t,n,e,o){let{sc:r,ox:l,oy:s,cw:a,ch:c,art:i}=n;t.clearRect(0,0,a,c),t.drawImage(i,0,0,a,c);let h=Math.max(4,F*r),u=o||{};for(let[g,d,A]of e)u.hide!==g&&(t.fillStyle="rgba(0,0,0,0.32)",t.beginPath(),t.ellipse(l+d*r+h*.18,s+A*r+h*.32,h*.95,h*.8,0,0,Math.PI*2),t.fill());let p=Math.round(h*$());for(let[g,d,A]of e){if(u.hide===g)continue;let f=_e(g,p),E=f.width/$();t.drawImage(f,l+d*r-E/2,s+A*r-E/2,E,E)}if(u.place){let[g,d,A]=u.place;t.strokeStyle=A?"rgba(255,255,255,0.85)":"rgba(255,90,90,0.9)",t.lineWidth=2,t.setLineDash([4,4]),t.beginPath(),t.arc(l+g*r,s+d*r,h+7,0,Math.PI*2),t.stroke(),t.setLineDash([]);let f=_e(0,p),E=f.width/$();t.globalAlpha=A?1:.6,t.drawImage(f,l+g*r-E/2,s+d*r-E/2,E,E),t.globalAlpha=1}if(u.aim){let{cx:g,cy:d,ux:A,uy:f,pull:E,hit:m}=u.aim,w=l+g*r,y=s+d*r;t.strokeStyle="rgba(255,255,255,0.75)",t.lineWidth=1.6,t.setLineDash([6,6]),t.beginPath(),t.moveTo(w,y),t.lineTo(w+A*m.t*r,y+f*m.t*r),t.stroke(),t.setLineDash([]);let b=w+A*m.t*r,R=y+f*m.t*r;if(t.strokeStyle="rgba(255,255,255,0.9)",t.beginPath(),t.arc(b,R,h,0,Math.PI*2),t.stroke(),m.id!==null){let x=m.bx*r+l-b,T=m.by*r+s-R,L=Math.sqrt(x*x+T*T)||1;t.strokeStyle="rgba(255,255,255,0.6)",t.lineWidth=2,t.beginPath(),t.moveTo(l+m.bx*r,s+m.by*r),t.lineTo(l+m.bx*r+x/L*60,s+m.by*r+T/L*60),t.stroke();let v=A*(x/L)+f*(T/L),H=A-v*(x/L),D=f-v*(T/L),O=Math.sqrt(H*H+D*D);O>.05&&(t.strokeStyle="rgba(255,255,255,0.3)",t.beginPath(),t.moveTo(b,R),t.lineTo(b+H/O*40*O,R+D/O*40*O),t.stroke())}let S=14+E*90,C=Math.max(180,c*.42),I=w-A*(h+S),M=y-f*(h+S),N=I-A*C,P=M-f*C;t.lineCap="round",t.strokeStyle="rgba(0,0,0,0.35)",t.lineWidth=9,t.beginPath(),t.moveTo(I+3,M+5),t.lineTo(N+3,P+5),t.stroke();let Y=t.createLinearGradient(I,M,N,P);Y.addColorStop(0,"#F4F1E8"),Y.addColorStop(.03,"#F4F1E8"),Y.addColorStop(.035,"#2E6BD8"),Y.addColorStop(.06,"#2E6BD8"),Y.addColorStop(.065,"#E8C98F"),Y.addColorStop(.6,"#C9935B"),Y.addColorStop(.62,"#1E1530"),Y.addColorStop(1,"#2B1F44"),t.strokeStyle=Y,t.lineWidth=7,t.beginPath(),t.moveTo(I,M),t.lineTo(N,P),t.stroke(),t.lineCap="butt"}}function fe(t,n,e=10){let r=Math.min((t-e*2)/(G+120),(n-e*2)/(W+120)),l=(t-G*r)/2,s=(n-W*r)/2;return{sc:r,ox:l,oy:s,cw:t,ch:n,art:$o(t,n,r,l,s)}}function Jo(t,n,e,o){let r=J(t,n,e),l=n>e,s=fe(l?e:n,l?n:e,4);l&&(r.save(),r.translate(n,0),r.rotate(Math.PI/2)),he(r,s,o||[],{}),l&&r.restore()}function Qo(t,n){let e=document.createElement("canvas");e.style.display="block",e.style.touchAction="none",t.appendChild(e);let o={...n},r=null,l=null,s=o.balls||[],a=null,c=0,i=null,h=null,u=0,p=!1,g=Pt(),d=()=>{let T=t.getBoundingClientRect(),L=Math.max(120,Math.floor(T.width)),v=Math.max(200,Math.floor(T.height));l=J(e,L,v),r=fe(L,v,6),w()},A=()=>s.find(T=>T[0]===0),f=T=>{let L=e.getBoundingClientRect();return[(T.clientX-L.left-r.ox)/r.sc,(T.clientY-L.top-r.oy)/r.sc]},E=()=>o.canShoot&&!h,m=()=>{let T=i?[0,i[0],i[1]]:A();if(!T||!a)return null;let L=s.filter(v=>v[0]!==0);return{cx:T[1],cy:T[2],ux:a[0],uy:a[1],pull:c,hit:ro(L,T[1],T[2],a[0],a[1])}},w=()=>{!r||p||he(l,r,s,{aim:E()&&a&&(!o.bih||i)?m():null,place:i&&o.bih&&!h?[i[0],i[1],i[2]]:null,hide:i&&o.bih&&!h?0:-1})},y=()=>{let T=i?[0,i[0],i[1]]:A();if(!T)return;let L=null;s.forEach(([O,k,B])=>{if(O===0)return;let K=(k-T[1])*(k-T[1])+(B-T[2])*(B-T[2]);(!L||K<L.d)&&(L={d:K,x:k,y:B})});let v=L?L.x:G/2,H=L?L.y:W/4,D=Math.sqrt((v-T[1])*(v-T[1])+(H-T[2])*(H-T[2]))||1;a=[(v-T[1])/D,(H-T[2])/D]},b=()=>{let T=A(),L=!!o.brk,v=T?T[1]:G/2,H=T?T[2]:L?W*.82:W*.75;yt(s,v,H,L)||(v=G/2,H=W*.82),i=[v,H,yt(s,v,H,L)]},R=null,S=T=>{if(!E()||!r)return;let[L,v]=f(T);if(e.setPointerCapture&&e.setPointerCapture(T.pointerId),o.bih&&i&&(L-i[0])*(L-i[0])+(v-i[1])*(v-i[1])<F*3.2*(F*3.2)){R={kind:"place",id:T.pointerId};return}R={kind:"aim",id:T.pointerId},C(T)},C=T=>{if(!R||R.id!==T.pointerId)return;let[L,v]=f(T);if(R.kind==="place"){let H=V(L,F,G-F),D=V(v,o.brk?Tt+F*.1:F,W-F);i=[H,D,yt(s,H,D,!!o.brk)]}else{let H=i?[0,i[0],i[1]]:A();if(!H)return;let D=L-H[1],O=v-H[2],k=Math.sqrt(D*D+O*O);k>F*.6&&(a=[D/k,O/k]),o.onAim&&o.onAim()}w()},I=T=>{R&&R.id===T.pointerId&&(R=null)};e.addEventListener("pointerdown",S),e.addEventListener("pointermove",C),e.addEventListener("pointerup",I),e.addEventListener("pointercancel",I);let M=typeof ResizeObserver!="undefined"?new ResizeObserver(()=>d()):null;M?M.observe(t):window.addEventListener("resize",d);let N=(T,L,v)=>{cancelAnimationFrame(u);let H=0,D=0;h={frames:T},g.begin();let O=k=>{if(p)return;g.tick(k),H||(H=k);let B=Math.min(T.length-1,Math.floor((k-H)/1e3*60));for(s=T[B];D<L.length&&L[D][0]<=B;)o.onHit&&o.onHit(L[D][1]),D+=1;let K=performance.now();if(w(),g.work(performance.now()-K),B>=T.length-1){h=null,v&&v(),w();return}u=requestAnimationFrame(O)};u=requestAnimationFrame(O)},P={set(T){o={...o,...T},T.balls&&!h&&(s=T.balls),o.bih&&o.canShoot&&!i&&b(),o.bih||(i=null),o.canShoot&&!a&&y(),w()},setPull(T){c=V(T,0,1),w()},shoot(T){if(!E()||!a||o.bih&&(!i||!i[2]))return null;let L={dx:Math.round(a[0]*1e6),dy:Math.round(a[1]*1e6),p:Math.round(V(T,.02,1)*1e3),s:Math.round(V(o.spin||0,-1,1)*100)};return o.bih&&i&&(L.cx=Math.round(i[0]*100)/100,L.cy=Math.round(i[1]*100)/100),c=0,L},animate(T,L,v,H){let D=H||Bt(T,L);return i=null,N(D.frames,D.ev.hits,()=>{s=D.final,v&&v(D)}),D},aimAt(T,L){a=[T,L],w()},placeAt(T,L){o.bih&&(i=[T,L,yt(s,T,L,!!o.brk)],w())},stats(){return g.report()},busy(){return!!h},destroy(){p=!0,cancelAnimationFrame(u),M?M.disconnect():window.removeEventListener("resize",d),e.remove()}};d(),P.set({});let Y=setTimeout(()=>{!p&&!h&&Bt(s,{dx:0,dy:-1e6,p:400,s:0})},700),x=P.destroy;return P.destroy=()=>{clearTimeout(Y),x()},P}function Xo(t,n){let e=n===t.x?"x":"o",o=Ft(t,e),r=o?oo(t.b,o)===0:!1,l=t.b.find(u=>u[0]===0)||[0,G/2,W*.82],s=t.bih?{cx:l[1],cy:l[2]}:{},a=t.b.filter(([u])=>u!==0&&(r?u===8:o?bt(u)===o:u!==8)),c=[[0,0],[G,0],[0,W/2],[G,W/2],[0,W],[G,W]],i=[];for(let[,u,p]of a)for(let[g,d]of c){let A=g-u,f=d-p,E=Math.sqrt(A*A+f*f)||1,m=u-A/E*2*F,w=p-f/E*2*F,y=m-l[1],b=w-l[2],R=Math.sqrt(y*y+b*b)||1,S=y/R*(A/E)+b/R*(f/E);S<.35||i.push({cut:S,l:E+R,dx:Math.round(y/R*1e6),dy:Math.round(b/R*1e6)})}i.sort((u,p)=>p.cut-u.cut||u.l-p.l);let h=null;for(let u of i.slice(0,24))for(let p of[420,650,900]){let g={dx:u.dx,dy:u.dy,p,s:0,...s},{next:d}=ce(t,g,n);if(d.w){if(d.w===e)return g;continue}if(!d.ev.fl&&d.t===n)return g;!h&&!d.ev.fl&&(h=g)}if(h)return h;for(let u=0;u<360;u+=6){let p=u*Math.PI/180,g={dx:Math.round(Math.cos(p)*1e6),dy:Math.round(Math.sin(p)*1e6),p:500,s:0,...s},{next:d}=ce(t,g,n);if(!d.ev.fl&&!d.w)return g}return{dx:0,dy:-1e6,p:500,s:0,...s}}var ge={};et(ge,{BR:()=>it,CH:()=>It,CW:()=>Yt,HOLES:()=>X,MAXS:()=>io,draw:()=>pe,findPutt:()=>cn,finishHole:()=>nn,initial:()=>on,mount:()=>an,playHole:()=>lo,preview:()=>sn,putt:()=>Ae});var Yt=1e3,It=1500,it=15,Mt=26,Rt=1/480,Wt=8,so=240,_o=.95,io=6,Z=(t,n,e,o)=>[[t,n],[e,n],[e,o],[t,o]],X=[{n:"Warm up",par:2,out:Z(330,120,670,1400),tee:[500,1270],cup:[500,300],blocks:[],bumps:[],slopes:[],sand:[]},{n:"Dog leg",par:3,out:[[200,1400],[470,1400],[470,500],[820,500],[820,170],[200,170]],tee:[335,1270],cup:[700,330],via:[[335,340]],blocks:[],bumps:[[335,700,34]],slopes:[],sand:[]},{n:"Bumpers",par:3,out:Z(220,140,780,1420),tee:[500,1290],cup:[500,320],blocks:[],bumps:[[500,820,62],[355,560,46],[645,560,46],[360,1060,34],[640,1060,34]],slopes:[],sand:[]},{n:"Hillside",par:2,out:Z(260,140,740,1420),tee:[600,1290],cup:[380,330],blocks:[],bumps:[],slopes:[{p:Z(260,600,740,900),a:[430,0]}],sand:[]},{n:"Zig zag",par:3,out:Z(200,120,800,1440),tee:[300,1310],cup:[300,270],via:[[710,1005],[290,625]],blocks:[Z(200,980,620,1030),Z(380,600,800,650)],bumps:[],slopes:[],sand:[]},{n:"Volcano",par:3,out:Z(230,140,770,1420),tee:[500,1290],cup:[500,420],blocks:[],bumps:[[330,900,30],[670,900,30]],slopes:[{p:Z(370,290,630,370),a:[0,-360]},{p:Z(370,470,630,550),a:[0,360]},{p:Z(370,370,450,470),a:[-360,0]},{p:Z(550,370,630,470),a:[360,0]}],sand:[]},{n:"Bank shot",par:3,out:Z(200,140,800,1420),tee:[650,1290],cup:[640,400],via:[[265,730]],blocks:[Z(330,700,800,760)],bumps:[[480,1e3,36]],slopes:[],sand:[Z(200,300,330,520)]},{n:"Bridge",par:2,out:[[250,1420],[750,1420],[750,1e3],[560,1e3],[560,600],[750,600],[750,140],[250,140],[250,600],[440,600],[440,1e3],[250,1e3]],tee:[500,1300],cup:[560,300],blocks:[],bumps:[],slopes:[{p:Z(440,600,560,1e3),a:[0,-60]}],sand:[Z(290,200,420,420)]},{n:"U turn",par:4,out:[[180,1420],[440,1420],[440,430],[560,430],[560,1420],[820,1420],[820,140],[180,140]],tee:[310,1300],cup:[690,1180],via:[[310,300],[690,300]],blocks:[],bumps:[[500,260,40]],slopes:[{p:Z(560,1050,820,1300),a:[0,160]}],sand:[]}];function tn(t){let n=[],e=o=>{for(let r=0;r<o.length;r++){let l=o[r],s=o[(r+1)%o.length];n.push([l[0],l[1],s[0],s[1]])}};return e(t.out),t.blocks.forEach(e),n}var en=X.map(tn);function ao(t,n,e){let o=!1;for(let r=0,l=t.length-1;r<t.length;l=r++){let s=t[r][0],a=t[r][1],c=t[l][0],i=t[l][1];a>e!=i>e&&n<(c-s)*(e-a)/(i-a)+s&&(o=!o)}return o}function Ae(t,n,e){let o=X[t],r=en[t],l=n[0],s=n[1],a=Math.sqrt(e[0]*e[0]+e[1]*e[1])||1,c=60+V(e[2],1,1e3)/1e3*2340,i=e[0]/a*c,h=e[1]/a*c,u=[[l,s]],p=[],g=!1;for(let A=0;A<15*480;A++){let f=0,E=0;for(let S of o.slopes)ao(S.p,l,s)&&(f+=S.a[0],E+=S.a[1]);let m=so;for(let S of o.sand)ao(S,l,s)&&(m=so*4.5);i+=f*Rt,h+=E*Rt;let w=i*i+h*h;if(w>0){let S=Math.sqrt(w),C=S-(m+_o*S)*Rt;if(C<=3&&!(f||E))i=0,h=0;else if(C<=0)i=0,h=0;else{let I=C/S;i*=I,h*=I}}l+=i*Rt,s+=h*Rt;for(let[S,C,I,M]of r){let N=I-S,P=M-C,Y=N*N+P*P,x=((l-S)*N+(s-C)*P)/Y;x=x<0?0:x>1?1:x;let T=S+N*x,L=C+P*x,v=l-T,H=s-L,D=v*v+H*H;if(D>=it*it||D===0)continue;let O=Math.sqrt(D),k=v/O,B=H/O;l=T+k*it,s=L+B*it;let K=i*k+h*B;K<0&&(i-=1.72*K*k,h-=1.72*K*B,p.push([Math.floor(A/Wt),Math.min(1,-K/1500)]))}for(let[S,C,I]of o.bumps){let M=l-S,N=s-C,P=I+it,Y=M*M+N*N;if(Y>=P*P||Y===0)continue;let x=Math.sqrt(Y),T=M/x,L=N/x;l=S+T*P,s=C+L*P;let v=i*T+h*L;v<0&&(i-=1.88*v*T,h-=1.88*v*L,p.push([Math.floor(A/Wt),Math.min(1,-v/1200)]))}let y=l-o.cup[0],b=s-o.cup[1],R=y*y+b*b;if(R<Mt*Mt&&(Math.sqrt(i*i+h*h)<900||R<Mt*.4*(Mt*.4))){g=!0,l=o.cup[0],s=o.cup[1],u.push([l,s]);break}if(A%Wt===Wt-1&&u.push([l,s]),i===0&&h===0)break}u.push([l,s]);let d=A=>Math.round(A*100)/100;return{frames:u,end:[d(l),d(s)],holed:g,hits:p}}function lo(t,n){let e=X[t].tee.slice(),o=!1,r=[];for(let l=0;l<n.length&&!o;l++){let s=Ae(t,e,n[l]);r.push(s),e=s.end,o=s.holed}return{holed:o,strokes:o?r.length:io+1,parts:r,end:e}}function on(t){return{...t,f:t.t,h:1,sx:[],so:[],ls:null,lh:0,lb:null,w:null,why:null}}function nn(t,n,e){let o=lo(t.h-1,n),r=e===t.x?"x":"o",l=r==="x"?t.sx.concat([o.strokes]):t.sx.slice(),s=r==="o"?t.so.concat([o.strokes]):t.so.slice(),a=e===t.x?t.o:t.x,c=e!==t.f,i=c?t.h+1:t.h,h=null;if(l.length>=9&&s.length>=9||c&&t.h>=9){let u=l.reduce((g,d)=>g+d,0),p=s.reduce((g,d)=>g+d,0);h=u===p?"d":u<p?"x":"o"}return{...t,sx:l,so:s,h:h?9:i,t:h?t.t:c?t.f:a,n:(t.n||0)+1,ls:n,lh:t.h,lb:e,w:h,why:h?"done":null}}var de=new Map;function co(t,n,e,o){let r=`${t}:${n}:${e}:${o?1:0}`;if(de.has(r))return de.get(r);let l=$(),s=ot(n*l,e*l),a=s.getContext("2d");a.scale(l,l);let c=Math.min(n/Yt,e/It),i=(n-Yt*c)/2,h=(e-It*c)/2,u=X[t],p=b=>{a.beginPath(),b.forEach(([R,S],C)=>C?a.lineTo(i+R*c,h+S*c):a.moveTo(i+R*c,h+S*c)),a.closePath()};p(u.out),a.save(),a.shadowColor="rgba(0,0,0,0.35)",a.shadowBlur=18,a.shadowOffsetY=8,a.lineJoin="round",a.lineWidth=26*c+6,a.strokeStyle=o?"#3A2F63":"#5B47B8",a.stroke(),a.restore(),p(u.out);let g=a.createLinearGradient(0,h,0,h+It*c);g.addColorStop(0,"#3FAE5A"),g.addColorStop(1,"#2E9149"),a.fillStyle=g,a.fill(),a.save(),p(u.out),a.clip(),a.fillStyle="rgba(255,255,255,0.06)";for(let b=0;b<It;b+=90)a.fillRect(i,h+b*c,Yt*c,45*c);u.sand.forEach(b=>{p(b),a.fillStyle="#E8D49A",a.fill(),a.fillStyle="rgba(160,120,60,0.18)";for(let R=0;R<40;R++){let S=b[0][0]+R*37%97/97*(b[1][0]-b[0][0]),C=b[0][1]+R*53%89/89*(b[2][1]-b[0][1]);a.beginPath(),a.arc(i+S*c,h+C*c,1.4,0,Math.PI*2),a.fill()}}),u.slopes.forEach(b=>{p(b.p),a.fillStyle="rgba(0,40,10,0.13)",a.fill();let[R,S]=b.a,C=Math.sqrt(R*R+S*S)||1,I=R/C,M=S/C,N=b.p.map(v=>v[0]),P=b.p.map(v=>v[1]),Y=Math.min(...N),x=Math.max(...N),T=Math.min(...P),L=Math.max(...P);a.strokeStyle="rgba(255,255,255,0.28)",a.lineWidth=2,a.lineCap="round";for(let v=Y+40;v<x;v+=80)for(let H=T+40;H<L;H+=80){let D=i+v*c,O=h+H*c,k=14;a.beginPath(),a.moveTo(D-I*k,O-M*k),a.lineTo(D+I*k,O+M*k),a.lineTo(D+I*k-(I*6-M*5),O+M*k-(M*6+I*5)),a.moveTo(D+I*k,O+M*k),a.lineTo(D+I*k-(I*6+M*5),O+M*k-(M*6-I*5)),a.stroke()}}),a.restore(),u.blocks.forEach(b=>{p(b),a.save(),a.shadowColor="rgba(0,0,0,0.3)",a.shadowBlur=8,a.shadowOffsetY=4,a.fillStyle=o?"#4A3D7E":"#6D55D9",a.fill(),a.restore(),p(b),a.strokeStyle="rgba(255,255,255,0.25)",a.lineWidth=2,a.stroke()}),u.bumps.forEach(([b,R,S])=>{let C=i+b*c,I=h+R*c,M=S*c;a.fillStyle="rgba(0,0,0,0.3)",a.beginPath(),a.arc(C+2,I+5,M,0,Math.PI*2),a.fill();let N=a.createRadialGradient(C-M*.35,I-M*.4,M*.1,C,I,M);N.addColorStop(0,"#FFD6E7"),N.addColorStop(.5,"#F472B6"),N.addColorStop(1,"#BE185D"),a.fillStyle=N,a.beginPath(),a.arc(C,I,M,0,Math.PI*2),a.fill()});let[d,A]=u.tee;a.fillStyle="rgba(255,255,255,0.22)",a.beginPath(),a.roundRect?a.roundRect(i+(d-46)*c,h+(A-30)*c,92*c,60*c,10*c):a.rect(i+(d-46)*c,h+(A-30)*c,92*c,60*c),a.fill();let[f,E]=u.cup,m=Mt*c;a.fillStyle="rgba(255,255,255,0.35)",a.beginPath(),a.arc(i+f*c,h+E*c,m+3,0,Math.PI*2),a.fill();let w=a.createRadialGradient(i+f*c,h+E*c-m*.3,m*.1,i+f*c,h+E*c,m);w.addColorStop(0,"#000000"),w.addColorStop(1,"#1A1328"),a.fillStyle=w,a.beginPath(),a.arc(i+f*c,h+E*c,m,0,Math.PI*2),a.fill();let y={sc:c,ox:i,oy:h,w:n,h:e,c:s};return de.set(r,y),y}function rn(t,n,e,o){let[r,l]=X[e].cup,s=n.ox+r*n.sc,a=n.oy+l*n.sc,c=Math.max(34,120*n.sc);t.strokeStyle="#F4F1E8",t.lineWidth=2.4,t.beginPath(),t.moveTo(s,a),t.lineTo(s,a-c),t.stroke();let i=o?Math.sin(o/260)*3:0;t.fillStyle="#7C5CFC",t.beginPath(),t.moveTo(s,a-c),t.quadraticCurveTo(s+c*.3,a-c+4+i,s+c*.55,a-c+9),t.quadraticCurveTo(s+c*.3,a-c+14-i,s,a-c+19),t.closePath(),t.fill()}function pe(t,n,e,o,r,l,s){let a=co(n,e,o,r);t.clearRect(0,0,e,o),t.drawImage(a.c,0,0,e,o);let c=s||{};if(c.ghost&&(t.fillStyle="rgba(255,255,255,0.35)",t.beginPath(),t.arc(a.ox+c.ghost[0]*a.sc,a.oy+c.ghost[1]*a.sc,Math.max(3,it*a.sc),0,Math.PI*2),t.fill()),l&&!c.gone){let i=a.ox+l[0]*a.sc,h=a.oy+l[1]*a.sc,u=Math.max(3.5,it*a.sc);if(c.aim){let{ux:g,uy:d,p:A}=c.aim,f=40+A*190;t.strokeStyle="rgba(255,255,255,0.9)",t.lineWidth=3,t.setLineDash([2,7]),t.lineCap="round",t.beginPath(),t.moveTo(i,h),t.lineTo(i+g*f,h+d*f),t.stroke(),t.setLineDash([]);let E=A<.5?ct("#4ADE80","#FACC15",A*2):ct("#FACC15","#EF4444",(A-.5)*2);t.fillStyle=E,t.beginPath(),t.moveTo(i+g*(f+12),h+d*(f+12)),t.lineTo(i+g*f-d*8,h+d*f+g*8),t.lineTo(i+g*f+d*8,h+d*f-g*8),t.closePath(),t.fill()}t.fillStyle="rgba(0,0,0,0.3)",t.beginPath(),t.ellipse(i+u*.25,h+u*.45,u,u*.8,0,0,Math.PI*2),t.fill();let p=t.createRadialGradient(i-u*.35,h-u*.4,u*.1,i,h,u);p.addColorStop(0,"#FFFFFF"),p.addColorStop(.7,"#F1EEF8"),p.addColorStop(1,"#B9B2CF"),t.fillStyle=p,t.beginPath(),t.arc(i,h,u,0,Math.PI*2),t.fill()}return rn(t,a,n,c.t||0),a}function sn(t,n,e,o,r){let l=J(t,n,e);pe(l,o,n,e,r,X[o].tee,{t:0})}function an(t,n){let e=document.createElement("canvas");e.style.display="block",e.style.touchAction="none",t.appendChild(e);let o={...n},r=null,l=0,s=0,a=X[o.hole].tee.slice(),c=null,i=null,h=null,u=0,p=!1,g=Pt(),d=()=>co(o.hole,l,s,!!o.dark),A=I=>{!r||p||pe(r,o.hole,l,s,!!o.dark,a,{aim:c&&!h&&o.canPutt?c:null,t:I||0,gone:!!o.gone,ghost:o.ghost})},f=()=>{let I=t.getBoundingClientRect();l=Math.max(120,Math.floor(I.width)),s=Math.max(160,Math.floor(I.height)),r=J(e,l,s),A()},E=I=>{let M=e.getBoundingClientRect(),N=d();return[(I.clientX-M.left-N.ox)/N.sc,(I.clientY-M.top-N.oy)/N.sc]},m=I=>{!o.canPutt||h||(e.setPointerCapture&&e.setPointerCapture(I.pointerId),i={id:I.pointerId,s:E(I)})},w=I=>{if(!i||i.id!==I.pointerId)return;let[M,N]=E(I),P=i.s[0]-M,Y=i.s[1]-N,x=Math.sqrt(P*P+Y*Y);if(x<12){c=null;return}c={ux:P/x,uy:Y/x,p:V(x/520,.02,1)},o.onAim&&o.onAim(c.p),A()},y=I=>{if(!(!i||i.id!==I.pointerId))if(i=null,c&&o.canPutt&&!h){let M=[Math.round(c.ux*1e6),Math.round(c.uy*1e6),Math.round(c.p*1e3)];c=null,A(),o.onPutt&&o.onPutt(M)}else c=null,A()};e.addEventListener("pointerdown",m),e.addEventListener("pointermove",w),e.addEventListener("pointerup",y),e.addEventListener("pointercancel",()=>{i=null,c=null,A()});let b=typeof ResizeObserver!="undefined"?new ResizeObserver(()=>f()):null;b&&b.observe(t);let R=0,S=(I,M)=>{let N=++R,P=0,Y=()=>{if(p||N!==R)return;if(P>=I.length){h=null,M&&M();return}let x=I[P++],T=0,L=0;h=x,g.begin();let v=H=>{if(p||N!==R)return;g.tick(H),T||(T=H);let D=Math.min(x.frames.length-1,Math.floor((H-T)/1e3*60));for(a=x.frames[D];L<x.hits.length&&x.hits[L][0]<=D;)o.onHit&&o.onHit(x.hits[L][1]),L+=1;let O=performance.now();if(A(H),g.work(performance.now()-O),D>=x.frames.length-1){a=x.end,x.holed&&o.onHoled&&o.onHoled(),setTimeout(Y,x.holed?0:380);return}u=requestAnimationFrame(v)};u=requestAnimationFrame(v)};Y()},C={set(I){let M=o.hole;o={...o,...I},I.hole!=null&&I.hole!==M&&(a=X[o.hole].tee.slice()),I.ball&&(a=I.ball.slice()),A()},animate(I,M){cancelAnimationFrame(u),S(I,M)},putt(I){o.onPutt&&o.onPutt(I)},ball(){return a.slice()},stats(){return g.report()},busy(){return!!h},destroy(){p=!0,cancelAnimationFrame(u),b&&b.disconnect(),e.remove()}};return f(),C}function ln(t,n,e){let o=(t.via||[]).concat([t.cup]),r=Math.max(0,Math.min(e,o.length-1));for(let[c,i]of n)for(;r<o.length-1&&(c-o[r][0])**2+(i-o[r][1])**2<22500;)r+=1;let[l,s]=n[n.length-1],a=Math.sqrt((l-o[r][0])**2+(s-o[r][1])**2);for(let c=r;c<o.length-1;c++)a+=Math.sqrt((o[c+1][0]-o[c][0])**2+(o[c+1][1]-o[c][1])**2);return{d:a,k:r}}function cn(t,n,e=0){let o=X[t],r={d:1/0,a:0,p:500,shot:null,k:e},l=(i,h)=>{let u=i*Math.PI/180,p=[Math.round(Math.cos(u)*1e6),Math.round(Math.sin(u)*1e6),h],g=Ae(t,n,p),d=g.holed?{d:-1,k:(o.via||[]).length}:ln(o,g.frames,e);return d.d<r.d&&(r={d:d.d,a:i,p:h,shot:p,k:d.k}),g.holed},s=()=>({shot:r.shot,k:r.k});for(let i=0;i<360;i+=6)for(let h=100;h<=1e3;h+=100)if(l(i,h))return s();let a=r.a,c=r.p;for(let i=a-6;i<=a+6;i+=.5)for(let h=Math.max(20,c-90);h<=Math.min(1e3,c+90);h+=15)if(l(i,h))return s();return s()}var we={};et(we,{cuts:()=>Ee,gridOf:()=>me,mount:()=>fn,piecePath:()=>ye,preview:()=>un});var hn=[[.34,0,.42,-.02,.38,-.1],[.33,-.22,.42,-.3,.5,-.3],[.58,-.3,.67,-.22,.62,-.1],[.58,-.02,.66,0,1,0]];function me(t){let n=Math.round(Math.sqrt(t));return[n,n]}function Ee(t,n,e){let o=Q(`jig:${t}:${n}x${e}`),r=()=>({s:o()<.5?1:-1,c:(o()-.5)*.08,k:.9+o()*.2}),l=[],s=[];for(let a=0;a<e;a++){l.push([]),s.push([]);for(let c=0;c<n;c++)l[a].push(r()),s[a].push(r())}return{h:l,v:s}}function Gt(t,n,e,o,r,l){let s=e-t,a=o-n,c=Math.sqrt(s*s+a*a)||1,i=s/c,h=a/c,u=-h,p=i,g=Math.min(c,l||c),d=(A,f)=>{let E=A*c,m=0;return A>.2&&A<.8&&(E=c*(.5+r.c)+(A-.5)*r.k*g,m=f*r.k*g*r.s),[t+i*E+u*m,n+h*E+p*m]};return hn.map(([A,f,E,m,w,y])=>[...d(A,f),...d(E,m),...d(w,y)])}function Ut(t,n,e,o){if(!e){n.forEach(l=>t.bezierCurveTo(l[0],l[1],l[2],l[3],l[4],l[5]));return}let r=[o].concat(n.map(l=>[l[4],l[5]]));for(let l=n.length-1;l>=0;l--){let s=n[l],a=l===0?r[0]:r[l];t.bezierCurveTo(s[2],s[3],s[0],s[1],a[0],a[1])}}function ye(t,n,e,o,r,l,s){let a=new Path2D,c=s*o,i=l*r,h=c+o,u=i+r,p=Math.min(o,r);return a.moveTo(c,i),l===0?a.lineTo(h,i):Ut(a,Gt(c,i,h,i,t.h[l][s],p),!1),s===n-1?a.lineTo(h,u):Ut(a,Gt(h,i,h,u,t.v[l][s+1],p),!1),l===e-1?a.lineTo(c,u):Ut(a,Gt(c,u,h,u,t.h[l+1][s],p),!0,[c,u]),s===0?a.lineTo(c,i):Ut(a,Gt(c,i,c,u,t.v[l][s],p),!0,[c,i]),a.closePath(),a}function Kt(t,n,e,o){let r=Math.max(e/t,o/n),l=t*r,s=n*r;return[(e-l)/2,(o-s)/2,l,s]}function fn(t,n){let e=document.createElement("canvas");e.style.display="block",e.style.touchAction="none",t.appendChild(e);let o={...n},r=o.pieces||16,[l,s]=me(r),a=V(o.ar||1,.5,2),c=Ee(o.seed,l,s),i=null,h=0,u=0,p=0,g=0,d=0,A=0,f=0,E=0,m=[],w=!1,y=0,b=null,R=0,S=Date.now()-(o.saved&&o.saved.ms?o.saved.ms:0),C=new Set(o.saved&&o.saved.placed||[]),I=ot(4,4).getContext("2d"),M=o.image,N=()=>{let O=u>h*1.05;O?(d=Math.min(h-28,u*.56*a),A=d/a,p=(h-d)/2,g=14):(A=Math.min(u-28,h*.55/a),d=A*a,p=18,g=(u-A)/2),f=d/l,E=A/s;let k=Math.ceil(Math.max(f,E)*.34),B=$(),K=Q(`jigpos:${o.seed}`),U=O?[8,g+A+14,h-8,u-8]:[p+d+16,8,h-8,u-8],_=m;m=[];let qt=s*l,pt=Math.max(1,Math.min(qt,Math.floor((U[2]-U[0])/(f*1.08)))),Ie=Math.max(1,Math.ceil(qt/pt)),go=tt(Array.from({length:qt},(j,z)=>z),K);for(let j=0;j<s;j++)for(let z=0;z<l;z++){let St=j*l+z,gt=ye(c,l,s,f,E,j,z),Me=ot((f+2*k)*B,(E+2*k)*B),q=Me.getContext("2d");if(q.scale(B,B),q.translate(k-z*f,k-j*E),q.save(),q.clip(gt),M){let[Zt,yo,wo,bo]=Kt(M.naturalWidth||M.width,M.naturalHeight||M.height,d,A);q.drawImage(M,Zt,yo,wo,bo)}else q.fillStyle="#8B7CF6",q.fillRect(z*f-k,j*E-k,f+2*k,E+2*k);q.lineWidth=2.2,q.strokeStyle="rgba(255,255,255,0.45)",q.translate(-.6,-.6),q.stroke(gt),q.translate(1.2,1.2),q.strokeStyle="rgba(0,0,0,0.4)",q.stroke(gt),q.restore(),q.lineWidth=.8,q.strokeStyle="rgba(0,0,0,0.35)",q.stroke(gt);let ft=_.find(Zt=>Zt.i===St),Oe=Math.max(1,U[2]-U[0]-f),Se=Math.max(1,U[3]-U[1]-E),ke=p+z*f,Ce=g+j*E,Le=go[St],mo=Le%pt,Eo=Math.floor(Le/pt),Ne=U[0]+(pt>1?mo*Oe/(pt-1):Oe/2)+(K()-.5)*Math.min(14,f*.12),Pe=U[1]+(Ie>1?Eo*Se/(Ie-1):Se/2)+(K()-.5)*Math.min(14,E*.12),Vt=C.has(St)||ft&&ft.on;ft&&!ft.on&&(Ne=ft.px,Pe=ft.py),m.push({i:St,r:j,c:z,path:gt,cv:Me,m:k,hx:ke,hy:Ce,px:Vt?ke:V(Ne,0,h-f),py:Vt?Ce:V(Pe,0,u-E),on:Vt,z:K()})}m.sort((j,z)=>j.on===z.on?j.z-z.z:j.on?-1:1)},P=()=>{if(!(!i||w)){if(i.clearRect(0,0,h,u),i.fillStyle=o.dark?"rgba(255,255,255,0.05)":"rgba(40,20,90,0.05)",i.fillRect(p,g,d,A),i.strokeStyle=o.dark?"rgba(255,255,255,0.18)":"rgba(40,20,90,0.18)",i.lineWidth=1,i.setLineDash([4,4]),i.strokeRect(p+.5,g+.5,d-1,A-1),i.setLineDash([]),R&&M){let O=V((Date.now()-R)/600,0,1);m.forEach(_=>i.drawImage(_.cv,_.px-_.m,_.py-_.m,f+2*_.m,E+2*_.m)),i.save(),i.globalAlpha=O,i.beginPath(),i.rect(p,g,d,A),i.clip();let[k,B,K,U]=Kt(M.naturalWidth||M.width,M.naturalHeight||M.height,d,A);i.drawImage(M,p+k,g+B,K,U),i.restore(),O<1&&(y=requestAnimationFrame(P));return}for(let O of m)b&&b.p===O||i.drawImage(O.cv,O.px-O.m,O.py-O.m,f+2*O.m,E+2*O.m);if(b){let O=b.p;i.save(),i.shadowColor="rgba(0,0,0,0.4)",i.shadowBlur=14,i.shadowOffsetY=6,i.drawImage(O.cv,O.px-O.m,O.py-O.m-3,f+2*O.m,E+2*O.m),i.restore()}}},Y=()=>{let O=t.getBoundingClientRect(),k=Math.max(160,Math.floor(O.width)),B=Math.max(220,Math.floor(O.height));k===h&&B===u||(h=k,u=B,i=J(e,h,u),N(),P())},x=O=>{let k=e.getBoundingClientRect();return[O.clientX-k.left,O.clientY-k.top]},T=()=>({placed:m.filter(O=>O.on).map(O=>O.i),ms:Date.now()-S}),L=O=>{if(R)return;let[k,B]=x(O);for(let K=m.length-1;K>=0;K--){let U=m[K];if(!U.on&&I.isPointInPath(U.path,k-U.px+U.c*f,B-U.py+U.r*E)){e.setPointerCapture&&e.setPointerCapture(O.pointerId),b={p:U,id:O.pointerId,dx:k-U.px,dy:B-U.py},m.splice(K,1),m.push(U),o.onPick&&o.onPick(),P();return}}},v=O=>{if(!b||b.id!==O.pointerId)return;let[k,B]=x(O);b.p.px=V(k-b.dx,-f*.4,h-f*.6),b.p.py=V(B-b.dy,-E*.4,u-E*.6),P()},H=O=>{if(!b||b.id!==O.pointerId)return;let k=b.p;b=null;let B=Math.min(f,E)*.24+6;if(Math.abs(k.px-k.hx)<B&&Math.abs(k.py-k.hy)<B){k.px=k.hx,k.py=k.hy,k.on=!0,m=m.filter(U=>U!==k);let K=m.findIndex(U=>!U.on);m.splice(K<0?m.length:K,0,k),o.onSnap&&o.onSnap(m.filter(U=>U.on).length,m.length),m.every(U=>U.on)&&(R=Date.now(),o.onDone&&o.onDone(Date.now()-S))}o.onProgress&&o.onProgress(T()),P()};e.addEventListener("pointerdown",L),e.addEventListener("pointermove",v),e.addEventListener("pointerup",H),e.addEventListener("pointercancel",H);let D=typeof ResizeObserver!="undefined"?new ResizeObserver(()=>Y()):null;return D&&D.observe(t),Y(),m.length&&m.every(O=>O.on)&&!R&&(R=Date.now()-600),{targets(){let O=e.getBoundingClientRect();return m.filter(k=>!k.on).reverse().map(k=>({i:k.i,from:[O.left+k.px+f/2,O.top+k.py+E/2],to:[O.left+k.hx+f/2,O.top+k.hy+E/2]}))},progress:T,placed(){return m.filter(O=>O.on).length},total(){return m.length},destroy(){w=!0,cancelAnimationFrame(y),D&&D.disconnect(),e.remove()}}}function un(t,n,e,o,r){let l=J(t,n,e),s=r||{},a=s.pieces||16,[c,i]=me(a),h=Ee(s.seed,c,i),u=n/c,p=e/i;if(l.clearRect(0,0,n,e),s.solved&&o){let[A,f,E,m]=Kt(o.naturalWidth||o.width,o.naturalHeight||o.height,n,e);l.drawImage(o,A,f,E,m);return}let g=Q(`jigprev:${s.seed}`),d=Array.from({length:c*i},(A,f)=>f).sort(()=>g()-.5);l.fillStyle=s.dark?"#262036":"#EEE9FB",l.fillRect(0,0,n,e),d.forEach((A,f)=>{let E=Math.floor(A/c),m=A%c,w=Math.floor(f/c),y=f%c,b=ye(h,c,i,u,p,E,m);if(l.save(),l.translate((y-m)*u+(g()-.5)*u*.12,(w-E)*p+(g()-.5)*p*.12),l.clip(b),o){let[R,S,C,I]=Kt(o.naturalWidth||o.width,o.naturalHeight||o.height,n,e);l.drawImage(o,R,S,C,I)}l.restore(),l.save(),l.translate((y-m)*u,(w-E)*p),l.strokeStyle="rgba(255,255,255,0.5)",l.lineWidth=1,l.stroke(b),l.restore()})}var Re={};et(Re,{drawHandTile:()=>En,drawLine:()=>mn,drawTile:()=>Te,ends:()=>fo,fits:()=>pn,isDouble:()=>Ot,layoutLine:()=>uo,pipSum:()=>dn,pipsOf:()=>be,tileName:()=>An});var be=t=>[Math.floor(t/10),t%10],Ot=t=>Math.floor(t/10)===t%10,dn=t=>Math.floor(t/10)+t%10,An=t=>`${Math.floor(t/10)} and ${t%10}`;function fo(t){return!t||!t.length?null:[Math.floor(t[0]/10),t[t.length-1]%10]}function pn(t,n){let e=fo(t),[o,r]=be(n);return e?{l:o===e[0]||r===e[0],r:o===e[1]||r===e[1]}:{l:!0,r:!0}}var gn={0:[],1:[[.5,.5]],2:[[.27,.27],[.73,.73]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.27,.27],[.73,.27],[.27,.73],[.73,.73]],5:[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],6:[[.27,.22],[.73,.22],[.27,.5],[.73,.5],[.27,.78],[.73,.78]]};function Te(t,n,e,o,r,l,s,a){let c=a||{},i=Math.min(o,r)*.16;if(t.save(),c.flat||(t.fillStyle="rgba(0,0,0,0.28)",ut(t,n+1,e+2.5,o,r,i),t.fill()),c.back){let d=t.createLinearGradient(n,e,n,e+r);d.addColorStop(0,"#8B6CFF"),d.addColorStop(1,"#5B3FD6"),t.fillStyle=d,ut(t,n,e,o,r,i),t.fill(),t.strokeStyle="rgba(255,255,255,0.35)",t.lineWidth=1,ut(t,n+2.5,e+2.5,o-5,r-5,i*.7),t.stroke(),t.restore();return}let h=t.createLinearGradient(n,e,n+o*.3,e+r);h.addColorStop(0,c.lit?"#FFF7D6":"#FFFDF7"),h.addColorStop(1,c.lit?"#F5E6A8":"#E9E2D0"),t.fillStyle=h,ut(t,n,e,o,r,i),t.fill(),t.strokeStyle=c.lit?"#E0A800":"rgba(40,30,60,0.28)",t.lineWidth=c.lit?2:1,ut(t,n+.5,e+.5,o-1,r-1,i),t.stroke();let u=r>=o;t.strokeStyle="rgba(40,30,60,0.32)",t.lineWidth=1,t.beginPath(),u?(t.moveTo(n+o*.18,e+r/2),t.lineTo(n+o*.82,e+r/2)):(t.moveTo(n+o/2,e+r*.18),t.lineTo(n+o/2,e+r*.82)),t.stroke();let p=u?[[n,e,o,r/2],[n,e+r/2,o,r/2]]:[[n,e,o/2,r],[n+o/2,e,o/2,r]],g=Math.max(1.3,Math.min(o,r)*.085);[l,s].forEach((d,A)=>{let[f,E,m,w]=p[A];(gn[d]||[]).forEach(([y,b])=>{let R=f+m*(u?y:b),S=E+w*(u?b:y);t.fillStyle="#231B3A",t.beginPath(),t.arc(R,S,g,0,Math.PI*2),t.fill(),t.fillStyle="rgba(255,255,255,0.35)",t.beginPath(),t.arc(R-g*.3,S-g*.3,g*.35,0,Math.PI*2),t.fill()})}),t.restore()}function ho(t,n,e,o,r,l){let s=e,a=0,c=n,i=!1;for(let h of t){let u=Ot(h.v)&&!i,p=u?1:2;if((c>0?s+p>o:s-p<-o)&&!Ot(h.v)){let d=c>0?s:s-1,A=l>0?a:a-1;r.push({...h,x:d,y:A,w:1,h:2,near:l>0?"top":"bottom"}),a+=l>0?2:-2,s=c>0?d+1:d,c=-c,i=!0;continue}i=!1,u?(r.push({...h,x:c>0?s:s-1,y:a-.5,w:1,h:2,near:c>0?"left":"right",dbl:!0}),s+=c):(r.push({...h,x:c>0?s:s-2,y:a,w:2,h:1,near:c>0?"left":"right",dbl:Ot(h.v)}),s+=c*2)}return{x:s,y:a,d:c}}function uo(t,n,e,o){let r=t||[];if(!r.length)return{tiles:[],u:24,ends:null,w:e,h:Math.min(o,120)};let l=Math.max(0,Math.min(r.length-1,n|0)),s=null;for(let y of[26,24,22,20,18,16,14,13,12,11,10,9,8]){let b=Math.max(4,e/y/2-.6),R=[],S=r[l],C={v:S,a:Math.floor(S/10),b:S%10,lead:!0},I=Ot(S);I?R.push({...C,x:-.5,y:-.5,w:1,h:2,near:"left",dbl:!0}):R.push({...C,x:-1,y:0,w:2,h:1,near:"left"});let M=I?.5:1,N=r.slice(l+1).map(B=>({v:B,a:Math.floor(B/10),b:B%10})),P=r.slice(0,l).reverse().map(B=>({v:B,a:B%10,b:Math.floor(B/10)})),Y=ho(N,1,M,b,R,1),x=ho(P,-1,-M,b,R,-1),T=1/0,L=1/0,v=-1/0,H=-1/0;R.forEach(B=>{T=Math.min(T,B.x),L=Math.min(L,B.y),v=Math.max(v,B.x+B.w),H=Math.max(H,B.y+B.h)});let D=(v-T)*y,O=(H-L)*y,k={out:R,u:y,x0:T,y0:L,bw:D,bh:O,ra:Y,la:x};if(O<=o&&D<=e){s=k;break}s=k}let{out:a,u:c,x0:i,y0:h,bw:u,bh:p,ra:g,la:d}=s,A=(e-u)/2-i*c,f=Math.min(o,Math.max(p+2*c,3*c)),E=(f-p)/2-h*c,m=a.map(y=>({...y,px:A+y.x*c,py:E+y.y*c,pw:y.w*c,ph:y.h*c})),w=y=>({x:A+y.x*c+(y.d>0?c*.9:-c*.9),y:E+(y.y+.5)*c});return{tiles:m,u:c,w:e,h:f,ends:{r:w(g),l:w(d)}}}function mn(t,n,e,o,r,l){let s=uo(o,r,n,e),a=J(t,n,s.h);a.clearRect(0,0,n,s.h);let c=l||{};if(s.tiles.forEach(i=>{let{near:h}=i,u=i.a,p=i.b;if(i.dbl&&(u=i.a,p=i.a),h==="right"||h==="bottom"){let g=u;u=p,p=g}Te(a,i.px,i.py,i.pw,i.ph,u,p,{lit:c.lastV===i.v&&c.lastHot})}),c.drop&&!s.tiles.length){let i=s.u*1.2;a.save(),a.strokeStyle=c.dropHot?c.dark?"#FACC15":"#7C5CFC":c.dark?"rgba(255,255,255,0.8)":"rgba(90,60,30,0.5)",a.fillStyle=c.dropHot?c.dark?"rgba(250,204,21,0.16)":"rgba(124,92,252,0.12)":c.dark?"rgba(255,255,255,0.08)":"rgba(90,60,30,0.06)",a.lineWidth=2.5,a.setLineDash([5,5]),a.beginPath(),a.roundRect?a.roundRect(n/2-i/2,s.h/2-i,i,i*2,i*.18):a.rect(n/2-i/2,s.h/2-i,i,i*2),a.fill(),a.stroke(),a.restore()}return c.targets&&s.ends&&["l","r"].forEach(i=>{if(!c.targets[i])return;let h=s.ends[i];a.save(),a.strokeStyle=c.hot===i?c.dark?"#FACC15":"#7C5CFC":c.dark?"rgba(255,255,255,0.75)":"rgba(90,60,30,0.5)",a.lineWidth=2.5,a.setLineDash([4,4]),a.beginPath(),a.arc(h.x,h.y,s.u*.9,0,Math.PI*2),a.stroke(),a.restore()}),s}function En(t,n,e,o,r){let l=J(t,n,e);l.clearRect(0,0,n,e);let[s,a]=be(o);Te(l,2,2,n-4,e-6,s,a,r)}var At="M10.5 34.2C10.5 33.1 11.4 32.2 12.5 32.2H32.5C33.6 32.2 34.5 33.1 34.5 34.2V37.4C34.5 38.5 33.6 39.4 32.5 39.4H12.5C11.4 39.4 10.5 38.5 10.5 37.4Z",Ao={p:{body:`${At}M22.5 7.6A5.1 5.1 0 0 1 25.9 16.5C27.3 17.2 28 18.2 28 19.4C28 20.4 27.4 21.2 26.5 21.7C27.1 25.3 28.9 29 30.4 32.2H14.6C16.1 29 17.9 25.3 18.5 21.7C17.6 21.2 17 20.4 17 19.4C17 18.2 17.7 17.2 19.1 16.5A5.1 5.1 0 0 1 22.5 7.6Z`,lines:"M18.6 21.6H26.4"},r:{body:`${At}M12.3 9.2H16.6V12.4H20.4V9.2H24.6V12.4H28.4V9.2H32.7V16.3L29.8 19H15.2L12.3 16.3ZM15.6 19H29.4L30.3 32.2H14.7Z`,lines:"M12.6 16.3H32.4M15.4 22.3H29.6"},n:{body:`${At}M14.4 32.2C14 27.6 16.6 24.8 19.6 22.6C17 23.4 14.6 23.5 12.5 22.6C10.7 21.8 10.4 19.9 11.6 18.3L16.8 11.7L16 7.2L19.7 9.6C21.1 8.6 22.8 8 24.6 8C30.6 8.3 34.3 13.6 34.1 20.8C34 25.4 32.5 29 31.7 32.2Z`,lines:"M24.6 8.2C27.5 9.2 29.9 12.2 30.8 16.3M19.6 22.6C21.9 21.1 23.4 19 23.8 16.6",eye:[19.4,13.6,1.3]},b:{body:`${At}M22.5 4.4A2.4 2.4 0 1 1 22.49 4.4ZM22.5 8.4C27.2 11.6 28.8 16 27.5 20.2C27.1 21.4 25.9 22.2 24.6 22.4C25.4 25.6 27.8 29.1 30 32.2H15C17.2 29.1 19.6 25.6 20.4 22.4C19.1 22.2 17.9 21.4 17.5 20.2C16.2 16 17.8 11.6 22.5 8.4Z`,lines:"M24.4 12.2L21 17.2M19.2 22.4H25.8"},q:{body:`${At}M11.9 10.3A2 2 0 1 1 11.89 10.3ZM17.6 7.3A2 2 0 1 1 17.59 7.3ZM22.5 5.4A2 2 0 1 1 22.49 5.4ZM27.4 7.3A2 2 0 1 1 27.39 7.3ZM33.1 10.3A2 2 0 1 1 33.09 10.3ZM12.6 13.4L16.6 19.3L17.7 10.2L21.1 17.8L22.5 8.4L23.9 17.8L27.3 10.2L28.4 19.3L32.4 13.4L30 22.4H15ZM15.6 22.4H29.4C28.9 25.7 29.8 29.1 31 32.2H14C15.2 29.1 16.1 25.7 15.6 22.4Z`,lines:"M15.4 22.4H29.6M16.4 26.4H28.6"},k:{body:`${At}M21.2 3.6H23.8V6.4H26.6V9H23.8V12.2H21.2V9H18.4V6.4H21.2ZM22.5 15.4C23.6 13.6 25.4 12.4 27.6 12.4C31.4 12.4 33.4 16.6 31.1 20.6L29.8 22.6H15.2L13.9 20.6C11.6 16.6 13.6 12.4 17.4 12.4C19.6 12.4 21.4 13.6 22.5 15.4ZM15.6 22.6H29.4C28.9 25.8 29.8 29.1 31 32.2H14C15.2 29.1 16.1 25.8 15.6 22.6Z`,lines:"M15.2 22.6H29.8M22.5 15.4V22.4M16.4 26.6H28.6"}},po={p:"pawn",r:"rook",n:"knight",b:"bishop",q:"queen",k:"king"};typeof window!="undefined"&&!window.ZG1&&(window.ZG1={v:1,chess:{..._t,PIECES:Ao,PIECE_NAMES:po},ckr:oe,sudoku:ne,xword:re,pool:ue,golf:ge,jig:we,dom:Re});})();
