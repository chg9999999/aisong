"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Play,
  Download,
  Heart,
  Share2,
  MoreVertical,
  ShuffleIcon as Random,
  X,
  Music,
  AudioWaveformIcon as Waveform,
  Mic,
  Scissors,
  Pause,
  Copy,
  RefreshCcw,
  AlertCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import BackgroundAnimation from "@/components/background-animation"
import FloatingPlayer, { type MusicTrack } from "@/components/floating-player"
import { useMusicGenerationPolling } from "@/hooks/business/useMusicGenerationPolling"
import { AudioData, GenerateMusicParams } from "@/types/api"
import { formatTime } from "@/utils/format"
import { supabase } from '@/lib/supabase'
import { Progress } from "@/components/ui/progress"
import { MusicGenerator } from "@/components/music-generator"

export default function TextToMusicPage() {
  // 音乐生成参数
  const [prompt, setPrompt] = useState("")
  const [title, setTitle] = useState("")
  const [style, setStyle] = useState("")
  const [customMode, setCustomMode] = useState(true)
  const [instrumental, setInstrumental] = useState(false)
  const [model, setModel] = useState<"V3_5" | "V4">("V3_5")
  const [negativeTags, setNegativeTags] = useState("")

  // UI状态
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [generatedMusic, setGeneratedMusic] = useState<AudioData[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  
  // 使用新的音乐生成轮询Hook
  const { 
    status, 
    data: generatedMusicData, 
    error,
    generateMusic: startGenerateMusic,
    retry,
    resetPolling,
    isLoading,
    isSuccess,
    isError,
    textGenerated,
    firstAudioGenerated,
    elapsedTime,
    attempts
  } = useMusicGenerationPolling();
  
  // 创建一个useRef来保存音频播放器实例和状态
  const audioStateRef = useRef({
    isPlaying: false,
    currentTrack: null as MusicTrack | null,
    audioElement: null as HTMLAudioElement | null
  });
  
  // 格式化生成状态消息
  const getStatusMessage = () => {
    switch(status) {
      case 'idle': return '准备生成';
      case 'polling': return '正在生成音乐...';
      case 'success': return '生成成功';
      case 'error': return `生成失败: ${error?.message || '未知错误'}`;
      case 'timeout': return '生成超时，请重试';
      default: return '准备生成';
    }
  }

  // 当前选中的歌曲
  const selectedSong = generatedMusic && generatedMusic.length > 0 && selectedIndex < generatedMusic.length 
    ? generatedMusic[selectedIndex] 
    : null

  // 修改歌词提取函数，使其基于歌曲自身的属性而不是UI状态
  const extractLyrics = (song: AudioData | null) => {
    if (!song) return "No lyrics available";
    
    // 如果歌曲本身是纯音乐，或者没有提供歌词，显示为纯音乐
    if (song.instrumental || !song.prompt || song.prompt.trim() === "") {
      return "Instrumental track - no lyrics available";
    }
    
    // 否则返回歌曲的歌词
    return song.prompt;
  }
  
  // 创建一个MusicTrack对象的函数，处理类型转换
  const createMusicTrack = (song: AudioData): MusicTrack => {
    return {
      id: song.id,
      title: song.title || "Untitled",
      // 同时支持驼峰命名和下划线命名的字段名
      audioUrl: song.audioUrl || song.audio_url || song.source_audio_url || "",
      cover: song.imageUrl || song.image_url || song.source_image_url || "/placeholder.svg",
      artist: "AI Composer",
      // 将duration转换为字符串类型
      duration: typeof song.duration === 'number' ? formatTime(song.duration) : (song.duration || "0:00")
    };
  };
  
  // 修改初始化useEffect
  useEffect(() => {
    // 页面加载时加载历史任务数据
    const loadHistoryTasks = async () => {
      try {
        // 获取任务列表
        const response = await fetch('/api/generate/last-task-id');
        const data = await response.json();
        
        if (data.success) {
          // 如果有成功的任务，加载所有成功任务的数据
          if (data.successTasks && data.successTasks.length > 0) {
            const allMusic: AudioData[] = [];
            
            // 获取每个成功任务的详情并合并
            for (const task of data.successTasks) {
              try {
                const taskResponse = await fetch(`/api/generate/record-info?taskId=${task.taskId}`);
                const taskData = await taskResponse.json(); // 修复这里使用错误的response变量
                
                if (taskData.code === 200 && taskData.data && 
                    taskData.data.status === 'SUCCESS' && 
                    taskData.data.response && 
                    taskData.data.response.sunoData && 
                    taskData.data.response.sunoData.length > 0) {
                  
                  // 添加到音乐列表
                  allMusic.push(...taskData.data.response.sunoData);
                }
              } catch (err) {
                console.error(`加载任务 ${task.taskId} 失败:`, err);
              }
            }
            
            if (allMusic.length > 0) {
              // 更新状态
              setGeneratedMusic(allMusic);
              console.log(`已加载${allMusic.length}首历史音乐`);
            }
          }
        }
      } catch (error) {
        console.error('加载历史数据失败:', error);
      }
    };

    // 加载音乐数据
    const loadMusicData = async () => {
      try {
        console.log('尝试从/api/music加载音乐数据...');
        // 使用新的API端点
        const response = await fetch('/api/music?page=1&limit=50');
        const data = await response.json();
        
        console.log('从/api/music获取的数据:', data);
        
        if (data.success && data.items && data.items.length > 0) {
          setGeneratedMusic(data.items);
          console.log(`已加载${data.items.length}首音乐`);
        } else {
          console.log('没有找到音乐数据，尝试使用历史任务加载');
          // 如果新API没有数据，尝试使用旧方法
          loadHistoryTasks();
        }
      } catch (error) {
        console.error('加载音乐数据失败:', error);
        // 如果新API失败，尝试使用旧方法
        loadHistoryTasks();
      }
    };
    
    // 如果没有生成数据，加载历史数据
    if (generatedMusic.length === 0 && !generatedMusicData) {
      loadMusicData();
    }
    
    if (generatedMusicData && generatedMusicData.length > 0) {
      // 更新生成的音乐列表 - 保留历史数据，将新数据添加到前面
      setGeneratedMusic(prevMusic => {
        // 防止重复添加相同的歌曲
        const newMusicIds = new Set(generatedMusicData.map(item => item.id));
        const filteredPrevMusic = prevMusic.filter(item => !newMusicIds.has(item.id));
        
        // 为新生成的音乐添加instrumental属性（基于生成时的选项）
        const newMusicWithInstrumental = generatedMusicData.map(item => ({
          ...item,
          instrumental: instrumental
        }));
        
        // 新歌曲放在前面
        return [...newMusicWithInstrumental, ...filteredPrevMusic];
      });
      
      // 如果生成成功，播放第一首歌
      if (status === 'success' && generatedMusicData.length > 0) {
        const firstSong = generatedMusicData[0];
        if (firstSong) {
          const track = createMusicTrack(firstSong);
          
          // 设置当前曲目并开始播放
          setCurrentTrack(track);
          setIsPlaying(true);
        }
      }
    }
  }, [generatedMusicData, status, instrumental]); // 添加instrumental作为依赖
  
  // 确保解决ID比较问题的函数
  const isSameId = (id1: string | number | undefined, id2: string | number | undefined): boolean => {
    if (id1 === undefined || id2 === undefined) return false;
    return String(id1) === String(id2);
  };

  // 修改取消任务函数
  const handleCancelGeneration = () => {
    resetPolling();
    toast({ 
      title: "Task cancelled", 
      description: "The music generation task has been cancelled.",
    });
    setIsPlaying(false);
  };

  // 修改音乐生成处理函数
  const handleGenerateMusic = async (params: GenerateMusicParams) => {
    try {
      // 显示开始生成的提示
      toast({
        title: "开始生成",
        description: "正在创建音乐生成任务...",
      });

      // 更新状态以保持UI同步
      setPrompt(params.prompt || "");
      setTitle(params.title || "");
      setStyle(params.style || "");
      setCustomMode(params.customMode || false);
      setInstrumental(params.instrumental || false);
      setModel(params.model as "V3_5" | "V4" || "V3_5");
      setNegativeTags(params.negativeTags || "");

      // 使用新的生成方法
      await startGenerateMusic(params);
      
    } catch (error) {
      console.error("音乐生成失败:", error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 播放/暂停切换函数
  const handlePlayPauseToggle = useCallback(() => {
    setIsPlaying(prevIsPlaying => {
      const newIsPlaying = !prevIsPlaying;
      
      // 同时更新引用中的状态
      if (audioStateRef.current) {
        audioStateRef.current.isPlaying = newIsPlaying;
      }
      
      return newIsPlaying;
    });
  }, []);

  // 修改播放/暂停音轨函数
  const handlePlayTrack = useCallback((song: AudioData) => {
    // 如果点击的是当前正在播放的歌曲，则切换播放/暂停状态
    if (audioStateRef.current.currentTrack && isSameId(audioStateRef.current.currentTrack.id, song.id)) {
      handlePlayPauseToggle();
      return;
    }

    // 添加调试日志，查看音频数据
    console.log('音频数据详情:', {
      id: song.id,
      title: song.title,
      // 驼峰命名字段
      audioUrl: song.audioUrl,
      sourceAudioUrl: song.sourceAudioUrl,
      // 下划线命名字段
      audio_url: song.audio_url,
      source_audio_url: song.source_audio_url,
    });

    // 创建音轨对象，优先使用驼峰命名字段（API返回的真实URL）
    const track: MusicTrack = {
      id: song.id,
      title: song.title,
      artist: "AI Composer",
      cover: song.imageUrl || song.sourceImageUrl || song.image_url || song.source_image_url || "/placeholder.svg",
      duration: formatTime(song.duration || 0),
      audioUrl: song.audioUrl || song.sourceAudioUrl || song.audio_url || song.source_audio_url || "",
      streamUrl: song.streamAudioUrl || song.sourceStreamAudioUrl || song.stream_audio_url || song.source_stream_audio_url || "",
    }
    
    console.log('创建的音轨对象:', {
      id: track.id,
      title: track.title,
      audioUrl: track.audioUrl,
      streamUrl: track.streamUrl,
    });
    
    // 更新引用状态
    audioStateRef.current.currentTrack = track;
    audioStateRef.current.isPlaying = true;
    
    // 更新UI状态
    setCurrentTrack(track);
    setIsPlaying(true);
  }, [handlePlayPauseToggle, isSameId]);

  // 修改关闭播放器函数
  const handleClosePlayer = useCallback(() => {
    // 更新引用状态
    audioStateRef.current.currentTrack = null;
    audioStateRef.current.isPlaying = false;
    
    // 更新UI状态
    setCurrentTrack(null);
    setIsPlaying(false);
  }, []);

  // 选择歌曲
  const handleSelectSong = useCallback((song: AudioData, index: number) => {
    setSelectedIndex(index);
    handlePlayTrack(song);
  }, [handlePlayTrack]);

  // 切换收藏状态
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // 将来可以使用Supabase保存收藏状态
  }

  // 下载功能
  const handleDownload = (song: AudioData) => {
    const url = song.audio_url || song.source_audio_url
    if (!url) {
      toast({ title: "下载失败", description: "音频URL不可用", variant: "destructive" })
      return
    }
    
    // 创建一个不可见的a标签来触发下载
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `${song.title || "AI-Music"}.mp3`
    document.body.appendChild(a)
    a.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast({ title: "下载开始", description: `正在下载: ${song.title || "AI-Music"}` })
  }
  
  // 分享功能
  const handleShare = () => {
    if (navigator.share && selectedSong) {
      navigator.share({
        title: selectedSong.title || "AI Generated Music",
        text: "Check out this AI-generated music!",
        // url: window.location.href,
      }).catch(err => {
        console.error("分享失败:", err)
      })
    } else {
      toast({ title: "分享功能", description: "此浏览器不支持分享API或没有选择音乐" })
    }
  }
  
  // 复制歌词
  const handleCopyLyrics = () => {
    if (!selectedSong) return
    
    const lyrics = extractLyrics(selectedSong)
    navigator.clipboard.writeText(lyrics).then(() => {
      toast({ title: "已复制歌词到剪贴板" })
    }).catch(err => {
      console.error("复制失败:", err)
      toast({ title: "复制失败", variant: "destructive" })
    })
  }

  // 自定义音乐生成进度组件
  const MusicGenerationProgress = () => {
    // 计算进度百分比
    const progressPercent = 
      isSuccess ? 100 : 
      !isLoading ? 0 :
      textGenerated ? (firstAudioGenerated ? 90 : 60) : 30;
    
    return (
      <div className="mb-4 p-3 rounded-lg border border-blue-500/20 bg-blue-950/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-blue-400">Music Generation in Progress</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-blue-400 hover:text-blue-300 bg-blue-950/20 hover:bg-blue-900/30 border-blue-500/30"
            onClick={resetPolling}
          >
            Cancel
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{status === 'polling' ? 'Generating music...' : status}</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span className={textGenerated ? "text-green-400" : ""}>
              {textGenerated ? "✓ Text Generated" : "Generating Text..."}
            </span>
            <span className={firstAudioGenerated ? "text-green-400" : ""}>
              {firstAudioGenerated ? "✓ First Track" : (textGenerated ? "Generating Audio..." : "")}
            </span>
            <span className={isSuccess ? "text-green-400" : ""}>
              {isSuccess ? "✓ Completed" : "Completing..."}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Time elapsed: {Math.round(elapsedTime)}s</p>
        </div>
        
        {isError && error && (
          <div className="mt-3 p-2 rounded-md bg-red-900/20 border border-red-800/30 text-red-200 flex items-start gap-2 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Generation failed</p>
              <p className="text-red-300 mt-1">{error.message || "Unknown error"}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retry}
                className="mt-2 border-red-800/30 hover:bg-red-800/20 text-red-200 h-7 text-xs"
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-gray-200 relative">
      <BackgroundAnimation />
      <Header />

      {/* 主内容区域 - 固定标题和三栏布局 */}
      <div className="flex flex-col flex-grow pt-16 pb-14 relative z-10 min-h-screen">
        {/* 三栏布局容器 - 设置固定高度并允许各栏独立滚动 */}
        <div className="container mx-auto px-4 md:px-6 py-4 flex-grow flex max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)] min-h-[600px] w-full">
            {/* 左侧栏 - 使用MusicGenerator组件 */}
            <div className="lg:col-span-3 h-full overflow-hidden">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full overflow-y-auto">
                {isLoading && <MusicGenerationProgress />}
                
                <MusicGenerator
                  onSubmit={handleGenerateMusic}
                  isLoading={isLoading}
                  defaultValues={{
                    prompt,
                    style,
                    title,
                    customMode,
                    instrumental,
                    model,
                    negativeTags
                  }}
                />
              </div>
            </div>

            {/* 中间栏 - 音乐播放器和歌词 */}
            <div className="lg:col-span-6 h-full overflow-hidden">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full flex flex-col overflow-hidden">
                {/* 歌曲信息 - 固定在顶部 */}
                <div className="flex flex-col mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-200">Playing Now</h2>
                    {selectedSong && <span className="text-xs text-gray-400">{formatTime(selectedSong.duration || 0)}</span>}
                  </div>
                  
                  {/* 歌曲信息布局 */}
                  {selectedSong ? (
                    <>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedSong.imageUrl || selectedSong.sourceImageUrl || selectedSong.image_url || selectedSong.source_image_url || "/placeholder.svg"}
                        alt={selectedSong.title || "AI Music"}
                        fill
                        className="object-cover"
                      />
                      {/* 播放/暂停覆盖层 */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full border-white/50 bg-black/50 text-white hover:bg-black/70"
                            onClick={() => handlePlayTrack(selectedSong)}
                          >
                              {isPlaying && isSameId(currentTrack?.id, selectedSong.id) ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                    </div>
                    <div>
                          <h2 className="text-xl font-bold text-white">{selectedSong.title || "Untitled"}</h2>
                          <p className="text-gray-400">AI Composer • {selectedSong.model_name || selectedSong.modelName || "AI Model"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                        {selectedSong.tags && selectedSong.tags.split(',').map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-black/40 border-purple-500/30 text-gray-300 text-xs"
                      >
                            {tag.trim()}
                      </Badge>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex space-x-2 mb-4 border-t border-purple-500/10 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                      onClick={() => handlePlayTrack(selectedSong)}
                    >
                          {isPlaying && isSameId(currentTrack?.id, selectedSong.id) ? (
                        <Pause className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1" />
                      )}
                          {isPlaying && isSameId(currentTrack?.id, selectedSong.id) ? "Pause" : "Play"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className={`border-purple-500/30 bg-black/40 hover:bg-purple-900/20 ${isFavorite ? "text-red-400" : "text-gray-400 hover:text-white"}`}
                      onClick={toggleFavorite}
                    >
                      <Heart className="h-3.5 w-3.5 mr-1" fill={isFavorite ? "#f87171" : "none"} />
                      {isFavorite ? "Favorite" : "Like"}
                    </Button>

                    <div className="flex-grow"></div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                          onClick={handleCopyLyrics}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                          onClick={() => handleDownload(selectedSong)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                          <Music className="h-4 w-4 text-gray-400" />
                              <span>Add to Playlist</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                          <Waveform className="h-4 w-4 text-gray-400" />
                              <span>Reuse Prompt</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                          <Mic className="h-4 w-4 text-gray-400" />
                              <span>Vocal Removal</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                          <Scissors className="h-4 w-4 text-gray-400" />
                              <span>Get WAV Format</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 border border-dashed border-purple-500/30 rounded-lg bg-black/20">
                      <Music className="h-10 w-10 text-purple-500/50 mb-2" />
                      <p className="text-gray-400">No music selected</p>
                      <p className="text-xs text-gray-500">Generate or select a track to play</p>
                    </div>
                  )}
                </div>

                {/* 歌词显示 - 可滚动 */}
                <div className="flex-grow overflow-y-auto rounded-lg border border-purple-500/10 bg-black/20 p-4">
                  {selectedSong ? (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-400">Lyrics</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                          onClick={handleCopyLyrics}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed flex-grow">
                        {extractLyrics(selectedSong)}
                  </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Music className="h-8 w-8 text-purple-500/50 mb-2" />
                      <p className="text-gray-400">No lyrics available</p>
                      <p className="text-xs text-gray-500">Select a track to view lyrics</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧栏 - 历史记录 */}
            <div className="lg:col-span-3 h-full overflow-hidden">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-200">Generated Songs</h2>
                  <span className="text-xs text-gray-400">{generatedMusic?.length || 0} tracks</span>
                </div>

                {status === 'error' && (
                  <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-200">
                      {error?.message || "An error occurred during generation"}
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <Waveform className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-200">
                      {getStatusMessage()}
                    </p>
                  </div>
                )}

                {/* 歌曲列表 - 可滚动 */}
                <div className="flex-grow overflow-y-auto">
                  {generatedMusic && generatedMusic.length > 0 ? (
                  <div className="space-y-3">
                      {generatedMusic.map((song, index) => (
                      <div
                        key={song.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                            selectedIndex === index
                            ? "bg-purple-900/30 border border-purple-500/30"
                            : "hover:bg-black/40"
                        }`}
                          onClick={() => handleSelectSong(song, index)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <Image
                                src={song.imageUrl || song.sourceImageUrl || song.image_url || song.source_image_url || "/placeholder.svg"}
                                alt={song.title || "AI Music"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                              <h3 className="font-medium text-gray-200 truncate">{song.title || "Untitled"}</h3>
                            <div className="flex items-center text-xs text-gray-400 gap-2">
                                <span>{song.model_name || song.modelName || "AI Model"}</span>
                              <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                                <span>{formatTime(song.duration || 0)}</span>
                            </div>

                            <div className="flex gap-1 mt-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                    handleDownload(song)
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                    handlePlayTrack(song)
                                  }}
                                >
                                  {isPlaying && isSameId(currentTrack?.id, song.id) ? (
                                    <Pause className="h-3.5 w-3.5" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5" />
                                  )}
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-400 hover:text-white"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                      <Waveform className="h-4 w-4 text-gray-400" />
                                      <span>Convert to WAV</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                    <Mic className="h-4 w-4 text-gray-400" />
                                      <span>Vocal Removal</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="flex items-center gap-2 text-red-400 cursor-pointer">
                                    <X className="h-4 w-4" />
                                      <span>Remove</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Music className="h-12 w-12 text-purple-500/20 mb-3" />
                      <p className="text-gray-500">No songs generated yet</p>
                      <p className="text-xs text-gray-600 max-w-xs text-center mt-1">
                        Fill in the form on the left and click "Generate Music" to create your AI music
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 浮动音乐播放器 */}
      {currentTrack && (
        <FloatingPlayer
          track={currentTrack}
          onClose={handleClosePlayer}
          isPlaying={isPlaying}
          onPlayPauseToggle={handlePlayPauseToggle}
          audioRef={audioStateRef}
        />
      )}
    </div>
  )
}

