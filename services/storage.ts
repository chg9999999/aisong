// services/storage.ts
// 数据存储服务接口与实现

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  MusicResource,
  LyricsResource,
  VocalRemovalResult,
  WavConversionResult,
  Mp4VideoResult,
  MusicExtensionResult,
  MusicLibrary
} from '@/types/music';
import { TaskBase } from '@/types/common';

// 数据库结构类型
interface DbTask {
  id: string;
  user_id: string;
  data: any;
  created_at: string;
  updated_at: string;
}

interface DbMusicResource {
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  stream_audio_url?: string;
  image_url?: string;
  prompt: string;
  tags: string[];
  duration: number;
  created_at: string;
  model: string;
  updated_at: string;
}

interface DbLyricsResource {
  id: string;
  user_id: string;
  title: string;
  text: string;
  created_at: string;
  updated_at: string;
}

interface DbVocalRemovalResult {
  task_id: string;
  user_id: string;
  original_url: string;
  instrumental_url: string;
  vocal_url: string;
  created_at: string;
  updated_at: string;
}

interface DbWavConversionResult {
  task_id: string;
  user_id: string;
  original_audio_id: string;
  wav_url: string;
  created_at: string;
  updated_at: string;
}

interface DbMp4VideoResult {
  task_id: string;
  user_id: string;
  original_audio_id: string;
  video_url: string;
  caption_mode?: string;
  created_at: string;
  updated_at: string;
}

interface DbMusicExtensionResult {
  task_id: string;
  user_id: string;
  original_audio_id: string;
  extended_music_id: string;
  continue_at_position: number;
  created_at: string;
  updated_at: string;
}

interface DbRecentTask {
  task_id: string;
  user_id: string;
  created_at: string;
  type: string;
  updated_at: string;
}

// 存储服务接口
export interface IStorageService {
  // 任务相关
  saveTaskData(taskId: string, data: any): Promise<void>;
  getTaskData<T>(taskId: string): Promise<T | null>;
  
  // 资源相关
  saveMusicResource(resource: MusicResource): Promise<void>;
  getMusicResource(id: string): Promise<MusicResource | null>;
  
  // 任务列表
  getRecentTasks(): Promise<TaskBase[]>;
  addRecentTask(task: TaskBase): Promise<void>;
  
  // 音乐库
  getMusicLibrary(): Promise<MusicLibrary>;
  
  // 歌词相关
  saveLyricsResource(resource: LyricsResource): Promise<void>;
  getLyricsResource(id: string): Promise<LyricsResource | null>;
  
  // 人声分离相关
  saveVocalRemovalResult(result: VocalRemovalResult): Promise<void>;
  getVocalRemovalResult(taskId: string): Promise<VocalRemovalResult | null>;
  
  // WAV转换相关
  saveWavConversionResult(result: WavConversionResult): Promise<void>;
  getWavConversionResult(taskId: string): Promise<WavConversionResult | null>;
  
  // MP4视频相关
  saveMp4VideoResult(result: Mp4VideoResult): Promise<void>;
  getMp4VideoResult(taskId: string): Promise<Mp4VideoResult | null>;
  
  // 音乐扩展相关
  saveMusicExtensionResult(result: MusicExtensionResult): Promise<void>;
  getMusicExtensionResult(taskId: string): Promise<MusicExtensionResult | null>;
  
  // 用户设置
  saveUserSettings(settings: any): Promise<void>;
  getUserSettings<T>(): Promise<T | null>;
  
  // 数据导出导入
  exportAllData(): Promise<string>;
  importAllData(jsonStr: string): Promise<boolean>;
  
  // 清理数据
  clearAllData(): Promise<void>;
}

// Supabase存储服务实现
export class SupabaseStorageService implements IStorageService {
  private supabase: SupabaseClient;
  
  constructor() {
    // 从环境变量获取Supabase配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // 创建Supabase客户端
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  // 任务相关
  async saveTaskData(taskId: string, data: any): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .upsert({ 
        id: taskId, 
        data: data,
        updated_at: new Date().toISOString() 
      });
      
    if (error) throw error;
  }
  
