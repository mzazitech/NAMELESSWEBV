/*════════════════════════════════════════
 *  Text style / font transform commands
 *══════════════════════════════════════*/
import { FANCY_FONTS, VAPORWAVE, SARCASM, UPSIDE, MORSE, toMorse, fromMorse, ROT13, caesar, atbash, LEET } from '../_helpers.js';

const need = (ctx) => {
    if (!ctx.text || !ctx.text.trim()) {
        ctx.reply(`*Usage:* ${ctx.prefix}${ctx.command} <text>`);
        return false;
    }
    return true;
};

const t = (name, aliases, transform, desc) => ({
    name, aliases, category: 'text', desc,
    run: async (ctx) => { if (!need(ctx)) return; await ctx.reply(transform(ctx.text)); }
});

export default [
    t('bold',['fontbold','fbold'], FANCY_FONTS.bold, '𝗕𝗼𝗹𝗱 text'),
    t('italic',['fontitalic','fitalic'], FANCY_FONTS.italic, '𝐼𝑡𝑎𝑙𝑖𝑐 text'),
    t('bolditalic',['bi-text','boldital'], FANCY_FONTS.bolditalic, '𝑩𝒐𝒍𝒅 𝒊𝒕𝒂𝒍𝒊𝒄'),
    t('script',['cursive','fontscript'], FANCY_FONTS.script, '𝒮𝒸𝓇𝒾𝓅𝓉'),
    t('boldscript',['fancyscript','bscript'], FANCY_FONTS.boldscript, '𝓑𝓸𝓵𝓭 𝓼𝓬𝓻𝓲𝓹𝓽'),
    t('fraktur',['gothic','oldenglish'], FANCY_FONTS.fraktur, '𝔉𝔯𝔞𝔨𝔱𝔲𝔯'),
    t('doublestruck',['mathds','blackboard'], FANCY_FONTS.doublestruck, '𝔻𝕠𝕦𝕓𝕝𝕖 𝕊𝕥𝕣𝕦𝕔𝕜'),
    t('sans',['sansserif','fontsans'], FANCY_FONTS.sans, '𝖲𝖺𝗇𝗌'),
    t('sansbold',['sansb','sansbold'], FANCY_FONTS.sansbold, '𝗦𝗮𝗻𝘀 𝗯𝗼𝗹𝗱'),
    t('sansitalic',['sansi','sansital'], FANCY_FONTS.sansitalic, '𝘚𝘢𝘯𝘴 𝘪𝘵𝘢𝘭𝘪𝘤'),
    t('monospace',['mono','typewriter'], FANCY_FONTS.monospace, '𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎'),

    t('vaporwave',['fullwidth','wide','aesthetic'], VAPORWAVE, 'Ｆｕｌｌｗｉｄｔｈ ｔｅｘｔ'),
    t('sarcasm',['mocking','spongebob'], SARCASM, 'sArCaStIc TeXt'),
    t('upside',['upsidedown','flip-text'], UPSIDE, 'uʍop ǝpᴉsdn'),
    t('reverse-text',['reverse','rev-text','revtext'], s => [...String(s)].reverse().join(''), 'Reverse text'),
    t('reverse-words',['rev-words'], s => s.split(/\s+/).reverse().join(' '), 'Reverse words'),
    t('mirror',['mirrortext'], s => [...String(s)].reverse().join(''), 'Mirror text'),

    t('morse',['tomorse','enmorse'], toMorse, 'Encode text to morse'),
    t('demorse',['frommorse','demorse-decode'], fromMorse, 'Decode morse to text'),

    t('rot13',['rot-13'], ROT13, 'ROT13 cipher'),
    t('caesar',['caesar3'], s => caesar(s, 3), 'Caesar cipher (+3)'),
    t('caesar-encode',['caesar-en'], s => caesar(s, 5), 'Caesar cipher (+5)'),
    t('caesar-decode',['caesar-de'], s => caesar(s, -3), 'Caesar decipher (-3)'),
    t('atbash',['atbash-cipher'], atbash, 'Atbash cipher'),
    t('leet',['leetspeak','1337'], LEET, '1337 5p34k'),

    t('upper',['uppercase','toupper'], s => s.toUpperCase(), 'UPPERCASE'),
    t('lower',['lowercase','tolower'], s => s.toLowerCase(), 'lowercase'),
    t('title',['titlecase','tc'], s => s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()), 'Title Case'),
    t('sentence',['sentencecase','sc'], s => s[0]?.toUpperCase() + s.slice(1).toLowerCase(), 'Sentence case'),
    t('swapcase',['swap-case'], s => [...s].map(c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()).join(''), 'sWAP cASE'),
    t('snake',['snakecase','snake-case'], s => s.toLowerCase().replace(/\s+/g, '_'), 'snake_case'),
    t('kebab',['kebabcase','kebab-case','dash'], s => s.toLowerCase().replace(/\s+/g, '-'), 'kebab-case'),
    t('camel',['camelcase'], s => s.toLowerCase().replace(/[-_\s]+(\w)/g, (_, c) => c.toUpperCase()), 'camelCase'),
    t('pascal',['pascalcase'], s => (' ' + s.toLowerCase()).replace(/[-_\s]+(\w)/g, (_, c) => c.toUpperCase()), 'PascalCase'),

    t('alternating',['alt','alternate'], s => [...s].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join(''), 'AlTeRnAtInG'),
    t('shuffle-text',['shuffle-letters'], s => s.split('').sort(() => Math.random() - 0.5).join(''), 'Shuffle letters'),
    t('shuffle-words',['shuffle-w'], s => s.split(/\s+/).sort(() => Math.random() - 0.5).join(' '), 'Shuffle words'),
    t('repeat',['repeat-text'], s => s + ' ' + s + ' ' + s, 'Triple text'),
    t('clap',['clap-text'], s => s.split(/\s+/).join(' 👏 '), 'Add 👏 between words'),
    t('emojify',['emoji-text','add-emoji'], s => s.split(/\s+/).join(' ✨ '), 'Sparkle words'),
    t('spaces',['add-spaces'], s => [...s].join(' '), 'A d d   s p a c e s'),
    t('strike',['strikethrough','strike-text'], s => [...s].map(c => c + '\u0336').join(''), 'Strikethrough'),
    t('underline-text',['underline-x'], s => [...s].map(c => c + '\u0332').join(''), 'Underline'),
    t('overline-text',['overline-x'], s => [...s].map(c => c + '\u0305').join(''), 'Overline'),
    t('zalgo',['glitch','corrupt-text'], s => [...s].map(c => c + '\u0301\u0307\u034F').join(''), 'Glitchy zalgo'),

    t('charcount',['char-count'], s => `📊 ${s.length} chars`, 'Character count'),
    t('wordcount',['word-count'], s => `📊 ${s.trim().split(/\s+/).length} words`, 'Word count'),
    t('linecount',['line-count'], s => `📊 ${s.split(/\n/).length} lines`, 'Line count'),
    t('text-stats',['stats-text'], s => `📊 ${s.length} chars · ${s.trim().split(/\s+/).length} words · ${s.split(/\n/).length} lines`, 'Full stats'),

    t('replace-spaces-dash',['repspd'], s => s.replace(/\s+/g, '-'), 'Replace spaces with -'),
    t('replace-spaces-under',['repspu'], s => s.replace(/\s+/g, '_'), 'Replace spaces with _'),
    t('strip-spaces',['nospaces'], s => s.replace(/\s+/g, ''), 'Strip spaces'),
    t('truncate',['truncate-100'], s => s.length > 100 ? s.slice(0, 100) + '…' : s, 'Truncate to 100 chars'),
];
