/*════════════════════════════════════════
 *  Games (lightweight, in-memory)
 *══════════════════════════════════════*/
import { RNG, PICK } from '../_helpers.js';

global.gameStore = global.gameStore || {
    tictactoe: {},   // chatJid -> {board, turn, players}
    hangman: {},     // chatJid -> {word, guessed, lives, by}
    guess: {},       // chatJid -> {n, by}
    word: {},        // chatJid -> {word, by, hints}
    math: {},        // chatJid -> {q, ans, by}
    truthordare: {},
};

const ok = (name, aliases, fn, desc, opts = {}) => ({ name, aliases, category: 'games', desc, ...opts, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

// ---- TIC TAC TOE ----
function ttRender(board) {
    const r = i => board[i] || (i + 1);
    return `${r(0)} | ${r(1)} | ${r(2)}\n──┼──┼──\n${r(3)} | ${r(4)} | ${r(5)}\n──┼──┼──\n${r(6)} | ${r(7)} | ${r(8)}`;
}
function ttWinner(b) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, c, d] of lines) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    if (b.every(Boolean)) return 'draw';
    return null;
}

// ---- HANGMAN ----
const HM_WORDS = ['javascript','baileys','whatsapp','darknode','algorithm','elephant','calculator','keyboard','umbrella','sandwich','sunshine','mountain','astronaut','volcano','library','chocolate','telescope','butterfly'];

// ---- WORDLE-LIKE HINTS WORDS ----
const WORD_BANK = ['orange','planet','rocket','laptop','wonder','simple','escape','garden','silent','autumn','window','tunnel','jungle','mirror','bridge','cookie','muffin','marble','marker','folder','signal'];

const TOD_TRUTHS = ['What\'s your worst habit?','Have you ever lied to me?','Last person you stalked online?','Most embarrassing moment?'];
const TOD_DARES = ['Send a screenshot of your home screen','Sing the alphabet backwards','Voice-note a fake love confession','Type using only your nose for 10 sec'];

