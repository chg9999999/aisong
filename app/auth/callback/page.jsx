'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * 认证回调页面
 * 处理从OAuth提供者的重定向
 */
export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // 处理认证回调
    const handleAuthCallback = async () => {
      // 获取URL中的认证代码
      const code = searchParams.get('code');
      
      if (code) {
        try {
          // 交换认证代码获取会话
          await supabase.auth.exchangeCodeForSession(code);
          console.log('认证成功，重定向到首页');
          
          // 重定向到首页或之前的页面
          router.push('/');
        } catch (error) {
          console.error('处理认证回调时出错:', error);
          router.push('/auth/login?error=callback_error');
        }
      } else {
        // 没有code参数，可能是直接访问
        router.push('/auth/login');
      }
    };
    
    handleAuthCallback();
  }, [router, searchParams]);
  
  // 显示加载状态
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Processing login...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
} 