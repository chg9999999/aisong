import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { code: 400, msg: '缺少taskId参数', data: null },
        { status: 400 }
      );
    }
    
    // 调用远程API
    const response = await serverFetch(`/api/v1/lyrics/record-info?taskId=${taskId}`);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('查询歌词任务状态API错误:', error);
    return NextResponse.json(
      { code: 500, msg: '服务器错误', data: null },
      { status: 500 }
    );
  }
} 