export default [
    // TIC TAC TOE
    ok('ttt-start',['tttnew','tictactoe-new'], (ctx) => {
        global.gameStore.tictactoe[ctx.from] = { board: Array(9).fill(''), turn: 'X', players: { X: ctx.sender, O: null } };
        return `🎮 *Tic-tac-toe started!* You are X. Another player joins with *${ctx.prefix}ttt-join*. Place with *${ctx.prefix}ttt 1-9*.\n\n${ttRender(global.gameStore.tictactoe[ctx.from].board)}`;
    }, 'Start tictactoe'),
    ok('ttt-join',['tttj','tictactoe-join'], (ctx) => {
        const g = global.gameStore.tictactoe[ctx.from];
        if (!g) throw new Error('No game running');
        if (!g.players.O && g.players.X !== ctx.sender) g.players.O = ctx.sender;
        return `🎮 ${ctx.sender.split('@')[0]} joined as O. Whoever is X plays first.`;
    }, 'Join tictactoe'),
    ok('ttt',['tictactoe','ttt-place'], (ctx) => {
        const g = global.gameStore.tictactoe[ctx.from];
        if (!g) throw new Error('No active game. Start with .ttt-start');
        const pos = parseInt(ctx.args[0]) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8) throw new Error('Pick 1-9');
        if (g.board[pos]) throw new Error('Cell taken');
        if (g.players[g.turn] && g.players[g.turn] !== ctx.sender) throw new Error('Not your turn');
        g.board[pos] = g.turn;
        const w = ttWinner(g.board);
        if (w) {
            const out = w === 'draw' ? '🤝 Draw' : `🏆 ${w} wins!`;
            delete global.gameStore.tictactoe[ctx.from];
            return `${ttRender(g.board)}\n\n${out}`;
        }
        g.turn = g.turn === 'X' ? 'O' : 'X';
        return `${ttRender(g.board)}\n\nNext: *${g.turn}*`;
    }, 'Place tictactoe move'),
    ok('ttt-quit',['tttq','tictactoe-quit'], (ctx) => {
        delete global.gameStore.tictactoe[ctx.from];
        return '🛑 Tictactoe game ended.';
    }, 'Quit tictactoe'),

    // HANGMAN
    ok('hm-start',['hangman-new','hangman'], (ctx) => {
        const word = PICK(HM_WORDS);
        global.gameStore.hangman[ctx.from] = { word, guessed: new Set(), lives: 6, by: ctx.sender };
        return `🪢 *Hangman!* Word: ${word.replace(/./g, '_ ').trim()}\nLives: 6\nGuess with *${ctx.prefix}hm <letter>*`;
    }, 'Start hangman'),
    ok('hm',['hm-guess','hangman-guess'], (ctx) => {
        const g = global.gameStore.hangman[ctx.from];
        if (!g) throw new Error('No hangman game. Start with .hm-start');
        const ch = (ctx.args[0] || '').toLowerCase().trim()[0];
        if (!ch || !/[a-z]/.test(ch)) throw new Error('Guess a single letter');
        if (g.guessed.has(ch)) throw new Error('Already guessed');
        g.guessed.add(ch);
        if (!g.word.includes(ch)) g.lives--;
        const masked = g.word.split('').map(c => g.guessed.has(c) ? c : '_').join(' ');
        if (!masked.includes('_')) {
            delete global.gameStore.hangman[ctx.from];
            return `🎉 You won! Word was *${g.word}*`;
        }
        if (g.lives <= 0) {
            delete global.gameStore.hangman[ctx.from];
            return `💀 You died! Word was *${g.word}*`;
        }
        return `${masked}\nLives: ${g.lives}\nGuessed: ${[...g.guessed].sort().join(' ')}`;
    }, 'Guess hangman letter'),

    // GUESS A NUMBER
    ok('guess-start',['gns','guessnum-start'], (ctx) => {
        global.gameStore.guess[ctx.from] = { n: RNG(1, 100), by: ctx.sender };
        return '🎯 I picked a number 1–100. Use *.guess <n>*';
    }, 'Start guess-the-number'),
    ok('guess',['gn','guessnum'], (ctx) => {
        const g = global.gameStore.guess[ctx.from];
        if (!g) throw new Error('No game. Start with .guess-start');
        const n = parseInt(ctx.args[0]);
        if (isNaN(n)) throw new Error('Guess a number');
        if (n === g.n) {
            delete global.gameStore.guess[ctx.from];
            return `🎉 ${n} is correct!`;
        }
        return n < g.n ? '⬆ Higher' : '⬇ Lower';
    }, 'Guess the number'),

    // MATH GAME
    ok('math-start',['math-q','mathgame'], (ctx) => {
        const a = RNG(1, 50), b = RNG(1, 50);
        const op = PICK(['+', '-', '*']);
        const ans = eval(`${a} ${op} ${b}`);
        global.gameStore.math[ctx.from] = { q: `${a} ${op} ${b}`, ans, by: ctx.sender };
        return `🧮 Solve: *${a} ${op} ${b} = ?*\nAnswer with *.math <n>*`;
    }, 'Math challenge'),
    ok('math',['math-ans','math-answer'], (ctx) => {
        const g = global.gameStore.math[ctx.from];
        if (!g) throw new Error('No math game. Start with .math-start');
        const n = parseInt(ctx.args[0]);
        if (n === g.ans) {
            delete global.gameStore.math[ctx.from];
            return `✅ Correct! ${g.q} = ${g.ans}`;
        }
        return `❌ Try again`;
    }, 'Answer math'),

    // WORD SCRAMBLE
    ok('scramble-start',['scramble-new','scramble'], (ctx) => {
        const word = PICK(WORD_BANK);
        global.gameStore.word[ctx.from] = { word, by: ctx.sender };
        const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
        return `🔤 Unscramble: *${scrambled}*\nAnswer with *.scramble-ans <word>*`;
    }, 'Start word scramble'),
    ok('scramble-ans',['scramble-answer','sca'], (ctx) => {
        const g = global.gameStore.word[ctx.from];
        if (!g) throw new Error('No game. Start with .scramble-start');
        const a = (ctx.args[0] || '').toLowerCase();
        if (a === g.word) {
            delete global.gameStore.word[ctx.from];
            return `🎉 Correct! Word was *${g.word}*`;
        }
        return '❌ Wrong, try again';
    }, 'Answer scramble'),

    // TRUTH OR DARE
    ok('todstart',['truthordare-start','tod'], (ctx) => {
        return `🎲 ${PICK(['Truth','Dare'])}: ${PICK(Math.random() < 0.5 ? TOD_TRUTHS : TOD_DARES)}`;
    }, 'Truth or dare'),
    ok('truth-q',['truth-x'], () => '🤔 ' + PICK(TOD_TRUTHS), 'Truth question'),
    ok('dare-q',['dare-x'], () => '🎯 ' + PICK(TOD_DARES), 'Dare prompt'),

    // SLOTS
    ok('slots',['slot','spin'], () => {
        const symbols = ['🍒','🍋','🍇','🔔','💎','7'];
        const r = [PICK(symbols), PICK(symbols), PICK(symbols)];
        const win = r[0] === r[1] && r[1] === r[2];
        return `🎰 [ ${r.join(' | ')} ]\n${win ? '🏆 JACKPOT!' : '😅 Try again'}`;
    }, 'Spin the slot machine'),

    // BLACKJACK simplified
    ok('blackjack',['bj','21'], () => {
        const draw = () => RNG(1, 11);
        const player = [draw(), draw()];
        const dealer = [draw(), draw()];
        return `🃏 *Blackjack*\nYou: ${player.join(' + ')} = ${player.reduce((a,b) => a+b)}\nDealer: ${dealer.join(' + ')} = ${dealer.reduce((a,b) => a+b)}`;
    }, 'Quick blackjack hand'),

    // LOTTERY
    ok('lotto',['lottery'], () => {
        const draw = () => RNG(1, 49);
        const balls = new Set();
        while (balls.size < 6) balls.add(draw());
        return `🎟 Lotto draw: *${[...balls].sort((a, b) => a - b).join(' · ')}*`;
    }, 'Lottery draw'),

    // BINGO
    ok('bingo',['bingo-call'], () => {
        const letters = 'BINGO';
        const num = RNG(1, 75);
        const letter = letters[Math.floor((num - 1) / 15)];
        return `🎱 Bingo: *${letter}-${num}*`;
    }, 'Bingo call'),

    // QUEST
    ok('quest',['questgen','random-quest'], () => {
        return '🗡 ' + PICK(['Defeat the dragon of Mt Kenya','Recover the lost tablet of Karatasi','Cross the desert in 7 days','Find the hidden library of Alexandria']);
    }, 'Random quest'),
];
