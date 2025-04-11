/**
 * 人声分离业务逻辑Hook (轮询版)
 * 
 * 这个Hook封装了人声分离的完整流程，包括提交任务和轮询结果。
 * 它使用通用的useTaskPolling作为底层轮询机制，专注于处理人声分离的业务逻辑。
 */

import { useState } from 'react';
import { useTaskPolling } from '../useTaskPolling';
import { VocalRemovalResult } from '@/types/music';

// 人声分离参数
export interface VocalSeparationParams {
  audioId: string;
  taskId?: string;
}

// 人声分离任务状态API响应
interface VocalSeparationTaskResponse {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  result?: {
    originalUrl: string;
    instrumentalUrl: string;
    vocalUrl: string;
    taskId: string;
    createdAt: string;
  };
  error?: string;
}

/**
 * 人声分离Hook
 * 
 * 提供完整的人声分离流程控制，从创建任务到获取结果
 * 
 * @returns 包含分离状态、结果和控制函数的对象
 * 
 * @example
 * // 基本用法
 * const {
 *   status,
 *   result,
 *   separateVocals,
 *   isLoading
 * } = useVocalSeparationPolling();
 * 
 * // 触发分离
 * separateVocals({
 *   audioId: "音频ID"
 * });
 */
export function useVocalSeparationPolling() {
  // 创建任务的加载状态
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // 最近的生成参数，用于重试
  const [lastParams, setLastParams] = useState<VocalSeparationParams | null>(null);
  
  // 使用通用轮询Hook管理轮询状态
  const {
    status: pollingStatus,
    data: result,
    error: pollingError,
    startPolling,
    resetPolling,
    elapsedTime,
    attempts
  } = useTaskPolling<VocalRemovalResult, VocalSeparationTaskResponse>(
    // 获取任务状态的函数
    async (taskId: string) => {
      const response = await fetch(`/api/vocal-removal/status?taskId=${taskId}`);
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
      return response.result as VocalRemovalResult;
    },
    // 轮询配置
    {
      initialInterval: 2000,     // 2秒初始间隔
      maxInterval: 8000,         // 最大8秒间隔
      maxAttempts: 60,           // 最多尝试60次 (约2分钟)
      useProgressiveInterval: true
    }
  );

  /**
   * 创建并启动人声分离任务
   * 
   * @param params 人声分离的输入参数
   * @returns Promise<void>
   */
  const separateVocals = async (params: VocalSeparationParams) => {
    try {
      // 重置之前的状态
      resetPolling();
      setIsCreatingTask(true);
      setLastParams(params);
      
      // 创建新的人声分离任务
      const response = await fetch('/api/vocal-removal/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create vocal separation task: ${response.statusText}`);
      }
      
      // 解析创建任务的响应
      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error(data.msg || 'Failed to create vocal separation task');
      }
      
      const { taskId } = data.data;
      
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }
      
      // 开始轮询任务状态
      startPolling(taskId);
    } catch (error) {
      console.error('Error creating vocal separation task:', error);
      throw error;
    } finally {
      setIsCreatingTask(false);
    }
  };

  // 重试最近一次任务
  const retry = async () => {
    if (lastParams) {
      await separateVocals(lastParams);
    }
  };

  // 当前正在加载（创建任务或轮询中）
  const isLoading = isCreatingTask || pollingStatus === 'polling';
  
  // 任务是否成功完成
  const isSuccess = pollingStatus === 'success';
  
  // 是否发生错误（轮询错误或超时）
  const isError = pollingStatus === 'error' || pollingStatus === 'timeout';

  // 返回状态和控制函数
  return {
    status: pollingStatus,
    isLoading,
    isSuccess,
    isError,
    result,
    error: pollingError,
    separateVocals,
    retry,
    elapsedTime,
    attempts,
    lastParams
  };
} 