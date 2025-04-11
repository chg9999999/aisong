// utils/state.ts
// 状态管理工具函数

// 任务轮询状态管理
export class PollingManager {
  private intervalId: NodeJS.Timeout | null = null;
  private pollFunction: () => Promise<boolean>;
  private interval: number;
  private maxAttempts: number;
  private attempts: number = 0;
  
  constructor(
    pollFunction: () => Promise<boolean>,
    interval: number = 3000,
    maxAttempts: number = 60
  ) {
    this.pollFunction = pollFunction;
    this.interval = interval;
    this.maxAttempts = maxAttempts;
  }
  
  // 开始轮询
  start(): void {
    if (this.intervalId) return;
    
    this.attempts = 0;
    this.poll();
  }
  
  // 停止轮询
  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // 执行轮询
  private async poll(): Promise<void> {
    if (this.attempts >= this.maxAttempts) {
      this.stop();
      return;
    }
    
    try {
      const shouldStop = await this.pollFunction();
      this.attempts++;
      
      if (shouldStop) {
        this.stop();
      } else {
        this.intervalId = setTimeout(() => this.poll(), this.interval);
      }
    } catch (error) {
      console.error('轮询执行错误:', error);
      this.intervalId = setTimeout(() => this.poll(), this.interval);
    }
  }
  
  // 重置轮询
  reset(): void {
    this.stop();
    this.attempts = 0;
  }
  
  // 使用渐进式间隔（随着尝试次数增加，间隔也增加）
  useProgressiveInterval(
    baseInterval: number = 3000,
    maxInterval: number = 30000
  ): void {
    const calculateInterval = (attempt: number) => {
      // 随着尝试次数增加，间隔指数增长，但不超过最大间隔
      return Math.min(baseInterval * Math.pow(1.5, Math.floor(attempt / 5)), maxInterval);
    };
    
    const originalPoll = this.poll.bind(this);
    
    this.poll = async () => {
      if (this.attempts >= this.maxAttempts) {
        this.stop();
        return;
      }
      
      try {
        const shouldStop = await this.pollFunction();
        this.attempts++;
        
        if (shouldStop) {
          this.stop();
        } else {
          const dynamicInterval = calculateInterval(this.attempts);
          this.intervalId = setTimeout(() => this.poll(), dynamicInterval);
        }
      } catch (error) {
        console.error('轮询执行错误:', error);
        const dynamicInterval = calculateInterval(this.attempts);
        this.intervalId = setTimeout(() => this.poll(), dynamicInterval);
      }
    };
  }
}

// 任务队列状态管理
export class TaskQueue {
  private queue: Array<() => Promise<any>> = [];
  private running: boolean = false;
  private concurrentTasks: number;
  private activeCount: number = 0;
  
  constructor(concurrentTasks: number = 1) {
    this.concurrentTasks = concurrentTasks;
  }
  
  // 添加任务
  add(task: () => Promise<any>): void {
    this.queue.push(task);
    this.processQueue();
  }
  
  // 清空队列
  clear(): void {
    this.queue = [];
  }
  
  // 是否有任务在运行
  isRunning(): boolean {
    return this.running;
  }
  
  // 获取队列长度
  size(): number {
    return this.queue.length;
  }
  
  // 处理队列
  private async processQueue(): Promise<void> {
    if (this.running || this.queue.length === 0 || this.activeCount >= this.concurrentTasks) {
      return;
    }
    
    this.running = true;
    
    while (this.queue.length > 0 && this.activeCount < this.concurrentTasks) {
      const task = this.queue.shift();
      if (!task) continue;
      
      this.activeCount++;
      
      try {
        await task();
      } catch (error) {
        console.error('任务执行错误:', error);
      } finally {
        this.activeCount--;
      }
    }
    
    this.running = this.activeCount > 0;
    
    // 如果还有任务且有空闲槽位，继续处理
    if (this.queue.length > 0 && this.activeCount < this.concurrentTasks) {
      this.processQueue();
    }
  }
}

// 状态订阅管理
export class StateObserver<T> {
  private state: T;
  private listeners: Array<(state: T) => void> = [];
  
  constructor(initialState: T) {
    this.state = initialState;
  }
  
  // 获取当前状态
  getState(): T {
    return this.state;
  }
  
  // 更新状态
  setState(newState: Partial<T>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }
  
  // 订阅状态变化
  subscribe(listener: (state: T) => void): () => void {
    this.listeners.push(listener);
    
    // 返回取消订阅的函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('状态监听器执行错误:', error);
      }
    });
  }
} 