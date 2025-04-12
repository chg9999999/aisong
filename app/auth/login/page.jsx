'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('login');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();
  
  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
    
    // 检查URL参数中的错误信息
    const error = searchParams.get('error');
    if (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }, [isAuthenticated, router, searchParams]);
  
  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    
    try {
      if (activeTab === 'login') {
        // 登录处理
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        // 注册处理
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        const { error } = await signUp(email, password);
        if (error) throw error;
        
        // 注册后显示确认消息
        setSuccessMessage('Registration successful! Please check your email to confirm your account.');
        setActiveTab('login');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理Google登录
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };
  
  // 获取错误信息
  const getErrorMessage = (code) => {
    const errorMessages = {
      'callback_error': 'Authentication failed. Please try again.',
      'invalid_credentials': 'Invalid email or password',
      'email_taken': 'This email is already registered',
    };
    
    return errorMessages[code] || 'An error occurred. Please try again.';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to AI Music Generator
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to create amazing AI-powered music
          </p>
        </div>
        
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            {successMessage && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link href="/auth/reset-password" className="text-blue-600 hover:text-blue-500">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
                
                <p className="text-xs text-gray-500 mt-2">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </TabsContent>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5.22,16.25 5.22,12.27C5.22,8.29 8.36,5.27 12.19,5.27C15.68,5.27 17.16,7.13 17.16,7.13L19.07,5.1C19.07,5.1 16.83,2.57 12.18,2.57C6.95,2.57 2.85,7.07 2.85,12.27C2.85,17.47 6.95,22 12.18,22C17.29,22 21.35,18.19 21.35,12.91C21.35,11.76 21.35,11.1 21.35,11.1Z" fill="#4285F4"></path>
                    </g>
                  </svg>
                  Google
                </Button>
              </div>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 