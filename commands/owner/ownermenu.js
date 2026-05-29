/*════════════════════════════════════════
 *  Owner-only menu and meta commands
 *══════════════════════════════════════*/

import os from 'os';

function categoriesSnapshot() {
    const reg = global.commandCategories || new Map();
    const out = {};
    for (const [cat, list] of reg.entries()) {
        const seen = new Set();
        out[cat] = list.filter(c => {
            if (seen.has(c.name)) return false;
            seen.add(c.name); return true;
        });
    }
    return out;
}

function totalCount() {
    const reg = global.commandRegistry || new Map();
    return new Set([...reg.values()].map(c => c.name)).size;
}

export default [
    {
        name: 'ownermenu',
        aliases: ['ownmenu','om','adminmenu','staffmenu','controlpanel'],
        category: 'owner',
        owner: true,
        desc: 'Show the owner-only command menu',
        run: async (ctx) => {
            const cats = categoriesSnapshot();
            const ownerOnly = ['owner'];
            const sections = [];
            for (const cat of ownerOnly) {
                const list = cats[cat] || [];
                if (!list.length) continue;
                sections.push(`╭─[ *${cat.toUpperCase()}* (${list.length}) ]─\n` +
                              list.map(c => `│ • ${ctx.prefix}${c.name}${c.desc ? '  — ' + c.desc : ''}`).join('\n') +
                              '\n╰─────────────');
            }
            const text =
`╭═════ ⚙ *DARKNODE OWNER PANEL* ⚙ ═════╮
┃ 👑 Owner   : ${global.ownername}
┃ 📞 Number  : ${global.ownernumber}
┃ 🤖 Bot     : ${global.botname}
┃ 📦 Total   : ${totalCount()} commands
┃ 🧠 Up      : ${process.uptime().toFixed(0)}s
┃ 🖥  Host    : ${os.hostname()}
╰═════════════════════════════════╯

${sections.join('\n\n')}

_Tip:_ Run *${ctx.prefix}allmenu* for every command, or *${ctx.prefix}menu* for category browser.`;
            await ctx.reply(text);
        }
    },

    {
        name: 'allmenu',
        aliases: ['fullmenu','everymenu','listcmd','listcmds','commandlist','allcmds'],
        category: 'main',
        desc: 'List every loaded command grouped by category',
        run: async (ctx) => {
            const cats = categoriesSnapshot();
            const total = totalCount();
            const order = Object.keys(cats).sort();
            const blocks = order.map(cat => {
                const list = cats[cat];
                return `╭─[ *${cat.toUpperCase()}* (${list.length}) ]─\n` +
                       list.map(c => `│ • ${ctx.prefix}${c.name}`).join('\n') +
                       '\n╰─────────────';
            });
            const head =
`╭═════ 💎 *DARKNODE — ALL COMMANDS* 💎 ═════╮
┃ 📦 Total       : ${total}
┃ 🗂 Categories  : ${order.length}
┃ 🤖 Bot         : ${global.botname}
╰══════════════════════════════════════════╯`;
            await ctx.reply(`${head}\n\n${blocks.join('\n\n')}\n\n${global.footer || ''}`);
        }
    },

    {
        name: 'cmdcount',
        aliases: ['count-cmds','totalcmds','howmany','total-commands'],
        category: 'main',
        desc: 'Show total number of loaded commands',
        run: async (ctx) => {
            const cats = categoriesSnapshot();
            const total = totalCount();
            const lines = Object.entries(cats).sort().map(([k, v]) => `┃ ${k.padEnd(12, ' ')} : ${v.length}`);
            await ctx.reply(`╭═════ 📦 *Command Stats* ═════╮\n${lines.join('\n')}\n┃ ${'TOTAL'.padEnd(12,' ')} : ${total}\n╰═══════════════════════╯`);
        }
    },

    {
        name: 'reload-cmds',
        aliases: ['reloadcmds','reload-commands','rl-cmds','recmd','rebuild-cmds'],
        category: 'owner',
        owner: true,
        desc: 'Reload the modular command registry from disk',
        run: async (ctx) => {
            try {
                const reg = await import(`../../all/system/commandRegistry.js?v=${Date.now()}`);
                const stats = await reg.loadAllCommands(true);
                global.__commandRegistry = reg;
                await ctx.reply(`✅ Reloaded ${stats.total} commands from ${stats.files} files (${stats.categories} categories).`);
            } catch (e) {
                await ctx.reply(`❌ Reload failed: ${e?.message || e}`);
            }
        }
    },

    {
        name: 'restart',
        aliases: ['reboot','re-start','rb'],
        category: 'owner',
        owner: true,
        desc: 'Restart the bot process',
        run: async (ctx) => {
            await ctx.reply(`🔄 Restarting *${global.botname}* in 2s…`);
            setTimeout(() => process.exit(0), 2000);
        }
    },

    {
        name: 'shutdown',
        aliases: ['stopbot','killbot','poweroff'],
        category: 'owner',
        owner: true,
        desc: 'Shut down the bot process',
        run: async (ctx) => {
            await ctx.reply(`🛑 Shutting down *${global.botname}*…`);
            setTimeout(() => process.exit(0), 1500);
        }
    },

    {
        name: 'eval',
        aliases: ['ev','>'],
        category: 'owner',
        owner: true,
        desc: 'Evaluate JS code (owner only)',
        run: async (ctx) => {
            const code = ctx.text;
            if (!code) return ctx.reply(`Usage: ${ctx.prefix}eval <code>`);
            try {
                let res = await eval(`(async () => { ${code} })()`);
                if (typeof res !== 'string') res = JSON.stringify(res, null, 2);
                await ctx.reply(`✅ ${res}`.slice(0, 4000));
            } catch (e) {
                await ctx.reply(`❌ ${e?.message || e}`);
            }
        }
    },

    {
        name: 'exec',
        aliases: ['shell','sh','$'],
        category: 'owner',
        owner: true,
        desc: 'Run a shell command (owner only)',
        run: async (ctx) => {
            const cmd = ctx.text;
            if (!cmd) return ctx.reply(`Usage: ${ctx.prefix}exec <command>`);
            const { exec } = await import('child_process');
            exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
                ctx.reply((err ? `❌ ${err.message}\n\n` : '✅ Done\n\n') + (stdout || '') + (stderr ? `\n\nstderr:\n${stderr}` : '').slice(0, 4000));
            });
        }
    },

    {
        name: 'addowner',
        aliases: ['add-owner','setowner','ownerset'],
        category: 'owner',
        owner: true,
        desc: 'Add a JID to owners list',
        run: async (ctx) => {
            const fs = await import('fs');
            const target = ctx.args[0]?.replace(/[^0-9]/g, '');
            if (!target) return ctx.reply(`Usage: ${ctx.prefix}addowner <number>`);
            const jid = `${target}@s.whatsapp.net`;
            const file = './database/owner.json';
            const list = JSON.parse(fs.readFileSync(file));
            if (list.includes(jid)) return ctx.reply('Already an owner');
            list.push(jid);
            fs.writeFileSync(file, JSON.stringify(list, null, 2));
            await ctx.reply(`✅ Added ${jid} to owners`);
        }
    },

    {
        name: 'delowner',
        aliases: ['del-owner','removeowner','rmowner'],
        category: 'owner',
        owner: true,
        desc: 'Remove a JID from owners list',
        run: async (ctx) => {
            const fs = await import('fs');
            const target = ctx.args[0]?.replace(/[^0-9]/g, '');
            if (!target) return ctx.reply(`Usage: ${ctx.prefix}delowner <number>`);
            const jid = `${target}@s.whatsapp.net`;
            const file = './database/owner.json';
            let list = JSON.parse(fs.readFileSync(file));
            const before = list.length;
            list = list.filter(j => j !== jid);
            fs.writeFileSync(file, JSON.stringify(list, null, 2));
            await ctx.reply(list.length < before ? `✅ Removed ${jid}` : 'Not found');
        }
    },

    {
        name: 'listowner',
        aliases: ['owners','listowners','showowners'],
        category: 'owner',
        owner: true,
        desc: 'List all owner JIDs',
        run: async (ctx) => {
            const fs = await import('fs');
            const list = JSON.parse(fs.readFileSync('./database/owner.json'));
            await ctx.reply(`👑 *Owners (${list.length})*\n\n` + list.map(j => `• ${j}`).join('\n'));
        }
    },

    {
        name: 'addpremium',
        aliases: ['add-prem','setprem','premadd'],
        category: 'owner',
        owner: true,
        desc: 'Add a JID to premium users',
        run: async (ctx) => {
            const fs = await import('fs');
            const target = ctx.args[0]?.replace(/[^0-9]/g, '');
            if (!target) return ctx.reply(`Usage: ${ctx.prefix}addpremium <number>`);
            const jid = `${target}@s.whatsapp.net`;
            const file = './database/premium.json';
            const list = JSON.parse(fs.readFileSync(file));
            if (list.find(p => (typeof p === 'string' ? p : p.id) === jid)) return ctx.reply('Already premium');
            list.push({ id: jid, since: Date.now() });
            fs.writeFileSync(file, JSON.stringify(list, null, 2));
            await ctx.reply(`✅ Added ${jid} as premium`);
        }
    },

    {
        name: 'delpremium',
        aliases: ['del-prem','rmprem','premdel'],
        category: 'owner',
        owner: true,
        desc: 'Remove a JID from premium users',
        run: async (ctx) => {
            const fs = await import('fs');
            const target = ctx.args[0]?.replace(/[^0-9]/g, '');
            if (!target) return ctx.reply(`Usage: ${ctx.prefix}delpremium <number>`);
            const jid = `${target}@s.whatsapp.net`;
            const file = './database/premium.json';
            let list = JSON.parse(fs.readFileSync(file));
            list = list.filter(p => (typeof p === 'string' ? p : p.id) !== jid);
            fs.writeFileSync(file, JSON.stringify(list, null, 2));
            await ctx.reply(`✅ Removed ${jid}`);
        }
    },

    {
        name: 'listpremium',
        aliases: ['premiums','listprem','prem-list'],
        category: 'owner',
        owner: true,
        desc: 'List premium users',
        run: async (ctx) => {
            const fs = await import('fs');
            const list = JSON.parse(fs.readFileSync('./database/premium.json'));
            const lines = list.map(p => '• ' + (typeof p === 'string' ? p : p.id));
            await ctx.reply(`💎 *Premium Users (${list.length})*\n\n${lines.join('\n') || '(none)'}`);
        }
    },

    {
        name: 'broadcast',
        aliases: ['bcast','bc','bc-text'],
        category: 'owner',
        owner: true,
        desc: 'Broadcast a text message to recent chats',
        run: async (ctx) => {
            const text = ctx.text;
            if (!text) return ctx.reply(`Usage: ${ctx.prefix}broadcast <message>`);
            const chats = Object.keys(ctx.neo.chats || {});
            if (!chats.length) return ctx.reply('No chats cached.');
            await ctx.reply(`📡 Broadcasting to ${chats.length} chats…`);
            let n = 0;
            for (const chat of chats) {
                try {
                    await ctx.neo.sendMessage(chat, { text: `📢 *Broadcast from ${global.ownername}*\n\n${text}` });
                    await new Promise(r => setTimeout(r, 700));
                    n++;
                } catch {}
            }
            await ctx.reply(`✅ Broadcast complete: ${n}/${chats.length}`);
        }
    },

    {
        name: 'leaveall-empty',
        aliases: ['leave-empty','clear-empty-gc'],
        category: 'owner',
        owner: true,
        desc: 'Leave all groups with fewer than 5 members',
        run: async (ctx) => {
            const meta = await ctx.neo.groupFetchAllParticipating().catch(() => ({}));
            const small = Object.values(meta).filter(g => (g.participants?.length || 0) < 5);
            await ctx.reply(`Leaving ${small.length} small groups…`);
            for (const g of small) { try { await ctx.neo.groupLeave(g.id); } catch {} }
            await ctx.reply(`✅ Done`);
        }
    },

    {
        name: 'self-ping',
        aliases: ['selfping','test-bot','testbot'],
        category: 'owner',
        owner: true,
        desc: 'Bot replies confirming it is alive',
        run: async (ctx) => {
            await ctx.reply(`✅ ${global.botname} alive | Uptime ${process.uptime().toFixed(0)}s | RSS ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`);
        }
    },

    {
        name: 'setprefix',
        aliases: ['setprefixes','prefixes-set'],
        category: 'owner',
        owner: true,
        desc: 'Set bot command prefix(es) — comma separated',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}setprefix .,!,#`);
            const list = ctx.text.split(',').map(s => s.trim()).filter(Boolean);
            global.prefa = list;
            await ctx.reply(`✅ Prefix(es) set to: ${list.join(' ')}`);
        }
    },

    {
        name: 'setbotname',
        aliases: ['botname-set','rename-bot'],
        category: 'owner',
        owner: true,
        desc: 'Change the bot display name',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}setbotname <name>`);
            global.botname = ctx.text.trim();
            try { await ctx.neo.updateProfileName(ctx.text.trim()); } catch {}
            await ctx.reply(`✅ Bot name updated to: ${global.botname}`);
        }
    },

    {
        name: 'setbotbio',
        aliases: ['setbio','botbio-set'],
        category: 'owner',
        owner: true,
        desc: 'Update WhatsApp bot status/bio',
        run: async (ctx) => {
            if (!ctx.text) return ctx.reply(`Usage: ${ctx.prefix}setbotbio <text>`);
            try { await ctx.neo.updateProfileStatus(ctx.text); await ctx.reply('✅ Bio updated'); }
            catch (e) { await ctx.reply(`❌ ${e?.message || e}`); }
        }
    },

    {
        name: 'getlog',
        aliases: ['log-tail','printlog','botlog'],
        category: 'owner',
        owner: true,
        desc: 'Print last lines of bot console (process state)',
        run: async (ctx) => {
            const mu = process.memoryUsage();
            const lines = [
                `🟢 Uptime  : ${process.uptime().toFixed(0)}s`,
                `📦 RSS     : ${(mu.rss / 1024 / 1024).toFixed(1)} MB`,
                `🟦 Heap    : ${(mu.heapUsed / 1024 / 1024).toFixed(1)} / ${(mu.heapTotal / 1024 / 1024).toFixed(1)} MB`,
                `📡 Pid     : ${process.pid}`,
                `🖥 Host    : ${os.hostname()}`,
                `🐧 Platform: ${os.platform()} ${os.release()}`,
                `🧠 Node    : ${process.version}`,
            ];
            await ctx.reply('```\n' + lines.join('\n') + '\n```');
        }
    },

    {
        name: 'savechat',
        aliases: ['saveconv','dump-chat'],
        category: 'owner',
        owner: true,
        desc: 'Mark conversation as saved (no-op stub)',
        run: async (ctx) => ctx.reply('✅ chat marked saved')
    },
    {
        name: 'clearcache',
        aliases: ['clear-cache','flushcache'],
        category: 'owner',
        owner: true,
        desc: 'Flush in-memory caches',
        run: async (ctx) => { global.aiUsageCount = {}; global.sessions = {}; await ctx.reply('🧹 Caches cleared.'); }
    },
    {
        name: 'set-presence',
        aliases: ['presence','setstatus'],
        category: 'owner',
        owner: true,
        desc: 'Set WhatsApp presence: available|composing|recording|paused|unavailable',
        run: async (ctx) => {
            const which = (ctx.args[0] || 'available').toLowerCase();
            try { await ctx.neo.sendPresenceUpdate(which); await ctx.reply(`✅ presence -> ${which}`); }
            catch (e) { await ctx.reply(`❌ ${e?.message || e}`); }
        }
    },
    {
        name: 'mode-public',
        aliases: ['public','setpublic'],
        category: 'owner',
        owner: true,
        desc: 'Set bot to public mode',
        run: async (ctx) => { global.public = true; await ctx.reply('✅ Bot is now PUBLIC'); }
    },
    {
        name: 'mode-private',
        aliases: ['self','setprivate','privatemode'],
        category: 'owner',
        owner: true,
        desc: 'Set bot to self/private mode',
        run: async (ctx) => { global.public = false; await ctx.reply('✅ Bot is now SELF/PRIVATE'); }
    },
];
