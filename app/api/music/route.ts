import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    // 从URL中获取分页参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 计算起始位置
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // 从Supabase获取音乐数据
    const { data, error, count } = await supabase
      .from('music_tracks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Supabase查询失败:', error);
      return NextResponse.json({
        success: false,
        message: '获取数据失败',
        items: []
      }, { status: 500 });
    }
    
    // 添加驼峰命名版本的字段，以便前端能够使用一致的字段名
    const items = data?.map(item => ({
      ...item,
      // 添加驼峰命名版本的URL字段
      audioUrl: item.audio_url,
      sourceAudioUrl: item.audio_url,
      imageUrl: item.image_url,
      sourceImageUrl: item.image_url,
      // 添加其他需要的驼峰命名字段
      modelName: item.model
    })) || [];
    
    // 返回数据和分页信息
    return NextResponse.json({
      success: true,
      items: items,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
        hasMore: data && count ? from + data.length < count : false
      }
    });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误',
      items: []
    }, { status: 500 });
  }
} 