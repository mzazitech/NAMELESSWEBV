/*════════════════════════════════════════
 *  Multi-tenant Baileys instance manager
 *  Each user gets an isolated WhatsApp socket
 *══════════════════════════════════════════*/
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import Pino from 'pino';
import NodeCache from 'node-cache';
import baileysPkg from '@whiskeysockets/baileys';
const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    proto,
    generateWAMessageFromContent,
    jidDecode,
    downloadContentFromMessage,
    prepareWAMessageMedia,
    generateMessageID,
    generateWAMessage,
    DisconnectReason,
} = baileysPkg;

import haruka from '@ryuu-reinzz/haruka-lib';
import { smsg } from '../all/library/myfunc.js';
import { userSessionDir, userSettingsForBot, getUser } from './users.js';

const PROPERTY = {
    proto, generateWAMessageFromContent, jidDecode, downloadContentFromMessage,
    prepareWAMessageMedia, generateMessageID, generateWAMessage,
};

class BotManager extends EventEmitter {
    constructor() {
        super();
        this.bots = new Map();   // userId -> { sock, status, pairingCode, lastActivity }
        this.handler = null;
        this.handlerTs = 0;
    }

    async loadHandler(force = false) {
        const now = Date.now();
        if (!force && this.handler && (now - this.handlerTs) < 5 * 60 * 1000) return this.handler;
        this.handler = (await import(`../all/system/mzazi.js?u=${now}`)).default;
        this.handlerTs = now;
        return this.handler;
    }

    getStatus(userId) {
        const b = this.bots.get(userId);
        if (!b) return { status: 'offline' };
        return {
            status: b.status,
            pairingCode: b.pairingCode || null,
            phone: b.phone || null,
            startedAt: b.startedAt || null,
        };
    }

    async start(userId, phoneNumber) {
        const u = await getUser(userId);
        if (!u) throw new Error('user not found');
        if (this.bots.has(userId)) {
            const b = this.bots.get(userId);
            if (b.status === 'connected' || b.status === 'connecting' || b.status === 'pairing') {
                return this.getStatus(userId);
            }
            try { b.sock?.end?.(); } catch {}
        }

        const sessionDir = userSessionDir(userId);
        const cleanPhone = phoneNumber ? String(phoneNumber).replace(/[^0-9]/g, '') : null;

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();
        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger: Pino({ level: 'silent' }),
            browser: Browsers.windows('Firefox'),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' })),
            },
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: true,
            getMessage: async () => '',
        });

        // Inject per-user settings BEFORE haruka so commands see them
        sock.userSettings = userSettingsForBot(u);
        sock.public = sock.userSettings.public;

        // Tiny in-memory store for haruka
        const store = {
            chats: {}, messages: {}, contacts: {}, groupMetadata: {},
            bind(ev) {
                ev.on('chats.upsert', cs => cs.forEach(c => store.chats[c.id] = c));
                ev.on('messages.upsert', ({ messages }) => {
                    for (const msg of messages) {
                        const jid = msg.key.remoteJid;
                        store.messages[jid] = store.messages[jid] || [];
                        store.messages[jid].push(msg);
                    }
                });
                ev.on('contacts.upsert', cs => cs.forEach(c => store.contacts[c.id] = c));
                ev.on('groups.update', gs => gs.forEach(g => store.groupMetadata[g.id] = g));
            },
            loadMessage: async () => '',
        };
        haruka.addProperty(sock, store, smsg, PROPERTY);
        store.bind(sock.ev);

        const entry = {
            sock, store, status: 'connecting', pairingCode: null,
            phone: cleanPhone, startedAt: Date.now(), userId,
        };
        this.bots.set(userId, entry);

        // Pairing flow if not registered
        if (cleanPhone && !sock.authState.creds.registered) {
            entry.status = 'pairing';
            setTimeout(async () => {
                try {
                    const pairingName = u.settings?.pairingName || 'DARKNODE';
                    const code = await sock.requestPairingCode(cleanPhone, pairingName);
                    const fmt = code?.match(/.{1,4}/g)?.join('-') || code;
                    entry.pairingCode = fmt;
                    console.log(`[BotMgr] pairing code for ${u.email}: ${fmt}`);
                    this.emit('pairing', { userId, code: fmt });
                } catch (e) {
                    console.log('[BotMgr] pairing error', e?.message || e);
                    entry.status = 'error';
                    entry.lastError = e?.message || String(e);
                }
            }, 2500);
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (up) => {
            const { connection, lastDisconnect } = up;
            if (connection === 'open') {
                entry.status = 'connected';
                entry.pairingCode = null;
                entry.connectedAt = Date.now();
                console.log(`[BotMgr] ${u.email} connected`);
                this.emit('connected', { userId });
            } else if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode;
                const isLogout = code === DisconnectReason?.loggedOut;
                console.log(`[BotMgr] ${u.email} closed (code=${code}) logout=${isLogout}`);
                entry.status = isLogout ? 'logged_out' : 'disconnected';
                if (!isLogout) {
                    setTimeout(() => {
                        if (this.bots.get(userId) === entry) {
                            this.start(userId).catch(err => console.log('[BotMgr] reconnect failed', err?.message));
                        }
                    }, 4000);
                }
                this.emit('disconnected', { userId, isLogout });
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek?.message) return;
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
                    ? mek.message.ephemeralMessage.message : mek.message;
                if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
                if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
                if (mek.key.id?.startsWith('BAE5') && mek.key.id.length === 16) return;

                const m = smsg(sock, mek, store);
                const handler = await this.loadHandler();
                handler(sock, m, chatUpdate, store);
            } catch (err) {
                console.log(`[BotMgr][${u.email}] msg handler error`, err?.message || err);
            }
        });

        return this.getStatus(userId);
    }

    async stop(userId) {
        const b = this.bots.get(userId);
        if (!b) return false;
        try { b.sock?.end?.(); } catch {}
        try { b.sock?.logout?.(); } catch {}
        this.bots.delete(userId);
        return true;
    }

    async logout(userId) {
        const b = this.bots.get(userId);
        if (b) {
            try { await b.sock?.logout?.(); } catch {}
            try { b.sock?.end?.(); } catch {}
        }
        this.bots.delete(userId);
        // wipe session
        const dir = path.resolve(`./sessions/${userId}`);
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
        fs.mkdirSync(dir, { recursive: true });
        return true;
    }

    async refreshSettings(userId) {
        const b = this.bots.get(userId);
        const u = await getUser(userId);
        if (b && u) {
            b.sock.userSettings = userSettingsForBot(u);
            b.sock.public = b.sock.userSettings.public;
        }
    }

    activeCount() { return this.bots.size; }
}

export const botManager = new BotManager();
export default botManager;
