/*════════════════════════════════════════
 *  Encoding / hashing / cryptography text utils
 *══════════════════════════════════════*/
import { md5, sha1, sha256, sha512 } from '../_helpers.js';

const need = (ctx) => {
    if (!ctx.text || !ctx.text.trim()) {
        ctx.reply(`*Usage:* ${ctx.prefix}${ctx.command} <text>`); return false;
    }
    return true;
};
const t = (name, aliases, transform, desc) => ({
    name, aliases, category: 'text', desc,
    run: async (ctx) => { if (!need(ctx)) return; try { await ctx.reply(transform(ctx.text)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } }
});

export default [
    t('base64',['b64','tob64','tobase64'], s => Buffer.from(s).toString('base64'), 'Encode base64'),
    t('base64decode',['b64dec','frombase64','fromb64'], s => Buffer.from(s, 'base64').toString('utf8'), 'Decode base64'),
    t('hex',['tohex','hexencode'], s => Buffer.from(s).toString('hex'), 'Encode hex'),
    t('hexdecode',['hexdec','fromhex'], s => Buffer.from(s, 'hex').toString('utf8'), 'Decode hex'),
    t('binary',['tobinary','tobin'], s => [...s].map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '), 'To binary'),
    t('bindecode',['bindec','frombin'], s => s.split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join(''), 'From binary'),
    t('octal',['tooctal'], s => [...s].map(c => c.charCodeAt(0).toString(8)).join(' '), 'To octal'),
    t('url-encode',['urlenc','encurl'], s => encodeURIComponent(s), 'URL encode'),
    t('url-decode',['urldec','decurl'], s => decodeURIComponent(s), 'URL decode'),
    t('html-encode',['htmlenc','escape-html'], s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])), 'HTML encode'),
    t('html-decode',['htmldec','unescape-html'], s => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[e])), 'HTML decode'),
    t('json-pretty',['pretty-json'], s => JSON.stringify(JSON.parse(s), null, 2), 'Pretty JSON'),
    t('json-min',['min-json','minify-json'], s => JSON.stringify(JSON.parse(s)), 'Minify JSON'),

    t('md5',['hash-md5','tomd5'], md5, 'MD5 hash'),
    t('sha1',['hash-sha1','tosha1'], sha1, 'SHA-1 hash'),
    t('sha256',['hash-sha256','tosha256'], sha256, 'SHA-256 hash'),
    t('sha512',['hash-sha512','tosha512'], sha512, 'SHA-512 hash'),

    t('to-charcodes',['ascii-codes','char-codes'], s => [...s].map(c => c.charCodeAt(0)).join(' '), 'Char codes'),
    t('from-charcodes',['from-codes'], s => s.split(/\s+/).map(c => String.fromCharCode(parseInt(c, 10))).join(''), 'Codes -> string'),
    t('to-unicode',['unicode-escape'], s => [...s].map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join(''), 'Unicode escape'),
    t('from-unicode',['unicode-unescape'], s => s.replace(/\\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))), 'Unicode unescape'),
    t('jwt-decode',['decode-jwt'], s => {
        const parts = s.trim().split('.');
        if (parts.length !== 3) throw new Error('Not a JWT');
        return [
            'HEADER:\n' + JSON.stringify(JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')), null, 2),
            'PAYLOAD:\n' + JSON.stringify(JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')), null, 2),
            'SIGNATURE:\n' + parts[2]
        ].join('\n\n');
    }, 'Decode a JWT (no verify)'),
];
