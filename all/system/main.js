/*════════════════════════════
 *  💎  MONEYHEIST AI LOADER by Mzazi Tech Inc.
 *════════════════════════════
 *  🤖  Bot Name    : MONEYHEIST AI
 *  👑  Owner       : Mzazi Tech Inc.
 *  💎  Version     : Premium Edition
 *  ⚡  Loader      : Enhanced Boot System
 ══════════════════════════
 */

import '../../settings.js'

import pino from 'pino'
import haruka from "@ryuu-reinzz/haruka-lib";
import { Boom } from '@hapi/boom'
import fs from 'fs'
import chalk from 'chalk'
import { fileTypeFromStream } from 'file-type'
import path from 'path'
import axios from 'axios'

import {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid
} from '../library/exif.js'

import {
  unixTimestampSeconds,
  generateMessageTag,
  processTime,
  getRandom,
  getBuffer,
  getImg,
  fetchJson,
  runtime,
  clockString,
  sleep,
  isUrl,
  getTime,
  formatDate,
  tanggal,
  jam,
  formatp,
  json,
  logic,
  generateProfilePicture,
  bytesToSize,
  getSizeMedia,
  parseMention,
  getGroupAdmins,
  protex,
  loadModule,
  smsg,
  reSize
} from '../library/myfunc.js'

import neoConnect, {
  delay,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  jidDecode,
  proto,
  Browsers,
  generateWAMessage,
  jidNormalizedUser
} from '@whiskeysockets/baileys'

import NodeCache from 'node-cache'
import Pino from 'pino'
import readline from 'readline'
import { parsePhoneNumber } from 'libphonenumber-js'
import makeWASocket from '@whiskeysockets/baileys'
import { createRequire } from 'module'
import { execSync } from 'child_process'

const require = createRequire(import.meta.url)

// Bot reloads the handler module on every change, which adds new listeners
// each time. Lift the cap so Node stops printing MaxListenersExceededWarning.
process.setMaxListeners(50)
try { require('events').EventEmitter.defaultMaxListeners = 50 } catch {}

let mainHandler;
const loadHandler = async () => {
    delete await import.meta.resolve('./mzazi.js'); // optional, pastikan cache clear
    mainHandler = (await import(`./mzazi.js?update=${Date.now()}`)).default;
};
loadHandler();

// 🚀 Boot the modular command registry (auto-loads commands/**)
(async () => {
    try {
        const reg = await import('./commandRegistry.js');
        await reg.loadAllCommands(true);
        global.__commandRegistry = reg;
    } catch (e) {
        console.log('[CommandRegistry] failed to load:', e?.message || e);
    }
})();
const requiredModules = [
  '@whiskeysockets/baileys',
  'pino',
  'chalk',
  'figlet',
  'ora'
]

for (const mod of requiredModules) {
  try {
    require.resolve(mod)
  } catch (err) {
    console.log(`[ Auto Installer By Mzazi ] Module ${mod} belum ada. Menginstall...`)
    execSync(`npm install ${mod}`, { stdio: 'inherit' })
  }
}


function makeInMemoryStore({ logger } = {}) {
  const store = {
    chats: {},
    messages: {},
    contacts: {},
    groupMetadata: {},

    bind(ev) {
      ev.on('chats.upsert', chats => {
        for (const chat of chats) {
          store.chats[chat.id] = chat
        }
      })

      ev.on('messages.upsert', ({ messages }) => {
        for (const msg of messages) {
          const jid = msg.key.remoteJid
          store.messages[jid] = store.messages[jid] || []
          store.messages[jid].push(msg)
        }
      })

      ev.on('contacts.upsert', contacts => {
        for (const c of contacts) {
          store.contacts[c.id] = c
        }
      })

      ev.on('groups.update', groups => {
        for (const g of groups) {
          store.groupMetadata[g.id] = g
        }
      })
    },

    writeToFile(file) {
      fs.writeFileSync(file, JSON.stringify({
        chats: store.chats,
        messages: store.messages,
        contacts: store.contacts,
        groupMetadata: store.groupMetadata
      }, null, 2))
    },

    readFromFile(file) {
      if (!fs.existsSync(file)) return
      const data = JSON.parse(fs.readFileSync(file))
      store.chats = data.chats || {}
      store.messages = data.messages || {}
      store.contacts = data.contacts || {}
      store.groupMetadata = data.groupMetadata || {}
    }
  }

  return store
}
const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})

