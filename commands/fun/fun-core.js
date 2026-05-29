/*════════════════════════════════════════
 *  Fun / silly / interactive commands
 *══════════════════════════════════════*/
import { RNG, PICK, rngHash, dlBuffer } from '../_helpers.js';

const SUBJECT = (ctx) => ctx.text || ctx.pushname || 'you';

// Image effect via popcat.xyz — transforms a profile pic
async function applyEffect(ctx, endpoint) {
    const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                 || ctx.m?.quoted?.sender
                 || ctx.sender;
    let ppUrl;
    try { ppUrl = await ctx.neo.profilePictureUrl(target, 'image'); }
    catch { ppUrl = 'https://files.catbox.moe/bwgltx.png'; }
    const apiUrl = `https://api.popcat.xyz/${endpoint}?image=${encodeURIComponent(ppUrl)}`;
    try {
        const buf = await dlBuffer(apiUrl);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `*${endpoint}* effect on @${target.split('@')[0]}`, mentions: [target] }, { quoted: ctx.m });
    } catch (e) {
        await ctx.reply(`❌ ${endpoint} failed: ${e?.message || e}`);
    }
}

const effect = (name, aliases, endpoint) => ({
    name, aliases, category: 'fun',
    desc: `Apply ${endpoint} effect on profile picture (tag/quote a user)`,
    run: (ctx) => applyEffect(ctx, endpoint)
});

const pct = (name, aliases, label, range = [0, 100]) => ({
    name, aliases, category: 'fun', desc: `${label} percentage`,
    run: async (ctx) => {
        const subject = SUBJECT(ctx);
        const pct = rngHash(subject + name, range[1] - range[0]) + range[0];
        await ctx.reply(`📊 *${label}* — ${subject}: *${pct}%*`);
    }
});

const insultFor = (subject) => PICK([
    `you have the strategic mind of a slow tortoise, ${subject}.`,
    `you couldn't sell water in a desert, ${subject}.`,
    `if brains were taxed, ${subject} would get a refund.`,
    `${subject}, you bring everyone so much joy… when you leave the room.`,
    `${subject}, you're not stupid, you just have bad luck thinking.`,
    `${subject}, your secrets are safe with me — I never even listen.`,
]);
const complimentFor = (subject) => PICK([
    `${subject}, you light up rooms.`,
    `your presence is a gift, ${subject}.`,
    `${subject}, you make the world a kinder place.`,
    `you have a great sense of humor, ${subject}.`,
    `${subject}, you're someone people want around.`,
    `${subject}, your effort never goes unnoticed.`,
]);

