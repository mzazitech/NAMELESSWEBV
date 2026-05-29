/*════════════════════════════════════════
 *  Economy / RPG-lite commands
 *══════════════════════════════════════*/
import fs from 'fs';
import { RNG, PICK } from '../_helpers.js';

const FILE = './database/economy.json';
function load() {
    try { return JSON.parse(fs.readFileSync(FILE)); } catch { return {}; }
}
function save(d) { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }
function user(d, jid) {
    if (!d[jid]) d[jid] = { wallet: 100, bank: 0, xp: 0, level: 1, last: {}, inv: {} };
    return d[jid];
}
function checkCooldown(u, key, ms) {
    const now = Date.now();
    if (u.last[key] && (now - u.last[key]) < ms) {
        const remain = Math.ceil((ms - (now - u.last[key])) / 1000);
        return remain;
    }
    u.last[key] = now;
    return 0;
}
function gainXp(u, x) {
    u.xp += x;
    while (u.xp >= u.level * 100) { u.xp -= u.level * 100; u.level++; }
}

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'economy', desc, run: async (ctx) => {
    try {
        const d = load();
        const u = user(d, ctx.sender);
        const r = await fn(ctx, d, u);
        save(d);
        if (r != null) await ctx.reply(String(r));
    } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); }
}});

