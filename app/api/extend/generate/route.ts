import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';
import { MusicExtensionParams } from '@/types/api';

// 定义扩展API响应类型
interface ExtendMusicApiResponse {
  taskId: string;
  [key: string]: any;
}

/**
 * 创建音乐扩展任务
 * @param request 请求对象
 * @returns 响应对象
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const {
      audioId,
      defaultParamFlag = true,
      prompt,
      style,
      title,
      continueAt,
      model,
      negativeTags
    } = body;
    
    console.log('[API] 创建音乐扩展任务 - 参数:', body);
    
    // 参数验证
    if (!audioId) {
      console.error('[API] 创建音乐扩展任务失败 - 缺少音频ID');
      return NextResponse.json(
        { code: 400, msg: '缺少必要参数: audioId' },
        { status: 400 }
      );
    }
    
    if (defaultParamFlag === false && !prompt) {
      console.error('[API] 创建音乐扩展任务失败 - 使用自定义参数时，提示词不能为空');
      return NextResponse.json(
        { code: 400, msg: '使用自定义参数时，提示词不能为空' },
        { status: 400 }
      );
    }
    
    // 使用自定义参数时，continueAt为必填
    if (defaultParamFlag === false && continueAt === undefined) {
      console.error('[API] 创建音乐扩展任务失败 - 使用自定义参数时，继续位置参数不能为空');
      return NextResponse.json(
        { code: 400, msg: '使用自定义参数时，继续位置参数(continueAt)不能为空' },
        { status: 400 }
      );
    }
    
    // 使用固定的虚拟回调URL，因为服务器强制要求此参数
    const callBackUrl = "https://example.com/no-callback";
    
    // 准备请求参数
    const requestParams: MusicExtensionParams = {
      audioId,
      defaultParamFlag,
      callBackUrl,
      model: model as 'V3_5' | 'V4' || 'V3_5' // 无论是否使用默认参数，都添加默认模型参数
    };
    
    // 仅当使用自定义参数时添加这些字段
    if (!defaultParamFlag) {
      requestParams.prompt = prompt;
      requestParams.continueAt = continueAt;
      if (style) requestParams.style = style;
      if (title) requestParams.title = title;
      // 确保模型版本格式正确
      if (model) {
        // 只接受V3_5和V4两种格式
        requestParams.model = model !== 'V3_5' && model !== 'V4' 
          ? (model.toUpperCase() === 'V4' ? 'V4' : 'V3_5') as 'V3_5' | 'V4'
          : model as 'V3_5' | 'V4';
      }
      if (negativeTags) requestParams.negativeTags = negativeTags;
    }
    
    // 调用服务端API
    const response = await serverFetch<ExtendMusicApiResponse>('/api/v1/generate/extend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestParams),
    });
    
    console.log('[API] 创建音乐扩展任务成功:', response);
    
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
            type: 'extend',
            params: body
          }),
        });
        
        console.log('[API] 成功创建扩展任务记录:', taskId);
      } catch (error) {
        console.error('[API] 创建本地扩展任务记录失败:', error);
      }
    }
    
    // 返回API响应
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] 创建音乐扩展任务失败:', error);
    
    return NextResponse.json(
      { 
        code: 500, 
        msg: error instanceof Error ? error.message : '创建音乐扩展任务失败'
      },
      { status: 500 }
    );
  }
} 