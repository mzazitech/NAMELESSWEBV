/*════════════════════════════════════════
 *  Shared helpers for every command file
 *══════════════════════════════════════*/
import axios from 'axios';
import fetch from 'node-fetch';
import crypto from 'crypto';

export const RNG = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const PICK = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const SHUFFLE = (arr) => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

export async function tryFetch(url, opts = {}, asJson = true) {
    const res = await fetch(url, { timeout: 25000, ...opts });
    if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
    return asJson ? res.json() : res.buffer();
}

export async function tryAxios(url, opts = {}) {
    const res = await axios.get(url, { timeout: 25000, ...opts });
    return res.data;
}

export async function dlBuffer(url) {
    const res = await fetch(url, { timeout: 30000 });
    if (!res.ok) throw new Error(`Download failed ${res.status}`);
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
}

export function md5(s)   { return crypto.createHash('md5').update(s).digest('hex'); }
export function sha1(s)  { return crypto.createHash('sha1').update(s).digest('hex'); }
export function sha256(s){ return crypto.createHash('sha256').update(s).digest('hex'); }
export function sha512(s){ return crypto.createHash('sha512').update(s).digest('hex'); }

export function rngHash(input, max = 100) {
    const h = parseInt(md5(String(input || Math.random())).slice(0, 8), 16);
    return h % (max + 1);
}

export const FANCY_FONTS = {
    bold:        s => mapChar(s, 0x1D400, 0x1D41A),
    italic:      s => mapChar(s, 0x1D434, 0x1D44E),
    bolditalic:  s => mapChar(s, 0x1D468, 0x1D482),
    script:      s => mapChar(s, 0x1D49C, 0x1D4B6),
    boldscript:  s => mapChar(s, 0x1D4D0, 0x1D4EA),
    fraktur:     s => mapChar(s, 0x1D504, 0x1D51E),
    doublestruck:s => mapChar(s, 0x1D538, 0x1D552),
    sans:        s => mapChar(s, 0x1D5A0, 0x1D5BA),
    sansbold:    s => mapChar(s, 0x1D5D4, 0x1D5EE),
    sansitalic:  s => mapChar(s, 0x1D608, 0x1D622),
    sansbolditalic:s => mapChar(s, 0x1D63C, 0x1D656),
    monospace:   s => mapChar(s, 0x1D670, 0x1D68A),
};

function mapChar(s, upperBase, lowerBase) {
    return [...String(s)].map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90)  return String.fromCodePoint(upperBase + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(lowerBase + (code - 97));
        return c;
    }).join('');
}

export const VAPORWAVE = (s) => [...String(s)].map(c => {
    const code = c.charCodeAt(0);
    if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xFEE0);
    if (c === ' ') return '　';
    return c;
}).join('');

export const SARCASM = (s) => [...String(s)].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('');

const upsideMap = {
    a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',
    o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
    '?':'¿','!':'¡','.':'˙',',':'\'','(':')',')':'(','[':']',']':'[','{':'}','}':'{','<':'>','>':'<'
};
export const UPSIDE = (s) => [...String(s).toLowerCase()].reverse().map(c => upsideMap[c] || c).join('');

export const MORSE = {
    A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',
    L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',
    W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--',
    '4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',' ':'/'
};
export function toMorse(s) { return String(s).toUpperCase().split('').map(c => MORSE[c] || c).join(' '); }
export function fromMorse(s) {
    const inv = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
    return s.trim().split(' ').map(c => inv[c] || c).join('').replace(/\//g, ' ');
}

export function caesar(s, shift = 3) {
    return [...String(s)].map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90)  return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
        if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift + 26) % 26) + 97);
        return c;
    }).join('');
}

export const ROT13 = (s) => caesar(s, 13);

export function atbash(s) {
    return [...String(s)].map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90)  return String.fromCharCode(90 - (code - 65));
        if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
        return c;
    }).join('');
}

