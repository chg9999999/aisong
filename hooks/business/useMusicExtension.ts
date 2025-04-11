// hooks/useMusicExtension.ts
// 音乐扩展Hook实现

import { useState, useCallback, useEffect } from 'react';
import { 
  MusicExtensionParams, 
  AudioData
} from '@/types/api';
import { 
  ApiResponse,
  HookResult,
  ApiError,
} from '@/types/common';
import { MusicExtensionResult, MusicResource } from '@/types/music';
import { 
  validateRequiredParams, 
  handleApiError,
  PollingManager,
  parseTags
} from '@/utils';

// 自定义类型定义
interface MusicExtensionResponse {
  taskId: string;
}

interface MusicExtensionTaskInfo {
  taskId: string;
  parentMusicId?: string;
  param: string;
  response: {
    taskId: string;
    sunoData?: AudioData[];
  };
  status: string;
  type: string;
  errorCode: string | null;
  errorMessage: string | null;
}

// 音乐扩展状态
interface MusicExtensionState {
  taskId: string | null;
  status: 'idle' | 'loading' | 'polling' | 'success' | 'error';
  results: AudioData[] | null;
  error: ApiError | null;
  textGenerated: boolean;
  firstAudioGenerated: boolean;
}

// 音乐扩展API接口
const extendMusic = async (params: MusicExtensionParams): Promise<ApiResponse<MusicExtensionResponse>> => {
  const response = await fetch('/api/music-extension', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  return await response.json();
};

// 查询音乐扩展任务状态API接口
const getExtensionTaskStatus = async (taskId: string): Promise<ApiResponse<MusicExtensionTaskInfo>> => {
  const response = await fetch(`/api/music-extension/record-info?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};

// 音乐扩展自定义Hook
export function useMusicExtension(): HookResult<MusicExtensionResult, MusicExtensionParams> {
  // 状态管理
  const [state, setState] = useState<MusicExtensionState>({
    taskId: null,
    status: 'idle',
    results: null,
    error: null,
    textGenerated: false,
    firstAudioGenerated: false,
  });
  
  // 扩展结果
  const [extensionResult, setExtensionResult] = useState<MusicExtensionResult | null>(null);
  
  // 缓存最近的参数，用于重试
  const [lastParams, setLastParams] = useState<MusicExtensionParams | null>(null);
  
  // 轮询管理器
  const [pollingManager, setPollingManager] = useState<PollingManager | null>(null);
  
  // 初始化轮询管理器
  useEffect(() => {
    const manager = new PollingManager(async () => {
      if (!state.taskId) return true; // 没有任务ID，停止轮询
      
      try {
        const response = await getExtensionTaskStatus(state.taskId);
        
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
          
          // 文本生成完成
          if (taskInfo.status === 'TEXT_SUCCESS' && !prev.textGenerated) {
            newState.textGenerated = true;
          }
          
          // 第一首歌生成完成
          if (taskInfo.status === 'FIRST_SUCCESS' && !prev.firstAudioGenerated) {
            newState.firstAudioGenerated = true;
            
            // 如果有数据，更新结果
            if (taskInfo.response.sunoData && taskInfo.response.sunoData.length > 0) {
              newState.results = taskInfo.response.sunoData;
              
              // 处理扩展音乐资源
              processExtensionResult(taskInfo, lastParams);
            }
          }
          
          // 完成状态
          if (taskInfo.status === 'SUCCESS') {
            newState.status = 'success';
            
            // 如果有数据，更新结果
            if (taskInfo.response.sunoData && taskInfo.response.sunoData.length > 0) {
              newState.results = taskInfo.response.sunoData;
              
              // 处理扩展音乐资源
              processExtensionResult(taskInfo, lastParams);
            }
          }
          
          // 错误状态
          if (
            taskInfo.status === 'CREATE_TASK_FAILED' || 
            taskInfo.status === 'GENERATE_AUDIO_FAILED' || 
            taskInfo.status === 'CALLBACK_EXCEPTION' ||
            taskInfo.status === 'SENSITIVE_WORD_ERROR'
          ) {
            newState.status = 'error';
            newState.error = {
              code: 500,
              message: taskInfo.errorMessage || `生成失败: ${taskInfo.status}`,
              details: taskInfo
            };
          }
          
          return newState;
        });
        
        // 判断是否继续轮询
        return ['SUCCESS', 'CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(taskInfo.status);
        
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
    manager.useProgressiveInterval(3000, 10000);
    
    setPollingManager(manager);
    
    return () => {
      manager.stop();
    };
  }, [state.taskId, lastParams]);
  
  // 处理扩展结果
  const processExtensionResult = useCallback((taskInfo: MusicExtensionTaskInfo, params: MusicExtensionParams | null) => {
    if (!taskInfo.response.sunoData || taskInfo.response.sunoData.length === 0 || !params) return;
    
    const audio = taskInfo.response.sunoData[0]; // 通常只有一个结果
    
    // 创建音乐资源
    const musicResource: MusicResource = {
      id: audio.id,
      title: audio.title,
      audioUrl: audio.audio_url || audio.source_audio_url,
      streamAudioUrl: audio.stream_audio_url || audio.source_stream_audio_url,
      imageUrl: audio.image_url || audio.source_image_url,
      prompt: audio.prompt,
      tags: parseTags(audio.tags),
      duration: audio.duration,
      createdAt: audio.createTime,
      model: audio.model_name
    };
    
    // 创建扩展结果
    const result: MusicExtensionResult = {
      taskId: taskInfo.taskId,
      originalAudioId: params.audioId,
      extendedMusicResource: musicResource,
      continueAtPosition: params.continueAt || 0,
      createdAt: new Date().toISOString(),
    };
    
    // 更新扩展结果
    setExtensionResult(result);
    
    // 将来可使用Supabase存储
    // saveToSupabase('music_resources', musicResource);
    // saveToSupabase('music_extensions', result);
  }, []);
  
  // 执行音乐扩展
  const extendMusicAction = useCallback(async (params: MusicExtensionParams) => {
    try {
      // 重置状态
      setState({
        taskId: null,
        status: 'loading',
        results: null,
        error: null,
        textGenerated: false,
        firstAudioGenerated: false,
      });
      setExtensionResult(null);
      
      // 缓存参数用于重试
      setLastParams(params);
      
      // 参数验证
      validateRequiredParams(params, ['audioId']);
      
      // 发送请求
      const response = await extendMusic(params);
      
      if (response.code !== 200 || !response.data) {
        setState({
          taskId: null,
          status: 'error',
          results: null,
          error: {
            code: response.code,
            message: response.msg,
            details: response.data
          },
          textGenerated: false,
          firstAudioGenerated: false,
        });
        return;
      }
      
      // 获取任务ID
      const taskId = response.data.taskId;
      
      // 将来添加Supabase存储任务记录
      // addTaskToSupabase({
      //   taskId,
      //   createdAt: new Date().toISOString(),
      //   type: 'extend',
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
      // if (existingTaskData && existingTaskData.status === 'SUCCESS') {
      //   // 已有结果，直接显示
      //   setState({...});
      //   processExtensionResult(existingTaskData, params);
      //   return;
      // }
      
      // 启动轮询
      pollingManager?.start();
      
    } catch (error: any) {
      setState({
        taskId: null,
        status: 'error',
        results: null,
        error: handleApiError(error),
        textGenerated: false,
        firstAudioGenerated: false,
      });
    }
  }, [pollingManager, processExtensionResult]);
  
  // 重置状态
  const reset = useCallback(() => {
    pollingManager?.stop();
    setState({
      taskId: null,
      status: 'idle',
      results: null,
      error: null,
      textGenerated: false,
      firstAudioGenerated: false,
    });
    setExtensionResult(null);
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
    
    await extendMusicAction(lastParams);
  }, [lastParams, extendMusicAction]);
  
  return {
    status: state.status,
    data: extensionResult,
    error: state.error,
    execute: extendMusicAction,
    reset,
    retry,
  };
} 