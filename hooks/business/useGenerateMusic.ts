/**
 * 音乐生成Hook实现
 * 
 * @deprecated 这是旧版回调系统的一部分，将在未来版本中移除。
 * 请使用新的轮询系统 useMusicGenerationPolling 代替。
 * 新版本提供了更可靠的状态管理、错误处理和进度跟踪功能。
 */

// hooks/useGenerateMusic.ts
// 音乐生成Hook实现

import { useState, useCallback } from 'react';
import { 
  GenerateMusicParams, 
  AudioData,
} from '@/types/api';
import { 
  ApiResponse,
  HookResult,
  ApiError,
} from '@/types/common';
import { MusicResource } from '@/types/music';
import { 
  validateCustomModeParams, 
  handleApiError,
  parseTags
} from '@/utils';

// 自定义类型定义，确保在本文件内使用
interface GenerateMusicResponse {
  taskId: string;
}

interface MusicTaskInfo {
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

// 音乐生成状态
interface MusicGenerationState {
  taskId: string | null;
  status: 'idle' | 'loading' | 'polling' | 'success' | 'error';
  results: AudioData[] | null;
  error: ApiError | null;
  textGenerated: boolean;
  firstAudioGenerated: boolean;
}

// 音乐生成API接口
const generateMusic = async (params: GenerateMusicParams): Promise<ApiResponse<GenerateMusicResponse>> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  return await response.json();
};

// 查询任务状态API接口
const getTaskStatus = async (taskId: string): Promise<ApiResponse<MusicTaskInfo>> => {
  const response = await fetch(`/api/generate/record-info?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};

// 音乐生成自定义Hook
export function useGenerateMusic(): HookResult<AudioData[], GenerateMusicParams> & { checkTaskStatus: (taskId: string) => Promise<void> } {
  // 输出弃用警告
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[DEPRECATED] useGenerateMusic is deprecated and will be removed in future versions. ' +
      'Please use useMusicGenerationPolling instead.'
    );
  }
  
  // 状态管理
  const [state, setState] = useState<MusicGenerationState>({
    taskId: null,
    status: 'idle',
    results: null,
    error: null,
    textGenerated: false,
    firstAudioGenerated: false,
  });
  
  // 缓存最近的参数，用于重试
  const [lastParams, setLastParams] = useState<GenerateMusicParams | null>(null);
  
  // 手动查询任务状态
  const checkTaskStatus = useCallback(async (taskId: string) => {
    if (!taskId) {
      console.warn('查询任务状态失败: 缺少任务ID');
      return;
    }
    
    try {
      setState(prev => ({ ...prev, status: 'polling' }));
      
      console.log('手动查询任务状态:', taskId);
      const response = await getTaskStatus(taskId);
      
      if (response.code !== 200) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: {
            code: response.code,
            message: response.msg
          }
        }));
        return;
      }
      
      const taskInfo = response.data;
      console.log('任务状态查询结果:', taskInfo);
      
      // 更新状态
      setState(prev => {
        const newState = { ...prev, taskId }; // 确保taskId被设置
        
        // 文本生成完成
        if (taskInfo.status === 'TEXT_SUCCESS' && !prev.textGenerated) {
          newState.textGenerated = true;
        }
        
        // 第一首歌生成完成
        if (taskInfo.status === 'FIRST_SUCCESS' && !prev.firstAudioGenerated) {
          newState.firstAudioGenerated = true;
          
          // 如果有数据，更新结果
          if (taskInfo.response?.sunoData && taskInfo.response.sunoData.length > 0) {
            newState.results = taskInfo.response.sunoData;
            
            // 处理音乐资源
            taskInfo.response.sunoData.forEach((audio: AudioData) => {
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
              
              console.log('音乐资源:', musicResource);
            });
          }
        }
        
        // 完成状态
        if (taskInfo.status === 'SUCCESS') {
          newState.status = 'success';
          
          // 如果有数据，更新结果
          if (taskInfo.response?.sunoData && taskInfo.response.sunoData.length > 0) {
            newState.results = taskInfo.response.sunoData;
            
            // 处理音乐资源
            taskInfo.response.sunoData.forEach((audio: AudioData) => {
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
              
              console.log('音乐资源:', musicResource);
            });
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
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: handleApiError(error)
      }));
    }
  }, []);
  
  // 生成音乐
  const generateMusicAction = useCallback(async (params: GenerateMusicParams) => {
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
      
      // 缓存参数用于重试
      setLastParams(params);
      
      // 参数验证
      validateCustomModeParams(params);
      
      // 发送请求
      const response = await generateMusic(params);
      
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
      console.log('创建音乐生成任务成功, taskId:', taskId);
      
      // 更新状态
      setState(prev => ({
        ...prev,
        taskId,
        status: 'polling', // 改为polling状态，但不自动轮询
      }));
      
    } catch (error) {
      setState({
        taskId: null,
        status: 'error',
        results: null,
        error: handleApiError(error),
        textGenerated: false,
        firstAudioGenerated: false,
      });
    }
  }, []);
  
  // 重置状态
  const reset = useCallback(() => {
    setState({
      taskId: null,
      status: 'idle',
      results: null,
      error: null,
      textGenerated: false,
      firstAudioGenerated: false,
    });
  }, []);
  
  // 重试
  const retry = useCallback(() => {
    if (lastParams) {
      generateMusicAction(lastParams);
    }
  }, [lastParams, generateMusicAction]);
  
  return {
    taskId: state.taskId,
    status: state.status,
    data: state.results,
    error: state.error,
    isLoading: state.status === 'loading' || state.status === 'polling',
    textGenerated: state.textGenerated,
    firstAudioGenerated: state.firstAudioGenerated,
    execute: generateMusicAction,
    reset,
    retry,
    checkTaskStatus, // 添加手动查询方法
  };
} 