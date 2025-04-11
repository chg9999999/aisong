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

// ----------------------------------------------
// 旧版hooks (已弃用，请使用上方的轮询hooks)
// ----------------------------------------------
// @deprecated use useMusicGenerationPolling instead
export * from './useGenerateMusic';

// 旧版歌词生成Hook已不存在，已完全迁移到useLyricsGeneration
// export * from './useLyrics';

// @deprecated use useVocalSeparationPolling instead
export * from './useVocalRemoval';

// @deprecated use useMusicExtensionPolling instead
export * from './useMusicExtension';

// @deprecated use useMp4GenerationPolling instead
export * from './useMp4Generation';

// @deprecated use useWavConversionPolling instead
export * from './useWavConversion';
export * from './useWavFileConversion';

// // 用户设置相关
// export { useUserSettings } from './useUserSettings';

// // 历史记录相关
// export { useHistory } from './useHistory';

// // 本地存储相关
// export { useLocalStorage } from './useLocalStorage';

// 待实现的音乐生成轮询Hook
// export * from './useMusicGenerationPolling'; 