// Func load feature 
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

let lastCases = {}; // simpan state lama

function loadCase() {
  let file = fs.readFileSync("./all/system/mzazi.js", "utf-8");
  let lines = file.split("\n");
  let menu = {};
  let currentCategory = null;

  for (let line of lines) {
    // Deteksi kategori
    let catMatch = line.match(/\/\/—+\[ Menu (.+?) \]—+\/\//i);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      if (!menu[currentCategory]) menu[currentCategory] = [];
    }

    // Deteksi case
    let caseMatch = line.match(/case\s+['"]([^'"]+)['"]\s*:/i);
    if (caseMatch && currentCategory) {
      menu[currentCategory].push(caseMatch[1]);
    }
  }

  global.menucase = menu;

  // log rapih
  let total = Object.values(menu).reduce((a, b) => a + b.length, 0);
  console.log(`${colors.cyan}[${total}]${colors.green} Case Berhasil Diload${colors.reset}`);

  return menu;
}
async function initLidOwner(neo) {
  if (global.lidownernumber) return global.lidownernumber;

  const jid = global.ownernumber + "@s.whatsapp.net";
  const lid = await neo.signalRepository.lidMapping
    .getLIDForPN(jid);

  global.lidownernumber = lid.split("@")[0];
  return global.lidownernumber;
}

// === load pertama
lastCases = loadCase();

// === pantau perubahan file
const caseFile = path.resolve("./all/system/mzazi.js");

fs.watch(caseFile, (eventType, filename) => {
  if (eventType === "change") {
    try {
      const newCases = loadCase();

      // cari perbedaan
      let added = [];
      let removed = [];

      for (let cat in newCases) {
        for (let c of newCases[cat]) {
          if (!Object.values(lastCases).flat().includes(c)) {
            added.push(c);
          }
        }
      }

      for (let cat in lastCases) {
        for (let c of lastCases[cat]) {
          if (!Object.values(newCases).flat().includes(c)) {
            removed.push(c);
          }
        }
      }

      // log perubahan
      added.forEach(c =>
      console.log(`${colors.green}[ + ] Case ditambahkan:${colors.reset} ${c}`)
      );
      removed.forEach(c =>
        console.log(`${colors.red}[ - ] Case dihapus:${colors.reset} ${c}`)
      );

      lastCases = newCases;
    } catch (e) {
      console.error(colors.red, "Gagal reload case:", e, colors.reset);
    }
  }
});

let numbs = null
let owner = JSON.parse(fs.readFileSync('./database/owner.json'))
let db = JSON.parse(fs.readFileSync('./database/set.json'));

