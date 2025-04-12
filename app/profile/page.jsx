'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  // 将整个页面包装在ProtectedRoute中
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, profile, updateProfile, refreshProfile, signOut } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // 当配置文件数据加载时更新表单
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);
  
  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理退出登录
  const handleSignOut = async () => {
    await signOut();
  };
  
  // 显示加载状态
  if (!profile) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-3/4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        
        <CardContent>
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
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <Input
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{user?.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Username</h3>
                <p className="mt-1">{profile.username || 'Not set'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1">{profile.full_name || 'Not set'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                <p className="mt-1">{profile.bio || 'Not set'}</p>
              </div>
              
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <div>
            <p className="text-sm text-gray-500">
              Last login: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 