import { serverFetch } from '@/services/api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 提供一个虚拟回调URL，因为服务器强制要求此参数
    // 选择一个不会真正被调用的地址
    const params = {
      ...body,
      callBackUrl: "https://example.com/no-callback",
    };
    
    // 调用远程API
    const response = await serverFetch('/api/v1/lyrics', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('歌词生成API错误:', error);
    return NextResponse.json(
      { code: 500, msg: '服务器错误', data: null },
      { status: 500 }
    );
  }
} 