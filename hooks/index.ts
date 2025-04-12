// hooks/index.ts
// 统一导出所有钩子函数

// UI相关钩子
export * from './ui/use-toast';
export * from './ui/use-mobile';

// 通用轮询钩子
export { useTaskPolling } from './useTaskPolling';

// ----------------------------------------------
// 新版轮询系统hooks (推荐使用)
// ----------------------------------------------
export { useLyricsGeneration } from './business/useLyricsGeneration';
export { useVocalSeparationPolling } from './business/useVocalSeparationPolling';
export { useMusicGenerationPolling } from './business/useMusicGenerationPolling';
export { useMusicExtensionPolling } from './business/useMusicExtensionPolling';
export { useWavConversionPolling } from './business/useWavConversionPolling';
export { useMp4GenerationPolling } from './business/useMp4GenerationPolling';

