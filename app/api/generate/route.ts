import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';
import { GenerateMusicParams } from '@/types/api';

// 定义API响应类型
interface GenerateMusicApiResponse {
  taskId: string;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json() as GenerateMusicParams;
    const { prompt, model, customMode, style, title, instrumental, negativeTags } = requestBody;
    
    console.log("生成音乐请求参数:", {
      prompt,
      model,
      customMode,
      style,
      title,
      instrumental,
      negativeTags
    });

    // 构建API请求参数
    const apiParams: GenerateMusicParams = {
      prompt,
      model,
      customMode,
      style,
      title,
      instrumental,
      negativeTags,
      callBackUrl: "https://example.com/no-callback",
    };
    
    // 调用音乐生成API，指定返回类型
    const response = await serverFetch<GenerateMusicApiResponse>('/api/v1/generate', {
      method: 'POST',
      body: JSON.stringify(apiParams),
    });
    
    console.log("生成音乐API响应:", response);
    
    // 返回API响应
    return NextResponse.json(response);
  } catch (error) {
    console.error("生成音乐失败:", error);
    return NextResponse.json({ 
      code: 500, 
      msg: error instanceof Error ? error.message : "生成音乐失败",
      data: null
    }, { status: 500 });
  }
} 