const leetMap = { a:'4', e:'3', i:'1', o:'0', s:'5', t:'7', l:'1', g:'9', b:'8', z:'2' };
export const LEET = (s) => [...String(s).toLowerCase()].map(c => leetMap[c] || c).join('');

export function toRoman(num) {
    if (!num || num < 1 || num > 3999) return '?';
    const lookup = [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];
    let out = ''; for (const [r, v] of lookup) { while (num >= v) { out += r; num -= v; } } return out;
}
export function fromRoman(str) {
    const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
    let num = 0;
    for (let i = 0; i < str.length; i++) {
        const cur = map[str[i].toUpperCase()] || 0;
        const nxt = map[(str[i + 1] || '').toUpperCase()] || 0;
        num += cur < nxt ? -cur : cur;
    }
    return num;
}

export function pad(n, len = 2) { return String(n).padStart(len, '0'); }

export function genPassword(len = 16, opts = { upper: true, lower: true, digit: true, symbol: true }) {
    let pool = '';
    if (opts.lower)  pool += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.upper)  pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.digit)  pool += '0123456789';
    if (opts.symbol) pool += '!@#$%^&*()-_=+[]{}<>?';
    if (!pool) pool = 'abcdefghijklmnopqrstuvwxyz';
    let out = '';
    for (let i = 0; i < len; i++) out += pool[Math.floor(Math.random() * pool.length)];
    return out;
}

export function uuidV4() {
    return crypto.randomUUID();
}

export const COUNTRIES = [
    'Kenya','Tanzania','Uganda','Rwanda','South Africa','Nigeria','Ghana','Egypt','Morocco','Ethiopia',
    'USA','UK','Canada','Mexico','Brazil','Argentina','Chile','Peru','Colombia','Venezuela',
    'Germany','France','Spain','Italy','Portugal','Netherlands','Belgium','Sweden','Norway','Finland',
    'Russia','Ukraine','Poland','Greece','Turkey','Iran','Iraq','Saudi Arabia','UAE','Qatar',
    'India','Pakistan','Bangladesh','Sri Lanka','Nepal','Bhutan','China','Japan','Korea','Vietnam',
    'Thailand','Indonesia','Malaysia','Singapore','Philippines','Australia','New Zealand','Fiji'
];

export const ANIMALS = ['cat','dog','fox','panda','red panda','koala','kangaroo','lion','tiger','elephant','giraffe','zebra','rhino','hippo','penguin','dolphin','whale','shark','octopus','turtle','frog','rabbit','hamster','squirrel','owl','eagle','parrot','sparrow','wolf','bear','deer','horse','cow','sheep','goat','pig','chicken','duck','goose','swan'];

export const COLORS = ['red','orange','yellow','green','blue','indigo','violet','pink','black','white','gray','brown','cyan','magenta','lime','navy','olive','teal','maroon','aqua','silver','gold','crimson','salmon','coral','tomato','beige','khaki','lavender','plum'];

export function safeFnFetch(url) {
    return fetch(url, { timeout: 25000 })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);
}

export const NEKOS_BEST_ENDPOINTS = [
    'baka','bite','blush','bored','cry','cuddle','dance','facepalm','feed','handhold','happy',
    'highfive','hug','kick','kiss','laugh','nod','nom','nope','pat','peck','poke','pout','punch',
    'shoot','shrug','slap','sleep','smile','smug','stare','think','thumbsup','tickle','wave','wink','yawn','yeet'
];

export const WAIFU_PICS_SFW = [
    'waifu','neko','shinobu','megumin','bully','cuddle','cry','hug','awoo','kiss','lick','pat','smug','bonk','yeet','blush','smile','wave','highfive','handhold','nom','bite','glomp','slap','kill','kick','happy','wink','poke','dance','cringe'
];

export function tableLine(label, val) {
    return `┃ ${String(label).padEnd(14, ' ')} » ${val}`;
}
