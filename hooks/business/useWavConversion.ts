// hooks/useWavConversion.ts
// WAV转换Hook实现

import { useState, useCallback, useEffect } from 'react';
import { 
  WavConversionParams, 
  WavTaskInfo,
  WavCallbackData,
} from '@/types/api';
import { 
  ApiResponse,
  HookResult,
  ApiError,
} from '@/types/common';
import { WavConversionResult } from '@/types/music';
import { 
  validateRequiredParams, 
  handleApiError,
  PollingManager
} from '@/utils';

// 自定义类型定义
interface WavConversionResponse {
  taskId: string;
}

// WAV转换状态
interface WavConversionState {
  taskId: string | null;
  status: 'idle' | 'loading' | 'polling' | 'success' | 'error';
  result: WavConversionResult | null;
  error: ApiError | null;
}

// WAV转换API接口
const convertToWav = async (params: WavConversionParams): Promise<ApiResponse<WavConversionResponse>> => {
  const response = await fetch('/api/wav-conversion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  return await response.json();
};

// 查询WAV转换任务状态API接口
const getWavConversionStatus = async (taskId: string): Promise<ApiResponse<WavTaskInfo>> => {
  const response = await fetch(`/api/wav-conversion/record-info?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};

// WAV转换自定义Hook
export function useWavConversion(): HookResult<WavConversionResult, WavConversionParams> {
  // 状态管理
  const [state, setState] = useState<WavConversionState>({
    taskId: null,
    status: 'idle',
    result: null,
    error: null,
  });
  
  // 缓存最近的参数，用于重试
  const [lastParams, setLastParams] = useState<WavConversionParams | null>(null);
  
  // 轮询管理器
  const [pollingManager, setPollingManager] = useState<PollingManager | null>(null);
  
  // 初始化轮询管理器
  useEffect(() => {
    const manager = new PollingManager(async () => {
      if (!state.taskId) return true; // 没有任务ID，停止轮询
      
      try {
        const response = await getWavConversionStatus(state.taskId);
        
        if (response.code !== 200) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: {
              code: response.code,
              message: response.msg
            }
          }));
          return true; // 发生错误，停止轮询
        }
        
        const taskInfo = response.data;
        
        // 更新任务状态
        setState(prev => {
          const newState = { ...prev };
          
          // 完成状态
          if (taskInfo.status === 'SUCCESS') {
            newState.status = 'success';
            
            // 如果有数据，更新结果
            if (taskInfo.response && taskInfo.response.audio_wav_url) {
              const wavResult: WavConversionResult = {
                taskId: taskInfo.taskId,
                originalAudioId: taskInfo.musicId,
                wavUrl: taskInfo.response.audio_wav_url,
                createdAt: taskInfo.createTime || taskInfo.completeTime || new Date().toISOString()
              };
              
              newState.result = wavResult;
              
              // 未来可在此添加Supabase存储逻辑
              // saveToSupabase('wav_conversions', wavResult);
            }
          }
          
          // 错误状态
          if (
            taskInfo.status === 'CREATE_TASK_FAILED' || 
            taskInfo.status === 'GENERATE_WAV_FAILED' || 
            taskInfo.status === 'CALLBACK_EXCEPTION' ||
            taskInfo.status === 'SENSITIVE_WORD_ERROR'
          ) {
            newState.status = 'error';
            newState.error = {
              code: 500,
              message: taskInfo.errorMessage || `处理失败: ${taskInfo.status}`,
              details: taskInfo
            };
          }
          
          return newState;
        });
        
        // 判断是否继续轮询
        return [
          'SUCCESS',
          'CREATE_TASK_FAILED',
          'GENERATE_WAV_FAILED',
          'CALLBACK_EXCEPTION',
          'SENSITIVE_WORD_ERROR'
        ].includes(taskInfo.status);
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: handleApiError(error)
        }));
        return true; // 发生错误，停止轮询
      }
    }, 3000, 60); // 3秒一次，最多轮询60次（3分钟）
    
    // 使用渐进式间隔
    manager.useProgressiveInterval(3000, 10000);
    
    setPollingManager(manager);
    
    return () => {
      manager.stop();
    };
  }, [state.taskId]);
  
  // 执行WAV转换
  const convertToWavAction = useCallback(async (params: WavConversionParams) => {
    try {
      // 重置状态
      setState({
        taskId: null,
        status: 'loading',
        result: null,
        error: null,
      });
      
      // 缓存参数用于重试
      setLastParams(params);
      
      // 参数验证
      validateRequiredParams(params, ['audioId']);
      
      // 发送请求
      const response = await convertToWav(params);
      
      if (response.code !== 200 || !response.data) {
        setState({
          taskId: null,
          status: 'error',
          result: null,
          error: {
            code: response.code,
            message: response.msg,
            details: response.data
          }
        });
        return;
      }
      
      // 获取任务ID
      const taskId = response.data.taskId;
      
      // 未来可在此添加Supabase任务记录逻辑
      // addTaskToSupabase({
      //   taskId,
      //   createdAt: new Date().toISOString(),
      //   type: 'wav',
      //   params
      // });
      
      // 更新状态
      setState(prev => ({
        ...prev,
        taskId,
        status: 'polling'
      }));
      
      // 未来可以从Supabase获取任务数据
      // const existingTaskData = await getTaskFromSupabase(taskId);
      // if (existingTaskData && existingTaskData.status === 'SUCCESS') {
      //   // 已有结果，直接显示
      //   setState({...});
      //   return;
      // }
      
      // 启动轮询
      pollingManager?.start();
      
    } catch (error: any) {
      setState({
        taskId: null,
        status: 'error',
        result: null,
        error: handleApiError(error)
      });
    }
  }, [pollingManager]);
  
  // 重置状态
  const reset = useCallback(() => {
    pollingManager?.stop();
    setState({
      taskId: null,
      status: 'idle',
      result: null,
      error: null
    });
    setLastParams(null);
  }, [pollingManager]);
  
  // 重试
  const retry = useCallback(async () => {
    if (!lastParams) {
      setState(prev => ({
        ...prev,
        error: {
          code: 400,
          message: '无法重试，未找到原始参数'
        }
      }));
      return;
    }
    
    await convertToWavAction(lastParams);
  }, [lastParams, convertToWavAction]);
  
  return {
    status: state.status,
    data: state.result,
    error: state.error,
    execute: convertToWavAction,
    reset,
    retry
  };
} 