/*════════════════════════════════════════
 *  Search commands
 *══════════════════════════════════════*/
import { dlBuffer } from '../_helpers.js';

const ok = (name, aliases, fn, desc) => ({ name, aliases, category: 'search', desc, run: async (ctx) => { try { const r = await fn(ctx); if (r != null) await ctx.reply(String(r)); } catch (e) { await ctx.reply(`❌ ${e?.message || e}`); } } });

export default [
    ok('wikipedia',['wiki','wiki-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}wiki <query>`);
        const j = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        if (!j?.extract) return '❌ no result';
        const text = `📚 *${j.title}*\n\n${j.extract}\n\n${j.content_urls?.desktop?.page || ''}`;
        if (j.thumbnail?.source) {
            const buf = await dlBuffer(j.thumbnail.source);
            await ctx.neo.sendMessage(ctx.from, { image: buf, caption: text }, { quoted: ctx.m });
            return null;
        }
        return text;
    }, 'Wikipedia search'),

    ok('ddg',['duckduckgo','dduck'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}ddg <query>`);
        const j = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(ctx.text)}&format=json&no_html=1`).then(r => r.json()).catch(() => null);
        if (!j) return '❌';
        const txt = j.AbstractText || j.RelatedTopics?.[0]?.Text || 'No instant answer';
        return `🦆 ${txt}\n${j.AbstractURL || j.RelatedTopics?.[0]?.FirstURL || ''}`;
    }, 'DuckDuckGo instant answer'),

    ok('github-search',['ghsearch','github-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}ghsearch <query>`);
        const j = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(ctx.text)}&per_page=5`).then(r => r.json()).catch(() => null);
        if (!j?.items) return '❌';
        return '🐙 *GitHub repos*\n\n' + j.items.map((r, i) => `${i + 1}. *${r.full_name}* ⭐${r.stargazers_count}\n   ${r.description || ''}\n   ${r.html_url}`).join('\n\n');
    }, 'GitHub repo search'),

    ok('npm-search',['npmsearch','npm-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}npmsearch <query>`);
        const j = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(ctx.text)}&size=5`).then(r => r.json()).catch(() => null);
        if (!j?.objects) return '❌';
        return '📦 *npm*\n\n' + j.objects.map((o, i) => `${i + 1}. *${o.package.name}* v${o.package.version}\n   ${o.package.description || ''}`).join('\n\n');
    }, 'npm package search'),

    ok('pypi',['pip-search'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}pypi <package>`);
        const j = await fetch(`https://pypi.org/pypi/${encodeURIComponent(ctx.text)}/json`).then(r => r.json()).catch(() => null);
        if (!j?.info) return '❌ not found';
        return `🐍 *${j.info.name}* v${j.info.version}\n• ${j.info.summary || ''}\n• Author: ${j.info.author || '—'}\n• License: ${j.info.license || '—'}\n• ${j.info.home_page || ''}`;
    }, 'PyPI package info'),

    ok('crates',['cargo-search'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}crates <crate>`);
        const j = await fetch(`https://crates.io/api/v1/crates/${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const c = j?.crate;
        if (!c) return '❌';
        return `🦀 *${c.id}* v${c.newest_version}\n• ${c.description || ''}\n• Downloads: ${c.downloads.toLocaleString()}`;
    }, 'crates.io crate info'),

    ok('weather-search',['wsearch','wx-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}wx <city>`);
        const r = await fetch(`https://wttr.in/${encodeURIComponent(ctx.text)}?format=4`).then(r => r.text());
        return `🌤 ${r}`;
    }, 'Weather search'),

    ok('movie-find',['imdb-search','search-movie'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}movie-find <title>`);
        const j = await fetch(`https://api.popcat.xyz/imdb?q=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        if (!j?.title) return '❌';
        return `🎬 *${j.title}* (${j.year}) — ⭐${j.imdbrating}\n${j.plot}`;
    }, 'Movie search'),

    ok('book',['booksearch','bk'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}book <title>`);
        const j = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(ctx.text)}&limit=3`).then(r => r.json()).catch(() => null);
        if (!j?.docs) return '❌';
        return '📚 *Books*\n\n' + j.docs.slice(0, 3).map((b, i) => `${i + 1}. *${b.title}* — ${(b.author_name || []).join(', ')}\n   First published: ${b.first_publish_year || '?'}`).join('\n\n');
    }, 'Open Library book search'),

    ok('anime-search',['anisearch','anime-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}anisearch <title>`);
        const j = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(ctx.text)}&limit=1`).then(r => r.json()).catch(() => null);
        const a = j?.data?.[0];
        if (!a) return '❌';
        return `🌸 *${a.title}* (${a.type})\n• Score: ${a.score} ⭐\n• Episodes: ${a.episodes}\n• Status: ${a.status}\n• ${a.synopsis?.slice(0, 350)}…`;
    }, 'Anime search (MAL)'),

    ok('manga',['mangasearch','manga-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}manga <title>`);
        const j = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(ctx.text)}&limit=1`).then(r => r.json()).catch(() => null);
        const a = j?.data?.[0];
        if (!a) return '❌';
        return `📚 *${a.title}*\n• Score: ${a.score} ⭐\n• Volumes: ${a.volumes}\n• Status: ${a.status}\n• ${a.synopsis?.slice(0, 350)}…`;
    }, 'Manga search'),

    ok('mealsearch',['meal-search','recipe-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}mealsearch <name>`);
        const j = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const m = j?.meals?.[0];
        if (!m) return '❌';
        return `🍽 *${m.strMeal}* — ${m.strArea}\n${m.strInstructions?.slice(0, 600)}…`;
    }, 'Meal/recipe search'),

    ok('cocktail-search',['drink-find','cocktail-find'], async (ctx) => {
        if (!ctx.text) throw new Error(`Usage: ${ctx.prefix}cocktail-search <name>`);
        const j = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(ctx.text)}`).then(r => r.json()).catch(() => null);
        const d = j?.drinks?.[0];
        if (!d) return '❌';
        return `🍹 *${d.strDrink}*\n${d.strInstructions || ''}`;
    }, 'Cocktail search'),
];