  async getTaskData<T>(taskId: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('data')
      .eq('id', taskId)
      .single();
      
    if (error) return null;
    return data?.data as T || null;
  }
  
  // 资源相关
  async saveMusicResource(resource: MusicResource): Promise<void> {
    // 保存音乐资源
    const { error } = await this.supabase
      .from('music_resources')
      .upsert({
        id: resource.id,
        title: resource.title,
        audio_url: resource.audioUrl,
        stream_audio_url: resource.streamAudioUrl,
        image_url: resource.imageUrl,
        prompt: resource.prompt,
        tags: resource.tags,
        duration: resource.duration,
        created_at: resource.createdAt,
        model: resource.model,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // 更新音乐库表
    await this.updateMusicLibrary('music', resource.id);
  }
  
  async getMusicResource(id: string): Promise<MusicResource | null> {
    const { data, error } = await this.supabase
      .from('music_resources')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) return null;
    
    // 转换为应用所需的格式
    if (data) {
      const dbResource = data as DbMusicResource;
      return {
        id: dbResource.id,
        title: dbResource.title,
        audioUrl: dbResource.audio_url,
        streamAudioUrl: dbResource.stream_audio_url,
        imageUrl: dbResource.image_url,
        prompt: dbResource.prompt,
        tags: dbResource.tags,
        duration: dbResource.duration,
        createdAt: dbResource.created_at,
        model: dbResource.model
      };
    }
    
    return null;
  }
  
  // 任务列表
  async getRecentTasks(): Promise<TaskBase[]> {
    const { data, error } = await this.supabase
      .from('recent_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (error) return [];
    
    return (data as DbRecentTask[]).map(item => ({
      taskId: item.task_id,
      createdAt: item.created_at,
      type: item.type as TaskBase['type']
    }));
  }
  
  async addRecentTask(task: TaskBase): Promise<void> {
    const { error } = await this.supabase
      .from('recent_tasks')
      .upsert({
        task_id: task.taskId,
        created_at: task.createdAt,
        type: task.type,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
  }
  
  // 音乐库
  async getMusicLibrary(): Promise<MusicLibrary> {
    // 默认返回空音乐库
    const defaultLibrary: MusicLibrary = {
      music: [],
      lyrics: [],
      vocalRemovals: [],
      wavConversions: [],
      videos: [],
      extensions: []
    };
    
    try {
      // 获取音乐资源
      const { data: musicData, error: musicError } = await this.supabase
        .from('music_resources')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (musicData && !musicError) {
        defaultLibrary.music = (musicData as DbMusicResource[]).map(item => ({
          id: item.id,
          title: item.title,
          audioUrl: item.audio_url,
          streamAudioUrl: item.stream_audio_url,
          imageUrl: item.image_url,
          prompt: item.prompt,
          tags: item.tags,
          duration: item.duration,
          createdAt: item.created_at,
          model: item.model
        }));
      }
      
      // 获取歌词资源
      const { data: lyricsData, error: lyricsError } = await this.supabase
        .from('lyrics_resources')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (lyricsData && !lyricsError) {
        defaultLibrary.lyrics = (lyricsData as DbLyricsResource[]).map(item => ({
          id: item.id,
          title: item.title,
          text: item.text,
          createdAt: item.created_at
        }));
      }
      
      // 获取人声分离结果
      const { data: vocalData, error: vocalError } = await this.supabase
        .from('vocal_removal_results')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (vocalData && !vocalError) {
        defaultLibrary.vocalRemovals = (vocalData as DbVocalRemovalResult[]).map(item => ({
          taskId: item.task_id,
          originalUrl: item.original_url,
          instrumentalUrl: item.instrumental_url,
          vocalUrl: item.vocal_url,
          createdAt: item.created_at
        }));
      }
      
      // 获取WAV转换结果
      const { data: wavData, error: wavError } = await this.supabase
        .from('wav_conversion_results')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (wavData && !wavError) {
        defaultLibrary.wavConversions = (wavData as DbWavConversionResult[]).map(item => ({
          taskId: item.task_id,
          originalAudioId: item.original_audio_id,
          wavUrl: item.wav_url,
          createdAt: item.created_at
        }));
      }
      
      // 获取MP4视频结果
      const { data: mp4Data, error: mp4Error } = await this.supabase
        .from('mp4_video_results')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (mp4Data && !mp4Error) {
        defaultLibrary.videos = (mp4Data as DbMp4VideoResult[]).map(item => ({
          taskId: item.task_id,
          originalAudioId: item.original_audio_id,
          videoUrl: item.video_url,
          captionMode: item.caption_mode as Mp4VideoResult['captionMode'],
          createdAt: item.created_at
        }));
      }
      
      // 获取音乐扩展结果
      const { data: extensionData, error: extensionError } = await this.supabase
        .from('music_extension_results')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (extensionData && !extensionError) {
        // 这里需要额外查询扩展的音乐资源
        defaultLibrary.extensions = await Promise.all(
          (extensionData as DbMusicExtensionResult[]).map(async item => {
            const musicResource = await this.getMusicResource(item.extended_music_id);
            return {
              taskId: item.task_id,
              originalAudioId: item.original_audio_id,
              extendedMusicResource: musicResource!,
              continueAtPosition: item.continue_at_position,
              createdAt: item.created_at
            };
          })
        );
      }
      
      return defaultLibrary;
    } catch (error) {
      console.error('获取音乐库失败:', error);
      return defaultLibrary;
    }
  }
  
  // 更新音乐库
  private async updateMusicLibrary(type: string, resourceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('library_items')
      .upsert({
        resource_id: resourceId,
        type: type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
  }
  
  // 歌词相关
  async saveLyricsResource(resource: LyricsResource): Promise<void> {
    const { error } = await this.supabase
      .from('lyrics_resources')
      .upsert({
        id: resource.id,
        title: resource.title,
        text: resource.text,
        created_at: resource.createdAt,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // 更新音乐库表
    await this.updateMusicLibrary('lyrics', resource.id);
  }
  
  async getLyricsResource(id: string): Promise<LyricsResource | null> {
    const { data, error } = await this.supabase
      .from('lyrics_resources')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) return null;
    
    if (data) {
      const dbResource = data as DbLyricsResource;
      return {
        id: dbResource.id,
        title: dbResource.title,
        text: dbResource.text,
        createdAt: dbResource.created_at
      };
    }
    
    return null;
  }
  
  // 人声分离相关
  async saveVocalRemovalResult(result: VocalRemovalResult): Promise<void> {
    const { error } = await this.supabase
      .from('vocal_removal_results')
      .upsert({
        task_id: result.taskId,
        original_url: result.originalUrl,
        instrumental_url: result.instrumentalUrl,
        vocal_url: result.vocalUrl,
        created_at: result.createdAt,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // 更新音乐库表
    await this.updateMusicLibrary('vocal_removal', result.taskId);
  }
  
  async getVocalRemovalResult(taskId: string): Promise<VocalRemovalResult | null> {
    const { data, error } = await this.supabase
      .from('vocal_removal_results')
      .select('*')
      .eq('task_id', taskId)
      .single();
      
    if (error) return null;
    
    if (data) {
      const dbResult = data as DbVocalRemovalResult;
      return {
        taskId: dbResult.task_id,
        originalUrl: dbResult.original_url,
        instrumentalUrl: dbResult.instrumental_url,
        vocalUrl: dbResult.vocal_url,
        createdAt: dbResult.created_at
      };
    }
    
    return null;
  }
  
  // WAV转换相关
  async saveWavConversionResult(result: WavConversionResult): Promise<void> {
    const { error } = await this.supabase
      .from('wav_conversion_results')
      .upsert({
        task_id: result.taskId,
        original_audio_id: result.originalAudioId,
        wav_url: result.wavUrl,
        created_at: result.createdAt,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // 更新音乐库表
    await this.updateMusicLibrary('wav', result.taskId);
  }
  
  async getWavConversionResult(taskId: string): Promise<WavConversionResult | null> {
    const { data, error } = await this.supabase
      .from('wav_conversion_results')
      .select('*')
      .eq('task_id', taskId)
      .single();
      
    if (error) return null;
    
    if (data) {
      const dbResult = data as DbWavConversionResult;
      return {
        taskId: dbResult.task_id,
        originalAudioId: dbResult.original_audio_id,
        wavUrl: dbResult.wav_url,
        createdAt: dbResult.created_at
      };
    }
    
    return null;
  }
  
  // MP4视频相关
  async saveMp4VideoResult(result: Mp4VideoResult): Promise<void> {
    const { error } = await this.supabase
      .from('mp4_video_results')
      .upsert({
        task_id: result.taskId,
        original_audio_id: result.originalAudioId,
        video_url: result.videoUrl,
        caption_mode: result.captionMode,
        created_at: result.createdAt,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // 更新音乐库表
    await this.updateMusicLibrary('mp4', result.taskId);
  }
  
  async getMp4VideoResult(taskId: string): Promise<Mp4VideoResult | null> {
    const { data, error } = await this.supabase
      .from('mp4_video_results')
      .select('*')
      .eq('task_id', taskId)
      .single();
      
    if (error) return null;
    
    if (data) {
      const dbResult = data as DbMp4VideoResult;
      return {
        taskId: dbResult.task_id,
        originalAudioId: dbResult.original_audio_id,
        videoUrl: dbResult.video_url,
        captionMode: dbResult.caption_mode as Mp4VideoResult['captionMode'],
        createdAt: dbResult.created_at
      };
    }
    
    return null;
  }
  
  // 音乐扩展相关
  async saveMusicExtensionResult(result: MusicExtensionResult): Promise<void> {
    const { error } = await this.supabase
      .from('music_extension_results')
      .upsert({
        task_id: result.taskId,
        original_audio_id: result.originalAudioId,
        extended_music_id: result.extendedMusicResource.id,
        continue_at_position: result.continueAtPosition,
        created_at: result.createdAt,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // 保存扩展的音乐资源
    await this.saveMusicResource(result.extendedMusicResource);
    
    // 更新音乐库表
    await this.updateMusicLibrary('extend', result.taskId);
  }
  
  async getMusicExtensionResult(taskId: string): Promise<MusicExtensionResult | null> {
    const { data, error } = await this.supabase
      .from('music_extension_results')
      .select('*')
      .eq('task_id', taskId)
      .single();
      
    if (error) return null;
    
    if (data) {
      const dbResult = data as DbMusicExtensionResult;
      const musicResource = await this.getMusicResource(dbResult.extended_music_id);
      if (!musicResource) return null;
      
      return {
        taskId: dbResult.task_id,
        originalAudioId: dbResult.original_audio_id,
        extendedMusicResource: musicResource,
        continueAtPosition: dbResult.continue_at_position,
        createdAt: dbResult.created_at
      };
    }
    
    return null;
  }
  
  // 用户设置
  async saveUserSettings(settings: any): Promise<void> {
    const userId = await this.getCurrentUserId();
    
    const { error } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
  }
  
  async getUserSettings<T>(): Promise<T | null> {
    const userId = await this.getCurrentUserId();
    
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();
      
    if (error) return null;
    return data?.settings as T || null;
  }
  
  // 获取当前用户ID
  private async getCurrentUserId(): Promise<string> {
    const { data } = await this.supabase.auth.getUser();
    return data.user?.id || 'anonymous';
  }
  
  // 数据导出
  async exportAllData(): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      
      // 查询与用户相关的所有数据
      const [
        { data: tasks },
        { data: music },
        { data: lyrics },
        { data: vocalRemovals },
        { data: wavConversions },
        { data: mp4Videos },
        { data: musicExtensions },
        { data: userSettings }
      ] = await Promise.all([
        this.supabase.from('tasks').select('*').eq('user_id', userId),
        this.supabase.from('music_resources').select('*').eq('user_id', userId),
        this.supabase.from('lyrics_resources').select('*').eq('user_id', userId),
        this.supabase.from('vocal_removal_results').select('*').eq('user_id', userId),
        this.supabase.from('wav_conversion_results').select('*').eq('user_id', userId),
        this.supabase.from('mp4_video_results').select('*').eq('user_id', userId),
        this.supabase.from('music_extension_results').select('*').eq('user_id', userId),
        this.supabase.from('user_settings').select('*').eq('user_id', userId)
      ]);
      
      // 整合所有数据
      const exportData = {
        tasks: tasks || [],
        music: music || [],
        lyrics: lyrics || [],
        vocalRemovals: vocalRemovals || [],
        wavConversions: wavConversions || [],
        mp4Videos: mp4Videos || [],
        musicExtensions: musicExtensions || [],
        userSettings: userSettings || []
      };
      
      return JSON.stringify(exportData);
    } catch (error) {
      console.error('导出数据失败:', error);
      return '{}';
    }
  }
  
  // 数据导入
  async importAllData(jsonStr: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      const data = JSON.parse(jsonStr);
      
      // 导入所有数据
      const tasks = Array.isArray(data.tasks) ? data.tasks.map((task: any) => ({ ...task, user_id: userId })) : [];
      const music = Array.isArray(data.music) ? data.music.map((item: any) => ({ ...item, user_id: userId })) : [];
      const lyrics = Array.isArray(data.lyrics) ? data.lyrics.map((item: any) => ({ ...item, user_id: userId })) : [];
      const vocalRemovals = Array.isArray(data.vocalRemovals) ? data.vocalRemovals.map((item: any) => ({ ...item, user_id: userId })) : [];
      const wavConversions = Array.isArray(data.wavConversions) ? data.wavConversions.map((item: any) => ({ ...item, user_id: userId })) : [];
      const mp4Videos = Array.isArray(data.mp4Videos) ? data.mp4Videos.map((item: any) => ({ ...item, user_id: userId })) : [];
      const musicExtensions = Array.isArray(data.musicExtensions) ? data.musicExtensions.map((item: any) => ({ ...item, user_id: userId })) : [];
      const userSettings = Array.isArray(data.userSettings) ? data.userSettings.map((item: any) => ({ ...item, user_id: userId })) : [];
      
      // 批量插入数据
      await Promise.all([
        tasks.length > 0 ? this.supabase.from('tasks').upsert(tasks) : Promise.resolve(),
        music.length > 0 ? this.supabase.from('music_resources').upsert(music) : Promise.resolve(),
        lyrics.length > 0 ? this.supabase.from('lyrics_resources').upsert(lyrics) : Promise.resolve(),
        vocalRemovals.length > 0 ? this.supabase.from('vocal_removal_results').upsert(vocalRemovals) : Promise.resolve(),
        wavConversions.length > 0 ? this.supabase.from('wav_conversion_results').upsert(wavConversions) : Promise.resolve(),
        mp4Videos.length > 0 ? this.supabase.from('mp4_video_results').upsert(mp4Videos) : Promise.resolve(),
        musicExtensions.length > 0 ? this.supabase.from('music_extension_results').upsert(musicExtensions) : Promise.resolve(),
        userSettings.length > 0 ? this.supabase.from('user_settings').upsert(userSettings) : Promise.resolve()
      ]);
      
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }
  
  // 清理数据
  async clearAllData(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // 删除所有用户相关数据
      await Promise.all([
        this.supabase.from('tasks').delete().eq('user_id', userId),
        this.supabase.from('music_resources').delete().eq('user_id', userId),
        this.supabase.from('lyrics_resources').delete().eq('user_id', userId),
        this.supabase.from('vocal_removal_results').delete().eq('user_id', userId),
        this.supabase.from('wav_conversion_results').delete().eq('user_id', userId),
        this.supabase.from('mp4_video_results').delete().eq('user_id', userId),
        this.supabase.from('music_extension_results').delete().eq('user_id', userId),
        this.supabase.from('user_settings').delete().eq('user_id', userId),
        this.supabase.from('library_items').delete().eq('user_id', userId),
        this.supabase.from('recent_tasks').delete().eq('user_id', userId)
      ]);
    } catch (error) {
      console.error('清理数据失败:', error);
    }
  }
}

// 创建存储服务实例
export const storageService: IStorageService = new SupabaseStorageService(); 