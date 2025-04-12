import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

// 定义响应类型
interface ApiResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    parentMusicId?: string;
    param: string;
    response?: {
      taskId: string;
      sunoData?: any[];
    };
    status: string;
    type: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

/**
 * 获取音乐扩展任务状态
 * 
 * GET /api/extend/status?taskId=xxx
 */
export async function GET(request: NextRequest) {
  // 获取任务ID
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  
  console.log(`[API] 收到音乐扩展任务状态查询请求, ID: ${taskId}`);
  
  // 验证参数
  if (!taskId) {
    return NextResponse.json(
      { 
        code: 400, 
        msg: 'Task ID is required',
        data: null
      },
      { status: 400 }
    );
  }
  
  try {
    // 调用Suno API获取任务状态 - 使用正确的API路径
    const response = await serverFetch(`/api/v1/generate/record-info?taskId=${taskId}`);
    
    // 输出详细的响应结构
    console.log('[API] 音乐扩展任务状态详细结构:', JSON.stringify(response, null, 2));
    
    // 使用类型断言处理响应数据
    const typedResponse = response as ApiResponse;
    const { data } = typedResponse;
    
    if (data && data.response) {
      console.log('[API] 音乐扩展数据结构:', JSON.stringify(data.response, null, 2));
    }
    
    // 适配轮询响应格式
    const result = {
      taskId: data?.taskId || taskId,
      status: data?.status || 'PENDING',
      result: null as any,
      error: null as string | null,
      progress: {
        textGenerated: data?.status === 'TEXT_SUCCESS' || data?.status === 'FIRST_SUCCESS' || data?.status === 'SUCCESS',
        firstAudioGenerated: data?.status === 'FIRST_SUCCESS' || data?.status === 'SUCCESS'
      }
    };
    
    // 如果任务完成且有结果数据，则处理结果
    if (data?.status === 'SUCCESS' && data.response?.sunoData && data.response.sunoData.length > 0) {
      const audio = data.response.sunoData[0];
      const paramObj = JSON.parse(data.param || '{}');
      
      // 记录原始数据结构以便调试
      console.log('[API] 原始音频数据:', JSON.stringify(audio, null, 2));
      console.log('[API] 参数对象:', paramObj);
      console.log('[API] 原始音频ID:', data.parentMusicId || paramObj.audioId);
      
      // 创建标准化的结果对象
      result.result = {
        taskId: data.taskId,
        originalAudioId: data.parentMusicId || paramObj.audioId,
        // 将单个对象改为数组格式，保持与前端代码兼容
        sunoData: [{
          id: audio.id,
          title: audio.title,
          audioUrl: audio.audio_url || audio.source_audio_url,
          streamAudioUrl: audio.stream_audio_url || audio.source_stream_audio_url,
          imageUrl: audio.image_url || audio.source_image_url,
          sourceImageUrl: audio.source_image_url,
          prompt: audio.prompt,
          tags: audio.tags ? (typeof audio.tags === 'string' ? audio.tags : audio.tags.join(',')) : '',
          duration: audio.duration,
          createTime: audio.createTime,
          modelName: audio.model_name
        }],
        continueAtPosition: paramObj.continueAt || 0,
        createdAt: audio.createTime || new Date().toISOString()
      };
      
      // 记录处理后的音频数据
      console.log('[API] 处理后的扩展音频数据:', JSON.stringify(result.result.sunoData[0], null, 2));
    }
    
    // 如果任务失败，则设置错误信息
    if (['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(data?.status || '')) {
      result.status = 'ERROR';
      result.error = data?.errorMessage || `Task failed with status: ${data?.status}`;
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`[API] 查询音乐扩展任务状态失败:`, error);
    
    return NextResponse.json(
      { 
        taskId,
        status: 'ERROR',
        result: null,
        error: `Failed to fetch task status: ${error instanceof Error ? error.message : String(error)}`,
        progress: {
          textGenerated: false,
          firstAudioGenerated: false
        }
      },
      { status: 500 }
    );
  }
} 