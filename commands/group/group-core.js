/*════════════════════════════════════════
 *  Group / chat moderation commands
 *══════════════════════════════════════*/

const groupOnly = (run) => async (ctx) => {
    if (!ctx.isGroup) return ctx.reply('🚫 Group only');
    return run(ctx);
};

const adminOnly = (run) => async (ctx) => {
    if (!ctx.isGroup) return ctx.reply('🚫 Group only');
    if (!ctx.isAdmins && !ctx.isCreator) return ctx.reply('🚫 Admins only');
    return run(ctx);
};

const botAdminOnly = (run) => async (ctx) => {
    if (!ctx.isGroup) return ctx.reply('🚫 Group only');
    if (!ctx.isBotAdmins) return ctx.reply('🚫 I need to be admin to do that');
    return run(ctx);
};

const ok = (name, aliases, fn, desc, opts = {}) => ({ name, aliases, category: 'group', desc, group: true, ...opts, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

export default [
    ok('grouplink',['gclink','glink','invite-link'], groupOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        const code = await ctx.neo.groupInviteCode(ctx.from);
        return `🔗 https://chat.whatsapp.com/${code}`;
    }), 'Get group invite link'),

    ok('revokelink',['revokegc','reset-link'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        const code = await ctx.neo.groupRevokeInvite(ctx.from);
        return `🔄 New link: https://chat.whatsapp.com/${code}`;
    }), 'Revoke + new invite link'),

    ok('groupinfo',['gcinfo','about-gc'], groupOnly(async (ctx) => {
        const md = await ctx.neo.groupMetadata(ctx.from);
        const admins = md.participants.filter(p => p.admin).length;
        return `╭─[ 👥 *${md.subject}* ]─\n` +
               `┃ 🆔 ID    : ${md.id}\n` +
               `┃ 👥 Total : ${md.participants.length}\n` +
               `┃ 👑 Admins: ${admins}\n` +
               `┃ 📝 Desc  : ${md.desc || '(none)'}\n` +
               `┃ 📅 Created: ${new Date(md.creation * 1000).toDateString()}\n` +
               `╰────────────────`;
    }), 'About this group'),

    ok('listadmins',['admins','admin-list','staff'], groupOnly(async (ctx) => {
        const md = await ctx.neo.groupMetadata(ctx.from);
        const admins = md.participants.filter(p => p.admin);
        const lines = admins.map(a => `• @${a.id.split('@')[0]}${a.admin === 'superadmin' ? ' 👑' : ''}`);
        await ctx.neo.sendMessage(ctx.from, { text: `*Admins (${admins.length}/${md.participants.length})*\n\n${lines.join('\n')}`, mentions: admins.map(a => a.id) }, { quoted: ctx.m });
        return null;
    }), 'List group admins'),

    ok('gcname',['groupname','setname','changename'], adminOnly(async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}gcname <new name>`);
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        await ctx.neo.groupUpdateSubject(ctx.from, ctx.text);
        return `✅ Group name updated`;
    }), 'Change group subject'),

    ok('gcdesc',['groupdesc','setdesc','changedesc'], adminOnly(async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}gcdesc <new description>`);
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        await ctx.neo.groupUpdateDescription(ctx.from, ctx.text);
        return `✅ Group description updated`;
    }), 'Change group description'),

    ok('open-gc',['open','unlock','opengc'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        await ctx.neo.groupSettingUpdate(ctx.from, 'not_announcement');
        return '🔓 Group OPEN — anyone can send.';
    }), 'Open group (everyone can chat)'),

    ok('close-gc',['close','lock','closegc'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        await ctx.neo.groupSettingUpdate(ctx.from, 'announcement');
        return '🔒 Group CLOSED — only admins can send.';
    }), 'Close group (admins only)'),

    ok('lock-info',['lockinfo','lockdesc'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        await ctx.neo.groupSettingUpdate(ctx.from, 'locked');
        return '🔒 Only admins can edit group info.';
    }), 'Lock group info edits'),

    ok('unlock-info',['unlockinfo','unlockdesc'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        await ctx.neo.groupSettingUpdate(ctx.from, 'unlocked');
        return '🔓 Anyone can edit group info.';
    }), 'Unlock group info edits'),

    ok('promote',['admin','make-admin'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.m?.quoted?.sender;
        if (!target) throw new Error('Tag/quote a user');
        await ctx.neo.groupParticipantsUpdate(ctx.from, [target], 'promote');
        return `✅ Promoted @${target.split('@')[0]} to admin`;
    }), 'Promote a member to admin'),

    ok('demote',['unadmin','demote-admin'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.m?.quoted?.sender;
        if (!target) throw new Error('Tag/quote a user');
        await ctx.neo.groupParticipantsUpdate(ctx.from, [target], 'demote');
        return `✅ Demoted @${target.split('@')[0]}`;
    }), 'Demote an admin'),

    ok('kick',['remove','boot'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        const target = ctx.m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.m?.quoted?.sender;
        if (!target) throw new Error('Tag/quote a user');
        await ctx.neo.groupParticipantsUpdate(ctx.from, [target], 'remove');
        return `🚫 Removed @${target.split('@')[0]}`;
    }), 'Remove a member'),

    ok('add-many',['adduser','addnumber'], adminOnly(async (ctx) => {
        if (!ctx.isBotAdmins) return '🚫 I must be admin';
        const numbers = ctx.text.split(/[\s,]+/).filter(Boolean).map(n => n.replace(/\D/g, ''));
        if (!numbers.length) throw new Error(`Usage: ${ctx.prefix}adduser 254712345678,254700000000`);
        const jids = numbers.map(n => `${n}@s.whatsapp.net`);
        const r = await ctx.neo.groupParticipantsUpdate(ctx.from, jids, 'add');
        return `📥 Add result:\n${r.map(x => `• ${x.jid}: ${x.status}`).join('\n')}`;
    }), 'Add member(s) by number'),

    ok('tagall',['everyone','hidetag','tag-all'], adminOnly(async (ctx) => {
        const md = await ctx.neo.groupMetadata(ctx.from);
        const mentions = md.participants.map(p => p.id);
        const text = ctx.text || '📢 Attention everyone';
        await ctx.neo.sendMessage(ctx.from, { text: `${text}\n\n${mentions.map(m => '@' + m.split('@')[0]).join(' ')}`, mentions });
        return null;
    }), 'Mention every member'),

    ok('hidetag-only',['hide-tag','silent-tag'], adminOnly(async (ctx) => {
        const md = await ctx.neo.groupMetadata(ctx.from);
        const mentions = md.participants.map(p => p.id);
        const text = ctx.text || '🤫';
        await ctx.neo.sendMessage(ctx.from, { text, mentions });
        return null;
    }), 'Mention everyone silently (no list)'),

    ok('tagadmins',['tag-admins','adminscall'], groupOnly(async (ctx) => {
        const md = await ctx.neo.groupMetadata(ctx.from);
        const admins = md.participants.filter(p => p.admin);
        await ctx.neo.sendMessage(ctx.from, { text: `📢 Attention admins\n\n${admins.map(a => '@' + a.id.split('@')[0]).join(' ')}`, mentions: admins.map(a => a.id) });
        return null;
    }), 'Tag all admins'),

    ok('antilink',['anti-link','linkblock'], adminOnly((ctx) => {
        global.antiLink = global.antiLink || {};
        const on = (ctx.args[0] || '').toLowerCase() === 'on';
        global.antiLink[ctx.from] = on;
        return `🛡 antilink ${on ? 'ENABLED' : 'DISABLED'}`;
    }), 'Toggle antilink'),

    ok('antispam',['anti-spam'], adminOnly((ctx) => {
        global.antiSpam = global.antiSpam || {};
        const on = (ctx.args[0] || '').toLowerCase() === 'on';
        global.antiSpam[ctx.from] = on;
        return `🛡 antispam ${on ? 'ENABLED' : 'DISABLED'}`;
    }), 'Toggle antispam'),

    ok('welcome',['welcome-toggle','setwelcome'], adminOnly((ctx) => {
        global.welcome = global.welcome || {};
        const on = (ctx.args[0] || '').toLowerCase() === 'on';
        global.welcome[ctx.from] = on;
        return `👋 welcome messages ${on ? 'ENABLED' : 'DISABLED'}`;
    }), 'Toggle welcome messages'),

    ok('leave-msg',['leavemsg-toggle','setleave'], adminOnly((ctx) => {
        global.leaveMsg = global.leaveMsg || {};
        const on = (ctx.args[0] || '').toLowerCase() === 'on';
        global.leaveMsg[ctx.from] = on;
        return `👋 leave messages ${on ? 'ENABLED' : 'DISABLED'}`;
    }), 'Toggle leave messages'),

    ok('leavegc',['leavegroup','byebye'], adminOnly(async (ctx) => {
        await ctx.neo.sendMessage(ctx.from, { text: '👋 Leaving the group. Goodbye!' });
        setTimeout(() => ctx.neo.groupLeave(ctx.from), 2000);
        return null;
    }), 'Bot leaves the group'),

    ok('totalmem',['gctotal','members-count','membercount'], groupOnly(async (ctx) => {
        const md = await ctx.neo.groupMetadata(ctx.from);
        return `👥 ${md.participants.length} members in *${md.subject}*`;
    }), 'Member count'),

    ok('listmem',['memberlist','listmembers'], groupOnly(async (ctx) => {
        const md = await ctx.neo.groupMetadata(ctx.from);
        const text = `👥 *Members of ${md.subject} (${md.participants.length})*\n\n` + md.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n');
        await ctx.neo.sendMessage(ctx.from, { text, mentions: md.participants.map(p => p.id) }, { quoted: ctx.m });
        return null;
    }), 'List all members'),

    ok('vote-open',['voteopen','startvote','poll-open'], adminOnly((ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}voteopen <topic>`);
        global.gcVotes = global.gcVotes || {};
        global.gcVotes[ctx.from] = { topic: ctx.text, yes: new Set(), no: new Set(), open: true };
        return `🗳 *Vote opened:* ${ctx.text}\n\nUse *${ctx.prefix}vote yes* or *${ctx.prefix}vote no*`;
    }), 'Open a vote'),

    ok('vote',['vote-cast','castvote'], groupOnly((ctx) => {
        const which = (ctx.args[0] || '').toLowerCase();
        const v = global.gcVotes?.[ctx.from];
        if (!v?.open) throw new Error('No active vote');
        if (which !== 'yes' && which !== 'no') throw new Error('Use yes or no');
        v[which].add(ctx.sender);
        v[which === 'yes' ? 'no' : 'yes'].delete(ctx.sender);
        return `🗳 Vote recorded — yes:${v.yes.size} no:${v.no.size}`;
    }), 'Vote yes/no'),

    ok('vote-close',['voteclose','endvote','poll-close'], adminOnly((ctx) => {
        const v = global.gcVotes?.[ctx.from];
        if (!v) throw new Error('No vote');
        v.open = false;
        return `📊 *Vote closed:* ${v.topic}\n• ✅ Yes: ${v.yes.size}\n• ❌ No: ${v.no.size}\n• Winner: ${v.yes.size === v.no.size ? 'TIE' : v.yes.size > v.no.size ? 'YES' : 'NO'}`;
    }), 'Close the vote'),

    ok('poll',['create-poll','newpoll'], adminOnly(async (ctx) => {
        const [q, ...opts] = ctx.text.split('|').map(s => s.trim()).filter(Boolean);
        if (!q || opts.length < 2) throw new Error(`Usage: ${ctx.prefix}poll question | option1 | option2`);
        await ctx.neo.sendMessage(ctx.from, { poll: { name: q, values: opts.slice(0, 12), selectableCount: 1 } });
        return null;
    }), 'Create a poll'),
];
