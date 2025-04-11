import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 读取.env.local文件并解析环境变量
function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const envVars: Record<string, string> = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      // 跳过空行和注释
      if (!line || line.startsWith('#')) return;
      
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        
        // 移除引号
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        envVars[key] = value;
      }
    });
  }
  
  return envVars;
}

// 加载环境变量
const env = loadEnv();
console.log('已读取环境变量');

// 创建Supabase客户端
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('无法获取Supabase配置。请确保.env.local文件包含NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 任务存储路径
const TASKS_DIR = path.join(process.cwd(), 'tasks');

async function migrateLocalData() {
  console.log('开始迁移本地数据到Supabase...');
  
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
        console.log(`迁移任务ID: ${taskData.id || file.replace('.json', '')}, 音乐数量: ${taskData.results.length}`);
        
        // 为每个音乐创建记录
        for (const musicItem of taskData.results) {
          // 修正：使用驼峰命名字段，同时兼容下划线命名
          const audioUrl = musicItem.audioUrl || musicItem.sourceAudioUrl || musicItem.audio_url || musicItem.source_audio_url;
          const imageUrl = musicItem.imageUrl || musicItem.sourceImageUrl || musicItem.image_url || musicItem.source_image_url;
          
          const musicId = musicItem.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          console.log(`处理音乐: ${musicId}, 标题: ${musicItem.title || 'Untitled'}`);
          console.log(`音频URL: ${audioUrl || 'N/A'}, 图像URL: ${imageUrl || 'N/A'}`);
          
          // 插入数据到Supabase
          const { data, error } = await supabase
            .from('music_tracks')
            .insert({
              id: musicId,
              title: musicItem.title || 'Untitled',
              prompt: musicItem.prompt || '',
              audio_url: audioUrl,
              image_url: imageUrl,
              duration: musicItem.duration || 0,
              model: musicItem.model_name || musicItem.modelName || '',
              instrumental: !!taskData.params?.instrumental,
              tags: musicItem.tags || [],
              task_id: taskData.id || file.replace('.json', ''),
              created_at: new Date(musicItem.createTime || taskData.createdAt || Date.now()).toISOString()
            });
            
          if (error) {
            console.error(`插入音乐数据失败:`, error);
          } else {
            console.log(`成功插入音乐数据: ${musicId}`);
          }
        }
      } else {
        console.log(`跳过非成功任务或无结果任务: ${file}`);
      }
    } catch (err) {
      console.error(`处理文件${file}失败:`, err);
    }
  }
  
  console.log('数据迁移完成!');
}

// 执行迁移
migrateLocalData().catch(err => {
  console.error('迁移过程中发生错误:', err);
}); 