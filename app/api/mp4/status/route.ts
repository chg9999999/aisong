import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

// 定义响应类型
interface ApiResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    musicId: string;
    callbackUrl?: string;
    musicIndex?: number;
    completeTime?: string;
    createTime?: string;
    response?: {
      videoUrl: string;
    };
    successFlag: string;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

/**
 * 获取MP4视频生成任务状态
 * 
 * GET /api/mp4/status?taskId=xxx
 */
export async function GET(request: NextRequest) {
  // 获取任务ID
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  
  console.log(`[API] 收到MP4视频生成任务状态查询请求, ID: ${taskId}`);
  
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
    // 调用Suno API获取任务状态
    const response = await serverFetch(`/api/v1/mp4/record-info?taskId=${taskId}`);
    
    // 输出详细的响应结构
    console.log('[API] MP4视频生成任务状态详细结构:', JSON.stringify(response, null, 2));
    
    // 使用类型断言处理响应数据
    const typedResponse = response as ApiResponse;
    const { data } = typedResponse;
    
    if (data && data.response) {
      console.log('[API] MP4视频数据结构:', JSON.stringify(data.response, null, 2));
    }
    
    // 适配轮询响应格式
    const result = {
      taskId: data?.taskId || taskId,
      status: data?.successFlag === 'SUCCESS' ? 'SUCCESS' : data?.successFlag === 'PENDING' ? 'PENDING' : 'ERROR',
      result: null as any,
      error: null as string | null
    };
    
    // 如果任务完成且有结果数据，则处理结果
    if (data?.successFlag === 'SUCCESS' && data.response?.videoUrl) {
      // 创建标准化的结果对象
      result.result = {
        taskId: data.taskId,
        originalAudioId: data.musicId,
        videoUrl: data.response.videoUrl,
        createdAt: data.completeTime || data.createTime || new Date().toISOString()
      };
    }
    
    // 如果任务失败，则设置错误信息
    if ([
      'CREATE_TASK_FAILED', 
      'GENERATE_MP4_FAILED', 
      'CALLBACK_EXCEPTION', 
      'SENSITIVE_WORD_ERROR'
    ].includes(data?.successFlag || '')) {
      result.status = 'ERROR';
      result.error = data?.errorMessage || `Task failed with status: ${data?.successFlag}`;
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`[API] 查询MP4视频生成任务状态失败:`, error);
    
    return NextResponse.json(
      { 
        taskId,
        status: 'ERROR',
        result: null,
        error: `Failed to fetch task status: ${error instanceof Error ? error.message : String(error)}`
      },
      { status: 500 }
    );
  }
} 