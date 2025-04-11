// 数据导出工具

// 数据类型定义
export interface ProjectData {
  recentTasks?: string[];
  recentLyricsTasks?: string[];
  recentVocalRemovalTasks?: string[];
  taskDetails?: Record<string, any>;
  [key: string]: any; // 允许其他类型的数据
}

export type ExportDataType = 'music' | 'lyrics' | 'vocalRemoval' | 'wav' | 'extend' | 'mp4';

/**
 * 从localStorage中加载所有任务数据 
 * @deprecated 不再需要本地存储功能，此函数将在未来版本中移除
 */
export function loadProjectData(): ProjectData {
  if (typeof window === 'undefined') return {};
  
  console.warn('loadProjectData() 已废弃：项目不再使用本地JSON记录功能');
  return {};
}

/**
 * 将数据保存为下载文件（仅用于用户手动导出）
 * @param dataToExport 要导出的数据
 */
export function saveAsDownload(dataToExport: ProjectData): void {
  try {
    // 生成时间戳
    const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
    
    // 转换为JSON字符串
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接并触发下载
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    
    // 默认文件名
    const customFileName = 'ai-music-data';
    a.setAttribute('download', `${customFileName}-${timestamp}.json`);
    
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('数据已成功导出到下载文件');
  } catch (error) {
    console.error('数据导出为文件失败:', error);
    alert('导出数据失败，请查看控制台获取详细信息。');
  }
} 