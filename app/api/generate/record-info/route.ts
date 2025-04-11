import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/services/api';
import { MusicTaskInfo } from '@/types/api';

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
    
    console.log('查询任务状态, taskId:', taskId);
    
    // 调用远程API
    const response = await serverFetch<MusicTaskInfo>(`/api/v1/generate/record-info?taskId=${taskId}`);
    
    // 添加调试日志
    console.log('API响应数据:', JSON.stringify(response, null, 2));
    
    // 检查音频URL
    if (response.code === 200 && response.data && response.data.response && response.data.response.sunoData) {
      const audioData = response.data.response.sunoData;
      if (audioData.length > 0) {
        const audioUrlDebug = {
          audio_url: audioData[0].audio_url,
          source_audio_url: audioData[0].source_audio_url,
          stream_audio_url: audioData[0].stream_audio_url,
          source_stream_audio_url: audioData[0].source_stream_audio_url,
        };
        console.log('音频URL信息:', audioUrlDebug);
      }
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('查询任务状态API错误:', error);
    return NextResponse.json(
      { code: 500, msg: '服务器错误', data: null },
      { status: 500 }
    );
  }
} 