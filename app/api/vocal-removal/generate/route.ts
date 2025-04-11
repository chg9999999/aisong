import { serverFetch } from '@/services/api';
import { NextRequest, NextResponse } from 'next/server';
import { VocalRemovalParams } from '@/types';

// 服务器端API端点
const API_ENDPOINT = '/api/v1/vocal-removal/generate';

// 处理POST请求 - 创建人声分离任务
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: VocalRemovalParams = await request.json();
    
    // 不再需要回调URL，直接使用轮询方式获取结果
    const params = {
      ...body
    };
    
    console.log('[API] 创建人声分离任务，参数:', params);
    
    // 调用远程API
    const response = await serverFetch(API_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    console.log('[API] 人声分离任务创建结果:', response);
    
    // 返回响应
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] 人声分离任务创建失败:', error);
    
    // 返回错误响应
    return NextResponse.json(
      {
        code: 500,
        msg: error instanceof Error ? error.message : '服务器错误',
        data: null
      },
      { status: 500 }
    );
  }
} 