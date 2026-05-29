/*════════════════════════════════════════
 *  Random / generator commands
 *══════════════════════════════════════*/
import { RNG, PICK, COUNTRIES, ANIMALS, COLORS, genPassword, uuidV4, toRoman, fromRoman, dlBuffer, safeFnFetch } from '../_helpers.js';

const t = (name, aliases, fn, desc, category = 'random') => ({
    name, aliases, category, desc,
    run: async (ctx) => { try { const out = await fn(ctx); if (out != null) await ctx.reply(String(out)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } }
});

const SCIFI_NAMES = ['Zara','Kai','Nova','Orion','Lyra','Atlas','Iris','Phoenix','Echo','Vega','Riven','Astra','Caelum','Lumen','Solene','Sable','Onyx','Idris'];
const FANTASY_NAMES = ['Eldrin','Galadrith','Thalindra','Brorinor','Velmira','Faenor','Aelthien','Ysolde','Glaurion','Mirivor','Sylwen','Eowynn'];
const BUSINESS_PREFIXES = ['Nova','Quantum','Stellar','Vivid','Apex','Bright','Pulse','Loop','Orbit','Sphere','Lyric','Halcyon','Arcadia','Volta','Kindred'];
const BUSINESS_SUFFIXES = ['Labs','Co.','Studio','Works','Forge','Foundry','House','Group','Collective','Ventures','Industries','Systems','Network','Hub','Circle'];
const COCKTAILS = ['Mojito','Old Fashioned','Negroni','Margarita','Daiquiri','Manhattan','Espresso Martini','Aperol Spritz','Pina Colada','Mai Tai','Whiskey Sour','Cosmopolitan','Moscow Mule','Sazerac','Mint Julep'];
const SPELLS = ['Lumos','Nox','Wingardium Leviosa','Expecto Patronum','Expelliarmus','Stupefy','Avada Kedavra','Accio','Alohomora','Petrificus Totalus','Sectumsempra','Riddikulus','Reparo','Crucio','Imperio','Obliviate','Apparate','Disapparate','Reducio','Engorgio'];
const POKE_NAMES = ['Pikachu','Charmander','Bulbasaur','Squirtle','Eevee','Mewtwo','Snorlax','Gengar','Gyarados','Dragonite','Lucario','Garchomp','Greninja','Lucario','Sylveon','Umbreon','Espeon','Vaporeon','Jolteon','Flareon'];

const FORTUNES = [
    'A pleasant surprise is in store for you today.',
    'Now is the time to try something new.',
    'A small kindness will return tenfold.',
    'Trust your instincts on the next big decision.',
    'A new opportunity is closer than you think.',
    'Your patience will be rewarded soon.',
    'A familiar face will bring good news.',
    'You are stronger than you think.',
    'Take the path less traveled this week.',
    'The best is yet to come.',
];

const ADVICE = [
    'Drink a glass of water before each meal.',
    'Sleep is a productivity superpower.',
    'Read 10 pages of a book every day.',
    'Save 10% of every paycheck.',
    'Compound interest works for habits too.',
    'Walk for 30 minutes daily.',
    'Say no more often.',
    'Default to writing things down.',
    'Block 25-minute focus sessions.',
    'Praise in public, critique in private.',
];

const QUOTES = [
    '"The only way to do great work is to love what you do." — Steve Jobs',
    '"Stay hungry, stay foolish." — Steve Jobs',
    '"Whether you think you can or can\'t, you\'re right." — Henry Ford',
    '"Be yourself; everyone else is taken." — Oscar Wilde',
    '"In the middle of difficulty lies opportunity." — Albert Einstein',
    '"Do one thing every day that scares you." — Eleanor Roosevelt',
    '"Simplicity is the ultimate sophistication." — Leonardo da Vinci',
    '"You miss 100% of the shots you don\'t take." — Wayne Gretzky',
    '"The journey of a thousand miles begins with a single step." — Lao Tzu',
    '"Make it work, make it right, make it fast." — Kent Beck',
];

const MOTIVATIONS = [
    '🔥 You did NOT come this far to only come this far.',
    '💪 Every expert was once a beginner.',
    '🌱 Small steps every day beats big steps once a year.',
    '🎯 Progress, not perfection.',
    '☀️ Today is a great day to start.',
    '🚀 Done > perfect.',
    '🧠 Hard work beats talent when talent doesn\'t work hard.',
    '🌈 Storms always end.',
    '💡 Read. Build. Ship.',
    '⛰ The only way out is through.',
];

const RIDDLES = [
    ['I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?', 'An echo'],
    ['The more of me you take, the more you leave behind. What am I?', 'Footsteps'],
    ['I have cities, but no houses; mountains, but no trees; water, but no fish. What am I?', 'A map'],
    ['What has hands but cannot clap?', 'A clock'],
    ['What gets wetter the more it dries?', 'A towel'],
    ['What can you catch but never throw?', 'A cold'],
];

const FACTS = [
    'A group of flamingos is called a "flamboyance".',
    'Octopuses have three hearts.',
    'Bananas are berries, but strawberries are not.',
    'Honey never spoils.',
    'Sharks existed before trees.',
    'A day on Venus is longer than its year.',
    'Cows have best friends.',
    'Wombat poop is cube-shaped.',
    'Hot water freezes faster than cold water sometimes (Mpemba effect).',
    'Cleopatra lived closer in time to the moon landing than to the Pyramids.',
];

const JOKES = [
    'Why don\'t scientists trust atoms? Because they make up everything.',
    'I told my computer I needed a break, and it said "no problem — I\'ll go to sleep."',
    'Why did the scarecrow win an award? Because he was outstanding in his field.',
    'I would tell a UDP joke, but you might not get it.',
    'Why don\'t programmers like nature? Too many bugs.',
    'There are 10 kinds of people in the world: those who understand binary and those who don\'t.',
    'Parallel lines have so much in common… it\'s a shame they\'ll never meet.',
    'Why did the developer go broke? Because he used up all his cache.',
    'I\'m on a seafood diet. I see food and I eat it.',
    'Why did the math book look sad? It had too many problems.',
];

const PICKUPS = [
    'Are you Wi-Fi? Because I\'m feeling a connection.',
    'Do you have a map? I keep getting lost in your eyes.',
    'Are you a magician? Whenever I look at you, everyone else disappears.',
    'If beauty were time, you\'d be eternity.',
    'Is your name Google? Because you have everything I\'ve been searching for.',
    'Are you a parking ticket? Because you\'ve got "fine" written all over you.',
    'Do you believe in love at first sight, or should I walk by again?',
    'Are you a camera? Every time I look at you, I smile.',
];

const HOROSCOPE_LINES = [
    'Today is full of opportunity — say yes to one new thing.',
    'A surprise text could change your week — pay attention.',
    'Be patient: a delayed plan is in your favor.',
    'Money matters get clearer this week.',
    'Energy is high; channel it into a creative project.',
    'A friend will offer you advice worth listening to.',
    'Trust your intuition over the advice of strangers.',
];

const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];

