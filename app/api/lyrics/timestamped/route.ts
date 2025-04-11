import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

/**
 * 获取带时间戳的歌词字幕 (POST方法，符合API文档)
 * @param request 请求对象
 * @returns 响应对象
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { taskId, audioId, musicIndex } = body;
    
    console.log(`[API] 开始获取带时间戳的歌词 taskId=${taskId}, audioId=${audioId}, musicIndex=${musicIndex}`);
    
    // 参数校验
    if (!taskId) {
      console.log('[API] 获取带时间戳的歌词失败 - 缺少任务ID');
      return NextResponse.json(
        { code: 400, msg: '缺少任务ID参数' },
        { status: 400 }
      );
    }
    
    // 准备请求参数
    const requestParams: any = {
      taskId
    };
    
    // 添加可选参数
    if (audioId) requestParams.audioId = audioId;
    if (musicIndex !== undefined) requestParams.musicIndex = musicIndex;
    
    // 构建请求URL并发送请求
    console.log(`[API] 请求Suno API: /api/v1/generate/get-timestamped-lyrics`);
    
    // 发起请求
    const response = await serverFetch('/api/v1/generate/get-timestamped-lyrics', {
      method: 'POST',
      body: JSON.stringify(requestParams),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`[API] 获取带时间戳的歌词成功 - taskId: ${taskId}`);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] 获取带时间戳的歌词失败:', error);
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 获取带时间戳的歌词字幕 (旧版GET方法，将被弃用)
 * @param request 请求对象
 * @returns 响应对象
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const audioId = searchParams.get('audioId');
    
    console.log(`[API] 开始获取带时间戳的歌词 audioId=${audioId} (使用了不推荐的GET方法)`);
    
    // 参数校验
    if (!audioId) {
      console.log('[API] 获取带时间戳的歌词失败 - 缺少音频ID');
      return NextResponse.json(
        { code: 400, msg: '缺少音频ID参数' },
        { status: 400 }
      );
    }
    
    // 构建查询请求URL - 注意：这种使用方式将在未来被弃用
    const queryUrl = `/api/v1/generate/get-timestamped-lyrics?audioId=${audioId}`;
    console.log(`[API] 请求Suno API: ${queryUrl} (不符合API规范，应使用POST)`);
    
    try {
      // 尝试使用GET方法请求（不符合API文档规范）
      const response = await serverFetch(queryUrl, {
        method: 'GET',
      });
      
      console.log(`[API] 获取带时间戳的歌词响应 - audioId: ${audioId}`, response);
      
      // 如果返回错误，提示用户使用POST方法
      if (response.code !== 200) {
        return NextResponse.json({
          code: 404,
          msg: '请使用POST方法调用此API，并提供taskId参数。GET方法已被弃用，详情请参考API文档。',
          data: null
        });
      }
      
      return NextResponse.json(response);
    } catch (error) {
      console.error('[API] GET方法请求失败:', error);
      return NextResponse.json({
        code: 404,
        msg: '请使用POST方法调用此API，并提供taskId参数。GET方法已被弃用，详情请参考API文档。',
        data: null
      });
    }
  } catch (error) {
    console.error('[API] 获取带时间戳的歌词失败:', error);
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 