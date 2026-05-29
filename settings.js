/*═══════════════════════════════════════════════════════
 *  ⌬  YT NeoShiroko Labs
 *═══════════════════════════════════════════════════════
 *  🌐  Website     : https://www.neolabsofficial.my.id
 *  ⌨︎  Developer   : https://zass.cloud
 *  ▶︎  YouTube     : https://www.youtube.com/@shirokode
 *  ⚙︎  Cheap Panel : pterokudesu.web.id
 *
 *  ⚠︎  Please do not remove this watermark
 *═══════════════════ © 2025 Zass Desuta ─════════════════════
 */

import fs from "fs";
import { fileURLToPath } from "url";
import chalk from "chalk";

//——————————[ Owner Settings ]——————————//
global.ytname = "https://www.youtube.com/@shirokode"
global.location = "Cooperative University of Kenya"
global.ownername = "Mzazi Tech Inc"
global.ownernumber = '254741388986'
global.lidownernumber = null // leave empty
global.email = "mzazitech@gmail.com"
global.footer = "> Powered By Mzazi Tech Systems"
global.chatbotDM = false;
global.chatbotGC = false;
global.OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""
//——————————[ Bot Settings ]——————————//
global.botname = 'DARKNODE AI V2.0'
global.menuImage = './media/menu.jpg' 
global.versi = '1.0.0'
global.foot = '© DARKNODE V2.0'
global.idSaluran = ""
global.namach = "DARKNODE BOT"
global.aiUsageCount = global.aiUsageCount || {}
global.autoAiSessions = {}
global.hias = "➤"
global.pairing = "DARKNODE"
global.paystack = {
    key: process.env.PAYSTACK_KEY || "",
    currency: process.env.PAYSTACK_CURRENCY || "KES"
}

//——————————[ Sticker Settings ]——————————//
global.packname = 'DARKNODE'
global.author = `\nWaBot By Mzazi Tech inc.`
global.themeemoji = '🪀'
global.wm = "⫹⫺ DARKNODE V1.0"

//——————————[ Link Settings ]——————————//
global.link = "https://whatsapp.com/channel/0029Vb6w7eO9sBIEUYRgeC30"
global.namagc = "Marketplace¹ || Mzazi Official"
global.linkgc = "https://chat.whatsapp.com/Bvdic3yrpFh5kTkk5oc5G0"
global.web = "https://www.mzazi.shop"
global.prefa = ['.']


//——————————[ Payment Settings ]——————————//
global.dana = "Not Available"
global.gopay = "Not Available"
global.ovo = "Not Available"
global.qris = "https://link_qr_mu.desu"
global.an = {
  dana: "Dana name",
  gopay: "Gopay name",
  ovo: "OVO name"
}

//——————————[ Automatic Settings ]——————————//
global.pay = {
  apikey: "APIKEY_KAMU",
  project: "SLUG_KAMU"
}

global.ch2h = {
  api_id: "xxx",
  apikey: "xxx"
}

//——————————[ Push Contact Settings ]——————————//
global.delayjpm = 1000
global.delaypushkontak = 6000

//——————————[ Manage Vercel ]——————————//
global.vercelToken = process.env.VERCEL_TOKEN || ""

//——————————[ Manage GitHub ]——————————//
global.githubToken = process.env.GITHUB_TOKEN || ""
global.githubUsername = process.env.GITHUB_USERNAME || ""

//——————————[ Media URLs ]——————————//
global.gif = "./media/menu.jpg"
global.imgthumb = "./media/menu.jpg"
global.imgmenu = "./media/menu.jpg"
global.imgdoc = "./media/menu.jpg"
global.logo = "./media/menu.jpg"
global.vn = "./media/menu.jpg"
global.thumb_welcome = "./media/menu.jpg"

//——————————[ Panel API V1 ]——————————//
global.egg = process.env.PANEL_V1_EGG || ""
global.nestid = process.env.PANEL_V1_NESTID || "5"
global.loc = process.env.PANEL_V1_LOC || "1"
global.domain = process.env.PANEL_V1_DOMAIN || "https://public.lordea.tech"
global.apikey = process.env.PANEL_V1_APIKEY || ""
global.capikey = process.env.PANEL_V1_CAPIKEY || ""

//——————————[ Panel API V2 ]——————————//
global.egg2 = process.env.PANEL_V2_EGG || ""
global.nestid2 = process.env.PANEL_V2_NESTID || ""
global.loc2 = process.env.PANEL_V2_LOC || ""
global.domain2 = process.env.PANEL_V2_DOMAIN || "https://public.lordeagle.tech"
global.apikey2 = process.env.PANEL_V2_APIKEY || ""
global.capikey2 = process.env.PANEL_V2_CAPIKEY || ""

//——————————[ Private Panel API ]——————————//
global.egg3 = process.env.PANEL_V3_EGG || "5"
global.nestid3 = process.env.PANEL_V3_NESTID || "5"
global.loc3 = process.env.PANEL_V3_LOC || "1"
global.domain3 = process.env.PANEL_V3_DOMAIN || "https://public.lordeagle.tech"
global.apikey3 = process.env.PANEL_V3_APIKEY || ""
global.capikey3 = process.env.PANEL_V3_CAPIKEY || ""

//——————————[ Message Settings ]——————————//
global.loadreact = "🎊"
global.mesg = {
  slr: "This feature is for resellers only! Please contact the owner to purchase access",
  pv: "*[ DarkNode System ]* This feature is only available in private chat",
  gc: "*[ DarkNode System ]* This feature is only for groups",
  own: "*[ DarkNode System ]* This feature is only for the owner",
  adm: "*[ DarkNode System ]* This feature is only for admins",
  botadm: "Make the bot admin first",
  load: "please wait....",
  err: "An error occurred, please try again later..."
}

const __filename = fileURLToPath(import.meta.url);

fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(chalk.green.bold("New Update: DarkNode V1.0 Settings"));
  import(`${import.meta.url}?update=${Date.now()}`);
});