export default [
    ok('balance',['bal','wallet','money'], (ctx, d, u) => {
        return `💼 *${ctx.pushname || 'You'}*\n• 💰 Wallet: ${u.wallet}\n• 🏦 Bank   : ${u.bank}\n• 🎚 Level  : ${u.level} (${u.xp} xp)`;
    }, 'Show balance'),

    ok('daily',['claimdaily','dailyclaim'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'daily', 24 * 60 * 60 * 1000);
        if (cd) return `⏳ Daily already claimed. Try again in ${Math.floor(cd / 3600)}h`;
        const r = RNG(80, 220);
        u.wallet += r;
        gainXp(u, 10);
        return `🎁 Daily reward: *+${r} coins*. Wallet: ${u.wallet}`;
    }, 'Daily reward'),

    ok('weekly',['claimweekly'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'weekly', 7 * 24 * 60 * 60 * 1000);
        if (cd) return `⏳ Weekly already claimed. Try again in ${Math.floor(cd / 86400)}d`;
        const r = RNG(500, 1500);
        u.wallet += r;
        gainXp(u, 50);
        return `🎁 Weekly reward: *+${r} coins*`;
    }, 'Weekly reward'),

    ok('work',['job','workjob'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'work', 30 * 60 * 1000);
        if (cd) return `⏳ Tired. Try again in ${Math.ceil(cd / 60)}m`;
        const r = RNG(40, 200);
        u.wallet += r;
        gainXp(u, 5);
        return `💼 You worked as a ${PICK(['driver','barista','tutor','dev','dancer','farmer','plumber'])} and earned *${r}*`;
    }, 'Work for coins'),

    ok('crime',['rob','heist','loot'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'crime', 60 * 60 * 1000);
        if (cd) return `⏳ Cool down ${Math.ceil(cd / 60)}m`;
        if (Math.random() < 0.4) {
            const fine = RNG(50, 200);
            u.wallet = Math.max(0, u.wallet - fine);
            return `🚨 Caught! Fined ${fine}`;
        }
        const r = RNG(150, 500);
        u.wallet += r;
        gainXp(u, 8);
        return `🦹 Successful heist: *+${r}*`;
    }, 'Risky crime'),

    ok('hunt',['hunting'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'hunt', 20 * 60 * 1000);
        if (cd) return `⏳ Cool down ${Math.ceil(cd / 60)}m`;
        const animal = PICK(['rabbit','deer','wolf','bear','elephant']);
        const r = RNG(20, 180);
        u.wallet += r;
        gainXp(u, 5);
        return `🏹 You hunted a ${animal} and earned *${r}*`;
    }, 'Hunt animals'),

    ok('fish',['fishing'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'fish', 15 * 60 * 1000);
        if (cd) return `⏳ Cool down ${Math.ceil(cd / 60)}m`;
        const r = RNG(15, 120);
        u.wallet += r;
        gainXp(u, 4);
        return `🎣 You caught a ${PICK(['tilapia','salmon','catfish','tuna','shark'])}: *+${r}*`;
    }, 'Fish for coins'),

    ok('mine',['mining'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'mine', 25 * 60 * 1000);
        if (cd) return `⏳ Cool down ${Math.ceil(cd / 60)}m`;
        const r = RNG(30, 250);
        u.wallet += r;
        gainXp(u, 6);
        return `⛏ You mined ${PICK(['copper','silver','gold','diamond','emerald'])}: *+${r}*`;
    }, 'Mine for coins'),

    ok('deposit',['dep','bankin'], (ctx, d, u) => {
        const amt = ctx.args[0] === 'all' ? u.wallet : parseInt(ctx.args[0]);
        if (!amt || amt > u.wallet) throw new Error('invalid amount');
        u.wallet -= amt; u.bank += amt;
        return `🏦 Deposited ${amt}. Wallet ${u.wallet}, Bank ${u.bank}`;
    }, 'Deposit to bank'),

    ok('withdraw',['wd','bankout'], (ctx, d, u) => {
        const amt = ctx.args[0] === 'all' ? u.bank : parseInt(ctx.args[0]);
        if (!amt || amt > u.bank) throw new Error('invalid amount');
        u.bank -= amt; u.wallet += amt;
        return `🏦 Withdrew ${amt}. Wallet ${u.wallet}, Bank ${u.bank}`;
    }, 'Withdraw from bank'),

    ok('pay',['give','transfer'], (ctx, d, u) => {
        const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amt = parseInt(ctx.args.find(a => /^\d+$/.test(a)));
        if (!target || !amt) throw new Error(`Usage: ${ctx.prefix}pay @user 100`);
        if (amt > u.wallet) throw new Error('not enough wallet');
        u.wallet -= amt;
        const tgt = user(d, target);
        tgt.wallet += amt;
        return `💸 Sent ${amt} to @${target.split('@')[0]}`;
    }, 'Send coins to someone'),

    ok('gamble',['bet','flipbet'], (ctx, d, u) => {
        const amt = parseInt(ctx.args[0]);
        if (!amt || amt > u.wallet) throw new Error('invalid amount');
        if (Math.random() < 0.48) {
            u.wallet += amt;
            return `🎉 You won ${amt}! Wallet ${u.wallet}`;
        }
        u.wallet -= amt;
        return `💸 You lost ${amt}. Wallet ${u.wallet}`;
    }, 'Coin-flip gamble'),

    ok('rob-user',['robuser'], (ctx, d, u) => {
        const cd = checkCooldown(u, 'rob', 90 * 60 * 1000);
        if (cd) return `⏳ Cool down ${Math.ceil(cd / 60)}m`;
        const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) throw new Error(`Usage: ${ctx.prefix}rob-user @user`);
        const tgt = user(d, target);
        if (tgt.wallet < 50) return '😅 Target has no money';
        if (Math.random() < 0.5) {
            const stolen = Math.floor(tgt.wallet * 0.3);
            tgt.wallet -= stolen; u.wallet += stolen;
            return `🦹 Stole ${stolen} from @${target.split('@')[0]}`;
        }
        const fine = Math.floor(u.wallet * 0.2);
        u.wallet -= fine;
        return `🚨 Caught! Lost ${fine} as a fine`;
    }, 'Rob another user'),

    ok('leaderboard',['top','richlist','top10'], (ctx, d) => {
        const list = Object.entries(d).map(([jid, v]) => ({ jid, total: v.wallet + v.bank })).sort((a, b) => b.total - a.total).slice(0, 10);
        return '🏆 *Top 10 Richest*\n\n' + list.map((p, i) => `${i + 1}. @${p.jid.split('@')[0]} — ${p.total}`).join('\n');
    }, 'Top 10 richest'),

    ok('level',['rank','xp','myxp'], (ctx, d, u) => `🎚 *${ctx.pushname || 'You'}*\n• Level: ${u.level}\n• XP: ${u.xp}/${u.level * 100}`, 'Show level'),

    ok('reset-eco',['eco-reset','clear-eco'], async (ctx, d) => {
        if (!ctx.isCreator) return '🚫 Owner only';
        save({});
        return '🧹 Economy reset';
    }, 'Reset economy (owner)'),
];
