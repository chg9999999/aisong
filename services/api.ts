// API服务层
import { ApiResponse } from '@/types/common';
import { 
  GenerateMusicParams, 
  MusicTaskInfo as TaskInfo, 
  GenerateLyricsParams, 
  GenerateLyricsResponse as LyricsResponse, 
  LyricsTaskInfo, 
  VocalRemovalParams, 
  VocalRemovalResponse, 
  VocalRemovalTaskInfo 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.API_KEY;

// 服务器端API调用（带有API密钥）
async function serverFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    ...options.headers,
  };

  try {
    console.log('[serverFetch] 请求远程API:', url);
    
    // 创建一个带超时的fetch请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // 清除超时定时器

    const data = await response.json();
    console.log('[serverFetch] 远程API返回:', data);
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('[serverFetch] API调用错误:', error);
    
    // 处理不同类型的错误
    let errorMsg = '服务器错误';
    
    if (error instanceof Error) {
      // 处理AbortError (超时)
      if (error.name === 'AbortError') {
        errorMsg = 'API请求超时，请稍后再试';
      } 
      // 处理连接错误
      else if (error.message.includes('fetch failed') || 
               error.message.includes('ENOTFOUND') || 
               error.message.includes('getaddrinfo')) {
        errorMsg = 'AI服务器连接失败，请检查网络连接或稍后再试';
      }
      // 其他错误类型
      else {
        errorMsg = `API调用错误: ${error.message}`;
      }
    }
    
    return {
      code: 500,
      msg: errorMsg,
      data: null as T,
    };
  }
}

// 客户端API调用（不包含API密钥）
export async function clientFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const fullUrl = `/api${endpoint}`;
    console.log('[clientFetch] 请求本地API:', fullUrl);
    const response = await fetch(fullUrl, options);
    const data = await response.json();
    console.log('[clientFetch] 本地API返回:', data);
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('[clientFetch] API调用错误:', error);
    return {
      code: 500,
      msg: '服务器错误',
      data: null as T,
    };
  }
}

// 音乐生成API
export const musicApi = {
  // 创建音乐生成任务
  generateMusic: async (params: GenerateMusicParams) => {
    console.log('[musicApi] 生成音乐参数:', params);
    return await clientFetch<{ taskId: string }>('/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // 查询任务状态
  getTaskInfo: async (taskId: string) => {
    console.log('[musicApi] 查询任务状态:', taskId);
    return await clientFetch<TaskInfo>(`/generate/record-info?taskId=${taskId}`);
  },

  // 查询剩余积分
  getCredit: async () => {
    return await clientFetch<number>('/generate/credit');
  },
};

// 歌词生成API
export const lyricsApi = {
  // 创建歌词生成任务
  generateLyrics: async (params: GenerateLyricsParams) => {
    console.log('[lyricsApi] 生成歌词参数:', params);
    return await clientFetch<LyricsResponse>('/lyrics', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // 查询歌词任务状态
  getLyricsTaskInfo: async (taskId: string) => {
    console.log('[lyricsApi] 查询歌词任务状态:', taskId);
    return await clientFetch<LyricsTaskInfo>(`/lyrics/record-info?taskId=${taskId}`);
  }
};

// 人声分离API
export const vocalRemovalApi = {
  // 创建人声分离任务
  generateVocalRemoval: async (params: VocalRemovalParams) => {
    console.log('[vocalRemovalApi] 生成人声分离参数:', params);
    return await clientFetch<VocalRemovalResponse>('/vocal-removal/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // 查询人声分离任务状态
  getVocalRemovalTaskInfo: async (taskId: string) => {
    console.log('[vocalRemovalApi] 查询人声分离任务状态:', taskId);
    return await clientFetch<VocalRemovalTaskInfo>(`/vocal-removal/record-info?taskId=${taskId}`);
  }
};

// WAV格式音频转换API
export const wavApi = {
  // 创建WAV音频生成任务
  generateWav: async (params: { taskId: string; audioId: string }) => {
    if (!params.taskId) {
      throw new Error('任务ID不能为空');
    }
    if (!params.audioId) {
      throw new Error('音频ID不能为空');
    }

    const response = await fetch('/api/wav/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return await response.json();
  },

  // 查询WAV音频生成任务状态
  getWavTaskInfo: async (params: { taskId: string }) => {
    if (!params.taskId) {
      throw new Error('任务ID不能为空');
    }

    const response = await fetch(`/api/wav/record-info?taskId=${params.taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  }
};

// 音乐扩展API
export const extendApi = {
  // 创建音乐扩展任务
  generateExtend: async (params: {
    audioId: string;
    defaultParamFlag?: boolean;
    prompt?: string;
    style?: string;
    title?: string;
    continueAt?: number;
    model?: string;
    negativeTags?: string;
  }) => {
    if (!params.audioId) {
      throw new Error('音频ID不能为空');
    }

    // 参数验证逻辑修正
    // defaultParamFlag = true: 使用自定义参数，需要提供prompt、style和title
    // defaultParamFlag = false: 使用默认参数，只需audioId
    if (params.defaultParamFlag === true) {
      if (!params.prompt) {
        throw new Error('使用自定义参数时，提示词不能为空');
      }
      
      if (!params.style) {
        throw new Error('使用自定义参数时，音乐风格不能为空');
      }
      
      if (!params.title) {
        throw new Error('使用自定义参数时，标题不能为空');
      }
    }

    const response = await fetch('/api/extend/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return await response.json();
  },

  // 查询音乐扩展任务状态
  getExtendTaskInfo: async (taskId: string) => {
    if (!taskId) {
      throw new Error('任务ID不能为空');
    }

    const response = await fetch(`/api/extend/record-info?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  }
};

// 带时间戳歌词API
export const timestampedLyricsApi = {
  // 获取带时间戳的歌词
  getTimestampedLyrics: async (params: { taskId: string; audioId?: string; musicIndex?: number }) => {
    if (!params.taskId) {
      throw new Error('任务ID不能为空');
    }
    const response = await fetch(`/api/generate/get-timestamped-lyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return await response.json();
  },
};

// MP4视频生成API
export const mp4Api = {
  // 创建MP4视频生成任务
  generateMp4: async (params: {
    taskId: string;
    audioId: string;
    caption?: string;
    captionMode?: 'lyrics' | 'none' | 'custom';
    prompt?: string;
    style?: string;
    outputFormat?: string;
    title?: string;
    negative_prompt?: string;
  }) => {
    if (!params.taskId) {
      throw new Error('任务ID不能为空');
    }
    if (!params.audioId) {
      throw new Error('音频ID不能为空');
    }
    
    const response = await fetch('/api/mp4/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return await response.json();
  },
  
  // 查询MP4视频生成任务状态
  getMp4TaskInfo: async (taskId: string) => {
    if (!taskId) {
      throw new Error('任务ID不能为空');
    }
    const response = await fetch(`/api/mp4/record-info?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  }
};

// 导出服务器端API调用函数
export { serverFetch }; 