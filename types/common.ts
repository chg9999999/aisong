// types/common.ts
// 定义通用类型和工具类型

// 错误类型
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

// API响应通用接口
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// 操作状态
export type OperationStatus = 'idle' | 'loading' | 'polling' | 'success' | 'error';

// Hook返回的通用结构
export interface HookResult<TData, TParams = any> {
  // 状态
  status: OperationStatus;
  data: TData | null;
  error: ApiError | null;
  
  // 操作方法
  execute: (params: TParams) => Promise<void>;
  reset: () => void;
  retry: () => Promise<void>;
}

// 本地存储项目
export interface StorageItem {
  key: string;
  value: any;
  expireAt?: number; // Unix时间戳，毫秒
}

// 分页数据
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 任务基础信息
export interface TaskBase {
  taskId: string;
  createdAt: string;
  type: 'music' | 'lyrics' | 'vocalRemoval' | 'wav' | 'extend' | 'mp4' | 'timestampedLyrics';
}

// 用户设置
export interface UserSettings {
  defaultModel: 'V3_5' | 'V4';
  autoSave: boolean;
  notifyOnCompletion: boolean;
  theme: 'light' | 'dark' | 'system';
}

// 可选项类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 非空类型
export type NonNullable<T> = T extends null | undefined ? never : T;

// 导入MusicLibrary类型从music.ts
import type { MusicLibrary } from './music';
export type { MusicLibrary }; 