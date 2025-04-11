import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';

/**
 * 创建MP4视频生成任务
 * 
 * 该接口已完全迁移到轮询模式，但仍提供虚拟回调URL以满足API要求
 * @param request 请求对象
 * @returns 响应对象
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { taskId, audioId, caption, captionMode = "lyrics", prompt, style, outputFormat = "mp4", title, negative_prompt } = body;

    console.log('[API] 创建MP4视频生成任务 - 参数:', body);

    // 参数校验
    if (!taskId) {
      console.log('[API] 创建MP4视频生成任务失败 - 缺少任务ID');
      return NextResponse.json(
        { code: 400, msg: '缺少任务ID参数' },
        { status: 400 }
      );
    }
    
    if (!audioId) {
      console.log('[API] 创建MP4视频生成任务失败 - 缺少音频ID');
      return NextResponse.json(
        { code: 400, msg: '缺少音频ID参数' },
        { status: 400 }
      );
    }

    // 准备请求参数
    const requestParams: any = {
      taskId,
      audioId,
      outputFormat,
      // 提供一个虚拟回调URL，因为服务器强制要求此参数
      // 选择一个不会真正被调用的地址
      callBackUrl: "https://example.com/no-callback"
    };

    // 添加可选参数
    if (caption) requestParams.caption = caption;
    if (captionMode) requestParams.captionMode = captionMode;
    if (prompt) requestParams.prompt = prompt;
    if (style) requestParams.style = style;
    if (title) requestParams.title = title;
    if (negative_prompt) requestParams.negative_prompt = negative_prompt;

    // 发送请求
    const response = await serverFetch('/api/v1/mp4/generate', {
      method: 'POST',
      body: JSON.stringify(requestParams),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('[API] 创建MP4视频生成任务成功:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] 创建MP4视频生成任务失败:', error);
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 