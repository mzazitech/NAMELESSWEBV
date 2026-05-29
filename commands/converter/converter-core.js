/*════════════════════════════════════════
 *  Converter commands (units, formats)
 *══════════════════════════════════════*/

const need = (ctx, msg) => { if (!ctx.text) { ctx.reply(msg); return false; } return true; };
const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'converter', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

const conv = (name, aliases, fn, label, units = '') => ok(name, aliases, (ctx) => {
    const n = parseFloat(ctx.args[0]);
    if (isNaN(n)) throw new Error(`Usage: ${ctx.prefix}${name} <number>`);
    const r = fn(n);
    return `🔁 ${n} → *${typeof r === 'number' ? r.toFixed(4).replace(/\.?0+$/, '') : r}* ${units}`;
}, label);

export default [
    // Length
    conv('km-to-mi',['kmtomi','kilo-to-mile'], n => n * 0.621371, 'km → mi', 'mi'),
    conv('mi-to-km',['mitokm','mile-to-kilo'], n => n / 0.621371, 'mi → km', 'km'),
    conv('m-to-ft',['mtoft','meter-to-feet'], n => n * 3.28084, 'm → ft', 'ft'),
    conv('ft-to-m',['fttom','feet-to-meter'], n => n / 3.28084, 'ft → m', 'm'),
    conv('cm-to-in',['cmtoin','cm-to-inch'], n => n * 0.393701, 'cm → in', 'in'),
    conv('in-to-cm',['intocm','inch-to-cm'], n => n / 0.393701, 'in → cm', 'cm'),
    conv('yd-to-m',['ydtom','yard-to-m'], n => n * 0.9144, 'yd → m', 'm'),
    conv('m-to-yd',['mtoyd','m-to-yard'], n => n / 0.9144, 'm → yd', 'yd'),

    // Mass
    conv('kg-to-lb',['kgtolb','kilo-to-pound'], n => n * 2.20462, 'kg → lb', 'lb'),
    conv('lb-to-kg',['lbtokg','pound-to-kilo'], n => n / 2.20462, 'lb → kg', 'kg'),
    conv('g-to-oz',['gtooz','gram-to-oz'], n => n * 0.035274, 'g → oz', 'oz'),
    conv('oz-to-g',['oztog','oz-to-gram'], n => n / 0.035274, 'oz → g', 'g'),
    conv('ton-to-kg',['tontokg'], n => n * 1000, 'tonne → kg', 'kg'),
    conv('kg-to-ton',['kgtoton'], n => n / 1000, 'kg → tonne', 'tonne'),

    // Temperature
    conv('c-to-f',['ctof','celsius-to-fahrenheit'], n => (n * 9 / 5) + 32, '°C → °F', '°F'),
    conv('f-to-c',['ftoc','fahrenheit-to-celsius'], n => (n - 32) * 5 / 9, '°F → °C', '°C'),
    conv('c-to-k',['ctok','celsius-to-kelvin'], n => n + 273.15, '°C → K', 'K'),
    conv('k-to-c',['ktoc','kelvin-to-celsius'], n => n - 273.15, 'K → °C', '°C'),
    conv('f-to-k',['ftok'], n => (n - 32) * 5/9 + 273.15, '°F → K', 'K'),
    conv('k-to-f',['ktof'], n => (n - 273.15) * 9/5 + 32, 'K → °F', '°F'),

    // Volume
    conv('l-to-gal',['ltogal','liter-to-gallon'], n => n * 0.264172, 'L → gal (US)', 'gal'),
    conv('gal-to-l',['galtol','gallon-to-liter'], n => n / 0.264172, 'gal → L', 'L'),
    conv('ml-to-floz',['mltofloz'], n => n * 0.033814, 'mL → fl oz', 'fl oz'),
    conv('floz-to-ml',['floztoml'], n => n / 0.033814, 'fl oz → mL', 'mL'),
    conv('cup-to-ml',['cuptoml'], n => n * 240, 'cup → mL', 'mL'),
    conv('ml-to-cup',['mltocup'], n => n / 240, 'mL → cup', 'cup'),

    // Speed
    conv('mph-to-kph',['mphtokph'], n => n * 1.60934, 'mph → kph', 'kph'),
    conv('kph-to-mph',['kphtomph'], n => n / 1.60934, 'kph → mph', 'mph'),
    conv('ms-to-kph',['mstokph'], n => n * 3.6, 'm/s → kph', 'kph'),
    conv('kph-to-ms',['kphtoms'], n => n / 3.6, 'kph → m/s', 'm/s'),
    conv('knot-to-kph',['knottokph'], n => n * 1.852, 'knot → kph', 'kph'),

    // Storage
    conv('mb-to-gb',['mbtogb'], n => n / 1024, 'MB → GB', 'GB'),
    conv('gb-to-mb',['gbtomb'], n => n * 1024, 'GB → MB', 'MB'),
    conv('kb-to-mb',['kbtomb'], n => n / 1024, 'KB → MB', 'MB'),
    conv('mb-to-kb',['mbtokb'], n => n * 1024, 'MB → KB', 'KB'),
    conv('byte-to-mb',['btomb'], n => n / (1024 * 1024), 'B → MB', 'MB'),

    // Time
    conv('sec-to-min',['stomin'], n => n / 60, 'sec → min', 'min'),
    conv('min-to-hour',['mintohour'], n => n / 60, 'min → hour', 'h'),
    conv('hour-to-day',['hourtoday'], n => n / 24, 'hour → day', 'd'),
    conv('day-to-week',['daytoweek'], n => n / 7, 'day → week', 'w'),
    conv('day-to-year',['daytoyear'], n => n / 365.25, 'day → year', 'y'),

    // Number bases
    ok('dec-to-bin',['dectobin','tobinary-num'], (ctx) => {
        const n = parseInt(ctx.args[0]);
        if (isNaN(n)) throw new Error(`Usage: ${ctx.prefix}dec-to-bin <decimal>`);
        return `🧮 ${n} → *${n.toString(2)}*₂`;
    }, 'Decimal → binary'),
    ok('bin-to-dec',['bintodec','frombinary-num'], (ctx) => {
        if (!ctx.args[0]) throw new Error(`Usage: ${ctx.prefix}bin-to-dec 1010`);
        return `🧮 ${ctx.args[0]}₂ → *${parseInt(ctx.args[0], 2)}*`;
    }, 'Binary → decimal'),
    ok('dec-to-hex',['dectohex'], (ctx) => {
        const n = parseInt(ctx.args[0]);
        if (isNaN(n)) throw new Error(`Usage: ${ctx.prefix}dec-to-hex <decimal>`);
        return `🧮 ${n} → *0x${n.toString(16).toUpperCase()}*`;
    }, 'Decimal → hex'),
    ok('hex-to-dec',['hextodec'], (ctx) => {
        if (!ctx.args[0]) throw new Error(`Usage: ${ctx.prefix}hex-to-dec FF`);
        return `🧮 0x${ctx.args[0]} → *${parseInt(ctx.args[0].replace(/^0x/i, ''), 16)}*`;
    }, 'Hex → decimal'),
    ok('dec-to-oct',['dectoct'], (ctx) => {
        const n = parseInt(ctx.args[0]);
        if (isNaN(n)) throw new Error(`Usage: ${ctx.prefix}dec-to-oct <decimal>`);
        return `🧮 ${n} → *0o${n.toString(8)}*`;
    }, 'Decimal → octal'),

    // Format conversions
    ok('json-to-csv',['jsontocsv'], (ctx) => {
        const arr = JSON.parse(ctx.text || '[]');
        if (!Array.isArray(arr) || !arr.length) throw new Error('expected non-empty JSON array');
        const cols = Object.keys(arr[0]);
        const rows = arr.map(row => cols.map(c => JSON.stringify(row[c] ?? '')).join(','));
        return [cols.join(','), ...rows].join('\n');
    }, 'JSON → CSV'),
    ok('csv-to-json',['csvtojson'], (ctx) => {
        if (!ctx.text) throw new Error('Paste CSV after the command');
        const [head, ...rest] = ctx.text.trim().split(/\r?\n/);
        const cols = head.split(',');
        const out = rest.map(r => Object.fromEntries(r.split(',').map((v, i) => [cols[i], v])));
        return JSON.stringify(out, null, 2);
    }, 'CSV → JSON'),
];
