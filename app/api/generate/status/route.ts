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
    response: {
      taskId: string;
      sunoData?: any[];
    };
    status: string;
    type: string;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

/**
 * 获取音乐生成任务状态
 * 
 * GET /api/generate/status?taskId=xxx
 */
export async function GET(request: NextRequest) {
  // 获取任务ID
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  
  console.log(`[API] 收到音乐生成任务状态查询请求, ID: ${taskId}`);
  
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
    // 调用API获取任务状态
    const response = await serverFetch(`/api/v1/generate/record-info?taskId=${taskId}`);
    
    // 输出详细的响应结构
    console.log('[API] 音乐生成任务状态详细结构:', JSON.stringify(response, null, 2));
    
    // 将原始API响应转换为统一的任务状态响应格式
    const apiResponse = response as ApiResponse;
    
    // 检查响应是否成功
    if (apiResponse.code !== 200) {
      return NextResponse.json({
        taskId,
        status: 'ERROR',
        error: apiResponse.msg || 'Failed to get task status'
      });
    }
    
    // 获取任务数据
    const taskData = apiResponse.data;
    
    if (!taskData) {
      return NextResponse.json({
        taskId,
        status: 'ERROR',
        error: 'No task data returned'
      });
    }
    
    // 解析任务状态
    let status = 'PENDING';
    
    // 根据status字段判断任务状态
    if (taskData.status === 'SUCCESS') {
      status = 'SUCCESS';
    } else if (taskData.status === 'TEXT_SUCCESS') {
      status = 'TEXT_SUCCESS';
    } else if (taskData.status === 'FIRST_SUCCESS') {
      status = 'FIRST_SUCCESS';
    } else if (
      taskData.status === 'CREATE_TASK_FAILED' || 
      taskData.status === 'GENERATE_AUDIO_FAILED' || 
      taskData.status === 'CALLBACK_EXCEPTION' ||
      taskData.status === 'SENSITIVE_WORD_ERROR' ||
      taskData.errorCode
    ) {
      status = 'ERROR';
    }
    
    // 构造统一的任务状态响应
    const taskResponse: any = {
      taskId,
      status
    };
    
    // 如果任务成功，添加结果数据
    if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
      if (taskData.response && taskData.response.sunoData && taskData.response.sunoData.length > 0) {
        taskResponse.result = taskData.response.sunoData;
      }
    }
    
    // 如果文本生成成功
    if (status === 'TEXT_SUCCESS') {
      taskResponse.textGenerated = true;
    }
    
    // 如果任务失败，添加错误信息
    if (status === 'ERROR') {
      taskResponse.error = taskData.errorMessage || `处理失败: ${taskData.status}`;
    }
    
    return NextResponse.json(taskResponse);
    
  } catch (error) {
    console.error(`[API] 查询音乐生成任务状态失败:`, error);
    
    return NextResponse.json(
      { 
        taskId,
        status: 'ERROR',
        error: `Failed to fetch task status: ${error instanceof Error ? error.message : String(error)}`
      },
      { status: 500 }
    );
  }
} 