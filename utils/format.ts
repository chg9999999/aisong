// utils/format.ts
// 数据格式化工具函数

// 格式化时间（将秒转为 mm:ss 格式）
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 格式化时间（将秒转为 hh:mm:ss 格式，当超过一小时时）
export function formatLongTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 格式化日期（ISO字符串转为本地日期时间）
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return isoString;
  }
}

// 简化日期（只显示年月日）
export function formatSimpleDate(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    return isoString;
  }
}

// 格式化文件大小（字节转为 KB/MB/GB）
export function formatFileSize(bytes: number): string {
  if (isNaN(bytes) || bytes < 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 格式化数组为逗号分隔的字符串
export function formatArrayToString(arr: string[]): string {
  if (!Array.isArray(arr)) return '';
  return arr.join(', ');
}

// 限制字符串长度，超出部分替换为省略号
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return str.slice(0, maxLength) + '...';
}

// 格式化歌词为HTML，突出显示当前播放行
export function formatLyricsToHtml(lyrics: string, currentLine?: number): string {
  if (!lyrics) return '';
  
  const lines = lyrics.split('\n');
  
  return lines.map((line, index) => {
    if (index === currentLine) {
      return `<div class="current-line">${line}</div>`;
    }
    return `<div>${line}</div>`;
  }).join('');
}

// 解析标签字符串为数组
export function parseTags(tagString: string): string[] {
  if (!tagString) return [];
  
  return tagString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

// 格式化任务类型为友好显示名称
export function formatTaskType(type: string): string {
  const typeMapping: Record<string, string> = {
    'music': '音乐生成',
    'lyrics': '歌词生成',
    'vocalRemoval': '人声分离',
    'wav': 'WAV转换',
    'extend': '音乐扩展',
    'mp4': 'MP4视频',
    'timestampedLyrics': '带时间戳歌词'
  };
  
  return typeMapping[type] || type;
}

// 格式化任务状态为友好显示名称
export function formatTaskStatus(status: string): string {
  const statusMapping: Record<string, string> = {
    'PENDING': '处理中',
    'TEXT_SUCCESS': '文本生成完成',
    'FIRST_SUCCESS': '首首歌生成完成',
    'SUCCESS': '生成成功',
    'CREATE_TASK_FAILED': '创建任务失败',
    'GENERATE_AUDIO_FAILED': '生成音频失败',
    'GENERATE_LYRICS_FAILED': '生成歌词失败',
    'GENERATE_WAV_FAILED': '生成WAV失败',
    'GENERATE_MP4_FAILED': '生成MP4失败',
    'CALLBACK_EXCEPTION': '回调异常',
    'SENSITIVE_WORD_ERROR': '敏感词错误'
  };
  
  return statusMapping[status] || status;
}

// 格式化模型名称为友好显示名称
export function formatModelName(model: string): string {
  const modelMapping: Record<string, string> = {
    'V3_5': 'Suno V3.5',
    'V4': 'Suno V4'
  };
  
  return modelMapping[model] || model;
} 