const RECIPES = [
    'Garlic-butter shrimp pasta',
    'Spicy chicken biryani',
    'Classic margherita pizza',
    'Beef tacos with mango salsa',
    'Lemon-herb roast chicken',
    'Vegetable stir-fry with tofu',
    'Mushroom risotto',
    'Avocado toast with poached egg',
    'Banana pancakes',
    'Chocolate chip cookies',
];

const WORKOUTS = [
    'Full-body 20-min HIIT',
    'Upper-body push day (bench, press, dips)',
    'Lower-body leg day (squats, deadlifts, lunges)',
    'Core blast (planks, leg raises, twists)',
    '5K easy run',
    '30-min cycling intervals',
    'Yoga flow for flexibility',
    'Mobility + foam rolling session',
    'Boxing shadow rounds',
    'Long walk with weighted vest',
];

export default [
    t('randnum',['rand','random','rng','randint'], (ctx) => {
        const a = parseInt(ctx.args[0]) || 1;
        const b = parseInt(ctx.args[1]) || 100;
        return `🎲 ${RNG(Math.min(a,b), Math.max(a,b))} (range ${a}-${b})`;
    }, 'Random number'),
    t('randhex',['hex-color','randhexcolor'], () => '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase(), 'Random hex color'),
    t('randrgb',['rgb-color'], () => `rgb(${RNG(0,255)}, ${RNG(0,255)}, ${RNG(0,255)})`, 'Random RGB'),
    t('randcolor',['color-rand','randomcolor'], () => `🎨 ${PICK(COLORS)}`, 'Random color name'),
    t('randanimal',['animal-rand'], () => `🐾 ${PICK(ANIMALS)}`, 'Random animal'),
    t('randcountry',['country-rand'], () => `🌍 ${PICK(COUNTRIES)}`, 'Random country'),
    t('randcity',['city-rand'], () => `🏙 ${PICK(['Nairobi','Mombasa','Kisumu','Lagos','Cairo','Tokyo','Paris','New York','Berlin','Sydney','Dubai','Bangkok','Singapore','Toronto','Mexico City'])}`, 'Random city'),
    t('randtimezone',['tz-rand'], () => `🌐 ${PICK(['UTC','EAT','GMT','EST','PST','CST','IST','JST','AEST','BST','CET','EET'])}`, 'Random timezone'),
    t('randname',['name-rand','randomname','baby-name'], (ctx) => {
        const list = ctx.args[0]?.toLowerCase() === 'fantasy' ? FANTASY_NAMES : SCIFI_NAMES;
        return `📛 ${PICK(list)}`;
    }, 'Random name'),
    t('randbusiness',['biz-name-rand','randbiz'], () => `🏢 ${PICK(BUSINESS_PREFIXES)} ${PICK(BUSINESS_SUFFIXES)}`, 'Random biz name'),
    t('randslogan',['slogan-rand'], () => `📢 "${PICK(['Built for the future','Made with love','Just better','Beyond the basics','Engineered to last','Designed for life','Tomorrow, today'])}"`, 'Random slogan'),
    t('randcocktail',['cocktail-rand','randdrink'], () => `🍹 ${PICK(COCKTAILS)}`, 'Random cocktail'),
    t('randspell',['spell-rand','hp-spell'], () => `🪄 ${PICK(SPELLS)}`, 'Random Harry Potter spell'),
    t('randpokemon',['poke-rand','randpoke'], () => `🐭 ${PICK(POKE_NAMES)}`, 'Random Pokémon'),
    t('randplanet',['planet-rand'], () => `🪐 ${PICK(['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Kepler-22b','TRAPPIST-1d','Proxima b'])}`, 'Random planet'),
    t('randstar',['star-rand'], () => `⭐ ${PICK(['Sirius','Polaris','Vega','Betelgeuse','Rigel','Antares','Aldebaran','Arcturus','Procyon','Capella'])}`, 'Random star'),
    t('randplant',['plant-rand'], () => `🌿 ${PICK(['Aloe Vera','Bonsai','Cactus','Fern','Lavender','Mint','Orchid','Rose','Snake Plant','Succulent','Bamboo','Jasmine'])}`, 'Random plant'),
    t('randflower',['flower-rand'], () => `🌸 ${PICK(['Rose','Tulip','Sunflower','Lily','Daisy','Lotus','Orchid','Cherry Blossom','Lavender','Iris','Peony','Hibiscus'])}`, 'Random flower'),
    t('randtree',['tree-rand'], () => `🌳 ${PICK(['Oak','Maple','Pine','Birch','Cedar','Willow','Baobab','Acacia','Mahogany','Sequoia','Bamboo','Mango'])}`, 'Random tree'),
    t('randcar',['car-rand'], () => `🚗 ${PICK(['Toyota Camry','Honda Civic','Tesla Model 3','BMW M3','Ford Mustang','Mazda MX-5','Subaru WRX','Audi RS6','Porsche 911','Mercedes E-Class'])}`, 'Random car'),
    t('randbike',['bike-rand','moto-rand'], () => `🏍 ${PICK(['Yamaha YZF-R1','Kawasaki Ninja','Honda CBR','Ducati Panigale','BMW S1000RR','Suzuki Hayabusa','KTM Duke','Triumph Bonneville'])}`, 'Random bike'),
    t('randchar',['char-rand'], () => `🎭 ${PICK(['Sherlock Holmes','Hermione Granger','Aragorn','Tony Stark','Naruto','Goku','Frodo','Katniss','Luke Skywalker','Wonder Woman'])}`, 'Random fictional character'),

    t('fortune',['fortunecookie','randfortune'], () => `🥠 ${PICK(FORTUNES)}`, 'Daily fortune'),
    t('advice',['randadvice','randomadvice'], () => `💡 ${PICK(ADVICE)}`, 'Random life advice'),
    t('quote',['randomquote','randquote'], () => `💬 ${PICK(QUOTES)}`, 'Random quote'),
    t('motivation',['randmotivation','motivate'], () => PICK(MOTIVATIONS), 'Daily motivation'),
    t('inspiration',['inspire','randinspire'], () => `✨ ${PICK(QUOTES)}`, 'Random inspiration'),
    t('riddle',['randriddle','riddleme'], () => { const r = PICK(RIDDLES); return `🤔 *Riddle:* ${r[0]}\n\n_(spoiler)_ Answer: ||${r[1]}||`; }, 'Random riddle'),
    t('fact',['funfact','randfact','random-fact'], () => `📘 ${PICK(FACTS)}`, 'Random fun fact'),
    t('joke',['randjoke','dadjoke','pun'], () => `😄 ${PICK(JOKES)}`, 'Random joke'),
    t('pickup',['pickupline','randpickup'], () => `💘 ${PICK(PICKUPS)}`, 'Random pickup line'),
    t('horoscope',['horo','starsign'], (ctx) => {
        const s = (ctx.args[0] || PICK(SIGNS)).toLowerCase();
        if (!SIGNS.includes(s)) return `Pick one of: ${SIGNS.join(', ')}`;
        return `♋ *${s.toUpperCase()}* — ${PICK(HOROSCOPE_LINES)}`;
    }, 'Daily horoscope'),
    t('triviaquestion',['trivia-q','trivia-rand'], () => {
        const list = [
            ['What is the capital of Australia?', 'Canberra'],
            ['Who wrote 1984?', 'George Orwell'],
            ['What\'s the chemical symbol of gold?', 'Au'],
            ['How many continents are there?', '7'],
            ['Who painted the Mona Lisa?', 'Leonardo da Vinci'],
        ];
        const r = PICK(list);
        return `❓ ${r[0]}\n\n_(spoiler)_ Answer: ||${r[1]}||`;
    }, 'Trivia question'),

    t('recipe',['randrecipe','random-recipe'], () => `👩‍🍳 ${PICK(RECIPES)}`, 'Random recipe idea'),
    t('workout',['randworkout','random-workout'], () => `🏋 ${PICK(WORKOUTS)}`, 'Random workout idea'),

    t('coinflip',['coin','heads-or-tails','toss','flip'], () => `🪙 ${Math.random() < 0.5 ? 'Heads' : 'Tails'}`, 'Coin flip'),
    t('dice',['roll','rolldice','d6'], () => `🎲 ${RNG(1, 6)}`, 'Dice roll'),
    t('d20',['rolld20','dice20'], () => `🎲 ${RNG(1, 20)}`, 'D20 roll'),
    t('d100',['rolld100','dice100'], () => `🎲 ${RNG(1, 100)}`, 'D100 roll'),
    t('rps',['rock-paper-scissors','rps-game'], () => `✊✋✌ Bot picks: ${PICK(['rock','paper','scissors'])}`, 'Rock-paper-scissors'),
    t('eightball',['8ball','magic8','magicball'], (ctx) => {
        if (!ctx.text) return 'Ask a yes/no question.';
        return `🎱 ${PICK(['Yes','No','Maybe','Definitely','Unlikely','Ask again later','Without a doubt','Cannot say','Probably','Doubtful','Signs point to yes','Outlook is good'])}`;
    }, 'Magic 8-Ball'),

    t('shipname',['ship','ship-percent','shippercent'], (ctx) => {
        const a = ctx.args[0] || 'A';
        const b = ctx.args[1] || 'B';
        const pct = ((a.length + b.length) * 7) % 101;
        return `💞 ${a} ❤ ${b} → ${pct}%`;
    }, 'Ship percentage'),
    t('iq',['iq-test','iqcheck'], (ctx) => `🧠 IQ ≈ ${RNG(60, 199)}`, 'Random IQ check'),
    t('genius',['genius-pct','iam-genius'], () => `🧠 Genius level: ${RNG(50, 100)}%`, 'Genius %'),
    t('rate',['rate-x'], (ctx) => `⭐ ${ctx.text || 'this'} → ${RNG(1, 10)}/10`, 'Rate anything'),
    t('lovecalc',['love','love-percent','ldate'], (ctx) => {
        const a = ctx.args[0] || 'You';
        const b = ctx.args[1] || 'Me';
        return `💖 ${a} ❤ ${b} → ${(((a + b).length * 13) % 101)}%`;
    }, 'Love calculator'),

    t('password',['genpass','passwordgen'], (ctx) => `🔑 ${genPassword(parseInt(ctx.args[0]) || 16)}`, 'Random password'),
    t('pin',['pincode','genpin'], () => `🔐 ${RNG(0, 999999).toString().padStart(6, '0')}`, '6-digit PIN'),
    t('otp',['otpcode','genotp'], () => `🔢 ${RNG(0, 9999).toString().padStart(4, '0')}`, '4-digit OTP'),
    t('uuid',['uuidv4','genuuid'], () => uuidV4(), 'UUID v4'),
    t('roman',['toroman','torom'], (ctx) => toRoman(parseInt(ctx.args[0])) || '?', 'Number to Roman'),
    t('fromroman',['romandecode','fromrom'], (ctx) => String(fromRoman(ctx.args[0] || '')), 'Roman to number'),

    // Random API-backed (with safe fallback strings)
    t('catimg',['random-cat','randcat-img'], async (ctx) => {
        const j = await safeFnFetch('https://api.thecatapi.com/v1/images/search');
        const url = j?.[0]?.url;
        if (!url) return ctx.reply('🐱 Could not fetch.');
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🐱 Random cat' }, { quoted: ctx.m });
        return null;
    }, 'Random cat photo'),
    t('dogimg',['random-dog','randdog-img'], async (ctx) => {
        const j = await safeFnFetch('https://dog.ceo/api/breeds/image/random');
        const url = j?.message;
        if (!url) return ctx.reply('🐶 Could not fetch.');
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🐶 Random dog' }, { quoted: ctx.m });
        return null;
    }, 'Random dog photo'),
    t('foximg',['random-fox','randfox-img'], async (ctx) => {
        const j = await safeFnFetch('https://randomfox.ca/floof/');
        const url = j?.image;
        if (!url) return ctx.reply('🦊 Could not fetch.');
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🦊 Random fox' }, { quoted: ctx.m });
        return null;
    }, 'Random fox photo'),
    t('duckimg',['random-duck','randduck'], async (ctx) => {
        const j = await safeFnFetch('https://random-d.uk/api/v2/random');
        const url = j?.url;
        if (!url) return ctx.reply('🦆 Could not fetch.');
        const buf = await dlBuffer(url);
        await ctx.neo.sendMessage(ctx.from, { image: buf, caption: '🦆 Random duck' }, { quoted: ctx.m });
        return null;
    }, 'Random duck photo'),
];
