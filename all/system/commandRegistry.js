/*════════════════════════════════════════════════
 *  💎  DARKNODE COMMAND REGISTRY
 *  Auto-loads modular commands from /commands/**
 *══════════════════════════════════════════════*/

import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const COMMANDS_ROOT = path.resolve(__dirname, '..', '..', 'commands');

const registry  = new Map();   // commandName -> def
const byCategory = new Map();  // category -> [def]
let loaded = false;

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full, files);
        else if (e.isFile() && e.name.endsWith('.js') && !e.name.startsWith('_')) files.push(full);
    }
    return files;
}

async function loadFile(file) {
    try {
        const mod = await import(pathToFileURL(file).href + `?v=${Date.now()}`);
        const exported = mod.default;
        if (!exported) return 0;
        const list = Array.isArray(exported) ? exported : [exported];
        let n = 0;
        for (const cmd of list) {
            if (!cmd || typeof cmd.run !== 'function' || !cmd.name) continue;
            const names = [cmd.name, ...(cmd.aliases || [])].map(s => String(s).toLowerCase());
            for (const nm of names) registry.set(nm, cmd);
            const cat = cmd.category || 'misc';
            if (!byCategory.has(cat)) byCategory.set(cat, []);
            byCategory.get(cat).push(cmd);
            n++;
        }
        return n;
    } catch (err) {
        console.log('[cmdLoader] failed', file, err?.message);
        return 0;
    }
}

export async function loadAllCommands(verbose = true) {
    registry.clear(); byCategory.clear();
    const files = walk(COMMANDS_ROOT);
    let total = 0;
    for (const f of files) total += await loadFile(f);
    loaded = true;

    // Expose for legacy menu code
    global.commandRegistry = registry;
    global.commandCategories = byCategory;
    if (verbose) console.log(`[CommandRegistry] Loaded ${total} command definitions across ${byCategory.size} categories from ${files.length} files`);
    return { total, files: files.length, categories: byCategory.size };
}

export function getRegistry() { return registry; }
export function getByCategory() { return byCategory; }
export function isLoaded() { return loaded; }

export function listCategories() {
    return [...byCategory.keys()].sort();
}

export function listCommandsByCategory(cat) {
    const list = byCategory.get(cat) || [];
    // Deduplicate by name (registry has aliases too)
    const seen = new Set();
    const out  = [];
    for (const c of list) { if (!seen.has(c.name)) { seen.add(c.name); out.push(c); } }
    return out;
}

/**
 * Try to dispatch a command. Returns true if handled.
 * @param {string} command
 * @param {object} ctx  - { m, neo, args, text, prefix, command, mzazireply, isCreator, isAdmins, isBotAdmins, isGroup, sender, from, pushname, quoted, openai, ...rest }
 */
export async function tryRun(command, ctx) {
    if (!loaded) return false;
    if (!command) return false;
    const cmd = registry.get(String(command).toLowerCase());
    if (!cmd) return false;

    // permission gates
    if (cmd.owner && !ctx.isCreator) {
        await ctx.mzazireply(global.mesg?.own || '*Owner only*');
        return true;
    }
    if (cmd.group && !ctx.isGroup) {
        await ctx.mzazireply(global.mesg?.gc || '*Group only*');
        return true;
    }
    if (cmd.admin && !(ctx.isAdmins || ctx.isCreator)) {
        await ctx.mzazireply(global.mesg?.adm || '*Admin only*');
        return true;
    }
    if (cmd.botAdmin && !ctx.isBotAdmins) {
        await ctx.mzazireply(global.mesg?.botadm || '*Make the bot admin first*');
        return true;
    }
    if (cmd.private && ctx.isGroup) {
        await ctx.mzazireply(global.mesg?.pv || '*Private only*');
        return true;
    }

    try {
        await cmd.run(ctx);
    } catch (err) {
        console.log(`[cmd:${cmd.name}] error`, err);
        try { await ctx.mzazireply(`*Error in .${cmd.name}*\n\n${err?.message || err}`); } catch {}
    }
    return true;
}

export default { loadAllCommands, tryRun, getRegistry, getByCategory, listCategories, listCommandsByCategory, isLoaded };
