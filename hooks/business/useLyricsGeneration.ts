/**
 * 歌词生成业务逻辑Hook
 * 
 * 这个Hook封装了歌词生成的完整流程，包括提交任务和轮询结果。
 * 它使用通用的useTaskPolling作为底层轮询机制，专注于处理歌词生成的业务逻辑。
 */

import { useState } from 'react';
import { useTaskPolling } from '../useTaskPolling';
import { LyricsData } from '@/types/api';

// 歌词生成参数
export interface LyricsGenerationParams {
  prompt: string;
}

// 歌词生成API响应
interface LyricsGenerationResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

// 歌词任务状态API响应
interface LyricsTaskStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    param: string;
    response: {
      taskId: string;
      data?: LyricsData[];
    };
    status: string;
    type: string;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

// 输入参数类型
export interface LyricsGenerationInput {
  prompt: string;
}

// 歌词生成结果类型
export interface LyricsGenerationResult {
  lyrics: string;
  title: string;
  createdAt: string;
}

// API响应类型
interface LyricsTaskResponse {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  result?: {
    lyricsData: LyricsData[];
  };
  error?: string;
}

/**
 * 歌词生成Hook
 * 
 * 提供完整的歌词生成流程控制，从创建任务到获取结果
 * 
 * @returns 包含生成状态、结果和控制函数的对象
 * 
 * @example
 * // 基本用法
 * const {
 *   status,
 *   data,
 *   error,
 *   generateLyrics,
 *   isLoading
 * } = useLyricsGeneration();
 * 
 * // 触发生成
 * generateLyrics({
 *   prompt: "A song about love and heartbreak"
 * });
 */
export function useLyricsGeneration() {
  // 创建任务的加载状态
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // 最近的生成参数，用于重试
  const [lastParams, setLastParams] = useState<LyricsGenerationParams | null>(null);
  
  // 使用通用轮询Hook管理轮询状态
  const {
    status: pollingStatus,
    data: result,
    error: pollingError,
    startPolling,
    resetPolling,
    elapsedTime,
    attempts
  } = useTaskPolling<LyricsData[], LyricsTaskResponse>(
    // 获取任务状态的函数
    async (taskId: string) => {
      console.log(`[轮询] 查询歌词任务状态, ID: ${taskId}`);
      const response = await fetch(`/api/lyrics/status?taskId=${taskId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.statusText}`);
      }
      const responseData = await response.json();
      console.log(`[轮询] 获取到歌词任务状态:`, responseData);
      return responseData;
    },
    // 检查任务是否完成的函数
    (response) => {
      console.log("[轮询] 检查任务是否完成, 当前状态:", response.status);
      return response.status === 'SUCCESS' || response.status === 'ERROR';
    },
    // 提取业务数据的函数
    (response) => {
      if (response.status === 'ERROR') {
        throw new Error(response.error || 'Unknown error');
      }
      console.log("[轮询] 提取歌词数据:", response.result?.lyricsData);
      return response.result?.lyricsData || [];
    },
    // 轮询配置
    {
      initialInterval: 2000,      // 2秒初始间隔
      maxInterval: 8000,         // 最大8秒间隔
      maxAttempts: 30,           // 最多尝试30次 (约4分钟)
      useProgressiveInterval: true
    }
  );

  /**
   * 创建并启动歌词生成任务
   * 
   * @param input 歌词生成的输入参数
   * @returns Promise<void>
   */
  const generateLyrics = async (input: LyricsGenerationInput) => {
    try {
      // 重置之前的状态
      resetPolling();
      setIsCreatingTask(true);
      setLastParams({ prompt: input.prompt });
      
      console.log('[歌词生成] 开始创建歌词生成任务, 参数:', input);
      
      // 创建新的歌词生成任务
      const response = await fetch('/api/lyrics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create lyrics task: ${response.statusText}`);
      }
      
      // 解析创建任务的响应
      const data = await response.json();
      console.log('[歌词生成] API响应:', data);
      
      // 从嵌套的data对象中获取taskId
      const taskId = data.data?.taskId;
      
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }
      
      console.log('[歌词生成] 获取到任务ID:', taskId);
      
      // 开始轮询任务状态
      startPolling(taskId);
    } catch (error) {
      console.error('[歌词生成] 创建任务失败:', error);
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

  // 返回状态和控制函数
  return {
    status: pollingStatus,
    isLoading,
    isSuccess,
    isError,
    data: result,
    error: pollingError,
    generateLyrics,
    elapsedTime,
    attempts
  };
} 