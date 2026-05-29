/*════════════════════════════
 *  💎  MONEYHEIST AI LOADER by Mzazi Tech Inc.
 *════════════════════════════
 *  🤖  Bot Name    : MONEYHEIST AI
 *  👑  Owner       : Mzazi Tech Inc.
 *  💎  Version     : Premium Edition
 *  ⚡  Loader      : Enhanced Boot System
 ══════════════════════════
 */

import { spawn } from "child_process";
import path from "path";
import os from "os";
import chalk from "chalk";
import gradient from "gradient-string";
import figlet from "figlet";
import { fileURLToPath } from "url";

// __dirname versi ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File utama bot
// In multi-tenant mode (default since v3) we boot the web host instead of the
// single-instance pairing CLI. Set LEGACY_SINGLE_BOT=1 to fall back to main.js.
const file = process.env.LEGACY_SINGLE_BOT === '1' ? "main.js" : "../../web/server.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function bootAnimation() {
    console.clear();

    // 🔥 Header
    console.log(chalk.hex("#FF0000")("╔═════════════════════════════════╗"));
    console.log(chalk.hex("#FF0000")("║") + chalk.bold.white("    MONEYHEIST AI LOADER      ") + chalk.hex("#FF0000")("║"));
    console.log(chalk.hex("#FF0000")("╚══════════════════════════════════╝\n"));

    // 🚀 Start
    console.log(chalk.cyanBright("🚀 Booting MONEYHEIST AI System...\n"));
    await sleep(800);

    // 🎨 ASCII
    console.log(
        gradient.instagram(
            figlet.textSync("MZAZI", { font: "ANSI Shadow" })
        )
    );

    // 💎 Subtitle
    console.log(chalk.hex("#FFD700")("\n═════════════════════════════════"));
    console.log(chalk.bold.white("        MONEYHEIST AI • Premium Edition"));
    console.log(chalk.hex("#FF69B4")("        👑 Powered by Mzazi Tech Inc."));
    console.log(chalk.hex("#FFD700")("═════════════════════════════════\n"));

    await sleep(800);

    // 🖥️ SYSTEM INFO
    console.log(chalk.magenta.bold("┌────────── SYSTEM INFO ──────────┐"));
    console.log(chalk.white(`│ Platform     : ${os.platform()}`));
    console.log(chalk.white(`│ Release      : ${os.release()}`));
    console.log(chalk.white(`│ Architecture : ${os.arch()}`));
    console.log(chalk.white(`│ Hostname     : ${os.hostname()}`));
    console.log(chalk.white(`│ Total Memory : ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.white(`│ Free Memory  : ${(os.freemem() / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.white(`│ Uptime       : ${(os.uptime() / 60).toFixed(2)} minutes`));
    console.log(chalk.magenta.bold("└───────────────────────────────┘\n"));

    await sleep(1000);

    // ⚙️ MODULE INIT
    console.log(chalk.cyanBright("⚙️ Initializing MONEYHEIST AI Modules...\n"));

    const modules = [
        "Core Engine",
        "Command Handler",
        "Database",
        "Security Layer",
        "AI System"
    ];

    for (let i = 0; i < modules.length; i++) {
        process.stdout.write(
            chalk.cyan(`📦 ${modules[i]} `) + chalk.gray("... ")
        );
        await sleep(400);
        console.log(chalk.green("✓"));
    }

    console.log();

    // 🔄 LOADING ANIMATION
    const loadText = "LOADING SYSTEM";
    for (let i = 0; i < 3; i++) {
        process.stdout.write(chalk.cyanBright(loadText + ".\r"));
        await sleep(400);
        process.stdout.write(chalk.cyanBright(loadText + "..\r"));
        await sleep(400);
        process.stdout.write(chalk.cyanBright(loadText + "...\r"));
        await sleep(400);
    }

    console.log("\n");

    // ✅ FINAL STATUS
    console.log(chalk.greenBright("✅ MONEYHEIST AI is now ONLINE & ACTIVE\n"));

    await sleep(500);
}

async function start() {
    await bootAnimation();

    // Build args: legacy single-instance still uses --pairing-code,
    // multi-tenant web host needs no extra args.
    const isMultiTenant = file.includes('web/server.js');
    const args = isMultiTenant
        ? [path.resolve(__dirname, file)]
        : [path.join(__dirname, file), "--pairing-code"];

    // Mode scan QR (uncomment to use QR code instead)
    // const args = [path.join(__dirname, file)];

    console.log(chalk.gray("Launching process:\n"));
    console.log(chalk.yellow([process.argv[0], ...args].join(" ")));
    console.log();

    const p = spawn(process.argv[0], args, {
        stdio: ["inherit", "inherit", "inherit", "ipc"],
    });

    p.on("message", (data) => {
        if (data === "reset") {
            console.log(chalk.redBright("\n[ SYSTEM ] Restarting Bot...\n"));
            p.kill();
            start();
        }
    });

    p.on("exit", (code) => {
        console.error(chalk.redBright("\n[ SYSTEM ] Exited with code:"), code);

        if (code === 0 || code === 1) {
            console.log(chalk.yellowBright("[ SYSTEM ] Restarting...\n"));
            start();
        }
    });
}

start();