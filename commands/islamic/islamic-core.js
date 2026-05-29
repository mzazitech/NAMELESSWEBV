/*════════════════════════════════════════
 *  Islamic commands
 *══════════════════════════════════════*/
import { dlBuffer, PICK } from '../_helpers.js';

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'islamic', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

const ASMA = [
    'Ar-Rahman (The Most Compassionate)','Ar-Rahim (The Most Merciful)','Al-Malik (The King)','Al-Quddus (The Holy)',
    'As-Salam (The Source of Peace)','Al-Mu\'min (The Guardian of Faith)','Al-Muhaymin (The Protector)','Al-Aziz (The Mighty)',
    'Al-Jabbar (The Compeller)','Al-Mutakabbir (The Greatest)','Al-Khaliq (The Creator)','Al-Bari (The Maker of Order)',
    'Al-Musawwir (The Shaper)','Al-Ghaffar (The Forgiving)','Al-Qahhar (The Subduer)','Al-Wahhab (The Bestower)',
    'Ar-Razzaq (The Provider)','Al-Fattah (The Opener)','Al-\'Alim (The All-Knowing)','Al-Qabid (The Constrictor)',
];

const DUA_LIST = [
    ['Before eating', 'Bismillāhi wa \'alā barakatillāh'],
    ['After eating', 'Alhamdulillāhilladhī at\'amanā wa saqānā wa ja\'alanā Muslimīn'],
    ['Before sleeping', 'Bismika Allāhumma amūtu wa ahyā'],
    ['Waking up', 'Alhamdulillāhilladhī ahyānā ba\'da mā amātanā wa ilayhin-nushūr'],
    ['Entering home', 'Bismillāhi walajnā wa bismillāhi kharajnā wa \'alā Rabbinā tawakkalnā'],
    ['Leaving home', 'Bismillāh, tawakkaltu \'alallāh, walā hawla walā quwwata illā billāh'],
    ['When in pain', 'A\'ūdhu bi\'izzatillāhi wa qudratihi min sharri mā ajidu wa uhādhir (×7)'],
    ['Forgiveness', 'Astaghfirullāhalladhī lā ilāha illā Huwa al-Hayyul-Qayyūm wa atūbu ilayhi'],
    ['Anxiety', 'Allāhumma innī a\'ūdhu bika minal-hammi wal-hazan'],
];

export default [
    ok('quran',['surah','quran-list'], async (ctx) => {
        if (!ctx.text) {
            return '📖 *Use:* .quran <surah_no>:<ayah_no>  e.g.  .quran 1:1\nOr  .quran-list  to see surah names.';
        }
        const m = ctx.text.match(/(\d+)[:\s\-](\d+)/);
        if (!m) throw new Error(`Format: ${ctx.prefix}quran 1:1`);
        const surah = m[1], ayah = m[2];
        const j = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,en.asad`).then(r => r.json()).catch(() => null);
        const ayatAr = j?.data?.[0]?.text;
        const ayatEn = j?.data?.[1]?.text;
        const surahName = j?.data?.[0]?.surah?.englishName;
        if (!ayatAr) return '❌ not found';
        return `📖 *${surahName} ${surah}:${ayah}*\n\n${ayatAr}\n\n_${ayatEn}_`;
    }, 'Read a Quran ayah'),

    ok('quran-list',['surah-list'], async () => {
        const j = await fetch('https://api.alquran.cloud/v1/surah').then(r => r.json()).catch(() => null);
        if (!j?.data) return 'fail';
        return '📖 *Surah list*\n\n' + j.data.map(s => `${s.number.toString().padStart(3,' ')}. ${s.englishName} (${s.name})`).join('\n');
    }, 'List all surahs'),

    ok('hadith',['hadithrandom','randhadith'], async () => {
        const j = await fetch('https://random-hadith-generator.vercel.app/bukhari/').then(r => r.json()).catch(() => null);
        const d = j?.data;
        if (!d) return '📖 *Hadith*\n\n"Actions are by intentions" — Sahih Bukhari';
        return `📖 *${d.book} #${d.hadithNumber}*\n\n${d.hadith_english}\n\n_— ${d.refno}_`;
    }, 'Random hadith'),

    ok('asma',['names99','asma-husna'], () => {
        return '🕌 *Random of the 99 Names*\n\n' + PICK(ASMA);
    }, '99 Names of Allah'),

    ok('dua',['duaa','prayer-dua'], (ctx) => {
        const idx = parseInt(ctx.args[0]) - 1;
        const d = isNaN(idx) ? PICK(DUA_LIST) : (DUA_LIST[idx] || PICK(DUA_LIST));
        return `🤲 *Dua — ${d[0]}*\n\n${d[1]}`;
    }, 'Random dua / by index'),

    ok('dua-list',['duaa-list'], () => {
        return '🤲 *Available duas:*\n\n' + DUA_LIST.map((d, i) => `${i + 1}. ${d[0]}`).join('\n') + '\n\n_Use_ .dua <number>';
    }, 'List duas'),

    ok('hijri',['hijri-date','islamic-date'], async () => {
        const j = await fetch('https://api.aladhan.com/v1/gToH').then(r => r.json()).catch(() => null);
        const h = j?.data?.hijri;
        if (!h) return 'fail';
        return `📅 *Hijri:* ${h.day} ${h.month.en} ${h.year} (${h.weekday.en})`;
    }, 'Today in Hijri calendar'),

    ok('prayer',['prayer-time','salat'], async (ctx) => {
        const city = ctx.args[0] || 'Mecca';
        const country = ctx.args.slice(1).join(' ') || 'Saudi Arabia';
        const j = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`).then(r => r.json()).catch(() => null);
        const t = j?.data?.timings;
        if (!t) return '❌ city/country not found';
        return `🕌 *Prayer times — ${city}, ${country}*\n• Fajr   : ${t.Fajr}\n• Sunrise: ${t.Sunrise}\n• Dhuhr  : ${t.Dhuhr}\n• Asr    : ${t.Asr}\n• Maghrib: ${t.Maghrib}\n• Isha   : ${t.Isha}`;
    }, 'Prayer times for a city'),

    ok('qibla',['qibla-direction'], async (ctx) => {
        const lat = parseFloat(ctx.args[0]);
        const lng = parseFloat(ctx.args[1]);
        if (isNaN(lat) || isNaN(lng)) throw new Error(`Usage: ${ctx.prefix}qibla <lat> <lng>`);
        const j = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lng}`).then(r => r.json()).catch(() => null);
        if (!j?.data) return '❌';
        return `🕋 Qibla direction: ${j.data.direction.toFixed(2)}° from north`;
    }, 'Qibla direction'),

    ok('ramadan',['iftar-time'], async (ctx) => {
        const city = ctx.args[0] || 'Mecca';
        const country = ctx.args.slice(1).join(' ') || 'Saudi Arabia';
        const j = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`).then(r => r.json()).catch(() => null);
        const t = j?.data?.timings;
        if (!t) return '❌';
        return `🌙 *Ramadan in ${city}*\n• Imsak   : ${t.Imsak}\n• Maghrib (Iftar): ${t.Maghrib}`;
    }, 'Ramadan imsak/iftar'),
];
