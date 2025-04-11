"use client"

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Music, 
  Sparkles, 
  Settings2, 
  LayoutPanelLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerateMusicParams } from '@/types/api';
import { Badge } from '@/components/ui/badge';

interface MusicGeneratorProps {
  onSubmit: (formData: GenerateMusicParams) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<GenerateMusicParams>;
}

export function MusicGenerator({ onSubmit, isLoading, defaultValues = {} }: MusicGeneratorProps) {
  // Form state
  const [formData, setFormData] = useState<GenerateMusicParams>({
    prompt: defaultValues.prompt || '',
    style: defaultValues.style || '',
    title: defaultValues.title || '',
    customMode: defaultValues.customMode ?? false,
    instrumental: defaultValues.instrumental ?? false,
    model: defaultValues.model || 'V3_5',
    negativeTags: defaultValues.negativeTags || '',
  });

  // Character count tracking
  const [promptChars, setPromptChars] = useState(formData.prompt?.length || 0);
  const [styleChars, setStyleChars] = useState(formData.style?.length || 0);
  const [titleChars, setTitleChars] = useState(formData.title?.length || 0);

  // UI state for the advanced panel toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 处理模式切换
  const handleModeChange = (value: string) => {
    const isCustomMode = value === "custom";
    
    if (isCustomMode) {
      // 切换到高级模式，保留基础数据
      setFormData(prev => ({
        ...prev,
        customMode: true
      }));
    } else {
      // 切换到基础模式，只保留基础模式需要的字段，但内部实际保留其他值
      setFormData(prev => ({
        ...prev,
        customMode: false
      }));
    }
  };

  // Handle form changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Update character counts
    if (name === 'prompt') setPromptChars(value.length);
    if (name === 'style') setStyleChars(value.length);
    if (name === 'title') setTitleChars(value.length);
  };

  // Handle toggle changes
  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Quick select helpers
  const addToPrompt = (text: string) => {
    const newPrompt = formData.prompt ? `${formData.prompt}, ${text}` : text;
    setFormData((prev) => ({ ...prev, prompt: newPrompt }));
    setPromptChars(newPrompt.length);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 强制检查当前选中的Tab值，而不是依赖formData中的customMode
      const currentTab = document.querySelector('[data-state="active"][data-radix-collection-item]')?.getAttribute('value');
      const isCustomMode = currentTab === 'custom';
      
      console.log('当前激活的Tab:', currentTab, '是高级模式:', isCustomMode);
      
      // 根据当前模式准备不同的提交参数
      let submissionData: GenerateMusicParams;
      
      if (!isCustomMode) {
        // 基础模式 - 只提交需要的参数，强制设置customMode为false
        submissionData = {
          prompt: formData.prompt,
          instrumental: formData.instrumental,
          model: formData.model,
          customMode: false
        };
      } else {
        // 高级模式 - 提交完整参数
        submissionData = {
          ...formData,
          customMode: true
        };
      }
      
      console.log('准备提交的参数:', submissionData);
      
      // 调用提交函数
      await onSubmit(submissionData);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to generate music. Please try again.");
    }
  };

  // Style categories for quick selection
  const musicStyles = [
    "Classical", "Rock", "Pop", "Electronic", 
    "Jazz", "Hip-Hop", "Folk", "Country"
  ];

  const moodOptions = [
    "Happy", "Calm", "Epic", "Sad"
  ];

  const instrumentOptions = [
    "Piano", "Guitar", "Orchestra", "Synth"
  ];

  // Max character limits
  const LIMITS = {
    standardPrompt: 400,
    customPrompt: 3000,
    style: 200,
    title: 80
  };

  return (
    <Card className="rounded-xl border-none bg-transparent w-full">
      <CardHeader className="pb-1 pt-3 px-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-bold text-indigo-400">Create Your Music</CardTitle>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="standard" 
            onValueChange={(value: string) => handleModeChange(value)}>
        <div className="px-4 pb-1">
          <TabsList className="w-full grid grid-cols-2 p-1 mb-1 bg-[#1c1942]">
            <TabsTrigger value="standard" className="text-sm data-[state=active]:bg-indigo-600">Basic</TabsTrigger>
            <TabsTrigger value="custom" className="text-sm data-[state=active]:bg-indigo-600">Advanced</TabsTrigger>
          </TabsList>
        </div>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="standard" className="pt-0">
            <CardContent className="space-y-3 px-4 py-2">
              {/* 描述标签 */}
              <div className="space-y-1">
                <Label htmlFor="prompt" className="text-sm text-gray-400 required flex justify-between">
                  <div className="flex items-center gap-2">
                    <span>Describe the music you want to create</span>
                  </div>
                  <span className={`text-xs ${promptChars > LIMITS.standardPrompt ? 'text-red-500' : 'text-gray-500'}`}>
                    {promptChars}/{LIMITS.standardPrompt}
                  </span>
                </Label>
              
              {/* 主输入区 */}
              <Textarea 
                id="prompt"
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                placeholder="E.g., 'A relaxing piano melody with soft strings in the background'"
                className="min-h-[100px] border-indigo-500/30 bg-transparent text-gray-200 focus:border-indigo-500"
                maxLength={LIMITS.standardPrompt}
              />
              </div>
              
              {/* 人声/纯音乐切换 */}
              <div className="space-y-1">
                <Label htmlFor="std-instrumental" className="text-sm text-gray-400 flex items-center justify-between">
                  Instrumental Only (No Vocals)
                  <Switch
                    id="std-instrumental"
                    checked={formData.instrumental}
                    onCheckedChange={(checked) => handleToggleChange('instrumental', checked)}
                    className="data-[state=checked]:bg-indigo-600"
                  />
                </Label>
              </div>
              
              {/* 标准模式的提交按钮 */}
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-md"
                disabled={isLoading || (!formData.prompt || formData.prompt.trim().length === 0)}
              >
                {isLoading ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Music
                  </>
                )}
              </Button>
            </CardContent>
          </TabsContent>

          <TabsContent value="custom" className="pt-0">
            <CardContent className="pt-2 pb-2 px-4 space-y-3">
              {/* 标题和模型选择 */}
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="title" className="text-sm text-gray-400 required flex items-center gap-2">
                    Track Title
                    <span className="ml-auto text-xs text-gray-500">
                      {titleChars}/{LIMITS.title}
                    </span>
                  </Label>
                  <Input 
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a title for your music"
                    className="border-indigo-500/30 bg-transparent text-gray-200 focus:border-indigo-500"
                    maxLength={LIMITS.title}
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="custom-model" className="text-sm text-gray-400 flex items-center gap-2">
                    AI Model
                  </Label>
                  <Select
                    value={formData.model as "V3_5" | "V4"}
                    onValueChange={(value: "V3_5" | "V4") => setFormData(prev => ({...prev, model: value}))}
                  >
                    <SelectTrigger 
                      id="custom-model" 
                      className="w-[100px] border-indigo-500/30 bg-transparent text-gray-200"
                    >
                      <SelectValue placeholder="V3.5" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15132b] border-indigo-500/30">
                      <SelectItem value="V3_5">V3.5</SelectItem>
                      <SelectItem value="V4">V4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 整合的音乐风格输入框 */}
              <div className="space-y-1">
                <Label htmlFor="style" className="text-sm text-gray-400 required flex items-center gap-2">
                  Music Style
                  <span className="ml-auto text-xs text-gray-500">
                    {styleChars}/{LIMITS.style}
                  </span>
                </Label>
                <div>
                  <Textarea 
                    id="style"
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    placeholder="Enter music style, mood, vocal type, instruments separated by commas.&#10;E.g. Classical, Happy, Female vocals, Piano, Violin"
                    className="border-indigo-500/30 bg-transparent text-gray-200 focus:border-indigo-500 min-h-[80px]"
                    maxLength={LIMITS.style}
                    required
                  />
                  
                  {/* 标签选择区域 - 默认收起 */}
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-xs border-indigo-500/30 bg-transparent hover:bg-indigo-900/20 text-gray-300 w-full flex justify-between items-center"
                    >
                      <span>Quick Style Tags</span>
                      <span>{showAdvanced ? "▲" : "▼"}</span>
                    </Button>
                    
                    {showAdvanced && (
                      <div className="mt-2 space-y-2">
                        {/* 音乐风格 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Music Styles</Label>
                          <div className="flex flex-wrap gap-1">
                            {["Classical", "Rock", "Pop", "Electronic", "Jazz", "Hip-Hop", "Folk"].map(tag => (
                              <Button
                                key={tag}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newStyle = formData.style ? `${formData.style}, ${tag}` : tag;
                                  setFormData(prev => ({...prev, style: newStyle}));
                                  setStyleChars(newStyle.length);
                                }}
                                className="border-indigo-500/30 bg-transparent hover:bg-indigo-900/20 text-gray-300 text-xs h-7 px-2"
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* 情绪 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Mood</Label>
                          <div className="flex flex-wrap gap-1">
                            {["Happy", "Sad", "Epic", "Intense", "Melancholic"].map(tag => (
                              <Button
                                key={tag}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newStyle = formData.style ? `${formData.style}, ${tag}` : tag;
                                  setFormData(prev => ({...prev, style: newStyle}));
                                  setStyleChars(newStyle.length);
                                }}
                                className="border-indigo-500/30 bg-transparent hover:bg-indigo-900/20 text-gray-300 text-xs h-7 px-2"
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* 声音类型 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Vocals</Label>
                          <div className="flex flex-wrap gap-1">
                            {["Female vocals", "Male vocals", "Choir"].map(tag => (
                              <Button
                                key={tag}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newStyle = formData.style ? `${formData.style}, ${tag}` : tag;
                                  setFormData(prev => ({...prev, style: newStyle}));
                                  setStyleChars(newStyle.length);
                                }}
                                className="border-indigo-500/30 bg-transparent hover:bg-indigo-900/20 text-gray-300 text-xs h-7 px-2"
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* 乐器 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Instruments</Label>
                          <div className="flex flex-wrap gap-1">
                            {["Piano", "Guitar", "Drums", "Violin", "Synth"].map(tag => (
                              <Button
                                key={tag}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newStyle = formData.style ? `${formData.style}, ${tag}` : tag;
                                  setFormData(prev => ({...prev, style: newStyle}));
                                  setStyleChars(newStyle.length);
                                }}
                                className="border-indigo-500/30 bg-transparent hover:bg-indigo-900/20 text-gray-300 text-xs h-7 px-2"
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 歌词/描述 */}
              {!formData.instrumental && (
                <div className="space-y-1">
                  <Label htmlFor="custom-prompt" className="text-sm text-gray-400 required flex items-center gap-2">
                    Lyrics/Description
                    <span className={`ml-auto text-xs ${promptChars > LIMITS.customPrompt ? 'text-red-500' : 'text-gray-500'}`}>
                      {promptChars}/{LIMITS.customPrompt}
                    </span>
                  </Label>
                  <Textarea 
                    id="custom-prompt"
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    placeholder="Enter lyrics or detailed music description"
                    className="min-h-[150px] border-indigo-500/30 bg-transparent text-gray-200 focus:border-indigo-500"
                    maxLength={LIMITS.customPrompt}
                    required={!formData.instrumental}
                  />
                </div>
              )}

              {/* 底部控制区域 */}
              <div className="flex flex-col gap-2">
                {/* Instrumental开关 */}
                <div className="space-y-2">
                  <Label htmlFor="custom-instrumental" className="text-sm text-gray-400 flex items-center justify-between">
                    Instrumental Only (No Vocals)
                    <Switch
                      id="custom-instrumental"
                      checked={formData.instrumental}
                      onCheckedChange={(checked) => handleToggleChange('instrumental', checked)}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </Label>
                </div>

                {/* 简化的高级选项 - 直接显示，不使用折叠面板 */}
                <div className="space-y-2">
                  <Label htmlFor="negativeTags" className="text-sm text-gray-400 flex items-center gap-2">
                    Negative Tags (Optional)
                  </Label>
                  <Input 
                    id="negativeTags"
                    name="negativeTags"
                    value={formData.negativeTags}
                    onChange={handleInputChange}
                    placeholder="Elements to avoid, e.g. drums, distortion, noise"
                    className="border-indigo-500/30 bg-transparent text-gray-200 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-md mt-2"
                disabled={isLoading || 
                  (formData.instrumental 
                    ? (!formData.title || !formData.style) // 纯音乐模式只需要标题和风格
                    : (!formData.prompt || !formData.title || !formData.style)) // 带歌词模式需要提示词、标题和风格
                }
              >
                {isLoading ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Music
                  </>
                )}
              </Button>
            </CardContent>
          </TabsContent>

          <CardFooter className="pt-1 px-4 pb-3">
            {/* 只在自定义模式显示底部按钮 - 移除重复按钮 */}
          </CardFooter>
        </form>
      </Tabs>
    </Card>
  );
}

