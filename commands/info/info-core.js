/*════════════════════════════════════════
 *  Info / lookup commands
 *══════════════════════════════════════*/
import { dlBuffer, PICK } from '../_helpers.js';
import os from 'os';

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'info', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

export default [
    ok('serverinfo',['server-info','sysinfo'], () => {
        const mu = process.memoryUsage();
        const cpus = os.cpus();
        return `🖥 *Server*\n` +
               `• Hostname  : ${os.hostname()}\n` +
               `• Platform  : ${os.platform()} (${os.arch()})\n` +
               `• Release   : ${os.release()}\n` +
               `• Uptime    : ${Math.floor(os.uptime() / 3600)}h\n` +
               `• CPU       : ${cpus[0]?.model || '?'}\n` +
               `• Cores     : ${cpus.length}\n` +
               `• RAM total : ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB\n` +
               `• RAM free  : ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB\n` +
               `• Node      : ${process.version}\n` +
               `• Process RSS: ${(mu.rss / 1024 / 1024).toFixed(1)} MB\n` +
               `• Heap       : ${(mu.heapUsed / 1024 / 1024).toFixed(1)}/${(mu.heapTotal / 1024 / 1024).toFixed(1)} MB`;
    }, 'Server hardware info'),

    ok('processinfo',['proc-info','pinfo'], () => {
        const mu = process.memoryUsage();
        return `⚙ *Process*\n` +
               `• PID    : ${process.pid}\n` +
               `• Uptime : ${process.uptime().toFixed(0)}s\n` +
               `• Node   : ${process.version}\n` +
               `• Heap   : ${(mu.heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
               `• RSS    : ${(mu.rss / 1024 / 1024).toFixed(1)} MB\n` +
               `• Args   : ${process.argv.join(' ')}`;
    }, 'Node process info'),

    ok('owner',['owner-info','myowner','contactowner'], async (ctx) => {
        const numbers = (global.creator || []).map(c => c[0]).filter(Boolean);
        const mainOwner = numbers[0] || global.ownernumber;
        const text = `👑 *Bot Owner*\n• Name : ${global.ownername}\n• Number : ${mainOwner || '?'}\n\n_Use this contact for help._`;
        try {
            const vcard =
                'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${global.ownername}\n` +
                `TEL;type=CELL;type=VOICE;waid=${mainOwner}:+${mainOwner}\n` +
                'END:VCARD';
            await ctx.neo.sendMessage(ctx.from, { contacts: { displayName: global.ownername, contacts: [{ vcard }] } });
        } catch {}
        return text;
    }, 'Owner contact card'),

    ok('botstats',['stats','bot-stats'], (ctx) => {
        const total = new Set([...(global.commandRegistry || []).values?.() || []].map(c => c.name)).size || 0;
        const cats = global.commandCategories?.size || 0;
        return `📊 *${global.botname} Stats*\n` +
               `• Commands  : ${total}\n` +
               `• Categories: ${cats}\n` +
               `• Uptime    : ${Math.floor(process.uptime())}s\n` +
               `• Owner     : ${global.ownername}`;
    }, 'Bot statistics'),

    ok('runtime',['uptime-x'], () => {
        const s = Math.floor(process.uptime());
        const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
        return `⏱ Runtime: ${d}d ${h}h ${m}m ${s % 60}s`;
    }, 'Runtime since start'),

    ok('script',['repo','source'], () => `🔗 GitHub: https://github.com/Xnews\n📺 Channel: ${global.channelLink || '(not set)'}\n👤 Owner: ${global.ownername}`, 'Bot repo'),
    ok('credits',['author','credit'], () => `🛠 *${global.botname}*\n👑 Owner: ${global.ownername}\n💎 Powered by DARKNODE AI`, 'Show credits'),

    ok('rules',['gcrules','grouprules'], (ctx) => global.gcRules?.[ctx.from] || '📜 No rules set for this group. Use *.setrules <text>* to set them.', 'Show group rules'),
    ok('setrules',['set-rules'], (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}setrules <text>`);
        global.gcRules = global.gcRules || {};
        global.gcRules[ctx.from] = ctx.text;
        return '✅ Group rules saved.';
    }, 'Set group rules'),
    ok('delrules',['del-rules','clearrules'], (ctx) => {
        if (global.gcRules) delete global.gcRules[ctx.from];
        return '🧹 Rules cleared';
    }, 'Clear group rules'),

    ok('reminder',['remind','remindme','setremind'], (ctx) => {
        const mins = parseInt(ctx.args[0]);
        const msg = ctx.args.slice(1).join(' ');
        if (!mins || !msg) throw new Error(`Usage: ${ctx.prefix}remind <minutes> <message>`);
        setTimeout(() => {
            ctx.neo.sendMessage(ctx.from, { text: `⏰ *Reminder for @${ctx.sender.split('@')[0]}*\n\n${msg}`, mentions: [ctx.sender] });
        }, mins * 60 * 1000);
        return `✅ Will remind in ${mins} min`;
    }, 'Schedule a reminder'),

    ok('inspire-of-day',['todayquote'], async () => {
        const j = await fetch('https://zenquotes.io/api/today').then(r => r.json()).catch(() => null);
        return j?.[0] ? `🌅 "${j[0].q}" — ${j[0].a}` : 'no quote';
    }, 'Quote of the day'),

    ok('cat-fact',['catfact'], async () => {
        const j = await fetch('https://catfact.ninja/fact').then(r => r.json()).catch(() => null);
        return j?.fact ? `🐱 ${j.fact}` : 'fail';
    }, 'Random cat fact'),

    ok('dog-breed',['dogbreed','breeds'], async () => {
        const j = await fetch('https://dog.ceo/api/breeds/list/all').then(r => r.json()).catch(() => null);
        const breeds = Object.keys(j?.message || {});
        return `🐶 ${breeds.length} dog breeds available. Random: *${PICK(breeds)}*`;
    }, 'Random dog breed'),

    ok('pokemon-info',['pokeinfo','poke-info'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}pokeinfo pikachu`);
        const j = await fetch(`https://pokeapi.co/api/v2/pokemon/${ctx.text.toLowerCase()}`).then(r => r.json()).catch(() => null);
        if (!j?.name) return '❌ not found';
        const text = `🎮 *${j.name.toUpperCase()}* (#${j.id})\n• Types: ${j.types.map(t => t.type.name).join(', ')}\n• Height: ${j.height/10}m · Weight: ${j.weight/10}kg\n• Abilities: ${j.abilities.map(a => a.ability.name).join(', ')}`;
        const sprite = j.sprites?.other?.['official-artwork']?.front_default || j.sprites?.front_default;
        if (sprite) {
            const buf = await dlBuffer(sprite);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: text }, { quoted: ctx.m });
            return null;
        }
        return text;
    }, 'Pokémon info'),

    ok('iss-now',['iss','spacestation'], async () => {
        const j = await fetch('http://api.open-notify.org/iss-now.json').then(r => r.json()).catch(() => null);
        if (!j?.iss_position) return 'fail';
        return `🛰 *ISS now*\n• Lat: ${j.iss_position.latitude}\n• Lng: ${j.iss_position.longitude}`;
    }, 'ISS current position'),

    ok('astros',['inspace','people-in-space'], async () => {
        const j = await fetch('http://api.open-notify.org/astros.json').then(r => r.json()).catch(() => null);
        if (!j?.people) return 'fail';
        return `👨‍🚀 *${j.number} people in space*\n${j.people.map(p => `• ${p.name} — ${p.craft}`).join('\n')}`;
    }, 'People currently in space'),

    ok('joke-api',['jokeapi'], async () => {
        const j = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode').then(r => r.json()).catch(() => null);
        if (!j) return 'fail';
        return j.joke || `${j.setup}\n${j.delivery}`;
    }, 'Random joke from JokeAPI'),

    ok('numfact',['numberfact'], async (ctx) => {
        const n = ctx.args[0] || 'random';
        const t = await fetch(`http://numbersapi.com/${n}`).then(r => r.text()).catch(() => null);
        return `🔢 ${t}`;
    }, 'Number fact'),

    ok('mathfact',['mathfact-api'], async () => {
        const t = await fetch('http://numbersapi.com/random/math').then(r => r.text()).catch(() => null);
        return `🧮 ${t}`;
    }, 'Math fact'),

    ok('yearfact',['year-fact'], async (ctx) => {
        const y = ctx.args[0] || new Date().getFullYear();
        const t = await fetch(`http://numbersapi.com/${y}/year`).then(r => r.text()).catch(() => null);
        return `📅 ${t}`;
    }, 'Year fact'),

    ok('trivia-api',['trivia'], async () => {
        const j = await fetch('https://opentdb.com/api.php?amount=1&type=multiple').then(r => r.json()).catch(() => null);
        const q = j?.results?.[0];
        if (!q) return 'fail';
        const decode = s => s.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
        const all = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5).map(decode);
        return `❓ *${decode(q.question)}*\n\n${all.map((a, i) => `${'ABCD'[i]}) ${a}`).join('\n')}\n\n_(spoiler)_ Answer: ||${decode(q.correct_answer)}||`;
    }, 'Trivia question (OpenTDB)'),
];
