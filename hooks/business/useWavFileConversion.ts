// hooks/useWavFileConversion.ts
// WAV文件转换Hook实现

import { useState, useCallback, useEffect } from 'react';
import { 
  WavConversionParams, 
  WavTaskInfo
} from '@/types/api';
import { 
  ApiResponse,
  HookResult,
  ApiError,
} from '@/types/common';
import { WavConversionResult, MusicResource } from '@/types/music';
import { 
  validateRequiredParams, 
  handleApiError,
  PollingManager
} from '@/utils';

// 自定义类型定义
interface WavConversionResponse {
  taskId: string;
}

// WAV文件结果类型
interface WavFileResult extends MusicResource {
  originalAudioId: string;
  wavUrl: string;
  sampleRate: number;
}

// WAV文件转换状态
interface WavConversionState {
  taskId: string | null;
  status: 'idle' | 'loading' | 'polling' | 'success' | 'error';
  result: WavFileResult | null;
  error: ApiError | null;
}

// WAV文件转换API接口
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

// 查询WAV文件转换任务状态API接口
const getWavConversionStatus = async (taskId: string): Promise<ApiResponse<WavTaskInfo>> => {
  const response = await fetch(`/api/wav-conversion/record-info?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};

// WAV文件转换自定义Hook
export function useWavFileConversion(): HookResult<WavFileResult, WavConversionParams> {
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
        // 任务状态可能在API响应中以不同的字段名返回
        const taskStatus = taskInfo.status || taskInfo.successFlag || '';
        const successFlag = String(taskStatus);
        
        // 更新任务状态
        setState(prev => {
          const newState = { ...prev };
          
          // 完成状态
          if (successFlag === 'SUCCESS' || successFlag === 'success') {
            newState.status = 'success';
            
            // 如果有数据，更新结果
            if (taskInfo.response) {
              // 兼容不同的响应结构
              const wavUrl = taskInfo.response.wavUrl || taskInfo.response.audio_wav_url || '';
              
              if (wavUrl) {
                const wavResult: WavFileResult = {
                  id: taskInfo.taskId, // MusicResource需要id字段
                  taskId: taskInfo.taskId,
                  originalAudioId: taskInfo.musicId,
                  wavUrl: wavUrl,
                  sampleRate: (lastParams && ('sampleRate' in lastParams)) ? lastParams.sampleRate : 44100,
                  type: 'wav',
                  createdAt: taskInfo.createTime || taskInfo.completeTime || new Date().toISOString()
                };
                
                newState.result = wavResult;
                
                // 将结果保存到存储适配器
                storageAdapter.saveResource('wav_files', taskInfo.taskId, wavResult)
                  .catch(err => console.error('保存WAV文件结果失败:', err));
              }
            }
          }
          
          // 错误状态
          if (
            successFlag === 'CREATE_TASK_FAILED' || 
            successFlag === 'GENERATE_WAV_FAILED' || 
            successFlag === 'CALLBACK_EXCEPTION' ||
            successFlag === 'SENSITIVE_WORD_ERROR'
          ) {
            newState.status = 'error';
            newState.error = {
              code: 500,
              message: taskInfo.errorMessage || `处理失败: ${successFlag}`,
              details: taskInfo
            };
          }
          
          return newState;
        });
        
        // 判断是否继续轮询
        return [
          'SUCCESS', 
          'success', 
          'CREATE_TASK_FAILED',
          'GENERATE_WAV_FAILED',
          'CALLBACK_EXCEPTION', 
          'SENSITIVE_WORD_ERROR'
        ].includes(successFlag);
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: handleApiError(error)
        }));
        return true; // 发生错误，停止轮询
      }
    }, 3000, 120); // 3秒一次，最多轮询120次（6分钟）
    
    // 使用渐进式间隔
    manager.useProgressiveInterval(5000, 20000);
    
    setPollingManager(manager);
    
    return () => {
      manager.stop();
    };
  }, [state.taskId, lastParams]);
  
  // 执行WAV文件转换
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
      
      // 将任务添加到存储适配器
      await storageAdapter.addRecentTask({
        taskId,
        createdAt: new Date().toISOString(),
        type: 'wav'
      });
      
      // 保存任务参数
      await storageAdapter.saveTask(`params_${taskId}`, params);
      
      // 更新状态
      setState(prev => ({
        ...prev,
        taskId,
        status: 'polling'
      }));
      
      // 检查存储适配器中是否有任务数据
      const existingTaskData = await storageAdapter.getTask<WavTaskInfo>(taskId);
      if (existingTaskData) {
        // 任务状态可能在API响应中以不同的字段名返回
        const taskStatus = existingTaskData.status || existingTaskData.successFlag || '';
        const existingSuccessFlag = String(taskStatus);
        
        if ((existingSuccessFlag === 'SUCCESS' || existingSuccessFlag === 'success') && existingTaskData.response) {
          // 兼容不同的响应结构
          const wavUrl = existingTaskData.response.wavUrl || 
                          existingTaskData.response.audio_wav_url || '';
          
          if (wavUrl) {
            // 已有结果，直接显示
            const result: WavFileResult = {
              id: existingTaskData.taskId, // MusicResource需要id字段
              taskId: existingTaskData.taskId,
              originalAudioId: existingTaskData.musicId,
              wavUrl: wavUrl,
              sampleRate: ('sampleRate' in params) ? params.sampleRate : 44100,
              type: 'wav',
              createdAt: existingTaskData.createTime || existingTaskData.completeTime || new Date().toISOString()
            };
            
            setState({
              taskId,
              status: 'success',
              result,
              error: null
            });
            return;
          }
        }
      }
      
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