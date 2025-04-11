import { createClient } from '@supabase/supabase-js';
import { uploadToR2, downloadFromUrl, getR2FileUrl } from '../lib/r2';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateToR2() {
  try {
    // 获取所有音乐记录
    const { data: musicTracks, error } = await supabase
      .from('music_tracks')
      .select('*');

    if (error) {
      console.error('获取音乐记录失败:', error);
      return;
    }

    console.log(`找到 ${musicTracks.length} 条音乐记录`);

    // 遍历每条记录
    for (const track of musicTracks) {
      try {
        console.log(`处理音乐: ${track.title} (${track.id})`);

        let audioUrl = track.audio_url;
        let imageUrl = track.image_url;

        // 检查是否已经是R2 URL
        if (!track.audio_url?.includes(process.env.R2_PUBLIC_URL!)) {
          // 下载并上传音频文件
          const audioBuffer = await downloadFromUrl(track.audio_url);
          const audioKey = `audio/${track.id}.mp3`;
          audioUrl = await uploadToR2(audioKey, audioBuffer, 'audio/mpeg');
          console.log('音频文件已上传到R2:', audioUrl);
        } else {
          console.log('音频文件已在R2中，跳过');
        }

        // 检查图片是否已经是R2 URL
        if (!track.image_url?.includes(process.env.R2_PUBLIC_URL!)) {
          // 下载并上传图片文件
          const imageBuffer = await downloadFromUrl(track.image_url);
          const imageKey = `images/${track.id}.jpg`;
          imageUrl = await uploadToR2(imageKey, imageBuffer, 'image/jpeg');
          console.log('图片文件已上传到R2:', imageUrl);
        } else {
          console.log('图片文件已在R2中，跳过');
        }

        // 更新数据库记录
        const { error: updateError } = await supabase
          .from('music_tracks')
          .update({
            audio_url: audioUrl,
            image_url: imageUrl
          })
          .eq('id', track.id);

        if (updateError) {
          console.error('更新数据库记录失败:', updateError);
        } else {
          console.log('数据库记录已更新');
        }

        // 添加延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`处理音乐 ${track.id} 时出错:`, error);
      }
    }

    console.log('迁移完成');
  } catch (error) {
    console.error('迁移过程出错:', error);
  }
}

// 运行迁移
migrateToR2(); 