// hooks/business/index.ts
// 导出所有业务逻辑钩子

// ----------------------------------------------
// 新版轮询系统hooks (推荐使用)
// ----------------------------------------------
export * from './useLyricsGeneration'; // 歌词生成轮询Hook
export * from './useVocalSeparationPolling'; // 人声分离轮询Hook
export * from './useMusicGenerationPolling'; // 音乐生成轮询Hook
export * from './useMusicExtensionPolling'; // 音乐扩展轮询Hook
export * from './useWavConversionPolling'; // WAV转换轮询Hook
export * from './useMp4GenerationPolling'; // MP4生成轮询Hook
