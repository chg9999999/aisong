// types/api.ts
// 严格按照API文档定义各种请求和响应类型

import { ApiResponse } from './common';

// 任务状态枚举
export type TaskStatus = 
  | 'PENDING'
  | 'TEXT_SUCCESS'
  | 'FIRST_SUCCESS'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_AUDIO_FAILED'
  | 'GENERATE_LYRICS_FAILED'
  | 'GENERATE_WAV_FAILED'
  | 'GENERATE_MP4_FAILED'
  | 'CALLBACK_EXCEPTION'
  | 'SENSITIVE_WORD_ERROR';

// ==================== 音乐生成相关 ====================
// 音乐生成参数
export interface GenerateMusicParams {
  prompt: string;
  style?: string;
  title?: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: 'V3_5' | 'V4';
  negativeTags?: string;
  callBackUrl?: string;
}

// 音乐生成响应
export interface GenerateMusicResponse {
  taskId: string;
}

// 音频数据
export interface AudioData {
  id: string;
  // 支持下划线命名格式 (API返回格式1)
  audio_url?: string;
  source_audio_url?: string;
  stream_audio_url?: string;
  source_stream_audio_url?: string;
  image_url?: string;
  source_image_url?: string;
  // 支持驼峰命名格式 (API返回格式2)
  audioUrl?: string;
  sourceAudioUrl?: string;
  streamAudioUrl?: string;
  sourceStreamAudioUrl?: string;
  imageUrl?: string;
  sourceImageUrl?: string;
  // 其他字段
  prompt: string;
  model_name?: string;
  modelName?: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
  // 是否是纯音乐
  instrumental?: boolean;
}

// 音乐生成回调数据
export interface MusicGenerateCallbackData {
  callbackType: 'text' | 'first' | 'complete';
  task_id: string;
  data?: AudioData[];
}

// 音乐生成任务信息
export interface MusicTaskInfo {
  taskId: string;
  parentMusicId?: string;
  param: string;
  response: {
    taskId: string;
    sunoData?: AudioData[];
  };
  status: TaskStatus;
  type: string;
  errorCode: string | null;
  errorMessage: string | null;
}

// ==================== 音乐扩展相关 ====================
// 音乐扩展参数
export interface MusicExtensionParams {
  defaultParamFlag?: boolean;
  audioId: string;
  prompt?: string;
  style?: string;
  title?: string;
  continueAt?: number;
  model?: 'V3_5' | 'V4';
  negativeTags?: string;
  callBackUrl?: string;
}

// 音乐扩展响应与回调数据与音乐生成相同

// ==================== 歌词生成相关 ====================
// 歌词生成参数
export interface GenerateLyricsParams {
  prompt: string;
  callBackUrl?: string;
}

// 歌词生成响应
export interface GenerateLyricsResponse {
  taskId: string;
}

// 歌词数据
export interface LyricsData {
  text: string;
  title: string;
  status: 'complete' | string;
  errorMessage: string;
}

// 歌词生成回调数据
export interface LyricsCallbackData {
  callbackType: 'complete';
  taskId: string;
  lyricsData: LyricsData[];
}

// 歌词任务信息
export interface LyricsTaskInfo {
  taskId: string;
  param: string;
  response: {
    taskId: string;
    lyricsData: LyricsData[];
  };
  status: TaskStatus;
  type: string;
  errorCode: string | null;
  errorMessage: string | null;
}

// ==================== 带时间戳歌词相关 ====================
// 带时间戳歌词参数
export interface TimestampedLyricsParams {
  taskId: string;
  audioId?: string;
  musicIndex?: number;
}

// 带时间戳歌词词汇数据
export interface AlignedWord {
  word: string;
  success: boolean;
  start_s: number;
  end_s: number;
  p_align: number;
}

// 带时间戳歌词响应
export interface TimestampedLyricsResponse {
  alignedWords: AlignedWord[];
  waveformData: number[];
  hootCer: number;
  isStreamed: boolean;
}

// ==================== WAV格式转换相关 ====================
// WAV格式转换参数
export interface WavConversionParams {
  taskId?: string;
  audioId?: string;
  callBackUrl?: string;
}

// WAV格式转换响应
export interface WavConversionResponse {
  taskId: string;
}

// WAV格式转换回调数据
export interface WavCallbackData {
  audio_wav_url: string;
  task_id: string;
}

// WAV格式转换任务信息
export interface WavTaskInfo {
  taskId: string;
  musicId: string;
  callbackUrl?: string;
  completeTime?: string;
  response: {
    audio_wav_url: string;
  };
  status: TaskStatus;
  createTime: string;
  errorCode: string | null;
  errorMessage: string | null;
}

// ==================== 人声分离相关 ====================
// 人声分离参数
export interface VocalRemovalParams {
  taskId: string;
  audioId: string;
  callBackUrl?: string;
}

// 人声分离响应
export interface VocalRemovalResponse {
  taskId: string;
}

// 人声分离数据
export interface VocalRemovalData {
  instrumental_url: string;
  origin_url: string;
  vocal_url: string;
}

// 人声分离回调数据
export interface VocalRemovalCallbackData {
  task_id: string;
  vocal_removal_info: VocalRemovalData;
}

// 人声分离任务信息
export interface VocalRemovalTaskInfo {
  taskId: string;
  musicId: string;
  callbackUrl?: string;
  musicIndex?: number;
  completeTime?: string;
  response: {
    originUrl: string;
    instrumentalUrl: string;
    vocalUrl: string;
  };
  successFlag: TaskStatus;
  createTime: string;
  errorCode: string | null;
  errorMessage: string | null;
}

// ==================== MP4视频生成相关 ====================
// MP4视频生成参数
export interface Mp4GenerationParams {
  taskId: string;
  audioId: string;
  callBackUrl?: string;
  author?: string;
  domainName?: string;
}

// MP4视频生成响应
export interface Mp4GenerationResponse {
  taskId: string;
}

// MP4视频生成回调数据
export interface Mp4CallbackData {
  task_id: string;
  video_url: string;
}

// MP4视频生成任务信息
export interface Mp4TaskInfo {
  taskId: string;
  musicId: string;
  callbackUrl?: string;
  musicIndex?: number;
  completeTime?: string;
  response: {
    videoUrl: string;
  };
  successFlag: TaskStatus;
  createTime: string;
  errorCode: string | null;
  errorMessage: string | null;
} 