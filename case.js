// ==================== GROUP COMMANDS (SWITCH CASE) ====================
switch (command) {
    // ─────────────────── GROUP INFO & UTILITIES ───────────────────
    case 'grouplink':
    case 'linkgc': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to get the group link.');
        neo.groupInviteCode(from).then(code => {
            m.reply(`https://chat.whatsapp.com/${code}`);
        }).catch(() => m.reply('❌ Failed to get group link.'));
    }
    break;

    case 'tagall':
    case 'everyone': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can use this command.');
        let teks = text ? text : '『 TAG ALL 』';
        let member = groupMembers.map(v => v.id).join('\n');
        m.reply(`${teks}\n\n${member}`);
    }
    break;

    case 'hidetag': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can use this command.');
        neo.sendMessage(from, { text: text ? text : '👻', mentions: groupMembers.map(v => v.id) }, { quoted: m });
    }
    break;

    // ─────────────────── GROUP ADMIN TOOLS ───────────────────
    case 'kick':
    case 'remove': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can kick members.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to kick members.');
        let users = m.mentionedJid.length > 0 ? m.mentionedJid : (quoted ? [quoted.sender] : []);
        if (users.length === 0) return m.reply('❌ Mention or reply to the user you want to kick.');
        for (let user of users) {
            if (user === botNumber) return m.reply('❌ I cannot kick myself.');
            await neo.groupParticipantsUpdate(from, [user], 'remove');
        }
        m.reply(`✅ Successfully kicked ${users.length} member(s).`);
    }
    break;

    case 'add': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can add members.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to add members.');
        let users = m.mentionedJid.length > 0 ? m.mentionedJid : [];
        if (users.length === 0 && args.length > 0) {
            // if number provided, format it
            let num = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            users = [num];
        }
        if (users.length === 0) return m.reply('❌ Mention or provide the number to add.');
        for (let user of users) {
            await neo.groupParticipantsUpdate(from, [user], 'add');
        }
        m.reply(`✅ Successfully added ${users.length} member(s).`);
    }
    break;

    case 'promote': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can promote members.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to promote members.');
        let users = m.mentionedJid.length > 0 ? m.mentionedJid : (quoted ? [quoted.sender] : []);
        if (users.length === 0) return m.reply('❌ Mention or reply to the user you want to promote.');
        for (let user of users) {
            if (user === botNumber) return m.reply('❌ I cannot promote myself.');
            await neo.groupParticipantsUpdate(from, [user], 'promote');
        }
        m.reply(`✅ Successfully promoted ${users.length} member(s).`);
    }
    break;

    case 'demote': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can demote members.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to demote members.');
        let users = m.mentionedJid.length > 0 ? m.mentionedJid : (quoted ? [quoted.sender] : []);
        if (users.length === 0) return m.reply('❌ Mention or reply to the user you want to demote.');
        for (let user of users) {
            if (user === botNumber) return m.reply('❌ I cannot demote myself.');
            await neo.groupParticipantsUpdate(from, [user], 'demote');
        }
        m.reply(`✅ Successfully demoted ${users.length} member(s).`);
    }
    break;

    // ─────────────────── GROUP SETTINGS ───────────────────
    case 'group':
    case 'grup': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can change group settings.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to change group settings.');
        if (!args[0]) return m.reply('⚡ Options: open / close');
        if (args[0] === 'open') {
            await neo.groupSettingUpdate(from, 'not_announcement');
            m.reply('✅ Group has been opened (everyone can send messages).');
        } else if (args[0] === 'close') {
            await neo.groupSettingUpdate(from, 'announcement');
            m.reply('✅ Group has been closed (only admins can send messages).');
        } else {
            m.reply('❌ Invalid option. Use "open" or "close".');
        }
    }
    break;

    case 'setname':
    case 'setgcname': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can change group name.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to change group name.');
        if (!text) return m.reply('❌ Provide the new group name.');
        await neo.groupUpdateSubject(from, text);
        m.reply(`✅ Group name changed to: ${text}`);
    }
    break;

    case 'setdesc':
    case 'setdesk': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can change group description.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to change group description.');
        if (!text) return m.reply('❌ Provide the new description.');
        await neo.groupUpdateDescription(from, text);
        m.reply('✅ Group description updated.');
    }
    break;

    case 'setppgc':
    case 'setppgrup': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can change group icon.');
        if (!isBotAdmins) return m.reply('❌ I need to be admin to change group icon.');
        if (!quoted || !/image/.test(mime)) return m.reply('❌ Reply to an image with caption.');
        let media = await quoted.download();
        let { img } = await generateProfilePicture(media);
        await neo.updateProfilePicture(from, img);
        m.reply('✅ Group icon updated.');
    }
    break;

    // ─────────────────── LEAVE GROUP ───────────────────
    case 'leave':
    case 'out': {
        if (!isGroup) return m.reply('❌ This command can only be used in groups.');
        if (!isAdmins && !isGroupOwner && !isCreator) return m.reply('❌ Only admins can ask me to leave.');
        await m.reply('👋 Goodbye!');
        await neo.groupLeave(from);
    }
    break;

    // ─────────────────── DEFAULT (if no group command matches) ───────────────────
    default:
        // Optional: you can put other non-group commands here, or just let the handler continue
        break;
}