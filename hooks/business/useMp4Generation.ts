// hooks/useMp4Generation.ts
// MP4视频生成Hook实现

import { useState, useCallback, useEffect } from 'react';
import { 
  Mp4GenerationParams, 
  Mp4TaskInfo
} from '@/types/api';
import { 
  ApiResponse,
  HookResult,
  ApiError,
} from '@/types/common';
import { Mp4VideoResult } from '@/types/music';
import { 
  validateRequiredParams, 
  handleApiError,
  PollingManager, 
  storageAdapter
} from '@/utils';

// 自定义类型定义
interface Mp4GenerationResponse {
  taskId: string;
}

// MP4视频生成状态
interface Mp4GenerationState {
  taskId: string | null;
  status: 'idle' | 'loading' | 'polling' | 'success' | 'error';
  result: Mp4VideoResult | null;
  error: ApiError | null;
}

// MP4视频生成API接口
const generateMp4 = async (params: Mp4GenerationParams): Promise<ApiResponse<Mp4GenerationResponse>> => {
  const response = await fetch('/api/mp4-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  return await response.json();
};

// 查询MP4视频生成任务状态API接口
const getMp4GenerationStatus = async (taskId: string): Promise<ApiResponse<Mp4TaskInfo>> => {
  const response = await fetch(`/api/mp4-generation/record-info?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};

// MP4视频生成自定义Hook
export function useMp4Generation(): HookResult<Mp4VideoResult, Mp4GenerationParams> {
  // 状态管理
  const [state, setState] = useState<Mp4GenerationState>({
    taskId: null,
    status: 'idle',
    result: null,
    error: null,
  });
  
  // 缓存最近的参数，用于重试
  const [lastParams, setLastParams] = useState<Mp4GenerationParams | null>(null);
  
  // 轮询管理器
  const [pollingManager, setPollingManager] = useState<PollingManager | null>(null);
  
  // 初始化轮询管理器
  useEffect(() => {
    const manager = new PollingManager(async () => {
      if (!state.taskId) return true; // 没有任务ID，停止轮询
      
      try {
        const response = await getMp4GenerationStatus(state.taskId);
        
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
        const successFlag = String(taskInfo.successFlag);
        
        // 更新任务状态
        setState(prev => {
          const newState = { ...prev };
          
          // 完成状态
          if (successFlag === 'SUCCESS' || successFlag === 'success') {
            newState.status = 'success';
            
            // 如果有数据，更新结果
            if (taskInfo.response && taskInfo.response.videoUrl) {
              const videoResult: Mp4VideoResult = {
                taskId: taskInfo.taskId,
                originalAudioId: taskInfo.musicId,
                videoUrl: taskInfo.response.videoUrl,
                captionMode: lastParams?.captionMode,
                createdAt: taskInfo.createTime || taskInfo.completeTime || new Date().toISOString()
              };
              
              newState.result = videoResult;
              
              // 将结果保存到存储适配器
              storageAdapter.saveResource('mp4_videos', taskInfo.taskId, videoResult)
                .catch(err => console.error('保存MP4视频结果失败:', err));
            }
          }
          
          // 错误状态
          if (
            successFlag === 'CREATE_TASK_FAILED' || 
            successFlag === 'GENERATE_MP4_FAILED' || 
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
          'GENERATE_MP4_FAILED',
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
  
  // 执行MP4视频生成
  const generateMp4Action = useCallback(async (params: Mp4GenerationParams) => {
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
      validateRequiredParams(params, ['taskId', 'audioId']);
      
      // 发送请求
      const response = await generateMp4(params);
      
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
        type: 'mp4'
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
      const existingTaskData = await storageAdapter.getTask<Mp4TaskInfo>(taskId);
      if (existingTaskData) {
        const existingSuccessFlag = String(existingTaskData.successFlag);
        if ((existingSuccessFlag === 'SUCCESS' || existingSuccessFlag === 'success') && existingTaskData.response) {
          // 已有结果，直接显示
          const result: Mp4VideoResult = {
            taskId: existingTaskData.taskId,
            originalAudioId: existingTaskData.musicId,
            videoUrl: existingTaskData.response.videoUrl,
            captionMode: params.captionMode,
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
    
    await generateMp4Action(lastParams);
  }, [lastParams, generateMp4Action]);
  
  return {
    status: state.status,
    data: state.result,
    error: state.error,
    execute: generateMp4Action,
    reset,
    retry
  };
} 