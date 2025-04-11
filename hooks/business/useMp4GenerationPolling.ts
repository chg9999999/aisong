/**
 * MP4视频生成业务逻辑Hook - 轮询版
 * 
 * 这个Hook封装了MP4视频生成的完整流程，包括提交任务和轮询结果。
 * 它使用通用的useTaskPolling作为底层轮询机制，专注于处理MP4视频生成的业务逻辑。
 */

import { useState, useCallback } from 'react';
import { useTaskPolling } from '../useTaskPolling';

// MP4视频生成参数
export interface Mp4GenerationParams {
  taskId: string;
  audioId: string;
  captionMode?: 'none' | 'lyrics' | 'lyrics-translation';
}

// MP4视频生成结果类型
export interface Mp4VideoResult {
  taskId: string;
  originalAudioId: string;
  videoUrl: string;
  captionMode?: 'none' | 'lyrics' | 'lyrics-translation';
  createdAt: string;
}

// API响应类型
interface Mp4GenerationTaskResponse {
  taskId: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  result?: Mp4VideoResult;
  error?: string;
}

/**
 * MP4视频生成Hook - 轮询版
 * 
 * 提供完整的MP4视频生成流程控制，从创建任务到获取结果
 * 
 * @returns 包含生成状态、结果和控制函数的对象
 * 
 * @example
 * // 基本用法
 * const {
 *   status,
 *   result,
 *   generateMp4,
 *   isLoading
 * } = useMp4GenerationPolling();
 * 
 * // 触发视频生成
 * generateMp4({
 *   taskId: "task123",
 *   audioId: "audio123"
 * });
 */
export function useMp4GenerationPolling() {
  // 创建任务的加载状态
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // 最近的生成参数，用于重试
  const [lastParams, setLastParams] = useState<Mp4GenerationParams | null>(null);
  
  // 使用通用轮询Hook管理轮询状态
  const {
    status: pollingStatus,
    data: result,
    error: pollingError,
    startPolling,
    resetPolling,
    elapsedTime,
    attempts
  } = useTaskPolling<Mp4VideoResult, Mp4GenerationTaskResponse>(
    // 获取任务状态的函数
    async (taskId: string) => {
      const response = await fetch(`/api/mp4/status?taskId=${taskId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.statusText}`);
      }
      return response.json();
    },
    // 检查任务是否完成的函数
    (response) => {
      return response.status === 'SUCCESS' || response.status === 'ERROR';
    },
    // 提取业务数据的函数
    (response) => {
      if (response.status === 'ERROR') {
        throw new Error(response.error || 'Unknown error');
      }
      return response.result as Mp4VideoResult;
    },
    // 轮询配置
    {
      initialInterval: 5000,      // 5秒初始间隔
      maxInterval: 15000,         // 最大15秒间隔
      maxAttempts: 120,           // 最多尝试120次 (约15-20分钟)
      useProgressiveInterval: true
    }
  );

  /**
   * 创建并启动MP4视频生成任务
   * 
   * @param params MP4视频生成的输入参数
   * @returns Promise<void>
   */
  const generateMp4 = async (params: Mp4GenerationParams) => {
    try {
      // 参数验证
      if (!params.audioId || !params.taskId) {
        throw new Error('Both Audio ID and Task ID are required');
      }
      
      // 重置之前的状态
      resetPolling();
      setIsCreatingTask(true);
      
      // 缓存参数用于重试
      setLastParams(params);
      
      // 创建新的MP4视频生成任务
      const response = await fetch('/api/mp4/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create MP4 generation task: ${response.statusText}`);
      }
      
      // 解析创建任务的响应
      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error(data.msg || 'Failed to create MP4 generation task');
      }
      
      const { taskId } = data.data;
      
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }
      
      // 开始轮询任务状态
      startPolling(taskId);
      
    } catch (error) {
      console.error('Error creating MP4 generation task:', error);
      throw error;
    } finally {
      setIsCreatingTask(false);
    }
  };

  // 当前正在加载（创建任务或轮询中）
  const isLoading = isCreatingTask || pollingStatus === 'polling';
  
  // 任务是否成功完成
  const isSuccess = pollingStatus === 'success';
  
  // 是否发生错误（轮询错误或超时）
  const isError = pollingStatus === 'error' || pollingStatus === 'timeout';
  
  // 重试功能
  const retry = useCallback(() => {
    if (lastParams) {
      generateMp4(lastParams);
    }
  }, [lastParams]);

  // 返回状态和控制函数
  return {
    status: pollingStatus,
    isLoading,
    isSuccess,
    isError,
    result,
    error: pollingError,
    generateMp4,
    retry,
    elapsedTime,
    attempts,
    // 进度信息 - MP4生成不提供阶段性进度，根据时间计算估计进度
    progress: isSuccess ? 100 : isLoading ? Math.min(attempts * 2, 95) : 0
  };
} 