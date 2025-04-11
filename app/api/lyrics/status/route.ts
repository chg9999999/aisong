import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

// 定义响应类型
interface ApiResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    param: string;
    response?: {
      taskId: string;
      data?: any[];
    };
    status: string;
    type: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

/**
 * 获取歌词生成任务状态
 * 
 * GET /api/lyrics/status?taskId=xxx
 */
export async function GET(request: NextRequest) {
  // 获取任务ID
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  
  console.log(`[API] 收到歌词任务状态查询请求, ID: ${taskId}`);
  
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
    const response = await serverFetch(`/api/v1/lyrics/record-info?taskId=${taskId}`);
    
    // 输出详细的响应结构
    console.log('[API] 歌词任务状态详细结构:', JSON.stringify(response, null, 2));
    
    // 使用类型断言处理响应数据
    const typedResponse = response as any;
    if (typedResponse.data && typedResponse.data.response) {
      console.log('[API] 歌词数据结构:', JSON.stringify(typedResponse.data.response, null, 2));
    }
    
    // 将API响应转换为标准化的轮询格式
    const { data } = typedResponse;
    const result = {
      taskId: data?.taskId || taskId,
      status: data?.status || 'PENDING',
      result: null as any,
      error: null as string | null
    };
    
    // 如果任务完成且有结果数据
    if (data?.status === 'SUCCESS' && data?.response?.data && data.response.data.length > 0) {
      result.result = {
        lyricsData: data.response.data.map(item => ({
          text: item.text,
          title: item.title,
          status: item.status,
          errorMessage: item.errorMessage
        }))
      };
    }
    
    // 如果任务失败，设置错误信息
    if (['CREATE_TASK_FAILED', 'GENERATE_LYRICS_FAILED', 'CALLBACK_EXCEPTION'].includes(data?.status || '')) {
      result.status = 'ERROR';
      result.error = data?.errorMessage || `Task failed with status: ${data?.status}`;
    }
    
    console.log('[API] 转换后的轮询响应格式:', JSON.stringify(result, null, 2));
    
    // 返回标准化的响应
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`[API] 查询歌词任务状态失败:`, error);
    
    return NextResponse.json(
      { 
        code: 500, 
        msg: `Failed to fetch task status: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      },
      { status: 500 }
    );
  }
} 