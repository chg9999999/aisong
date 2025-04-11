import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 用于合并Tailwind CSS类名的工具函数
 * 结合clsx和tailwind-merge功能，确保类名合并时不会产生冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 