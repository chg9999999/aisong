import { serverFetch } from '@/services/api';
import { NextRequest, NextResponse } from 'next/server';

// 服务器端API端点
const API_ENDPOINT = '/api/v1/vocal-removal/record-info';

// 处理GET请求 - 查询人声分离任务详情
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    
    // 检查必要参数
    if (!taskId) {
      return NextResponse.json(
        {
          code: 400,
          msg: '缺少必要参数: taskId',
          data: null
        },
        { status: 400 }
      );
    }
    
    console.log('查询人声分离任务参数:', { taskId });
    
    // 构建查询URL
    const queryUrl = `${API_ENDPOINT}?taskId=${taskId}`;
    
    // 调用远程API
    const response = await serverFetch(queryUrl, {
      method: 'GET'
    });
    
    // 返回响应
    return NextResponse.json(response);
  } catch (error) {
    console.error('查询人声分离任务API错误:', error);
    
    // 返回错误响应
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器错误',
        data: null
      },
      { status: 500 }
    );
  }
} 