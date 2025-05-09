import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

/**
 * 查询音乐扩展任务状态
 * @param request 请求对象
 * @returns 响应对象
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    
    console.log(`[API] 开始查询扩展音频任务信息 taskId=${taskId}`);
    
    // 参数校验
    if (!taskId) {
      console.log('[API] 任务ID参数缺失');
      return NextResponse.json(
        { success: false, message: '缺少任务ID参数' },
        { status: 400 }
      );
    }
    
    // 构建查询请求URL
    const queryUrl = `/api/v1/generate/record-info?taskId=${taskId}`;
    console.log(`[API] 请求Suno API: ${queryUrl}`);
    
    // 发起查询请求
    const response = await serverFetch(queryUrl, {
      method: 'GET',
    });

    // 直接返回response，不需要再调用json()
    console.log(`[API] Suno API响应:`, response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] 查询扩展音频任务信息失败:', error);
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 