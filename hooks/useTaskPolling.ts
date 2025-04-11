/**
 * 通用任务轮询Hook
 * 
 * 这个Hook提供了一个可配置、可重用的轮询机制，用于替代旧的回调机制。
 * 它可以轮询任何类型的异步任务，并提供任务状态的实时反馈。
 * 
 * 主要特性:
 * - 可配置的轮询间隔和尝试次数
 * - 自适应轮询间隔（随着时间增加间隔）
 * - 详细的状态报告（进度、时间等）
 * - 完整的资源管理和错误处理
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// 轮询配置类型
export interface PollingConfig {
  // 初始轮询间隔 (毫秒)
  initialInterval?: number;
  // 最大轮询间隔 (毫秒)
  maxInterval?: number;
  // 间隔增长速率 (每次增长比例)
  growthRate?: number;
  // 最大尝试次数 (0表示无限)
  maxAttempts?: number;
  // 是否使用渐进式间隔 (随着轮询次数增加，间隔时间也增加)
  useProgressiveInterval?: boolean;
}

// 轮询状态类型
export type PollingStatus = 'idle' | 'polling' | 'success' | 'error' | 'timeout';

// 轮询结果类型
export interface PollingResult<T> {
  // 轮询状态
  status: PollingStatus;
  // 轮询数据
  data: T | null;
  // 轮询错误
  error: Error | null;
  // 开始轮询
  startPolling: (taskId: string) => void;
  // 停止轮询
  stopPolling: () => void;
  // 重置轮询
  resetPolling: () => void;
  // 当前尝试次数
  attempts: number;
  // 已轮询时间 (秒)
  elapsedTime: number;
}

/**
 * 通用任务轮询Hook
 * 
 * @param fetchFn 获取任务状态的函数，接收taskId并返回Promise
 * @param checkCompleteFn 检查任务是否完成的函数，接收API返回数据并返回布尔值
 * @param extractDataFn 从API返回数据中提取业务数据的函数
 * @param config 轮询配置
 * @returns 轮询结果对象
 * 
 * @example
 * // 基本用法
 * const {
 *   status,
 *   data,
 *   startPolling
 * } = useTaskPolling(
 *   (id) => fetch(`/api/tasks/${id}`).then(r => r.json()),
 *   (res) => res.status === 'SUCCESS',
 *   (res) => res.data.results,
 *   { initialInterval: 2000 }
 * );
 */
export function useTaskPolling<T, R>(
  fetchFn: (taskId: string) => Promise<R>,
  checkCompleteFn: (response: R) => boolean,
  extractDataFn: (response: R) => T,
  config: PollingConfig = {}
): PollingResult<T> {
  // 配置默认值
  const {
    initialInterval = 2000,   // 默认初始间隔为2秒
    maxInterval = 10000,      // 默认最大间隔为10秒
    growthRate = 1.5,         // 默认每次增长50%
    maxAttempts = 60,         // 默认最多尝试60次
    useProgressiveInterval = true, // 默认使用渐进式间隔
  } = config;

  // 内部状态
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 使用useRef保存定时器ID、任务ID和开始时间
  // useRef在组件渲染周期之间保持值，不触发重新渲染
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const taskIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // 计算当前应使用的轮询间隔
  // 如果启用了渐进式间隔，则根据尝试次数增加间隔
  const calculateInterval = useCallback((attempt: number): number => {
    if (!useProgressiveInterval) return initialInterval;
    
    // 使用平滑的指数增长函数
    // 每3次尝试增加一次间隔，但不超过最大间隔
    return Math.min(
      initialInterval * Math.pow(growthRate, Math.floor(attempt / 3)),
      maxInterval
    );
  }, [initialInterval, maxInterval, growthRate, useProgressiveInterval]);

  // 更新已过时间
  // 实时更新elapsedTime，提供用户界面反馈
  useEffect(() => {
    let timeUpdateInterval: NodeJS.Timeout | null = null;
    
    if (status === 'polling' && startTimeRef.current > 0) {
      timeUpdateInterval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);
      }, 100); // 每100ms更新一次
    }
    
    // 组件卸载时清理计时器
    return () => {
      if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    };
  }, [status]);

  // 执行单次轮询
  // 这是轮询的核心逻辑
  const executePoll = useCallback(async () => {
    // 如果没有taskId或已达到最大尝试次数，则停止轮询
    if (!taskIdRef.current || (maxAttempts > 0 && attempts >= maxAttempts)) {
      // 超出最大尝试次数
      if (status === 'polling' && maxAttempts > 0 && attempts >= maxAttempts) {
        setStatus('timeout');
        setError(new Error('Polling timeout: reached maximum attempts'));
      }
      return;
    }

    try {
      // 增加尝试次数
      setAttempts(prev => prev + 1);
      
      // 获取任务状态
      const response = await fetchFn(taskIdRef.current);
      
      // 检查任务是否完成
      const isComplete = checkCompleteFn(response);
      
      if (isComplete) {
        // 任务完成，提取数据并更新状态
        const extractedData = extractDataFn(response);
        setData(extractedData);
        setStatus('success');
        
        // 停止轮询
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // 任务未完成，继续轮询
        const interval = calculateInterval(attempts);
        timerRef.current = setTimeout(executePoll, interval);
      }
    } catch (err) {
      console.error('Polling error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
      
      // 停止轮询
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [attempts, fetchFn, checkCompleteFn, extractDataFn, calculateInterval, status, maxAttempts]);

  // 开始轮询
  // 外部调用此函数启动轮询过程
  const startPolling = useCallback((taskId: string) => {
    // 重置状态
    setStatus('polling');
    setData(null);
    setError(null);
    setAttempts(0);
    setElapsedTime(0);
    
    // 保存任务ID和开始时间
    taskIdRef.current = taskId;
    startTimeRef.current = Date.now();
    
    // 清除现有定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // 立即开始第一次轮询
    executePoll();
  }, [executePoll]);

  // 停止轮询
  // 用户可以手动取消轮询
  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (status === 'polling') {
      setStatus('idle');
    }
  }, [status]);

  // 重置轮询
  // 完全重置状态，用于重试或清理
  const resetPolling = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setData(null);
    setError(null);
    setAttempts(0);
    setElapsedTime(0);
    taskIdRef.current = null;
    startTimeRef.current = 0;
  }, [stopPolling]);

  // 组件卸载时清理
  // 防止内存泄漏
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 返回轮询结果和控制函数
  return {
    status,
    data,
    error,
    startPolling,
    stopPolling,
    resetPolling,
    attempts,
    elapsedTime
  };
} 