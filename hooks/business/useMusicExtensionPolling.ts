/**
 * 音乐扩展业务逻辑Hook - 轮询版
 * 
 * 这个Hook封装了音乐扩展的完整流程，包括提交任务和轮询结果。
 * 它使用通用的useTaskPolling作为底层轮询机制，专注于处理音乐扩展的业务逻辑。
 */

import { useState, useCallback } from 'react';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { AudioData } from '@/types/api';

// 音乐扩展参数
export interface MusicExtensionParams {
  audioId: string;
  defaultParamFlag?: boolean;
  prompt?: string;
  style?: string;
  title?: string;
  continueAt?: number;
  model?: string;
  negativeTags?: string;
}

// 音乐资源类型定义
export interface MusicResource {
  id: string;
  audioUrl: string;
  sourceAudioUrl?: string;
  streamAudioUrl?: string;
  sourceStreamAudioUrl?: string;
  imageUrl?: string;
  sourceImageUrl?: string;
  prompt?: string;
  modelName?: string;
  title: string;
  tags?: string;
  createTime?: number;
  duration: number;
}

// 音乐扩展结果类型
export interface MusicExtensionResult {
  taskId: string;
  originalAudioId?: string;
  // 使用sunoData数组替换extendedMusic
  sunoData: MusicResource[];
  continueAtPosition?: number;
  createdAt?: string;
}

// API响应类型
interface MusicExtensionTaskResponse {
  taskId: string;
  status: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' | 'ERROR';
  result?: MusicExtensionResult;
  error?: string;
  progress?: {
    textGenerated: boolean;
    firstAudioGenerated: boolean;
  };
}

/**
 * 音乐扩展Hook - 轮询版
 * 
 * 提供完整的音乐扩展流程控制，从创建任务到获取结果
 * 
 * @returns 包含生成状态、结果和控制函数的对象
 * 
 * @example
 * // 基本用法
 * const {
 *   status,
 *   result,
 *   extendMusic,
 *   isLoading
 * } = useMusicExtensionPolling();
 * 
 * // 触发扩展
 * extendMusic({
 *   audioId: "audio123",
 *   defaultParamFlag: true,
 *   prompt: "More energetic version",
 *   style: "Rock",
 *   title: "Extended Version"
 * });
 */
export function useMusicExtensionPolling() {
  // 创建任务的加载状态
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // 最近的生成参数，用于重试
  const [lastParams, setLastParams] = useState<MusicExtensionParams | null>(null);
  
  // 使用通用轮询Hook管理轮询状态
  const {
    status: pollingStatus,
    data: result,
    error: pollingError,
    startPolling,
    resetPolling,
    elapsedTime,
    attempts
  } = useTaskPolling<MusicExtensionResult, MusicExtensionTaskResponse>(
    // 获取任务状态的函数
    async (taskId: string) => {
      const response = await fetch(`/api/extend/status?taskId=${taskId}`);
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
      return response.result as MusicExtensionResult;
    },
    // 轮询配置
    {
      initialInterval: 3000,      // 3秒初始间隔
      maxInterval: 10000,         // 最大10秒间隔
      maxAttempts: 120,           // 最多尝试120次 (约10分钟)
      useProgressiveInterval: true
    }
  );

  /**
   * 创建并启动音乐扩展任务
   * 
   * @param params 音乐扩展的输入参数
   * @returns Promise<void>
   */
  const extendMusic = async (params: MusicExtensionParams) => {
    try {
      // 参数验证
      if (!params.audioId) {
        throw new Error('Audio ID is required');
      }
      
      // 重置之前的状态
      resetPolling();
      setIsCreatingTask(true);
      
      // 缓存参数用于重试
      setLastParams(params);
      
      // 创建新的音乐扩展任务
      const response = await fetch('/api/extend/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create music extension task: ${response.statusText}`);
      }
      
      // 解析创建任务的响应
      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error(data.msg || 'Failed to create music extension task');
      }
      
      const { taskId } = data.data;
      
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }
      
      // 开始轮询任务状态
      startPolling(taskId);
      
    } catch (error) {
      console.error('Error creating music extension task:', error);
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
      extendMusic(lastParams);
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
    extendMusic,
    retry,
    elapsedTime,
    attempts,
    
    // 进度信息 - 从轮询响应中提取
    progress: {
      textGenerated: result?.createdAt ? true : false,
      firstAudioGenerated: result?.sunoData && result.sunoData.length > 0 ? true : false
    }
  };
} 