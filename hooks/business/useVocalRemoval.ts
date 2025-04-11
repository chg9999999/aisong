// hooks/useVocalRemoval.ts
// 人声分离Hook实现

import { useState, useCallback, useEffect } from 'react';
import { 
  VocalRemovalParams, 
  VocalRemovalData 
} from '@/types/api';
import { 
  ApiResponse,
  HookResult,
  ApiError,
} from '@/types/common';
import { VocalRemovalResult } from '@/types/music';
import { 
  validateRequiredParams, 
  handleApiError,
  PollingManager
} from '@/utils';

// 自定义类型定义
interface VocalRemovalResponse {
  taskId: string;
}

interface VocalRemovalTaskInfo {
  taskId: string;
  musicId: string;
  callbackUrl?: string;
  musicIndex?: number;
  completeTime?: string;
  response: {
    originUrl: string;
    instrumentalUrl: string;
    vocalUrl: string;
  };
  successFlag: string;
  createTime: string;
  errorCode: string | null;
  errorMessage: string | null;
}

// 人声分离状态
interface VocalRemovalState {
  taskId: string | null;
  status: 'idle' | 'loading' | 'polling' | 'success' | 'error';
  result: VocalRemovalResult | null;
  error: ApiError | null;
}

// 人声分离API接口
const removeVocal = async (params: VocalRemovalParams): Promise<ApiResponse<VocalRemovalResponse>> => {
  const response = await fetch('/api/vocal-removal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  return await response.json();
};

// 查询人声分离任务状态API接口
const getVocalRemovalStatus = async (taskId: string): Promise<ApiResponse<VocalRemovalTaskInfo>> => {
  const response = await fetch(`/api/vocal-removal/record-info?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};

// 人声分离自定义Hook
export function useVocalRemoval(): HookResult<VocalRemovalResult, VocalRemovalParams> {
  // 状态管理
  const [state, setState] = useState<VocalRemovalState>({
    taskId: null,
    status: 'idle',
    result: null,
    error: null,
  });
  
  // 缓存最近的参数，用于重试
  const [lastParams, setLastParams] = useState<VocalRemovalParams | null>(null);
  
  // 轮询管理器
  const [pollingManager, setPollingManager] = useState<PollingManager | null>(null);
  
  // 初始化轮询管理器
  useEffect(() => {
    const manager = new PollingManager(async () => {
      if (!state.taskId) return true; // 没有任务ID，停止轮询
      
      try {
        const response = await getVocalRemovalStatus(state.taskId);
        
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
          if (taskInfo.successFlag === 'SUCCESS' || taskInfo.successFlag === 'success') {
            newState.status = 'success';
            
            // 如果有数据，更新结果
            if (taskInfo.response) {
              const vocalRemovalResult: VocalRemovalResult = {
                taskId: taskInfo.taskId,
                originalUrl: taskInfo.response.originUrl,
                instrumentalUrl: taskInfo.response.instrumentalUrl,
                vocalUrl: taskInfo.response.vocalUrl,
                createdAt: taskInfo.createTime || taskInfo.completeTime || new Date().toISOString()
              };
              
              newState.result = vocalRemovalResult;
              
              // 将来添加Supabase存储任务结果
              // saveTaskToSupabase(taskInfo.taskId, taskInfo);
              
              // 将来添加Supabase存储分离结果
              // saveToSupabase('vocal_removal_results', vocalRemovalResult);
            }
          }
          
          // 错误状态
          if (
            taskInfo.successFlag === 'CREATE_TASK_FAILED' || 
            taskInfo.successFlag === 'CALLBACK_EXCEPTION' ||
            taskInfo.successFlag === 'SENSITIVE_WORD_ERROR'
          ) {
            newState.status = 'error';
            newState.error = {
              code: 500,
              message: taskInfo.errorMessage || `处理失败: ${taskInfo.successFlag}`,
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
          'CALLBACK_EXCEPTION', 
          'SENSITIVE_WORD_ERROR'
        ].includes(taskInfo.successFlag);
        
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
  
  // 执行人声分离
  const removeVocalAction = useCallback(async (params: VocalRemovalParams) => {
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
      const response = await removeVocal(params);
      
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
      
      // 将来添加Supabase存储任务记录
      // addTaskToSupabase({
      //   taskId,
      //   createdAt: new Date().toISOString(),
      //   type: 'vocalRemoval',
      //   params
      // });
      
      // 更新状态
      setState(prev => ({
        ...prev,
        taskId,
        status: 'polling'
      }));
      
      // 将来可从Supabase获取现有任务数据
      // const existingTaskData = await getTaskFromSupabase(taskId);
      // if (existingTaskData && 
      //    (existingTaskData.successFlag === 'SUCCESS' || existingTaskData.successFlag === 'success') && 
      //    existingTaskData.response) {
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
    
    await removeVocalAction(lastParams);
  }, [lastParams, removeVocalAction]);
  
  return {
    status: state.status,
    data: state.result,
    error: state.error,
    execute: removeVocalAction,
    reset,
    retry
  };
} 