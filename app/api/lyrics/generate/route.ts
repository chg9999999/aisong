import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';
import { GenerateLyricsParams } from '@/types/api';

// 定义歌词生成API响应类型
interface GenerateLyricsApiResponse {
  taskId: string;
  [key: string]: any;
}

/**
 * 创建歌词生成任务
 * 
 * 该接口使用轮询模式，但提供虚拟回调URL以满足API要求
 * @param request 请求对象
 * @returns 响应对象
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { prompt } = body;
    
    console.log('[API] 创建歌词生成任务 - 参数:', body);
    
    // 验证参数
    if (!prompt) {
      console.error('[API] 创建歌词生成任务失败 - 缺少提示词');
      return NextResponse.json(
        { code: 400, msg: '缺少必要参数: prompt' },
        { status: 400 }
      );
    }
    
    // 构建请求参数 - 只需要单个prompt参数和虚拟回调URL
    const requestParams: GenerateLyricsParams = {
      prompt,
      // 提供一个虚拟回调URL，因为服务器强制要求此参数
      callBackUrl: "https://example.com/no-callback"
    };
    
    // 调用服务端API
    const response = await serverFetch<GenerateLyricsApiResponse>('/api/v1/lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestParams),
    });
    
    console.log('[API] 创建歌词生成任务成功:', response);
    
    // 如果API调用成功，创建本地任务记录
    if (response.code === 200 && response.data?.taskId) {
      const taskId = response.data.taskId;
      
      try {
        // 创建本地任务记录
        const origin = request.nextUrl.origin;
        const apiUrl = `${origin}/api/tasks/${taskId}`;
        
        await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'PENDING',
            progress: 0.1,
            createdAt: new Date().toISOString(),
            type: 'lyrics',
            params: body
          }),
        });
        
        console.log('[API] 成功创建本地歌词任务记录:', taskId);
      } catch (error) {
        console.error('[API] 创建本地歌词任务记录失败:', error);
      }
    }
    
    // 返回API响应
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] 创建歌词生成任务失败:', error);
    
    return NextResponse.json(
      { 
        code: 500, 
        msg: error instanceof Error ? error.message : '创建歌词生成任务失败'
      },
      { status: 500 }
    );
  }
} 