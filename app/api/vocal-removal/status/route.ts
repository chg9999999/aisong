import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';
import { VocalRemovalResult } from '@/types/music';
import { TaskStatus } from '@/types/api';

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
    response: {
      originUrl: string;
      instrumentalUrl: string;
      vocalUrl: string;
    };
    successFlag: TaskStatus;
    createTime: string;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

/**
 * 获取人声分离任务状态
 * 
 * GET /api/vocal-removal/status?taskId=xxx
 */
export async function GET(request: NextRequest) {
  // 获取任务ID
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  
  console.log(`[API] 收到人声分离任务状态查询请求, ID: ${taskId}`);
  
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
    const response = await serverFetch(`/api/v1/vocal-removal/record-info?taskId=${taskId}`);
    
    // 输出详细的响应结构
    console.log('[API] 人声分离任务状态详细结构:', JSON.stringify(response, null, 2));
    
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
    
    // 根据successFlag判断任务状态
    let status = 'PENDING';
    if (taskData.successFlag === 'SUCCESS') {
      status = 'SUCCESS';
    } else if (
      taskData.successFlag === 'CREATE_TASK_FAILED' || 
      taskData.successFlag === 'CALLBACK_EXCEPTION' ||
      taskData.successFlag === 'SENSITIVE_WORD_ERROR' ||
      taskData.errorCode
    ) {
      status = 'ERROR';
    } else if (
      // API可能返回非枚举中的值，使用字符串比较
      String(taskData.successFlag).toUpperCase() === 'PROCESSING'
    ) {
      status = 'PROCESSING';
    }
    
    // 构造统一的任务状态响应
    const taskResponse: any = {
      taskId,
      status
    };
    
    // 如果任务成功，添加结果数据
    if (status === 'SUCCESS' && taskData.response) {
      taskResponse.result = {
        originalUrl: taskData.response.originUrl,
        instrumentalUrl: taskData.response.instrumentalUrl,
        vocalUrl: taskData.response.vocalUrl,
        taskId: taskData.taskId,
        createdAt: taskData.createTime || taskData.completeTime || new Date().toISOString()
      };
    }
    
    // 如果任务失败，添加错误信息
    if (status === 'ERROR') {
      taskResponse.error = taskData.errorMessage || `处理失败: ${taskData.successFlag}`;
    }
    
    return NextResponse.json(taskResponse);
    
  } catch (error) {
    console.error(`[API] 查询人声分离任务状态失败:`, error);
    
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