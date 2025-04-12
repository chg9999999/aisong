'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

// 创建认证上下文
const AuthContext = createContext();

/**
 * 认证提供者组件，管理应用程序的认证状态
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化时检查会话并设置监听器
  useEffect(() => {
    async function initAuth() {
      try {
        setLoading(true);
        
        // 获取当前会话
        const { data: { session } } = await supabase.auth.getSession();
        handleSession(session);
        
        // 设置认证状态变化的监听器
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            handleSession(session);
          }
        );
        
        return () => {
          // 清理监听器
          subscription?.unsubscribe();
        };
      } catch (err) {
        console.error('认证初始化错误:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    initAuth();
  }, []);
  
  // 处理会话变化
  const handleSession = async (session) => {
    if (session?.user) {
      setUser(session.user);
      
      // 获取用户资料
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileError || !profileData) {
        // 如果没找到资料，立即创建一个
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            username: session.user.email ? session.user.email.split('@')[0] : `user_${session.user.id.substring(0, 8)}`,
            email: session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url || null
          });
          
        if (!insertError) {
          // 重新获取刚创建的资料
          await fetchProfile(session.user.id);
        }
      } else {
        setProfile(profileData);
      }
    } else {
      setUser(null);
      setProfile(null);
    }
  };
  
  // 获取用户资料
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile(data);
      }
      // 不再需要处理资料不存在的情况，handleSession已经处理
    } catch (err) {
      console.error('获取用户资料错误:', err);
      setError('获取用户资料失败');
    }
  };
  
  // 邮箱密码注册
  const signUp = async (email, password, metadata = {}) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      // 不再手动创建用户资料，依赖handleSession中的自动创建机制
      
      return { data, error: null };
    } catch (err) {
      console.error('注册错误:', err);
      setError(err.message);
      return { data: null, error: err };
    }
  };
  
  // 邮箱密码登录
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('登录错误:', err);
      setError(err.message);
      return { data: null, error: err };
    }
  };
  
  // OAuth登录（如Google）
  const signInWithOAuth = async (provider) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('OAuth登录错误:', err);
      setError(err.message);
      return { data: null, error: err };
    }
  };
  
  // 退出登录
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('退出登录错误:', err);
      setError(err.message);
    }
  };
  
  // 更新用户资料
  const updateProfile = async (updates) => {
    try {
      setError(null);
      if (!user) throw new Error('用户未登录');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('更新资料错误:', err);
      setError(err.message);
      return { data: null, error: err };
    }
  };
  
  // 刷新用户资料
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };
  
  // 重置密码
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('重置密码错误:', err);
      setError(err.message);
      return { data: null, error: err };
    }
  };
  
  // 更新密码
  const updatePassword = async (password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('更新密码错误:', err);
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // 提供给组件树的上下文值
  const value = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle: () => signInWithOAuth('google'),
    signOut,
    updateProfile,
    refreshProfile,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义钩子，方便在组件中使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 