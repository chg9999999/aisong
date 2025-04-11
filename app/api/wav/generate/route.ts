import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

/**
 * WAV格式音频生成API端点
 * 
 * 创建WAV格式音频转换任务
 * 注意：该接口已完全迁移到轮询模式，不再使用回调机制
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 修正验证逻辑 - 只需要至少有一个参数存在
    if (!body.taskId && !body.audioId) {
      return NextResponse.json(
        { code: 400, msg: '缺少必要参数: 至少需要提供taskId或audioId之一', data: null },
        { status: 400 }
      );
    }
    
    console.log('[API] 开始创建WAV格式音频生成任务:', body);
    
    // 构建API请求参数
    const apiParams: any = {};
    
    // 只传递存在的参数
    if (body.taskId) {
      apiParams.taskId = body.taskId;
    }
    
    if (body.audioId) {
      apiParams.audioId = body.audioId;
    }
    
    // 注意：已移除回调URL相关代码，完全使用轮询模式获取结果
    
    // 调用API
    const response = await serverFetch(
      '/api/v1/wav/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiParams)
      }
    );
    
    console.log('[API] WAV生成任务创建响应:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] 创建WAV格式音频生成任务失败:', error);
    return NextResponse.json(
      { code: 500, msg: '处理请求时发生错误', data: null },
      { status: 500 }
    );
  }
} 