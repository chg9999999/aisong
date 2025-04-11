/**
 * WAV转换业务逻辑Hook - 轮询版
 * 
 * 这个Hook封装了WAV转换的完整流程，包括提交任务和轮询结果。
 * 它使用通用的useTaskPolling作为底层轮询机制，专注于处理WAV转换的业务逻辑。
 */

import { useState, useCallback } from 'react';
import { useTaskPolling } from '../useTaskPolling';

// WAV转换参数
export interface WavConversionParams {
  taskId?: string;
  audioId?: string;
}

// WAV转换结果类型
export interface WavConversionResult {
  taskId: string;
  originalAudioId: string;
  wavUrl: string;
  createdAt: string;
}

// API响应类型
interface WavConversionTaskResponse {
  taskId: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  result?: WavConversionResult;
  error?: string;
}

/**
 * WAV转换Hook - 轮询版
 * 
 * 提供完整的WAV转换流程控制，从创建任务到获取结果
 * 
 * @returns 包含生成状态、结果和控制函数的对象
 * 
 * @example
 * // 基本用法
 * const {
 *   status,
 *   result,
 *   convertToWav,
 *   isLoading
 * } = useWavConversionPolling();
 * 
 * // 触发转换
 * convertToWav({
 *   audioId: "audio123"
 * });
 */
export function useWavConversionPolling() {
  // 创建任务的加载状态
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // 最近的生成参数，用于重试
  const [lastParams, setLastParams] = useState<WavConversionParams | null>(null);
  
  // 使用通用轮询Hook管理轮询状态
  const {
    status: pollingStatus,
    data: result,
    error: pollingError,
    startPolling,
    resetPolling,
    elapsedTime,
    attempts
  } = useTaskPolling<WavConversionResult, WavConversionTaskResponse>(
    // 获取任务状态的函数
    async (taskId: string) => {
      const response = await fetch(`/api/wav/status?taskId=${taskId}`);
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
      return response.result as WavConversionResult;
    },
    // 轮询配置
    {
      initialInterval: 2000,      // 2秒初始间隔
      maxInterval: 8000,          // 最大8秒间隔
      maxAttempts: 60,            // 最多尝试60次 (约3分钟)
      useProgressiveInterval: true
    }
  );

  /**
   * 创建并启动WAV转换任务
   * 
   * @param params WAV转换的输入参数
   * @returns Promise<void>
   */
  const convertToWav = async (params: WavConversionParams) => {
    try {
      // 参数验证
      if (!params.audioId && !params.taskId) {
        throw new Error('Either Audio ID or Task ID is required');
      }
      
      // 重置之前的状态
      resetPolling();
      setIsCreatingTask(true);
      
      // 缓存参数用于重试
      setLastParams(params);
      
      // 创建新的WAV转换任务
      const response = await fetch('/api/wav/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create WAV conversion task: ${response.statusText}`);
      }
      
      // 解析创建任务的响应
      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error(data.msg || 'Failed to create WAV conversion task');
      }
      
      const { taskId } = data.data;
      
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }
      
      // 开始轮询任务状态
      startPolling(taskId);
      
    } catch (error) {
      console.error('Error creating WAV conversion task:', error);
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
      convertToWav(lastParams);
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
    convertToWav,
    retry,
    elapsedTime,
    attempts,
    // 进度信息 - WAV转换不提供阶段性进度，只有简单状态
    progress: isSuccess ? 100 : isLoading ? Math.min(attempts * 5, 90) : 0
  };
} 