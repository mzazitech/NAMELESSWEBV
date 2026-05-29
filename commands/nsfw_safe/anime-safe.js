/*════════════════════════════════════════
 *  Safe-for-work anime image commands
 *══════════════════════════════════════*/
import { dlBuffer, NEKOS_BEST_ENDPOINTS, WAIFU_PICS_SFW } from '../_helpers.js';

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'anime', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

async function nekosBest(endpoint) {
    const j = await fetch(`https://nekos.best/api/v2/${endpoint}`).then(r => r.json()).catch(() => null);
    return j?.results?.[0]?.url || null;
}
async function waifuPics(endpoint) {
    const j = await fetch(`https://api.waifu.pics/sfw/${endpoint}`).then(r => r.json()).catch(() => null);
    return j?.url || null;
}

const list = [];

for (const e of NEKOS_BEST_ENDPOINTS) {
    list.push(ok(`anime-${e}`, [`an-${e}`], async (ctx) => {
        const url = await nekosBest(e);
        if (!url) return '❌ offline';
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🌸 *${e}*` }, { quoted: ctx.m });
        return null;
    }, `Anime ${e} image`));
}

for (const e of WAIFU_PICS_SFW) {
    list.push(ok(`waifu-${e}`, [`w-${e}`], async (ctx) => {
        const url = await waifuPics(e);
        if (!url) return '❌ offline';
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🌸 *waifu ${e}*` }, { quoted: ctx.m });
        return null;
    }, `Waifu ${e} image`));
}

list.push(ok('waifu', ['waifupic','waifu-img'], async (ctx) => {
    const url = await waifuPics('waifu');
    if (!url) return '❌ offline';
    const buf = await dlBuffer(url);
    await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🌸 waifu' }, { quoted: ctx.m });
    return null;
}, 'Random waifu'));

list.push(ok('neko', ['nekopic','neko-img','catgirl'], async (ctx) => {
    const url = await waifuPics('neko');
    if (!url) return '❌ offline';
    const buf = await dlBuffer(url);
    await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🐾 neko' }, { quoted: ctx.m });
    return null;
}, 'Random neko'));

export default list;
