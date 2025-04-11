"use client"

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/tailwind';
import { Sparkles, RefreshCw, AlertCircle, X } from 'lucide-react';

// 任务进度步骤类型
export interface TaskStep {
  id: string;
  label: string;
  completedLabel?: string;
}

// 组件属性类型
export interface TaskStatusProps {
  // 基础状态
  isLoading: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  
  // 进度信息
  progressPercent: number;
  elapsedTime: number;
  
  // 可选进度步骤
  steps?: TaskStep[];
  completedSteps?: string[]; // 已完成步骤的ID数组
  
  // 当前状态信息
  statusMessage?: string;
  
  // 操作回调
  onCancel?: () => void;
  onRetry?: () => void;
  
  // 样式定制
  variant?: 'default' | 'blue' | 'purple' | 'green' | 'amber';
  className?: string;
}

export function TaskStatus({
  isLoading,
  isSuccess = false,
  isError = false,
  errorMessage,
  progressPercent,
  elapsedTime,
  steps = [],
  completedSteps = [],
  statusMessage,
  onCancel,
  onRetry,
  variant = 'default',
  className,
}: TaskStatusProps) {
  // 根据变体选择颜色主题
  const getColorTheme = () => {
    switch(variant) {
      case 'blue':
        return {
          border: 'border-blue-500/20',
          bg: 'bg-blue-950/10',
          text: 'text-blue-400',
          textSecondary: 'text-blue-300',
          bgHover: 'hover:bg-blue-900/30',
          borderBtn: 'border-blue-500/30',
          progressBg: 'bg-blue-950/50',
          progressIndicator: '[&>div]:bg-blue-500'
        };
      case 'purple':
        return {
          border: 'border-purple-500/20',
          bg: 'bg-purple-950/10',
          text: 'text-purple-400',
          textSecondary: 'text-purple-300',
          bgHover: 'hover:bg-purple-900/30',
          borderBtn: 'border-purple-500/30',
          progressBg: 'bg-purple-950/50',
          progressIndicator: '[&>div]:bg-purple-500'
        };
      case 'green':
        return {
          border: 'border-green-500/20',
          bg: 'bg-green-950/10',
          text: 'text-green-400',
          textSecondary: 'text-green-300',
          bgHover: 'hover:bg-green-900/30',
          borderBtn: 'border-green-500/30',
          progressBg: 'bg-green-950/50',
          progressIndicator: '[&>div]:bg-green-500'
        };
      case 'amber':
        return {
          border: 'border-amber-500/20',
          bg: 'bg-amber-950/10',
          text: 'text-amber-400',
          textSecondary: 'text-amber-300',
          bgHover: 'hover:bg-amber-900/30',
          borderBtn: 'border-amber-500/30',
          progressBg: 'bg-amber-950/50',
          progressIndicator: '[&>div]:bg-amber-500'
        };
      default:
        return {
          border: 'border-indigo-500/20',
          bg: 'bg-indigo-950/10',
          text: 'text-indigo-400',
          textSecondary: 'text-indigo-300',
          bgHover: 'hover:bg-indigo-900/30',
          borderBtn: 'border-indigo-500/30',
          progressBg: 'bg-indigo-950/50',
          progressIndicator: '[&>div]:bg-indigo-500'
        };
    }
  };
  
  const colors = getColorTheme();
  
  // 获取合适的状态信息
  const getStatusMessage = () => {
    if (statusMessage) return statusMessage;
    
    if (isSuccess) return "Task completed successfully";
    if (isError) return "Task failed";
    if (isLoading) {
      if (progressPercent < 30) return "Starting process...";
      if (progressPercent < 60) return "Processing...";
      if (progressPercent < 90) return "Almost there...";
      return "Finalizing...";
    }
    
    return "Ready to start";
  };

  // 渲染错误状态
  if (isError) {
    return (
      <div className={cn(
        "p-3 rounded-md bg-red-900/20 border border-red-800/30 text-red-200 flex items-start gap-2",
        className
      )}>
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Task failed</p>
          <p className="text-sm text-red-300 mt-1">{errorMessage || "An unknown error occurred"}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-800/30 hover:bg-red-800/20 text-red-200"
              onClick={onRetry}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // 渲染进度状态
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      colors.border,
      colors.bg,
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={cn("text-sm font-medium", colors.text)}>
          {isSuccess ? "Task Completed" : "Task in Progress"}
        </h3>
        {onCancel && isLoading && (
          <Button
            variant="outline"
            size="sm"
            className={cn("h-6 px-2", colors.text, colors.bgHover, colors.borderBtn)}
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{getStatusMessage()}</span>
          <span>{progressPercent}%</span>
        </div>
        
        <Progress 
          value={progressPercent} 
          className={cn("h-2", colors.progressBg, colors.progressIndicator)}
        />
        
        {steps.length > 0 && (
          <div className="flex justify-between text-xs text-gray-500 pt-1">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              return (
                <span key={step.id} className={isCompleted ? "text-green-400" : ""}>
                  {isCompleted 
                    ? `✓ ${step.completedLabel || step.label}` 
                    : step.label}
                </span>
              );
            })}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Time elapsed: {Math.round(elapsedTime)}s
        </p>
      </div>
    </div>
  );
} 