/*════════════════════════════════════════
 *  Utility commands (calc, time, info, qr)
 *══════════════════════════════════════*/
import { dlBuffer, RNG, PICK, sha256, uuidV4, genPassword } from '../_helpers.js';
import QRCode from 'qrcode';
import os from 'os';

const need = (ctx, msg) => { if (!ctx.text) { ctx.reply(msg); return false; } return true; };
const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'util', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

export default [
    ok('calc',['calculator','math-eval'], (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}calc 12*7+sqrt(81)`);
        const expr = ctx.text.replace(/[^0-9.+\-*/(),\s%a-zA-Z]/g, '');
        const allow = { Math, sqrt: Math.sqrt, pow: Math.pow, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log, log10: Math.log10, PI: Math.PI, E: Math.E, floor: Math.floor, ceil: Math.ceil, round: Math.round };
        const fn = new Function(...Object.keys(allow), `return (${expr})`);
        const r = fn(...Object.values(allow));
        return `🧮 ${ctx.text} = *${r}*`;
    }, 'Math calculator'),

    ok('ping',['p','pingbot','latency'], async (ctx) => {
        const t0 = Date.now();
        await ctx.reply('🏓 Pong!');
        return null;
    }, 'Bot ping'),
    ok('alive',['imalive','isalive'], () => `✅ ${global.botname} alive — uptime ${Math.floor(process.uptime())}s`, 'Health check'),
    ok('uptime',['runtime','botuptime'], () => {
        const s = Math.floor(process.uptime());
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return `⏱ Uptime: ${h}h ${m}m ${sec}s`;
    }, 'Bot uptime'),
    ok('botinfo',['info','about','botabout'], () => {
        const mu = process.memoryUsage();
        return `╭─[ 🤖 *${global.botname}* ]─\n` +
               `┃ 🛠 Version: ${global.versi}\n` +
               `┃ 👑 Owner  : ${global.ownername}\n` +
               `┃ 📞 Number : ${global.ownernumber}\n` +
               `┃ 🧠 Node   : ${process.version}\n` +
               `┃ 🖥 Host   : ${os.hostname()}\n` +
               `┃ 🟦 Heap   : ${(mu.heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
               `┃ ⏱ Up     : ${Math.floor(process.uptime())}s\n` +
               `╰────────────────`;
    }, 'About this bot'),
    ok('myid',['userid','myinfo','sender-id'], (ctx) => `🪪 *Your JID:* ${ctx.sender}\n👤 *Pushname:* ${ctx.pushname || '(none)'}`, 'Show your JID'),
    ok('groupid',['gcid','chatid'], (ctx) => `🆔 *Chat JID:* ${ctx.from}`, 'Show chat JID'),

    ok('time',['now','clock'], () => '⏰ ' + new Date().toLocaleString(), 'Current time'),
    ok('date',['today'], () => '📅 ' + new Date().toDateString(), 'Today\'s date'),
    ok('utc',['utcnow'], () => '🌐 ' + new Date().toUTCString(), 'UTC time'),
    ok('iso',['isonow','iso-time'], () => '📐 ' + new Date().toISOString(), 'ISO timestamp'),
    ok('epoch',['unix','timestamp'], () => `🕒 ${Math.floor(Date.now() / 1000)}`, 'Unix epoch seconds'),
    ok('moonphase',['moon','moon-now'], () => {
        const date = new Date();
        const lp = 2551443; // synodic month seconds
        const refNew = new Date(Date.UTC(1970, 0, 7, 20, 35, 0)).getTime() / 1000;
        const phase = ((Math.floor(date.getTime() / 1000) - refNew) % lp) / lp;
        const names = ['🌑 New','🌒 Waxing Crescent','🌓 First Quarter','🌔 Waxing Gibbous','🌕 Full','🌖 Waning Gibbous','🌗 Last Quarter','🌘 Waning Crescent'];
        return names[Math.floor(phase * 8)] + ` (phase ${(phase * 100).toFixed(0)}%)`;
    }, 'Moon phase'),

    ok('countdown',['cd','cdto'], (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}countdown 2026-12-31`);
        const target = new Date(ctx.text);
        if (isNaN(target)) throw new Error('Invalid date');
        const diff = target - Date.now();
        if (diff < 0) return '⏳ That date is in the past.';
        const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000);
        return `⏳ ${d} days, ${h} hours until ${target.toDateString()}`;
    }, 'Countdown to a date'),
    ok('age',['agecalc'], (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}age YYYY-MM-DD`);
        const d = new Date(ctx.text);
        if (isNaN(d)) throw new Error('Invalid date');
        const ms = Date.now() - d.getTime();
        const years = ms / (365.25 * 86400000);
        return `🎂 Age: ${years.toFixed(2)} years (${Math.floor(years * 365.25)} days)`;
    }, 'Age calculator'),

    ok('qr',['qrcode','toqr','qrgen'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}qr <text or url>`);
        const buf = await QRCode.toBuffer(ctx.text, { errorCorrectionLevel: 'H', width: 600, margin: 2 });
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `📱 QR for: ${ctx.text}` }, { quoted: ctx.m });
        return null;
    }, 'Generate QR code'),

    ok('shorturl',['short','tinyurl','urlshort'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}shorturl <url>`);
        const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(ctx.text)}`).then(r => r.text());
        return `🔗 ${r}`;
    }, 'TinyURL shortener'),

    ok('weather',['wt','wttr'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}weather <city>`);
        const r = await fetch(`https://wttr.in/${encodeURIComponent(ctx.text)}?format=4`).then(r => r.text());
        return `🌤 ${r}`;
    }, 'Weather report'),

    ok('translate',['tr','tl'], async (ctx) => {
        const tag = ctx.args[0];
        const text = ctx.args.slice(1).join(' ');
        if (!tag || !text) throw new Error(`Usage: ${ctx.prefix}tr en hello world`);
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tag}&dt=t&q=${encodeURIComponent(text)}`;
        const j = await fetch(url).then(r => r.json());
        const out = j[0].map(x => x[0]).join('');
        return `🌐 ${out}`;
    }, 'Translate text'),

    ok('ipinfo',['ip','iplookup','iptrace'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}ipinfo 8.8.8.8`);
        const j = await fetch(`https://ipinfo.io/${ctx.text}/json`).then(r => r.json());
        return `🌐 *IP Info*\n${Object.entries(j).slice(0, 12).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`;
    }, 'IP lookup'),

    ok('whois',['domain-info'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}whois example.com`);
        const j = await fetch(`https://api.popcat.xyz/whois?url=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        if (!j) return '❌ failed';
        return `🌐 *${j.domain}*\n• Registrar: ${j.registrar || '?'}\n• Created: ${j.creation_date || '?'}\n• Expires: ${j.expiration_date || '?'}\n• Updated: ${j.updated_date || '?'}`;
    }, 'WHOIS lookup'),

    ok('color-info',['color','clr-info'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}color <#rrggbb or name>`);
        const j = await fetch(`https://api.popcat.xyz/color/${encodeURIComponent(ctx.text.replace('#',''))}`).then(r => r.json());
        if (j?.image) {
            const buf = await dlBuffer(j.image);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🎨 *${j.name || ctx.text}* — HEX ${j.hex} · RGB ${j.rgb} · brightness ${j.brightness}` }, { quoted: ctx.m });
            return null;
        }
        return JSON.stringify(j);
    }, 'Color info + swatch'),

    ok('barcode',['bcode','tobarcode'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}barcode <text>`);
        const url = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(ctx.text)}&code=Code128&dpi=96`;
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `📊 Barcode: ${ctx.text}` }, { quoted: ctx.m });
        return null;
    }, 'Barcode'),

    ok('strength',['pwd-strength','password-strength'], (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}strength <password>`);
        const t = ctx.text;
        let s = 0;
        if (t.length >= 8) s++;
        if (t.length >= 12) s++;
        if (/[A-Z]/.test(t)) s++;
        if (/[a-z]/.test(t)) s++;
        if (/[0-9]/.test(t)) s++;
        if (/[^A-Za-z0-9]/.test(t)) s++;
        const labels = ['🟥 very weak','🟧 weak','🟨 fair','🟩 good','🟦 strong','💪 very strong','🔥 excellent'];
        return `🔐 Password strength: *${labels[s]}* (${s}/6)`;
    }, 'Password strength meter'),

    ok('genpass',['password-gen','newpass'], (ctx) => `🔑 ${genPassword(parseInt(ctx.args[0]) || 16)}`, 'Generate password'),
    ok('uuid-gen',['gen-uuid'], () => uuidV4(), 'Generate UUID v4'),
    ok('genhash',['hashgen'], (ctx) => sha256(ctx.text || String(Date.now())), 'Generate SHA-256 hash'),

    ok('userpic',['pp','profilepic','getpp'], async (ctx) => {
        const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.m?.quoted?.sender || ctx.sender;
        try {
            const url = await ctx.neo.profilePictureUrl(target, 'image');
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `👤 ${target}` }, { quoted: ctx.m });
        } catch (e) { return `❌ no profile pic`; }
        return null;
    }, 'Get a user profile picture'),

    ok('jid',['whoami','jidinfo'], (ctx) => {
        const lines = [
            `👤 you  : ${ctx.sender}`,
            `💬 chat : ${ctx.from}`,
        ];
        if (ctx.m.quoted) lines.push(`📌 quote: ${ctx.m.quoted.sender}`);
        return lines.join('\n');
    }, 'Show JIDs'),

    ok('echo',['say','repeat-msg'], (ctx) => ctx.text || '(empty)', 'Echo text'),

    ok('rand-recipe',['fetch-recipe'], async (ctx) => {
        const j = await fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json()).catch(() => null);
        const meal = j?.meals?.[0];
        if (!meal) return '🍽 fetch failed';
        const ing = [];
        for (let i = 1; i <= 10; i++) {
            const n = meal[`strIngredient${i}`], m = meal[`strMeasure${i}`];
            if (n) ing.push(`• ${m?.trim()} ${n}`);
        }
        const text = `🍽 *${meal.strMeal}* — ${meal.strArea}\n\n*Ingredients:*\n${ing.join('\n')}\n\n*Instructions:*\n${meal.strInstructions?.slice(0, 800)}…`;
        if (meal.strMealThumb) {
            const buf = await dlBuffer(meal.strMealThumb);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: text }, { quoted: ctx.m });
            return null;
        }
        return text;
    }, 'Random recipe'),

    ok('rand-cocktail',['fetch-cocktail'], async (ctx) => {
        const j = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php').then(r => r.json()).catch(() => null);
        const d = j?.drinks?.[0];
        if (!d) return '🍹 fetch failed';
        const ing = [];
        for (let i = 1; i <= 10; i++) {
            const n = d[`strIngredient${i}`], m = d[`strMeasure${i}`];
            if (n) ing.push(`• ${m?.trim() || ''} ${n}`);
        }
        const text = `🍹 *${d.strDrink}*\n\n*Ingredients:*\n${ing.join('\n')}\n\n*Instructions:*\n${d.strInstructions || ''}`;
        if (d.strDrinkThumb) {
            const buf = await dlBuffer(d.strDrinkThumb);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: text }, { quoted: ctx.m });
            return null;
        }
        return text;
    }, 'Random cocktail'),

    ok('chuck-norris',['chuck','norris'], async () => {
        const j = await fetch('https://api.chucknorris.io/jokes/random').then(r => r.json()).catch(() => null);
        return j?.value ? `🥋 ${j.value}` : '😅 Chuck escaped.';
    }, 'Random Chuck Norris fact'),

    ok('yo-mama',['yomama','momjoke'], async () => {
        const j = await fetch('https://www.yomama-jokes.com/api/v1/jokes/random/').then(r => r.json()).catch(() => null);
        return j?.joke ? `😂 ${j.joke}` : '😅 Mom joke offline.';
    }, 'Yo-mama joke'),

    ok('dad-joke',['dadjoke','realdadjoke'], async () => {
        const j = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } }).then(r => r.json()).catch(() => null);
        return j?.joke ? `😆 ${j.joke}` : '🥁 ba-dum-tss.';
    }, 'Dad joke'),

    ok('crypto',['cryptoprice','coin-price'], async (ctx) => {
        const c = (ctx.args[0] || 'bitcoin').toLowerCase();
        const j = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${c}&vs_currencies=usd,eur,kes`).then(r => r.json()).catch(() => null);
        if (!j?.[c]) return `❌ unknown coin "${c}"`;
        return `💰 *${c.toUpperCase()}*\n• USD: $${j[c].usd}\n• EUR: €${j[c].eur}\n• KES: KSh${j[c].kes}`;
    }, 'Crypto price'),

    ok('exchange',['xrate','currency-x'], async (ctx) => {
        const [amt, from, to] = ctx.text.split(/\s+/);
        if (!amt || !from || !to) throw new Error(`Usage: ${ctx.prefix}exchange 100 USD KES`);
        const j = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`).then(r => r.json());
        const rate = j?.rates?.[to.toUpperCase()];
        if (!rate) return '❌ unknown currency code';
        return `💱 ${amt} ${from.toUpperCase()} = *${(parseFloat(amt) * rate).toFixed(2)} ${to.toUpperCase()}*`;
    }, 'Currency exchange'),

    ok('news',['topnews','headlines'], async () => {
        const j = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=5').then(r => r.json()).catch(() => null);
        if (!j?.results) return '❌ news offline';
        return '📰 *Top space-flight news*\n\n' + j.results.map((a, i) => `${i + 1}. ${a.title}\n   ${a.url}`).join('\n\n');
    }, 'Space news headlines'),

    ok('whois-num',['num-info','phone-info'], async (ctx) => {
        const num = (ctx.args[0] || '').replace(/[^0-9]/g, '');
        if (!num) throw new Error(`Usage: ${ctx.prefix}whois-num 254712345678`);
        const lib = await import('libphonenumber-js').catch(() => null);
        if (!lib) return '❌ lib missing';
        const pn = lib.parsePhoneNumberFromString('+' + num);
        if (!pn) return '❌ invalid number';
        return `📱 *Phone info*\n• Country: ${pn.country}\n• Type: ${pn.getType?.() || '?'}\n• National: ${pn.formatNational()}\n• International: ${pn.formatInternational()}`;
    }, 'Phone number info'),

    ok('imdb',['movie-info','findmovie'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}imdb <movie title>`);
        const j = await fetch(`https://api.popcat.xyz/imdb?q=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        if (!j?.title) return '❌ not found';
        const text = `🎬 *${j.title}* (${j.year})\n• Rating: ${j.imdbrating} ⭐\n• Genres: ${j.genres}\n• Director: ${j.director}\n• Plot: ${j.plot}`;
        if (j.poster) {
            const buf = await dlBuffer(j.poster);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: text }, { quoted: ctx.m });
            return null;
        }
        return text;
    }, 'IMDb info'),

    ok('lyrics',['song-lyrics','find-lyrics'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}lyrics <artist - song>`);
        const j = await fetch(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        if (!j?.lyrics) return '❌ no lyrics';
        return `🎤 *${j.title}* — ${j.artist}\n\n${String(j.lyrics).slice(0, 3500)}`;
    }, 'Song lyrics'),

    ok('urban',['urbandict','ud'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}urban <word>`);
        const j = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const d = j?.list?.[0];
        if (!d) return '❌ no definition';
        return `📖 *${d.word}*\n\n${d.definition}\n\n*Example:* ${d.example}`;
    }, 'Urban dictionary'),

    ok('countryinfo',['country-x','geo-country'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}countryinfo Kenya`);
        const j = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const c = j?.[0];
        if (!c) return '❌ not found';
        return `🌍 *${c.name?.common}* (${c.cca2})\n• Capital: ${c.capital?.[0]}\n• Region: ${c.region}\n• Population: ${c.population?.toLocaleString()}\n• Area: ${c.area?.toLocaleString()} km²\n• Currencies: ${Object.keys(c.currencies || {}).join(', ')}\n• Languages: ${Object.values(c.languages || {}).join(', ')}\n• TLD: ${c.tld?.join(', ')}`;
    }, 'Country info'),

    ok('countryflag',['flag','flag-of'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}flag Kenya`);
        const j = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const c = j?.[0];
        if (!c?.flags?.png) return '❌ not found';
        const buf = await dlBuffer(c.flags.png);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🏁 ${c.name?.common}` }, { quoted: ctx.m });
        return null;
    }, 'Country flag'),

    ok('github-user',['ghuser','gh-user'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}ghuser <login>`);
        const j = await fetch(`https://api.github.com/users/${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        if (!j?.login) return '❌ not found';
        const text = `🐙 *${j.name || j.login}*\n• Bio: ${j.bio || '—'}\n• Repos: ${j.public_repos}\n• Followers: ${j.followers}\n• Following: ${j.following}\n• Location: ${j.location || '—'}\n• URL: ${j.html_url}`;
        if (j.avatar_url) {
            const buf = await dlBuffer(j.avatar_url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: text }, { quoted: ctx.m });
            return null;
        }
        return text;
    }, 'GitHub user info'),

    ok('npm-info',['npmpkg','npm'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}npm <package>`);
        const j = await fetch(`https://registry.npmjs.org/${encodeURIComponent(ctx.text)}/latest`).then(r => r.json()).catch(() => null);
        if (!j?.name) return '❌ not found';
        return `📦 *${j.name}* v${j.version}\n• ${j.description || ''}\n• Author: ${j.author?.name || '—'}\n• License: ${j.license || '—'}\n• Repo: ${j.repository?.url || '—'}`;
    }, 'NPM package info'),

    ok('dictionary',['define-word','dict','dict-word'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}dictionary <word>`);
        const j = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const d = Array.isArray(j) ? j[0] : null;
        if (!d?.word) return '❌ not found';
        const def = d.meanings?.[0]?.definitions?.[0]?.definition || '';
        const ex = d.meanings?.[0]?.definitions?.[0]?.example || '';
        return `📖 *${d.word}*\n\n${def}${ex ? `\n\n_Example:_ ${ex}` : ''}`;
    }, 'Dictionary lookup'),
];
