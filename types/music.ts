// types/music.ts
// 定义音乐和音频相关的类型

// 人声分离结果
export interface VocalRemovalResult {
  originalUrl: string;   // 原始音频URL
  instrumentalUrl: string; // 乐器部分（无人声）URL
  vocalUrl: string;      // 人声部分URL
  taskId: string;        // 任务ID
  createdAt: string;     // 创建时间
}

// 本地缓存中的音乐记录
export interface CachedMusicRecord {
  id: string;
  title: string;
  audio_url: string;
  image_url?: string;
  duration: number;
  task_id?: string; // 关联的任务ID
  timestamp: number; // 添加到缓存的时间戳
} 