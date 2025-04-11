import fs from 'fs';
import path from 'path';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2Storage';
import fetch from 'node-fetch';

// 任务存储路径
const TASKS_DIR = path.join(process.cwd(), 'tasks');

async function migrateData() {
  console.log('开始数据迁移...');
  
  if (!fs.existsSync(TASKS_DIR)) {
    console.error('任务目录不存在:', TASKS_DIR);
    return;
  }
  
  // 读取所有JSON文件
  const files = fs.readdirSync(TASKS_DIR).filter(file => file.endsWith('.json'));
  console.log(`找到${files.length}个任务文件`);
  
  // 处理每个任务文件
  for (const file of files) {
    try {
      console.log(`处理文件: ${file}`);
      const filePath = path.join(TASKS_DIR, file);
      const taskData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // 只处理成功的音乐任务
      if (taskData.status === 'SUCCESS' && taskData.results && taskData.results.length > 0) {
        console.log(`迁移任务ID: ${taskData.id}, 音乐数量: ${taskData.results.length}`);
        
        // 为每个音乐创建记录
        for (const musicItem of taskData.results) {
          // 处理音频URL
          let audioUrl = musicItem.audio_url || musicItem.source_audio_url;
          let imageUrl = musicItem.image_url || musicItem.source_image_url;
          
          // 如果有URL，下载并上传到R2
          if (audioUrl) {
            try {
              console.log(`正在处理音频: ${audioUrl}`);
              const audioResponse = await fetch(audioUrl);
              const audioBuffer = await audioResponse.buffer();
              
              // 生成唯一文件名
              const audioKey = `music/${Date.now()}-${musicItem.id}.mp3`;
              
              // 上传到R2
              const newAudioUrl = await uploadToR2(audioKey, audioBuffer, 'audio/mpeg');
              console.log(`音频已上传到R2: ${newAudioUrl}`);
              
              // 更新URL
              audioUrl = newAudioUrl;
            } catch (downloadErr) {
              console.error(`下载/上传音频失败: ${audioUrl}`, downloadErr);
            }
          }
          
          // 同样处理图片
          if (imageUrl) {
            try {
              const imageResponse = await fetch(imageUrl);
              const imageBuffer = await imageResponse.buffer();
              const imageKey = `images/${Date.now()}-${musicItem.id}.jpg`;
              const newImageUrl = await uploadToR2(imageKey, imageBuffer, 'image/jpeg');
              imageUrl = newImageUrl;
            } catch (imgErr) {
              console.error(`下载/上传图片失败: ${imageUrl}`, imgErr);
            }
          }
          
          // 插入数据到Supabase
          const { data, error } = await supabase
            .from('music_tracks')
            .insert({
              id: musicItem.id,
              title: musicItem.title || 'Untitled',
              prompt: musicItem.prompt || '',
              audio_url: audioUrl,
              image_url: imageUrl,
              duration: musicItem.duration || 0,
              model: musicItem.model_name || '',
              instrumental: !!taskData.params?.instrumental,
              tags: musicItem.tags || [],
              task_id: taskData.id,
              created_at: new Date(musicItem.createTime || taskData.createdAt || Date.now()).toISOString()
            });
            
          if (error) {
            console.error(`插入音乐数据失败:`, error);
          } else {
            console.log(`成功插入音乐数据: ${musicItem.id}`);
          }
        }
      }
    } catch (err) {
      console.error(`处理文件${file}失败:`, err);
    }
  }
  
  console.log('数据迁移完成!');
}

// 执行迁移
migrateData().catch(console.error);
