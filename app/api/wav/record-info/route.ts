import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    // 验证必要参数
    if (!taskId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数: taskId' },
        { status: 400 }
      );
    }
    
    console.log('开始查询WAV格式音频任务信息, taskId:', taskId);
    
    // 调用API
    const response = await serverFetch(
      `/api/v1/wav/record-info?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('WAV任务查询响应:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('查询WAV格式音频任务失败:', error);
    return NextResponse.json(
      { success: false, message: '处理请求时发生错误', error: String(error) },
      { status: 500 }
    );
  }
} 