const pairingCode = !!numbs || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startneo() {
  await protex();

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const msgRetryCounterCache = new NodeCache();
  const property =  {
  proto,
  generateWAMessageFromContent,
  jidDecode,
  downloadContentFromMessage,
  prepareWAMessageMedia,
  generateMessageID,
  generateWAMessage
};

  const neo = makeWASocket({
    version,
    logger: Pino({ level: 'silent' }),
    browser: Browsers.windows('Firefox'),
    printQRInTerminal: !process.argv.includes("--pairing-code"),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" })),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    getMessage: async (key) => {
      const jid = jidNormalizedUser(key.remoteJid);
      const msg = await store.loadMessage(jid, key.id);
      return msg?.message || "";
    },
  });
  haruka.addProperty(neo, store, smsg, property);

  store.bind(neo.ev);

  const isPairing = process.argv.includes("--pairing-code");
  const pairingName = global.pairing;

  if (isPairing && !neo.authState.creds.registered) {
    let nomor;
    if (process.env.PAIR_NUMBER) {
      nomor = process.env.PAIR_NUMBER.replace(/[^0-9]/g, '');
      console.log(chalk.cyan(`\n[MONEYHEIST AI] Using PAIR_NUMBER from env: ${nomor}`));
    } else {
      console.log(chalk.cyan(`\n[MONEYHEIST AI] Enter WhatsApp number :`));
      nomor = await question(chalk.cyan(`EXAMPLE: +254xxx : `));
      nomor = nomor.replace(/[^0-9]/g, '');
    }

    console.log(chalk.green(`\n😈 Target Backdoor: ${chalk.bold(nomor)}`));

    setTimeout(async () => {
      try {
        const code = await neo.requestPairingCode(nomor, pairingName);
        const format = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.bgGreen.black(" Here's the pairing "), chalk.white.bold(format));
      } catch (err) {
        console.error(chalk.red("enter pairing code!"), err);
      }
    }, 3000);
  }

    neo.ev.on('messages.upsert', async chatUpdate => {
    try {
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
            ? mek.message.ephemeralMessage.message
            : mek.message;

        if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
        if (!neo.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;

        const m = smsg(neo, mek, store);

        await loadHandler();
        mainHandler(neo, m, chatUpdate, store);
    } catch (err) {
        console.log(err);
    }
});

    neo.ev.on('messages.upsert', async chatUpdate => {
        try {
        const mek = chatUpdate.messages[0];
        if (!mek || !mek.key) return;

        // Auto view status jika aktif
        if (mek.key.remoteJid === 'status@broadcast' && db.settings.autoview) {
            await neo.readMessages([mek.key]);
        }
    } catch (err) {
        console.error('AutoView Error:', err);
    }
});

    // ──────────────────[ AntiDelete + AntiViewOnce cache & handlers ]──────────────────
    if (!global.msgCache) global.msgCache = new Map();
    const MSG_CACHE_LIMIT = 1500;

    const cacheMessage = (mek) => {
        try {
            if (!mek || !mek.key || !mek.key.id || !mek.message) return;
            if (mek.key.remoteJid === 'status@broadcast') return;
            global.msgCache.set(mek.key.id, {
                key: mek.key,
                message: mek.message,
                participant: mek.key.participant || mek.participant || mek.key.remoteJid,
                pushName: mek.pushName || '',
                ts: Date.now()
            });
            if (global.msgCache.size > MSG_CACHE_LIMIT) {
                const firstKey = global.msgCache.keys().next().value;
                global.msgCache.delete(firstKey);
            }
        } catch (e) { /* noop */ }
    };

    const ownerJid = () => (global.ownernumber || '').replace(/\D/g, '') + '@s.whatsapp.net';

    // Cache every incoming message for later antidelete retrieval
    neo.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            // unwrap ephemeral / device-sent / forwarded wrappers so cache + viewOnce
            // detection mirror what the user actually sees, regardless of key order
            let msg = mek.message;
            if (msg.ephemeralMessage)        msg = msg.ephemeralMessage.message        || msg;
            if (msg.deviceSentMessage)       msg = msg.deviceSentMessage.message       || msg;
            if (msg.documentWithCaptionMessage) msg = msg.documentWithCaptionMessage.message || msg;
            cacheMessage({ ...mek, message: msg });

            // ── AntiViewOnce: auto reveal view-once media without any command
            if (db.settings && db.settings.antiviewonce && !mek.key.fromMe) {
                const inner =
                    msg.viewOnceMessage?.message ||
                    msg.viewOnceMessageV2?.message ||
                    msg.viewOnceMessageV2Extension?.message ||
                    null;
                if (inner) {
                    try {
                        const type = Object.keys(inner).find(k =>
                            k === 'imageMessage' || k === 'videoMessage' || k === 'audioMessage'
                        );
                        if (!type) return;
                        const node = inner[type];
                        const stream = await downloadContentFromMessage(
                            node,
                            type.replace('Message', '')
                        );
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                        const senderTag = (mek.key.participant || mek.key.remoteJid || '').split('@')[0];
                        const cap = `👁️‍🗨️ *AntiViewOnce*\n› From: @${senderTag}\n› Caption: ${node.caption || '_no caption_'}`;

                        const target = mek.key.remoteJid;
                        if (type === 'imageMessage') {
                            await neo.sendMessage(target, { image: buffer, caption: cap, mentions: [mek.key.participant || mek.key.remoteJid] }, { quoted: mek });
                        } else if (type === 'videoMessage') {
                            await neo.sendMessage(target, { video: buffer, caption: cap, mentions: [mek.key.participant || mek.key.remoteJid] }, { quoted: mek });
                        } else if (type === 'audioMessage') {
                            await neo.sendMessage(target, { audio: buffer, mimetype: 'audio/mp4', ptt: !!node.ptt }, { quoted: mek });
                            await neo.sendMessage(target, { text: cap, mentions: [mek.key.participant || mek.key.remoteJid] }, { quoted: mek });
                        }
                    } catch (e) {
                        console.error('AntiViewOnce error:', e?.message || e);
                    }
                }
            }
        } catch (err) {
            console.error('Cache/AntiViewOnce upsert error:', err?.message || err);
        }
    });

    // AntiDelete: react to message deletions (protocolMessage REVOKE)
    neo.ev.on('messages.update', async (updates) => {
        try {
            if (!db.settings || !db.settings.antidelete) return;
            for (const u of updates) {
                const isRevoke =
                    (u.update && u.update.message === null) ||
                    (u.update && u.update.messageStubType === 68); // REVOKE
                if (!isRevoke) continue;

                const cached = global.msgCache.get(u.key.id);
                if (!cached) continue;
                if (cached.key.fromMe) continue; // don't echo our own deletions

                const chat = u.key.remoteJid;
                const sender = cached.participant || chat;
                const senderTag = sender.split('@')[0];
                const header = `🗑️ *AntiDelete*\n› Deleted by: @${senderTag}\n› Chat: ${chat}\n› Time: ${new Date().toLocaleString()}`;

                // Send the header, then forward the original content
                await neo.sendMessage(chat, { text: header, mentions: [sender] });

                try {
                    await neo.relayMessage(chat, cached.message, { messageId: undefined });
                } catch (e) {
                    // Fallback: try copyNForward via a fake WAMessage
                    try {
                        const fake = proto.WebMessageInfo.fromObject({
                            key: cached.key,
                            message: cached.message,
                            participant: cached.participant
                        });
                        await neo.copyNForward(chat, fake, false);
                    } catch (e2) {
                        await neo.sendMessage(chat, {
                            text: `(Could not retrieve original media: ${e2?.message || e2})`
                        });
                    }
                }

                global.msgCache.delete(u.key.id);
            }
        } catch (err) {
            console.error('AntiDelete error:', err?.message || err);
        }
    });

    neo.ev.on('group-participants.update', async (update) => {
    const { id, participants, action, author } = update;

    // ── AntiPromote / AntiDemote ──
    // Compare by the user portion (the digits before '@') because modern WhatsApp
    // mixes '@s.whatsapp.net' and '@lid' formats inside the same group, which
    // makes full-JID equality checks silently fail.
    try {
        if ((action === 'promote' && db.settings?.antipromote) ||
            (action === 'demote'  && db.settings?.antidemote)) {

            const userOf = (j) => (j ? String(j).split('@')[0].split(':')[0] : '');

            const meta    = await neo.groupMetadata(id).catch(() => null);
            const botUser = userOf(neo.user?.id);
            const ownerU  = (global.ownernumber || '').replace(/\D/g, '');

            // Bot must be admin to reverse the action
            const botIsAdmin = meta?.participants?.some(p =>
                userOf(p.id) === botUser && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            const actorUser = userOf(author);
            const ownerOfGroupUser = userOf(meta?.owner);

            // Allow bot itself, configured owner, and group's WhatsApp owner.
            // If author is missing, *don't* allow by default — that case used to
            // make the handler silently no-op for some Baileys builds.
            const isAllowedActor =
                actorUser && (
                    actorUser === botUser ||
                    actorUser === ownerU  ||
                    actorUser === ownerOfGroupUser
                );

            if (!botIsAdmin) {
                console.log(`[AntiP/D] skip in ${id}: bot is not admin (botUser=${botUser})`);
            } else if (isAllowedActor) {
                // authorized actor — leave it alone
            } else {
                const reverse = action === 'promote' ? 'demote' : 'promote';
                const targets = participants
                    .map(p => (typeof p === 'string' ? p : p.id))
                    .filter(j => j && userOf(j) !== botUser && userOf(j) !== ownerU);

                if (targets.length) {
                    await neo.groupParticipantsUpdate(id, targets, reverse).catch(err =>
                        console.error('[AntiP/D] reverse failed:', err?.message || err)
                    );
                    const tagList  = targets.map(j => '@' + userOf(j)).join(', ');
                    const actorTag = actorUser ? '@' + actorUser : 'an admin';
                    const mentions = [...targets, ...(author ? [author] : [])];
                    await neo.sendMessage(id, {
                        text: `🛡️ *Anti${action[0].toUpperCase()}${action.slice(1)}*\n${actorTag} tried to ${action} ${tagList}. Reverted.`,
                        mentions
                    }).catch(() => {});
                }
            }
        }
    } catch (e) {
        console.error('AntiPromote/Demote error:', e?.message || e);
    }

    const groupName = await neo.getName(id);
    const bgUrl = 'https://telegra.ph/file/265c672094dfa87caea19.jpg';
    
    for (let p of participants) {
        let num = typeof p === 'string' ? p : p.id;
        if (!num) continue;

        let userTag = '@' + num.split('@')[0];
        let namanya;

        try {
            namanya = await neo.getName(num);
        } catch {
            namanya = userTag;
        }

        let ppUrl;
        try {
            ppUrl = await neo.profilePictureUrl(num, 'image');
        } catch {
            ppUrl = 'https://telegra.ph/file/265c672094dfa87caea19.jpg';
        }

        // Build a clean visible tag — strip the :device suffix so the @
        // displays a normal phone number instead of "@2547xx:5"
        const cleanTag = '@' + (num.split('@')[0].split(':')[0]);

        if (action === 'add' && db.groups && db.groups[id] && db.groups[id].welcome) {
            let teks = (db.groups[id].welcomeText || `Welcome ${namanya} (${cleanTag}) to *${groupName}*! 🎉`)
                .replace(/@user/gi, cleanTag)
                .replace(/@name/gi, namanya || cleanTag)
                .replace(/@group/gi, groupName);

            let apiUrl = `https://api.ryuu-dev.offc.my.id/tools/WelcomeLeave?desc=${encodeURIComponent(teks)}&title=${encodeURIComponent(namanya)}&profile=${encodeURIComponent(ppUrl)}&background=${encodeURIComponent(bgUrl)}`;

            await neo.sendMessage(id, {
                image: { url: apiUrl },
                caption: teks,
                mentions: [num],
                contextInfo: {
                    externalAdReply: {
                        title: `Welcome ${namanya}`,
                        body: groupName,
                        thumbnailUrl: ppUrl,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            });

        } else if (action === 'remove' && db.groups && db.groups[id] && db.groups[id].goodbye) {
            let teks = (db.groups[id].goodbyeText || `Goodbye ${namanya} (${cleanTag}). 👋  We'll miss you in *${groupName}*.`)
                .replace(/@user/gi, cleanTag)
                .replace(/@name/gi, namanya || cleanTag)
                .replace(/@group/gi, groupName);

            let apiUrl = `https://api.ryuu-dev.offc.my.id/tools/WelcomeLeave?desc=${encodeURIComponent(teks)}&title=${encodeURIComponent(namanya)}&profile=${encodeURIComponent(ppUrl)}&background=${encodeURIComponent(bgUrl)}`;

            await neo.sendMessage(id, {
                image: { url: apiUrl },
                caption: teks,
                mentions: [num],
                contextInfo: {
                    externalAdReply: {
                        title: `Goodbye ${namanya}`,
                        body: groupName,
                        thumbnailUrl: ppUrl,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            });
        }
    }
});
    neo.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    neo.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = neo.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            }
        }
    })

    neo.getName = async (jid, withoutContact = false) => {
  let id = neo.decodeJid(jid)

  withoutContact = neo.withoutContact || withoutContact
  let v

  if (id.endsWith('@g.us')) {
    v = store.contacts[id] || {}
    if (!(v.name || v.subject)) v = await neo.groupMetadata(id) || {}
    return (
      v.name ||
      v.subject ||
      id
    )
  }

  v =
    id === '0@s.whatsapp.net'
      ? { id, name: 'WhatsApp' }
      : id === neo.decodeJid(neo.user.id)
      ? neo.user
      : store.contacts[id] || {}

  return (
    (withoutContact ? '' : v.name) ||
    v.subject ||
    v.verifiedName ||
    id
  )
}
    global.selfmode = false
    neo.public = true

    neo.serializeM = (m) => smsg(neo, m, store)

neo.ev.on("connection.update", async (s) => {
    const { connection, lastDisconnect } = s;
    if (connection == "open") {
        console.log(chalk.magenta(`< # > Bot Berhasil Tersambung!`));
        
        try {
            // AUTO JOIN WHATSAPP CHANNEL/NEWSLETTER (SILENT)
            // Berikan delay sebelum mulai follow channel
            await sleep(2000);
            
            // Channel 1
            try {
                await neo.newsletterFollow('120363406324565188@newsletter');
                await sleep(1000); // Delay 1 detik
            } catch (err) {
                // Jika error karena structure, coba format ulang
                if (err.message.includes('unexpected response structure')) {
                    try {
                        console.log(chalk.yellow('⚠️ Retrying channel 1 with alternative method...'));
                        await neo.sendMessage('120363406324565188@newsletter', { text: '' });
                        await sleep(500);
                    } catch (err2) {
                        console.log(chalk.yellow('⚠️ Gagal join channel 1 setelah retry:', err2.message));
                    }
                } else {
                    console.log(chalk.yellow('⚠️ Gagal join channel 1:', err.message));
                }
            }
            
            // Channel 2
            try {
                await neo.newsletterFollow('120363419967954188@newsletter');
                await sleep(1000); // Delay 1 detik
            } catch (err) {
                if (err.message.includes('unexpected response structure')) {
                    try {
                        console.log(chalk.yellow('⚠️ Retrying channel 2 with alternative method...'));
                        await neo.sendMessage('120363419967954188@newsletter', { text: '' });
                        await sleep(500);
                    } catch (err2) {
                        console.log(chalk.yellow('⚠️ Gagal join channel 2 setelah retry:', err2.message));
                    }
                } else {
                    console.log(chalk.yellow('⚠️ Gagal join channel 2:', err.message));
                }
            }
            
            // Channel 3
            try {
                await neo.newsletterFollow('120363420619530273@newsletter');
                await sleep(1000); // Delay 1 detik
            } catch (err) {
                if (err.message.includes('unexpected response structure')) {
                    try {
                        console.log(chalk.yellow('⚠️ Retrying channel 3 with alternative method...'));
                        await neo.sendMessage('120363420619530273@newsletter', { text: '' });
                        await sleep(500);
                    } catch (err2) {
                        console.log(chalk.yellow('⚠️ Gagal join channel 3 setelah retry:', err2.message));
                    }
                } else {
                    console.log(chalk.yellow('⚠️ Gagal join channel 3:', err.message));
                }
            }
            
        } catch (error) {
            // Hanya tampilkan error jika semua gagal
            if (!error.message.includes('unexpected response structure')) {
                console.log(chalk.red('❌ Gagal join channel:', error.message));
            }
        }
        
        await loadCase();
        await loadModule(neo);
        await initLidOwner(neo);
    }
    
    if (
        connection === "close" &&
        lastDisconnect &&
        lastDisconnect.error &&
        lastDisconnect.error.output.statusCode != 401
    ) {
        startneo();
    }
});

neo.ev.on('creds.update', saveCreds);
neo.ev.on("messages.upsert", () => { });

    neo.sendText = (jid, text, quoted = '', options) => neo.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    })
    neo.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
    let mentioned = new Set()
    let matches = text.matchAll(/@([a-zA-Z0-9]{5,})/g)
    for (let m of matches) {
        mentioned.add(m[1] + '@lid')
    }
    if (options.mentionJid) {
        for (let j of options.mentionJid) {
            mentioned.add(j)
        }
        delete options.mentionJid
    }

    return neo.sendMessage(jid, {
        text,
        mentions: [...mentioned],
        ...options
    }, { quoted })
}
    neo.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options)
        } else {
            buffer = await imageToWebp(buff)
        }

        await neo.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        })
        return buffer
    }
    neo.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options)
        } else {
            buffer = await videoToWebp(buff)
        }

        await neo.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        })
        return buffer
    }
    neo.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await fileTypeFromStream(buffer)
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        // save to file
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    neo.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await fileTypeFromStream(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        let filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
        size: await getSizeMedia(data),
            ...type,
            data
        }

    }

    neo.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
  let type = await neo.getFile(path, true);
  let { res, data: file, filename: pathFile } = type;

  if (res && res.status !== 200 || file.length <= 65536) {
    try {
      throw {
        json: JSON.parse(file.toString())
      };
    } catch (e) {
      if (e.json) throw e.json;
    }
  }

  let opt = {
    filename
  };

  if (quoted) opt.quoted = quoted;
  if (!type) options.asDocument = true;

  let mtype = '',
    mimetype = type.mime,
    convert;
  
  if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
  else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
  else if (/video/.test(type.mime)) mtype = 'video';
  else if (/audio/.test(type.mime)) {
    convert = await (ptt ? toPTT : toAudio)(file, type.ext);
    file = convert.data;
    pathFile = convert.filename;
    mtype = 'audio';
    mimetype = 'audio/ogg; codecs=opus';
  } else mtype = 'document';

  if (options.asDocument) mtype = 'document';

  delete options.asSticker;
  delete options.asLocation;
  delete options.asVideo;
  delete options.asDocument;
  delete options.asImage;

  let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
  let m;

  try {
    m = await neo.sendMessage(jid, message, { ...opt, ...options });
  } catch (e) {
    //console.error(e)
    m = null;
  } finally {
    if (!m) m = await neo.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
    file = null;
    return m;
  }
}

    neo.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        return buffer
    }
}
startneo()


process.on('uncaughtException', function (err) {
let e = String(err)
/*if (e.includes("conflict")) return
if (e.includes("Socket connection timeout")) return
if (e.includes("not-authorized")) return
if (e.includes("already-exists")) return
if (e.includes("rate-overlimit")) return
if (e.includes("Connection Closed")) return
if (e.includes("Timed Out")) return
if (e.includes("Value not found")) return*/
console.log('Caught exception: ', err)
})