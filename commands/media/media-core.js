/*════════════════════════════════════════
 *  Media commands (TTS, image transforms via popcat)
 *══════════════════════════════════════*/
import { dlBuffer } from '../_helpers.js';

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'media', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

async function targetPp(ctx) {
    const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                 || ctx.m?.quoted?.sender
                 || ctx.sender;
    try { return await ctx.neo.profilePictureUrl(target, 'image'); }
    catch { return 'https://files.catbox.moe/bwgltx.png'; }
}
const popImg = (endpoint) => async (ctx) => {
    const pp = await targetPp(ctx);
    const url = `https://api.popcat.xyz/${endpoint}?image=${encodeURIComponent(pp)}`;
    const buf = await dlBuffer(url);
    await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `*${endpoint}*` }, { quoted: ctx.m });
    return null;
};

export default [
    ok('tts',['speak','voice','say'], async (ctx) => {
        const text = ctx.text;
        if (!text) throw new Error(`Usage: ${ctx.prefix}tts <text>`);
        const lang = ctx.args[0]?.length === 2 ? ctx.args[0] : 'en';
        const speech = lang === ctx.args[0] ? ctx.args.slice(1).join(' ') : text;
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(speech)}&tl=${lang}&client=tw-ob`;
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mpeg', ptt: true }, { quoted: ctx.m });
        return null;
    }, 'Text to speech'),

    ok('tts-en',['tts-english'], async (ctx) => {
        const t = ctx.text; if (!t) throw new Error('text?');
        const buf = await dlBuffer(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(t)}&tl=en&client=tw-ob`);
        await ctx.neo.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mpeg', ptt: true }, { quoted: ctx.m });
        return null;
    }, 'TTS in English'),

    ok('tts-sw',['tts-swahili','swahili-tts'], async (ctx) => {
        const t = ctx.text; if (!t) throw new Error('text?');
        const buf = await dlBuffer(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(t)}&tl=sw&client=tw-ob`);
        await ctx.neo.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mpeg', ptt: true }, { quoted: ctx.m });
        return null;
    }, 'TTS in Swahili'),

    // popcat image transforms
    ok('drip',['drippy'], popImg('drip'), 'Drip effect on PP'),
    ok('clown',['clownify'], popImg('clown'), 'Clown PP'),
    ok('greyscale',['gray-pp-x','gscale'], popImg('greyscale'), 'Grayscale PP'),
    ok('invert',['invertcolor'], popImg('invert'), 'Invert PP'),
    ok('mnm',['mm-pp-x'], popImg('mnm'), 'M&M PP'),
    ok('communism-pp',['communist'], popImg('communism'), 'Communist PP'),
    ok('uncover',['unblur'], popImg('uncover'), 'Uncover PP'),
    ok('pet-loop',['petpet','pet-pp-x'], popImg('pet'), 'Pet PP'),
    ok('blur',['blur-pp-x'], popImg('blur'), 'Blur PP'),

    ok('alphabet',['letter-img'], async (ctx) => {
        const ch = (ctx.args[0] || 'a')[0].toLowerCase();
        const buf = await dlBuffer(`https://api.popcat.xyz/alphabet?text=${ch}`);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🔤 ${ch}` }, { quoted: ctx.m });
        return null;
    }, 'Letter image'),

    ok('youtube-comment',['ytcomment','yt-comment'], async (ctx) => {
        const [name, ...rest] = ctx.text.split('|').map(s => s.trim());
        const text = rest.join(' | ');
        if (!name || !text) throw new Error(`Usage: ${ctx.prefix}ytcomment NAME | comment`);
        const pp = await targetPp(ctx);
        const url = `https://api.popcat.xyz/youtube-comment?image=${encodeURIComponent(pp)}&name=${encodeURIComponent(name)}&comment=${encodeURIComponent(text)}`;
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '📺' }, { quoted: ctx.m });
        return null;
    }, 'YouTube comment image'),

    ok('quote-img',['quoteimg','quotemaker'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}quote-img <text>`);
        const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.sender;
        const pp = await targetPp(ctx);
        const obj = {
            type: 'quote',
            format: 'png',
            backgroundColor: '#FFFFFF',
            messages: [{
                entities: [], avatar: true,
                from: { id: 1, name: ctx.pushname || target.split('@')[0], photo: { url: pp } },
                text: ctx.text, replyMessage: {}
            }]
        };
        const j = await fetch('https://bot.lyo.su/quote/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }).then(r => r.json()).catch(() => null);
        if (!j?.result?.image) return '❌ quote service offline';
        const buf = Buffer.from(j.result.image, 'base64');
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '💬' }, { quoted: ctx.m });
        return null;
    }, 'Telegram-style quote image'),
];
