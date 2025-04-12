'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth';

/**
 * 受保护路由组件
 * 如果用户未登录，将重定向到登录页面
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 需要保护的内容
 * @param {boolean} props.redirectIfAuthenticated - 如果为true，当用户已登录时重定向到首页（用于登录页等）
 * @param {string} props.redirectTo - 未登录时重定向的路径
 */
export default function ProtectedRoute({
  children,
  redirectIfAuthenticated = false,
  redirectTo = '/auth/login',
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // 等待认证状态加载完成
    if (!loading) {
      // 如果需要认证但未登录，重定向到登录页面
      if (!isAuthenticated && !redirectIfAuthenticated) {
        router.push(redirectTo);
      }
      
      // 如果已登录且路由不允许已登录用户访问，重定向到首页
      if (isAuthenticated && redirectIfAuthenticated) {
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, redirectIfAuthenticated, redirectTo, router]);
  
  // 未登录且路由需要认证时显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  // 如果认证状态已加载，且满足访问条件，显示子组件
  if (!loading && ((isAuthenticated && !redirectIfAuthenticated) || (!isAuthenticated && redirectIfAuthenticated))) {
    return children;
  }
  
  // 默认返回null，防止在重定向过程中闪烁
  return null;
} 