export default [
    pct('iqcheck',['iq-percent','iqof'], 'IQ', [60, 199]),
    pct('crazy',['crazy-percent'], 'Crazy meter'),
    pct('cool',['cool-percent','coolof'], 'Coolness'),
    pct('beauty',['beauty-percent','prettyof'], 'Beauty'),
    pct('cute',['cute-percent','cuteof'], 'Cuteness'),
    pct('lazy',['lazy-percent'], 'Laziness'),
    pct('rich',['rich-percent'], 'Rich potential'),
    pct('smart',['smart-percent'], 'Smartness'),
    pct('lucky',['lucky-percent'], 'Luck'),
    pct('hot',['hot-percent'], 'Hotness'),
    pct('savage',['savage-percent'], 'Savage'),
    pct('handsome',['handsome-percent'], 'Handsome'),
    pct('weird',['weird-percent'], 'Weirdness'),
    pct('honest',['honest-percent'], 'Honesty'),
    pct('mood',['mood-percent','mood-of'], 'Mood'),
    pct('hunger',['hunger-percent'], 'Hunger'),
    pct('sleepy',['sleepy-percent'], 'Sleepiness'),
    pct('strong',['strong-percent'], 'Strength'),
    pct('fast',['fast-percent','speed-percent'], 'Speed'),
    pct('caring',['caring-percent'], 'Caring'),
    pct('friend',['friend-percent','friendship'], 'Friendship'),

    {
        name: 'insult', aliases: ['roast-light','randinsult'], category: 'fun', desc: 'Light playful insult',
        run: async (ctx) => ctx.reply('😈 ' + insultFor(SUBJECT(ctx)))
    },
    {
        name: 'compliment-fun', aliases: ['compliment-light'], category: 'fun', desc: 'Sincere quick compliment',
        run: async (ctx) => ctx.reply('🌸 ' + complimentFor(SUBJECT(ctx)))
    },
    {
        name: 'truth', aliases: ['truth-q'], category: 'fun', desc: 'Random truth question',
        run: async (ctx) => ctx.reply('🤔 *Truth:* ' + PICK([
            'What\'s your most embarrassing childhood memory?',
            'Who was your first crush?',
            'What\'s a small lie you still tell?',
            'What was your worst date ever?',
            'What\'s your guilty pleasure?',
            'What\'s the weirdest dream you remember?',
        ]))
    },
    {
        name: 'dare', aliases: ['dare-q'], category: 'fun', desc: 'Random dare',
        run: async (ctx) => ctx.reply('🎯 *Dare:* ' + PICK([
            'Send a voice note singing your favorite song chorus.',
            'Text your contact list "I have a confession" then "wrong chat".',
            'Do 10 push-ups and post the count.',
            'Send a screenshot of your most-used app.',
            'Tell a corny joke in your status for 1 hour.',
            'Call a friend and recite a haiku.',
        ]))
    },
    {
        name: 'wyr', aliases: ['would-you-rather','wouldyourather'], category: 'fun', desc: 'Would-you-rather',
        run: async (ctx) => ctx.reply('🤷 *Would you rather*\n\n' + PICK([
            'Always be 10 minutes late, OR always be 20 minutes early?',
            'Speak every language fluently, OR play every instrument expertly?',
            'Live without internet, OR live without AC/heating?',
            'Have unlimited pizza, OR unlimited sushi?',
            'Always sing instead of speak, OR dance instead of walk?',
        ]))
    },
    {
        name: 'nhie', aliases: ['neverhaveiever'], category: 'fun', desc: 'Never-have-I-ever prompt',
        run: async (ctx) => ctx.reply('🚫 *Never have I ever:* ' + PICK([
            'Forgotten my own birthday',
            'Replied "k" then thrown my phone',
            'Cried watching a Pixar movie',
            'Sent a screenshot to the wrong person',
            'Pretended to know a song I didn\'t know',
        ]))
    },
    {
        name: 'thisorthat', aliases: ['this-or-that'], category: 'fun', desc: 'Random this-or-that',
        run: async (ctx) => {
            const opts = [['Tea','Coffee'],['Beach','Mountain'],['Pizza','Burger'],['Books','Movies'],['Cat','Dog'],['City','Countryside'],['Morning','Night']];
            const r = PICK(opts);
            await ctx.reply(`👉 ${r[0]} *or* ${r[1]}?`);
        }
    },
    {
        name: 'roastme', aliases: ['roast-me'], category: 'fun', desc: 'Bot lightly roasts you',
        run: async (ctx) => ctx.reply('🔥 ' + insultFor(ctx.pushname || 'you'))
    },
    {
        name: 'pickrand', aliases: ['pickrandom','pickone','choose'], category: 'fun', desc: 'Pick one option from a comma-separated list',
        run: async (ctx) => {
            if (!ctx.text?.includes(',')) return ctx.reply(`Usage: ${ctx.prefix}${ctx.command} pizza, burger, sushi`);
            const list = ctx.text.split(',').map(s => s.trim()).filter(Boolean);
            await ctx.reply(`👉 *${PICK(list)}*`);
        }
    },
    {
        name: 'shake', aliases: ['shake-magicball'], category: 'fun', desc: 'Shake the magic ball for a yes/no',
        run: async (ctx) => ctx.reply(`🎱 ${PICK(['Yes','No','Maybe','Try later','Definitely','Hm…'])}`)
    },
    {
        name: 'destiny', aliases: ['fate','destiny-roll'], category: 'fun', desc: 'A destiny prediction',
        run: async (ctx) => ctx.reply(`🔮 Your fate: ${PICK(['great success','quiet victory','an unexpected friend','a lucky number — 7','a small inconvenience','a beautiful surprise'])}`)
    },
    {
        name: 'when-marry', aliases: ['marry-when','marriage-age'], category: 'fun', desc: 'When will you marry?',
        run: async (ctx) => ctx.reply(`💍 Predicted marriage age: *${RNG(20, 45)} years old*`)
    },
    {
        name: 'when-rich', aliases: ['rich-when','rich-age'], category: 'fun', desc: 'When will you be rich?',
        run: async (ctx) => ctx.reply(`💰 Predicted wealth age: *${RNG(22, 60)} years old*`)
    },
    {
        name: 'death-date', aliases: ['lifeleft','expectancy-fun'], category: 'fun', desc: 'Just-for-fun life expectancy',
        run: async (ctx) => ctx.reply(`💀 (just for fun) Predicted age: *${RNG(72, 99)} years*`)
    },
    {
        name: 'jail-time', aliases: ['arrested','arrest-time'], category: 'fun', desc: 'Joke jail sentence',
        run: async (ctx) => ctx.reply(`🚔 ${ctx.pushname || 'you'} sentenced to *${RNG(1, 25)} years* for: ${PICK(['being too cute','using too many emojis','spamming the GC','watching anime at 3am','too many memes'])}`)
    },
    {
        name: 'meme', aliases: ['random-meme','memepls'], category: 'fun', desc: 'Random meme',
        run: async (ctx) => {
            const j = await fetch('https://meme-api.com/gimme').then(r => r.json()).catch(() => null);
            if (!j?.url) return ctx.reply('Could not fetch a meme.');
            const buf = await dlBuffer(j.url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: `*${j.title}* — r/${j.subreddit}` }, { quoted: ctx.m });
        }
    },

    // popcat.xyz effects
    effect('wasted',['wasted-effect','gta-wasted'], 'wasted'),
    effect('jail',['gojail','jailbars'], 'jail'),
    effect('blur-pp',['blurpp'], 'blur'),
    effect('drip-pp',['drippp'], 'drip'),
    effect('clown-pp',['clownpp'], 'clown'),
    effect('communism',['communist-pp'], 'communism'),
    effect('gay',['rainbow-effect','gayflag'], 'gay'),
    effect('greyscale-pp',['gray-pp'], 'greyscale'),
    effect('invert-pp',['invertpp'], 'invert'),
    effect('mnm-pp',['mnm','mm-pp'], 'mnm'),
    effect('pet-pp',['pet','petpet'], 'pet'),
    effect('uncover-pp',['uncoverpp'], 'uncover'),

    // popcat with text
    {
        name: 'biden-tweet', aliases: ['biden','biden-text'], category: 'fun', desc: 'Biden tweet image',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}biden <text>`);
            const url = `https://api.popcat.xyz/biden?text=${encodeURIComponent(ctx.text)}`;
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: 'Biden says…' }, { quoted: ctx.m });
        }
    },
    {
        name: 'trump-tweet', aliases: ['trump','trump-text'], category: 'fun', desc: 'Trump tweet image',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}trump <text>`);
            const url = `https://api.popcat.xyz/drake?text=${encodeURIComponent(ctx.text)}`;
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: 'Trump card' }, { quoted: ctx.m });
        }
    },
    {
        name: 'oogway', aliases: ['oogway-quote','oogway-meme'], category: 'fun', desc: 'Master Oogway with custom text',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}oogway <text>`);
            const url = `https://api.popcat.xyz/oogway?text=${encodeURIComponent(ctx.text)}`;
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🐢 Oogway' }, { quoted: ctx.m });
        }
    },
    {
        name: 'pooh',aliases: ['pooh-meme','pooh-text'], category: 'fun', desc: 'Pooh meme with two texts',
        run: async (ctx) => {
            const [a, b] = ctx.text.split('|').map(s => s?.trim());
            if (!a || !b) return ctx.reply(`Usage: ${ctx.prefix}pooh basic | classy`);
            const url = `https://api.popcat.xyz/pooh?text1=${encodeURIComponent(a)}&text2=${encodeURIComponent(b)}`;
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🍯 Pooh' }, { quoted: ctx.m });
        }
    },
    {
        name: 'drake', aliases: ['drake-meme'], category: 'fun', desc: 'Drake meme with two texts',
        run: async (ctx) => {
            const [a, b] = ctx.text.split('|').map(s => s?.trim());
            if (!a || !b) return ctx.reply(`Usage: ${ctx.prefix}drake bad option | good option`);
            const url = `https://api.popcat.xyz/drake?text1=${encodeURIComponent(a)}&text2=${encodeURIComponent(b)}`;
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: 'Drake meme' }, { quoted: ctx.m });
        }
    },
    {
        name: 'sadcat', aliases: ['sad-cat'], category: 'fun', desc: 'Sad cat meme with text',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}sadcat <text>`);
            const url = `https://api.popcat.xyz/sadcat?text=${encodeURIComponent(ctx.text)}`;
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '😿' }, { quoted: ctx.m });
        }
    },
    {
        name: 'caution', aliases: ['caution-sign'], category: 'fun', desc: 'Caution sign with custom text',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}caution <text>`);
            const url = `https://api.popcat.xyz/caution?text=${encodeURIComponent(ctx.text)}`;
            const buf = await dlBuffer(url);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '⚠ Caution' }, { quoted: ctx.m });
        }
    },
];
