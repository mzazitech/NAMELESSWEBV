/*════════════════════════════════════════
 *  AI Image generation – via OpenAI gpt-image-1
 *══════════════════════════════════════*/

async function genImage(openai, prompt, size = '1024x1024') {
    const res = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size,
        n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error('no image data');
    return Buffer.from(b64, 'base64');
}

const imgCmd = (names, sizeOrSuffix = null, opts = {}) => ({
    name: names[0],
    aliases: names.slice(1),
    category: 'ai',
    desc: opts.desc || `Generate an AI image (${names[0]})`,
    run: async (ctx) => {
        const q = (ctx.text || '').trim();
        if (!q) return ctx.reply(`*Usage:* ${ctx.prefix}${ctx.command} <prompt>\n\nExample: ${ctx.prefix}${ctx.command} ${opts.example || 'a futuristic city at sunset'}`);
        const prompt = opts.prefix ? `${opts.prefix} ${q}` : q;
        const size = opts.size || '1024x1024';
        await ctx.m.react?.('🎨').catch(() => {});
        try {
            const buf = await genImage(ctx.openai, prompt, size);
            await ctx.neo.sendMessage(ctx.from, {
                image: buf,
                caption: `🎨 *${names[0]}* — ${q}\n\n_Powered by DARKNODE AI_`
            }, { quoted: ctx.m });
            await ctx.m.react?.('✅').catch(() => {});
        } catch (e) {
            await ctx.reply(`*Image gen failed:* ${e?.message || e}`);
        }
    }
});

export default [
    imgCmd(['imagine','img','draw','image-gen','generate-image','genimg','aiimg','aiimage','dalle','aiart','create-image'], null, { desc: 'Generate any AI image' }),
    imgCmd(['imagine-square','imgsquare'], null, { size: '1024x1024' }),
    imgCmd(['imagine-wide','imgwide','imglandscape'], null, { size: '1536x1024' }),
    imgCmd(['imagine-tall','imgtall','imgportrait'], null, { size: '1024x1536' }),

    // Themed prompts (~30)
    imgCmd(['anime-art','anime-img','anime-gen'],   null, { prefix: 'anime style, vibrant, detailed, cinematic lighting,', example: 'samurai under cherry blossoms' }),
    imgCmd(['realistic-img','realistic'],           null, { prefix: 'photorealistic, ultra detail, 8k,' }),
    imgCmd(['cyberpunk-img','cyberpunk'],           null, { prefix: 'cyberpunk style, neon lights, futuristic,' }),
    imgCmd(['fantasy-img','fantasy'],               null, { prefix: 'epic fantasy art, painterly, dramatic,' }),
    imgCmd(['sci-fi-img','scifi'],                  null, { prefix: 'science fiction, alien worlds, ultra-detailed,' }),
    imgCmd(['watercolor-img','watercolor'],         null, { prefix: 'watercolor painting style, loose brush strokes,' }),
    imgCmd(['oil-painting','oilpaint'],             null, { prefix: 'classic oil painting, museum quality,' }),
    imgCmd(['pixel-art','pixelart','8bit-img'],     null, { prefix: '16-bit pixel art, vibrant palette,' }),
    imgCmd(['line-art','lineart'],                  null, { prefix: 'minimal black and white line art,' }),
    imgCmd(['cartoon-img','cartoon'],               null, { prefix: 'cartoon illustration, bold outlines, bright colors,' }),
    imgCmd(['comic-img','comic'],                   null, { prefix: 'comic book art, ink lines, halftone shading,' }),
    imgCmd(['manga-img','manga'],                   null, { prefix: 'black and white manga panel, dramatic shading,' }),
    imgCmd(['logo-gen','logo-img','logoai'],        null, { prefix: 'professional flat vector logo, simple, white background,' }),
    imgCmd(['poster-img','poster'],                 null, { prefix: 'cinematic movie poster style,' }),
    imgCmd(['wallpaper-img','wallpaper-gen'],       null, { prefix: 'high resolution desktop wallpaper, scenic,' , size: '1536x1024' }),
    imgCmd(['phone-wp','mobile-wp'],                null, { prefix: 'high resolution phone wallpaper, vertical,', size: '1024x1536' }),
    imgCmd(['mascot-img','mascot'],                 null, { prefix: 'cute mascot character, friendly, colorful,' }),
    imgCmd(['sticker-img','sticker-gen'],           null, { prefix: 'cute die-cut sticker, white background,' }),
    imgCmd(['emoji-img','emoji-gen'],               null, { prefix: 'flat emoji style, white background,' }),
    imgCmd(['avatar-gen','avatar-img'],             null, { prefix: 'character portrait avatar, headshot,' }),
    imgCmd(['cute-img','cute-art'],                 null, { prefix: 'kawaii style, soft pastel colors, adorable,' }),
    imgCmd(['dark-art','dark-img'],                 null, { prefix: 'dark moody art, dramatic shadows,' }),
    imgCmd(['vintage-img','vintage'],               null, { prefix: 'vintage 1950s style, faded colors,' }),
    imgCmd(['retro-img','retro'],                   null, { prefix: 'retro 80s aesthetic, neon, synthwave,' }),
    imgCmd(['minimal-img','minimalist'],            null, { prefix: 'minimalist design, lots of whitespace,' }),
    imgCmd(['lowpoly-img','lowpoly'],               null, { prefix: 'low poly 3d art,' }),
    imgCmd(['3d-render','render-3d'],               null, { prefix: '3d render, octane, ultra detail,' }),
    imgCmd(['concept-art','conceptart'],            null, { prefix: 'professional concept art, highly detailed,' }),
    imgCmd(['portrait-gen','portrait-img'],         null, { prefix: 'studio portrait, soft lighting, detailed,' }),
    imgCmd(['landscape-img','landscape-gen'],       null, { prefix: 'breathtaking landscape, golden hour,', size: '1536x1024' }),
    imgCmd(['food-img','foodart'],                  null, { prefix: 'gourmet food photography, top down,' }),
    imgCmd(['car-img','car-art'],                   null, { prefix: 'sports car photography, studio lighting,' }),
    imgCmd(['anime-girl-ai','anime-girl-gen'],      null, { prefix: 'anime girl, beautiful, detailed eyes, soft lighting,' }),
    imgCmd(['anime-boy-ai','anime-boy-gen'],        null, { prefix: 'anime boy, detailed, cinematic lighting,' }),
];
