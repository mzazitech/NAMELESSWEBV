/*════════════════════════════════════════
 *  Sticker commands (creation + meta)
 *══════════════════════════════════════*/
import { writeFile, unlink } from 'fs/promises';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { dlBuffer } from '../_helpers.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import os from 'os';
import path from 'path';

const exec = promisify(execCb);

async function saveQuotedMedia(ctx) {
    const m = ctx.m;
    const q = m.quoted || m;
    const types = ['imageMessage', 'videoMessage', 'stickerMessage'];
    const msg = q.message || q;
    let mtype = null, raw = null;
    for (const t of types) { if (msg[t]) { mtype = t; raw = msg[t]; break; } }
    if (!raw) throw new Error('Reply to / send an image, video, or sticker');
    const stream = await downloadContentFromMessage(raw, mtype.replace('Message', ''));
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return { buf, mtype };
}

async function bufferToWebpSticker(inputBuf, isVideo, packname, author) {
    const tmpDir = os.tmpdir();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const inFile = path.join(tmpDir, `in_${id}.${isVideo ? 'mp4' : 'png'}`);
    const outFile = path.join(tmpDir, `out_${id}.webp`);
    await writeFile(inFile, inputBuf);
    const filterComplex = "[0:v]scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000";
    const cmd = isVideo
        ? `ffmpeg -y -i "${inFile}" -vcodec libwebp -filter_complex "${filterComplex}" -loop 0 -ss 0 -t 6 -preset default -an -vsync 0 -s 512:512 "${outFile}"`
        : `ffmpeg -y -i "${inFile}" -vcodec libwebp -filter_complex "${filterComplex}" -lossless 1 -preset default -an -vsync 0 "${outFile}"`;
    try {
        await exec(cmd, { timeout: 60000 });
        let { readFile } = await import('fs/promises');
        let webp = await readFile(outFile);
        // attach exif metadata if possible
        try {
            const wsf = await import('wa-sticker-formatter').catch(() => null);
            if (wsf?.Sticker) {
                const sticker = new wsf.Sticker(webp, { pack: packname, author, type: wsf.StickerTypes.FULL, quality: 70 });
                webp = await sticker.toBuffer();
            }
        } catch {}
        return webp;
    } finally {
        try { await unlink(inFile); } catch {}
        try { await unlink(outFile); } catch {}
    }
}

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'sticker', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

export default [
    ok('sticker',['s','stiker','make-sticker'], async (ctx) => {
        const { buf, mtype } = await saveQuotedMedia(ctx);
        await ctx.m.react?.('🎨').catch(() => {});
        const webp = await bufferToWebpSticker(buf, mtype === 'videoMessage', global.packname || global.botname, global.author || global.ownername);
        await ctx.neo.sendMessage(ctx.from, { sticker: webp }, { quoted: ctx.m });
        return null;
    }, 'Convert media to sticker'),

    ok('stickerwm',['swm','sticker-wm','sticker-author'], async (ctx) => {
        const { buf, mtype } = await saveQuotedMedia(ctx);
        const [pack, author] = (ctx.text || '|').split('|').map(s => s.trim());
        const webp = await bufferToWebpSticker(buf, mtype === 'videoMessage', pack || global.packname, author || global.author);
        await ctx.neo.sendMessage(ctx.from, { sticker: webp }, { quoted: ctx.m });
        return null;
    }, 'Sticker with custom watermark (pack | author)'),

    ok('toimg',['stoimg','sticker-to-img','toimage'], async (ctx) => {
        const { buf, mtype } = await saveQuotedMedia(ctx);
        if (mtype !== 'stickerMessage') throw new Error('Reply to a sticker');
        const tmpDir = os.tmpdir();
        const id = Date.now();
        const inFile = path.join(tmpDir, `s_${id}.webp`);
        const outFile = path.join(tmpDir, `s_${id}.png`);
        await writeFile(inFile, buf);
        try {
            await exec(`ffmpeg -y -i "${inFile}" "${outFile}"`, { timeout: 30000 });
            const { readFile } = await import('fs/promises');
            const png = await readFile(outFile);
            await ctx.neo.sendMessage(ctx.from, { image: png, caption: '🖼 Converted to image' }, { quoted: ctx.m });
        } finally {
            try { await unlink(inFile); } catch {}
            try { await unlink(outFile); } catch {}
        }
        return null;
    }, 'Sticker → image'),

    ok('stext',['ttp','text-sticker'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}stext <text>`);
        const url = `https://api.popcat.xyz/welcomecard?background=https://i.imgur.com/Q9P7ZxC.png&text1=${encodeURIComponent(ctx.text)}&text2=${encodeURIComponent(global.botname)}&text3=darknode`;
        const buf = await dlBuffer(url);
        const webp = await bufferToWebpSticker(buf, false, global.packname, global.author);
        await ctx.neo.sendMessage(ctx.from, { sticker: webp }, { quoted: ctx.m });
        return null;
    }, 'Text → sticker'),

    ok('attp',['anim-text-sticker'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}attp <text>`);
        const url = `https://api.xteam.xyz/attp?file&text=${encodeURIComponent(ctx.text)}`;
        try {
            const buf = await dlBuffer(url);
            const webp = await bufferToWebpSticker(buf, true, global.packname, global.author);
            await ctx.neo.sendMessage(ctx.from, { sticker: webp }, { quoted: ctx.m });
        } catch {
            await ctx.reply('❌ attp endpoint offline; try .stext instead');
        }
        return null;
    }, 'Animated text sticker'),

    ok('emojimix',['emix','mix-emoji'], async (ctx) => {
        const [a, b] = (ctx.text || '').trim().split(/\s+/);
        if (!a || !b) throw new Error(`Usage: ${ctx.prefix}emojimix 😀 😎`);
        const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(a + '_' + b)}`;
        const j = await fetch(url).then(r => r.json()).catch(() => null);
        const img = j?.results?.[0]?.url;
        if (!img) return '❌ that emoji combo is not available';
        const buf = await dlBuffer(img);
        const webp = await bufferToWebpSticker(buf, false, global.packname, global.author);
        await ctx.neo.sendMessage(ctx.from, { sticker: webp }, { quoted: ctx.m });
        return null;
    }, 'Emoji mix sticker'),

    ok('takesticker',['takes','take-sticker'], async (ctx) => {
        const { buf, mtype } = await saveQuotedMedia(ctx);
        if (mtype !== 'stickerMessage') throw new Error('Reply to a sticker');
        const [pack, author] = (ctx.text || '|').split('|').map(s => s.trim());
        try {
            const wsf = await import('wa-sticker-formatter');
            const sticker = new wsf.Sticker(buf, { pack: pack || global.packname, author: author || global.author, type: wsf.StickerTypes.FULL });
            const out = await sticker.toBuffer();
            await ctx.neo.sendMessage(ctx.from, { sticker: out }, { quoted: ctx.m });
        } catch {
            await ctx.neo.sendMessage(ctx.from, { sticker: buf }, { quoted: ctx.m });
        }
        return null;
    }, 'Re-pack sticker with new metadata'),

    ok('stickerinfo',['sinfo'], async (ctx) => {
        const { buf, mtype } = await saveQuotedMedia(ctx);
        if (mtype !== 'stickerMessage') throw new Error('Reply to a sticker');
        return `🧷 Sticker bytes: ${buf.length}\nFormat: webp`;
    }, 'Sticker info'),
];
