/*════════════════════════════════════════
 *  Downloader / search commands
 *══════════════════════════════════════*/
import { dlBuffer } from '../_helpers.js';
import yts from 'yt-search';

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'downloader', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

async function ytApi(url, type = 'audio') {
    // Try a couple of public providers
    const providers = [
        `https://api.giftedtech.web.id/api/download/dlmp3?url=${encodeURIComponent(url)}&apikey=gifted`,
        `https://api.giftedtech.web.id/api/download/dlmp4?url=${encodeURIComponent(url)}&apikey=gifted`,
    ];
    const idx = type === 'audio' ? 0 : 1;
    const j = await fetch(providers[idx]).then(r => r.json()).catch(() => null);
    return j?.result?.download_url || j?.result?.url || j?.url;
}

export default [
    ok('ytsearch',['yts','yt-search','youtube-search'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}ytsearch <query>`);
        const r = await yts(ctx.text);
        const top = r.videos.slice(0, 5);
        if (!top.length) return '❌ no results';
        const text = top.map((v, i) => `${i + 1}. *${v.title}*\n   • ${v.author.name} · ${v.timestamp} · ${v.views.toLocaleString()} views\n   • ${v.url}`).join('\n\n');
        await ctx.reply(`🔎 *YouTube — top 5*\n\n${text}`);
        return null;
    }, 'Search YouTube'),

    ok('play',['ytmp3-find','playmusic'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}play <song name>`);
        const r = await yts(ctx.text);
        const v = r.videos[0];
        if (!v) return '❌ no results';
        await ctx.reply(`🎶 Found *${v.title}*\n${v.url}\n_Use ${ctx.prefix}ytmp3 ${v.url} to download._`);
        try {
            if (v.thumbnail) {
                const buf = await dlBuffer(v.thumbnail);
                await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🎶 *${v.title}*\n• ${v.author.name}\n• ${v.timestamp}` }, { quoted: ctx.m });
            }
        } catch {}
        return null;
    }, 'Search & preview a song'),

    ok('ytmp3',['yta','yt-audio'], async (ctx) => {
        const url = ctx.text;
        if (!/^https?:\/\//.test(url)) throw new Error(`Usage: ${ctx.prefix}ytmp3 <youtube url>`);
        await ctx.m.react?.('⬇').catch(() => {});
        const dl = await ytApi(url, 'audio');
        if (!dl) return '❌ provider unavailable, try again later';
        const buf = await dlBuffer(dl);
        await ctx.neo.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: ctx.m });
        return null;
    }, 'YouTube → MP3'),

    ok('ytmp4',['ytv','yt-video'], async (ctx) => {
        const url = ctx.text;
        if (!/^https?:\/\//.test(url)) throw new Error(`Usage: ${ctx.prefix}ytmp4 <youtube url>`);
        await ctx.m.react?.('⬇').catch(() => {});
        const dl = await ytApi(url, 'video');
        if (!dl) return '❌ provider unavailable, try again later';
        const buf = await dlBuffer(dl);
        await ctx.neo.sendMessage(ctx.from, { video: buf, mimetype: 'video/mp4', caption: '⬇ downloaded' }, { quoted: ctx.m });
        return null;
    }, 'YouTube → MP4'),

    ok('tiktok',['tt','ttdl','tikdl'], async (ctx) => {
        const url = ctx.text;
        if (!/^https?:\/\//.test(url)) throw new Error(`Usage: ${ctx.prefix}tiktok <tiktok url>`);
        const j = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`).then(r => r.json()).catch(() => null);
        const video = j?.video?.noWatermark || j?.video?.watermark;
        if (!video) return '❌ tiktok provider unavailable';
        const buf = await dlBuffer(video);
        await ctx.neo.sendMessage(ctx.from, { video: buf, mimetype: 'video/mp4', caption: `🎵 ${j.author?.name || ''} — ${j.title || ''}` }, { quoted: ctx.m });
        return null;
    }, 'TikTok video downloader'),

    ok('fbdl',['fb','facebook-dl'], async (ctx) => {
        const url = ctx.text;
        if (!/^https?:\/\//.test(url)) throw new Error(`Usage: ${ctx.prefix}fbdl <facebook url>`);
        const j = await fetch(`https://api.giftedtech.web.id/api/download/facebook?url=${encodeURIComponent(url)}&apikey=gifted`).then(r => r.json()).catch(() => null);
        const video = j?.result?.video?.[0]?.url || j?.result?.url;
        if (!video) return '❌ fb provider unavailable';
        const buf = await dlBuffer(video);
        await ctx.neo.sendMessage(ctx.from, { video: buf, mimetype: 'video/mp4', caption: '⬇ Facebook video' }, { quoted: ctx.m });
        return null;
    }, 'Facebook downloader'),

    ok('twitter',['tw','twdl','x-dl'], async (ctx) => {
        const url = ctx.text;
        if (!/^https?:\/\//.test(url)) throw new Error(`Usage: ${ctx.prefix}twitter <url>`);
        const j = await fetch(`https://api.giftedtech.web.id/api/download/twitter?url=${encodeURIComponent(url)}&apikey=gifted`).then(r => r.json()).catch(() => null);
        const video = j?.result?.HD || j?.result?.SD || j?.result?.url;
        if (!video) return '❌ twitter provider unavailable';
        const buf = await dlBuffer(video);
        await ctx.neo.sendMessage(ctx.from, { video: buf, mimetype: 'video/mp4', caption: '⬇ X / Twitter' }, { quoted: ctx.m });
        return null;
    }, 'Twitter / X downloader'),

    ok('igdl',['instagram','insta-dl','ig'], async (ctx) => {
        const url = ctx.text;
        if (!/^https?:\/\//.test(url)) throw new Error(`Usage: ${ctx.prefix}igdl <instagram url>`);
        const j = await fetch(`https://api.giftedtech.web.id/api/download/instagram?url=${encodeURIComponent(url)}&apikey=gifted`).then(r => r.json()).catch(() => null);
        const items = j?.result || [];
        if (!items.length) return '❌ instagram provider unavailable';
        for (const it of items.slice(0, 4)) {
            try {
                const buf = await dlBuffer(it.url || it);
                if (/\.mp4/i.test(it.url || '')) {
                    await ctx.neo.sendMessage(ctx.from, { video: buf, mimetype: 'video/mp4', caption: '⬇ Instagram' }, { quoted: ctx.m });
                } else {
                    await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '⬇ Instagram' }, { quoted: ctx.m });
                }
            } catch {}
        }
        return null;
    }, 'Instagram downloader'),

    ok('imgsearch',['gimage','google-img','img-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}imgsearch <query>`);
        const j = await fetch(`https://api.popcat.xyz/imgur?q=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const url = j?.url || j?.image;
        if (!url) return '❌ search provider offline';
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🔎 ${ctx.text}` }, { quoted: ctx.m });
        return null;
    }, 'Image search'),

    ok('wallpaper',['wp-search','wallpaper-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}wallpaper <query>`);
        const j = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(ctx.text)}&client_id=demo`).then(r => r.json()).catch(() => null);
        const url = j?.urls?.regular;
        if (!url) return '❌ wallpaper provider offline (try .imagine for an AI wallpaper)';
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `🖼 ${ctx.text}` }, { quoted: ctx.m });
        return null;
    }, 'Wallpaper search'),

    ok('apk-search',['apk','playstore'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}apk <name>`);
        const j = await fetch(`https://api.popcat.xyz/playstore?q=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const a = j?.[0];
        if (!a) return '❌ no results';
        return `📲 *${a.name}* (${a.developer})\n• ⭐ ${a.rating}\n• Installs: ${a.minInstalls}\n• Price: ${a.priceText || 'free'}\n• Updated: ${a.updated}\n• ${a.url}`;
    }, 'PlayStore search'),

    ok('reddit',['rdt'], async (ctx) => {
        const sub = (ctx.args[0] || 'memes').replace(/^r\//, '');
        const j = await fetch(`https://www.reddit.com/r/${sub}/random.json`).then(r => r.json()).catch(() => null);
        const post = Array.isArray(j) ? j[0]?.data?.children?.[0]?.data : null;
        if (!post) return '❌ reddit fail';
        const url = post.url;
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);
        if (isImage) {
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `📥 r/${sub} — *${post.title}*\n${post.permalink ? 'https://reddit.com' + post.permalink : ''}` }, { quoted: ctx.m });
            return null;
        }
        return `📥 r/${sub} — *${post.title}*\n${url}`;
    }, 'Reddit random post'),
];
