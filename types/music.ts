// types/music.ts
// 定义音乐和歌词等资源相关的类型

// 音乐资源
export interface MusicResource {
  id: string;
  title: string;
  audioUrl: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  prompt: string;
  tags: string[];
  duration: number;
  createdAt: string;
  model: string;
}

// 歌词资源
export interface LyricsResource {
  id: string;
  title: string;
  text: string;
  createdAt: string;
}

// 音乐样式类别
export type MusicStyle = 
  | 'Pop'
  | 'Rock'
  | 'Classical'
  | 'Electronic'
  | 'Jazz'
  | 'Hip-hop'
  | 'R&B'
  | 'Metal'
  | 'Folk'
  | 'Country'
  | 'Blues'
  | 'Reggae'
  | 'Latin'
  | 'Indie'
  | 'K-pop'
  | 'J-pop'
  | 'Cinematic'
  | 'Ambient'
  | 'Other';

// 音乐风格标签
export interface MusicStyleTag {
  id: string;
  name: MusicStyle;
  color: string;
}

// 歌词类型
export type LyricsType = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'full';

// 带时间戳的歌词行
export interface LyricsLine {
  text: string;
  startTime: number; // 秒
  endTime: number; // 秒
  type?: LyricsType;
}

// 完整歌词
export interface Lyrics {
  title: string;
  artist?: string;
  lines: LyricsLine[];
}

// 人声分离结果
export interface VocalRemovalResult {
  taskId: string;
  originalUrl: string;
  instrumentalUrl: string;
  vocalUrl: string;
  createdAt: string;
}

// WAV转换结果
export interface WavConversionResult {
  taskId: string;
  originalAudioId: string;
  wavUrl: string;
  createdAt: string;
}

// MP4视频结果
export interface Mp4VideoResult {
  taskId: string;
  originalAudioId: string;
  videoUrl: string;
  captionMode?: 'lyrics' | 'none' | 'custom';
  createdAt: string;
}

// 音乐扩展结果
export interface MusicExtensionResult {
  taskId: string;
  originalAudioId: string;
  extendedMusicResource: MusicResource;
  continueAtPosition: number; // 秒
  createdAt: string;
}

// 用户音乐库
export interface MusicLibrary {
  music: MusicResource[];
  lyrics: LyricsResource[];
  vocalRemovals: VocalRemovalResult[];
  wavConversions: WavConversionResult[];
  videos: Mp4VideoResult[];
  extensions: MusicExtensionResult[];
} 