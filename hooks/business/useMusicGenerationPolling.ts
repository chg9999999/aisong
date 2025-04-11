/**
 * 音乐生成业务逻辑Hook (轮询版)
 * 
 * 这个Hook封装了音乐生成的完整流程，包括提交任务和轮询结果。
 * 它使用通用的useTaskPolling作为底层轮询机制，专注于处理音乐生成的业务逻辑。
 */

import { useState, useEffect } from 'react';
import { useTaskPolling } from '../useTaskPolling';
import { AudioData, GenerateMusicParams } from '@/types/api';
import { parseTags } from '@/utils';
import { MusicResource } from '@/types/music';

// 音乐生成任务状态API响应
interface MusicGenerationTaskResponse {
  taskId: string;
  status: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' | 'ERROR';
  result?: AudioData[];
  textGenerated?: boolean;
  error?: string;
}

/**
 * 音乐生成Hook（轮询版）
 * 
 * 提供完整的音乐生成流程控制，从创建任务到获取结果
 * 
 * @returns 包含生成状态、结果和控制函数的对象
 * 
 * @example
 * // 基本用法
 * const {
 *   status,
 *   data,
 *   generateMusic,
 *   isLoading
 * } = useMusicGenerationPolling();
 * 
 * // 触发生成
 * generateMusic({
 *   prompt: "A calm piano track",
 *   customMode: true,
 *   style: "Classical",
 *   title: "Peaceful Piano"
 * });
 */
export function useMusicGenerationPolling() {
  // 创建任务的加载状态
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // 文本生成和第一首歌生成的状态
  const [textGenerated, setTextGenerated] = useState(false);
  const [firstAudioGenerated, setFirstAudioGenerated] = useState(false);
  
  // 最近的生成参数，用于重试
  const [lastParams, setLastParams] = useState<GenerateMusicParams | null>(null);
  
  // 使用通用轮询Hook管理轮询状态
  const {
    status: pollingStatus,
    data: results,
    error: pollingError,
    startPolling,
    resetPolling,
    elapsedTime,
    attempts
  } = useTaskPolling<AudioData[], MusicGenerationTaskResponse>(
    // 获取任务状态的函数
    async (taskId: string) => {
      const response = await fetch(`/api/generate/status?taskId=${taskId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.statusText}`);
      }
      return response.json();
    },
    // 检查任务是否完成的函数
    (response) => {
      if (response.status === 'TEXT_SUCCESS' && !textGenerated) {
        setTextGenerated(true);
      }
      
      if (response.status === 'FIRST_SUCCESS' && !firstAudioGenerated) {
        setFirstAudioGenerated(true);
      }
      
      return response.status === 'SUCCESS' || response.status === 'ERROR';
    },
    // 提取业务数据的函数
    (response) => {
      if (response.status === 'ERROR') {
        throw new Error(response.error || 'Unknown error');
      }
      return response.result || [];
    },
    // 轮询配置
    {
      initialInterval: 2000,     // 2秒初始间隔
      maxInterval: 10000,        // 最大10秒间隔
      maxAttempts: 120,          // 最多尝试120次 (约5分钟)
      useProgressiveInterval: true
    }
  );

  /**
   * 创建并启动音乐生成任务
   * 
   * @param params 音乐生成的输入参数
   * @returns Promise<void>
   */
  const generateMusic = async (params: GenerateMusicParams) => {
    try {
      // 重置之前的状态
      resetPolling();
      setIsCreatingTask(true);
      setTextGenerated(false);
      setFirstAudioGenerated(false);
      setLastParams(params);
      
      // 验证参数
      const validatedParams = validateGenerateMusicParams(params);
      
      // 创建新的音乐生成任务
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedParams),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create music generation task: ${response.statusText}`);
      }
      
      // 解析创建任务的响应
      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error(data.msg || 'Failed to create music generation task');
      }
      
      const { taskId } = data.data;
      
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }
      
      // 开始轮询任务状态
      startPolling(taskId);
    } catch (error) {
      console.error('Error creating music generation task:', error);
      throw error;
    } finally {
      setIsCreatingTask(false);
    }
  };

  // 重试最近一次任务
  const retry = async () => {
    if (lastParams) {
      await generateMusic(lastParams);
    }
  };

  // 当前正在加载（创建任务或轮询中）
  const isLoading = isCreatingTask || pollingStatus === 'polling';
  
  // 任务是否成功完成
  const isSuccess = pollingStatus === 'success';
  
  // 是否发生错误（轮询错误或超时）
  const isError = pollingStatus === 'error' || pollingStatus === 'timeout';

  // 如果有结果数据，处理为音乐资源格式
  useEffect(() => {
    if (results && results.length > 0) {
      console.log('转换音乐资源格式:', results);
      
      // 处理音乐资源
      const musicResources: MusicResource[] = results.map(audio => ({
        id: audio.id,
        title: audio.title || 'Untitled',
        audioUrl: audio.audio_url || audio.source_audio_url || '',
        streamAudioUrl: audio.stream_audio_url || audio.source_stream_audio_url || '',
        imageUrl: audio.image_url || audio.source_image_url || '',
        prompt: audio.prompt || '',
        tags: parseTags(audio.tags || ''),
        duration: audio.duration || 0,
        createdAt: audio.createTime || new Date().toISOString(),
        model: audio.model_name || 'unknown'
      }));
      
      console.log('处理后的音乐资源:', musicResources);
    }
  }, [results]);

  // 返回状态和控制函数
  return {
    status: pollingStatus,
    isLoading,
    isSuccess,
    isError,
    data: results,
    error: pollingError,
    generateMusic,
    retry,
    resetPolling,
    elapsedTime,
    attempts,
    lastParams,
    textGenerated,
    firstAudioGenerated
  };
}

/**
 * 验证音乐生成参数
 * 
 * @param params 音乐生成参数
 * @returns 验证后的参数
 */
function validateGenerateMusicParams(params: GenerateMusicParams): GenerateMusicParams {
  const validatedParams = { ...params };
  
  // 确保prompt字段存在
  if (!validatedParams.prompt) {
    throw new Error('Prompt is required');
  }
  
  // 自定义模式参数验证
  if (validatedParams.customMode === true) {
    // 纯器乐模式
    if (validatedParams.instrumental === true) {
      if (!validatedParams.style) {
        throw new Error('Style is required in custom mode with instrumental');
      }
      if (!validatedParams.title) {
        throw new Error('Title is required in custom mode with instrumental');
      }
    } 
    // 非纯器乐模式
    else {
      if (!validatedParams.style) {
        throw new Error('Style is required in custom mode');
      }
      if (!validatedParams.title) {
        throw new Error('Title is required in custom mode');
      }
    }
  }
  
  return validatedParams;
} 