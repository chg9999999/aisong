// utils/storage-adapter.ts
// 存储适配器 - 为将来整合Supabase做准备的过渡层

import { TaskBase } from '../types/common';

/**
 * 存储适配器接口 - 定义存储操作的通用方法
 * 将来可以实现为SupabaseStorageAdapter
 */
export interface StorageAdapter {
  // 任务相关
  saveTask: (taskId: string, data: any) => Promise<void>;
  getTask: <T>(taskId: string) => Promise<T | null>;
  getRecentTasks: () => Promise<TaskBase[]>;
  addRecentTask: (task: TaskBase) => Promise<void>;
  
  // 资源相关
  saveResource: (collection: string, id: string, data: any) => Promise<void>;
  getResource: <T>(collection: string, id: string) => Promise<T | null>;
  getResourcesByType: <T>(collection: string, filter?: any) => Promise<T[]>;
  
  // 用户设置
  saveUserSettings: (settings: any) => Promise<void>;
  getUserSettings: <T>() => Promise<T | null>;
  
  // 数据管理
  exportData: () => Promise<string>;
  importData: (jsonStr: string) => Promise<boolean>;
  clearData: () => Promise<void>;
}

/**
 * 内存存储适配器 - 临时使用内存存储，将来替换为Supabase
 * 这是为了保持应用程序结构不变，方便日后替换
 */
class MemoryStorageAdapter implements StorageAdapter {
  private storage: Map<string, any> = new Map();
  private recentTasks: TaskBase[] = [];
  
  // 任务相关
  async saveTask(taskId: string, data: any): Promise<void> {
    this.storage.set(`task_${taskId}`, data);
  }
  
  async getTask<T>(taskId: string): Promise<T | null> {
    return this.storage.get(`task_${taskId}`) as T || null;
  }
  
  async getRecentTasks(): Promise<TaskBase[]> {
    return [...this.recentTasks];
  }
  
  async addRecentTask(task: TaskBase): Promise<void> {
    // 检查是否已存在
    const exists = this.recentTasks.findIndex(t => t.taskId === task.taskId) >= 0;
    
    if (!exists) {
      // 添加到列表开头
      this.recentTasks.unshift(task);
      // 最多保存20个任务
      if (this.recentTasks.length > 20) {
        this.recentTasks = this.recentTasks.slice(0, 20);
      }
    } else {
      // 更新已有任务
      this.recentTasks = this.recentTasks.map(t => 
        t.taskId === task.taskId ? task : t
      );
    }
  }
  
  // 资源相关
  async saveResource(collection: string, id: string, data: any): Promise<void> {
    this.storage.set(`${collection}_${id}`, data);
    
    // 更新集合索引
    const collectionIndex = this.storage.get(`${collection}_index`) || [];
    if (!collectionIndex.includes(id)) {
      collectionIndex.push(id);
      this.storage.set(`${collection}_index`, collectionIndex);
    }
  }
  
  async getResource<T>(collection: string, id: string): Promise<T | null> {
    return this.storage.get(`${collection}_${id}`) as T || null;
  }
  
  async getResourcesByType<T>(collection: string, filter?: any): Promise<T[]> {
    const collectionIndex = this.storage.get(`${collection}_index`) || [];
    const resources: T[] = [];
    
    for (const id of collectionIndex) {
      const resource = this.storage.get(`${collection}_${id}`);
      if (resource) {
        // 如果有过滤条件，则应用过滤
        if (filter) {
          let match = true;
          for (const [key, value] of Object.entries(filter)) {
            if (resource[key] !== value) {
              match = false;
              break;
            }
          }
          if (match) {
            resources.push(resource as T);
          }
        } else {
          resources.push(resource as T);
        }
      }
    }
    
    return resources;
  }
  
  // 用户设置
  async saveUserSettings(settings: any): Promise<void> {
    this.storage.set('user_settings', settings);
  }
  
  async getUserSettings<T>(): Promise<T | null> {
    return this.storage.get('user_settings') as T || null;
  }
  
  // 数据管理
  async exportData(): Promise<string> {
    const data: Record<string, any> = {};
    
    for (const [key, value] of this.storage.entries()) {
      data[key] = value;
    }
    
    data['recent_tasks'] = this.recentTasks;
    
    return JSON.stringify(data);
  }
  
  async importData(jsonStr: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonStr);
      
      // 清空现有数据
      this.storage.clear();
      this.recentTasks = [];
      
      // 导入数据
      for (const [key, value] of Object.entries(data)) {
        if (key === 'recent_tasks') {
          this.recentTasks = value as TaskBase[];
        } else {
          this.storage.set(key, value);
        }
      }
      
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }
  
  async clearData(): Promise<void> {
    this.storage.clear();
    this.recentTasks = [];
  }
}

/**
 * 创建一个单例的内存存储适配器实例
 * 将来可以替换为Supabase实现
 */
const memoryStorageAdapter = new MemoryStorageAdapter();

// 导出默认存储适配器
export const storageAdapter: StorageAdapter = memoryStorageAdapter;

// 将来实现Supabase适配器
// export class SupabaseStorageAdapter implements StorageAdapter {
//   private supabase: any; // Supabase客户端实例
//   
//   constructor(supabaseClient: any) {
//     this.supabase = supabaseClient;
//   }
//   
//   async saveTask(taskId: string, data: any): Promise<void> {
//     await this.supabase.from('tasks').upsert({
//       id: taskId,
//       data: data,
//       updated_at: new Date()
//     });
//   }
//   
//   // ... 实现其他方法
// }
//
// 将来可以这样初始化:
// import { createClient } from '@supabase/supabase-js'
// const supabaseClient = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY')
// export const storageAdapter: StorageAdapter = new SupabaseStorageAdapter(supabaseClient); 