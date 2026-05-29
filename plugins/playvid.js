import axios from 'axios';
import yts from 'yt-search';

export default async function playvid(neo, m, text, mzazireply) {
  try {
    if (!text) return mzazireply('🎬 Example: .playvid faded');

    let search = await yts(text);
    let video = search.videos[0];

    if (!video) return mzazireply('❌ Video not found');

    let api = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(video.url)}&type=mp4`;

    let { data } = await axios.get(api);

    if (!data.status || !data.result?.download) {
      return mzazireply('❌ Failed to fetch video');
    }

    // 🔥 SEND INFO FIRST
    await neo.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption: `╭━━〔 🎬 DARKNODE VIDEO 〕━━⬣
┃ 🎥 Title : ${video.title}
┃ ⏱ Duration : ${video.timestamp}
┃ 👀 Views : ${video.views.toLocaleString()}
┃ 📺 Channel : ${video.author.name}
┃ 🔗 URL : ${video.url}
╰━━━━━━━━━━━━━━━━⬣

⏳ Downloading video...`
    }, { quoted: m });

    // 🔥 SEND VIDEO
    await neo.sendMessage(m.chat, {
      video: { url: data.result.download },
      mimetype: 'video/mp4',
      caption: `Video tittle 👉 🎬 ${video.title}.mp4`
    }, { quoted: m });

  } catch (e) {
    console.log(e);
    mzazireply('❌ Error downloading video');
  }
}