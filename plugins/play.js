// plugins/play.js

import axios from 'axios';
import yts from 'yt-search';

export default async function play(neo, m, text, mzazireply) {
  try {
    if (!text) return mzazireply('🎵 Example: .play faded');

    let search = await yts(text);
    let video = search.videos[0];

    if (!video) return mzazireply('❌ Song not found');

    let api = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(video.url)}&type=mp3`;

    let { data } = await axios.get(api);

    if (!data.status || !data.result?.download) {
      return mzazireply('❌ Failed to fetch audio');
    }

    // 🔥 SEND INFO FIRST
    await neo.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption: `╭━━〔 🎧 DARKNODE PLAYER 〕━━⬣
┃ 🎵 Title : ${video.title}
┃ ⏱ Duration : ${video.timestamp}
┃ 👀 Views : ${video.views.toLocaleString()}
┃ 📺 Channel : ${video.author.name}
┃ 🔗 URL : I will not provide Video Url since you can be removed by other stupid admins using cheap bots antilink commands
╰━━━━━━━━━━━━━━━━⬣

⏳ Downloading audio...`
    }, { quoted: m });

    // 🔥 THEN SEND AUDIO
    await neo.sendMessage(m.chat, {
      audio: { url: data.result.download },
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`
    }, { quoted: m });

  } catch (e) {
    console.log(e);
    mzazireply('❌ Error downloading song');
  }
}