"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  RefreshCw, 
  Scissors, 
  AlertCircle, 
  Music, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Download, 
  Heart, 
  Share2 
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import BackgroundAnimation from "@/components/background-animation"
import { MusicSelector } from "@/components/music-selector"
import FloatingPlayer, { type MusicTrack as FloatingMusicTrack } from "@/components/floating-player"
import { useMusicExtensionPolling } from "@/hooks/business/useMusicExtensionPolling"

interface MusicTrack {
  id: string
  title: string
  audio_url: string
  duration: number
  image_url?: string
}

// 创建简单的音频播放器组件
const SimpleAudioPlayer = ({ 
  src, 
  title,
  disabled = false
}: { 
  src?: string, 
  title: string,
  disabled?: boolean 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);

  // 加载音频元数据
  useEffect(() => {
    if (!src) return;
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // 重置状态
    setIsPlaying(false);
    setProgress(0);
    
    // 加载事件
    const handleMetadata = () => {
      setDuration(audio.duration);
    };
    
    audio.addEventListener('loadedmetadata', handleMetadata);
    return () => {
      audio.removeEventListener('loadedmetadata', handleMetadata);
    };
  }, [src]);
  
  // 更新进度
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // 音量控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);
  
  // 播放/暂停控制
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      // 暂停所有其他音频 (全局函数，在页面初始化时定义)
      document.querySelectorAll('audio').forEach(el => {
        if (el !== audio) el.pause();
      });
      
      audio.play().catch(error => {
        console.error("播放失败:", error);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Check your connection and try again.",
          variant: "destructive"
        });
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // 进度条拖动
  const handleProgressChange = (newValue: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newProgress = newValue[0];
    const newTime = (newProgress / 100) * duration;
    audio.currentTime = newTime;
    setProgress(newProgress);
    setCurrentTime(newTime);
  };
  
  // 切换静音
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // 音量滑块
  const handleVolumeChange = (newValue: number[]) => {
    const newVolume = newValue[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="w-full">
      <audio 
        ref={audioRef} 
        src={src} 
        preload="metadata"
      />
      
      <div className="flex flex-col space-y-2">
        {/* 主播放控制 */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full flex-shrink-0 border-purple-500/30 hover:bg-purple-900/20 text-gray-300"
            onClick={togglePlay}
            disabled={disabled || !src}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <div className="flex-grow space-y-1">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              className="py-0"
              onValueChange={handleProgressChange}
              disabled={disabled || !src}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        
        {/* 音量控制 */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20"
            onClick={toggleMute}
            disabled={disabled || !src}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={100}
            step={1}
            className="py-0 w-32"
            onValueChange={handleVolumeChange}
            disabled={disabled || !src}
          />
        </div>
      </div>
    </div>
  );
};

export default function MusicExtensionPage() {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null)
  const [promptText, setPromptText] = useState("")
  const [styleText, setStyleText] = useState("")
  const [titleText, setTitleText] = useState("Extended Version")
  const [originalAudioUrl, setOriginalAudioUrl] = useState("")
  const [originalDuration, setOriginalDuration] = useState(0)
  const [defaultParamFlag, setDefaultParamFlag] = useState(false)
  const [continuePoint, setContinuePoint] = useState(0)
  
  // Floating player states
  const [currentTrack, setCurrentTrack] = useState<FloatingMusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const audioStateRef = useRef({
    isPlaying: false,
    currentTrack: null as FloatingMusicTrack | null,
    audioElement: null as HTMLAudioElement | null
  });

  // 使用新的音乐扩展轮询Hook
  const {
    isLoading,
    isSuccess,
    isError,
    result,
    error,
    extendMusic,
    retry,
    elapsedTime,
    attempts,
    progress
  } = useMusicExtensionPolling();

  // 当选择新曲目时，重置状态
  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track)
    
    // 设置原始音频URL
    setOriginalAudioUrl(track.audio_url)
    setOriginalDuration(track.duration || 120)
    setContinuePoint(track.duration ? Math.max(0, track.duration - 10) : 0)
    
    // 重置其他状态
    setDefaultParamFlag(false)
    setPromptText("") // 清空提示词，让用户自己输入
    setStyleText("")
    setTitleText(`${track.title} - Extended`)
    
    // 输出调试信息
    console.log("Selected track:", track);
  }

  // 当扩展结果返回时，输出调试信息
  useEffect(() => {
    if (isSuccess && result && result.sunoData && result.sunoData.length > 0) {
      console.log("Extension successful with data:", result.sunoData[0]);
      
      // 调试：输出完整的音频URL和图片URL信息
      console.log("Audio URLs:", {
        audioUrl: result.sunoData[0].audioUrl,
        streamAudioUrl: result.sunoData[0].streamAudioUrl
      });
      
      console.log("Image URLs:", {
        imageUrl: result.sunoData[0].imageUrl,
        sourceImageUrl: result.sunoData[0].sourceImageUrl
      });
    }
  }, [isSuccess, result]);

  // 处理音乐扩展
  const handleExtend = async () => {
    if (!selectedTrack) return

    try {
      // 验证参数长度
      if (defaultParamFlag) {
        // 在自定义模式下，确保提示词不为空
        if (!promptText.trim()) {
          throw new Error("Prompt cannot be empty in custom mode");
        }
        if (promptText.length > 3000) {
          throw new Error("Prompt exceeds maximum length of 3000 characters");
        }
        if (styleText.length > 200) {
          throw new Error("Style exceeds maximum length of 200 characters");
        }
        if (titleText.length > 80) {
          throw new Error("Title exceeds maximum length of 80 characters");
        }
      }
      
      // 准备参数
      let params: any = {
        audioId: selectedTrack.id,
        defaultParamFlag: defaultParamFlag,
        continueAt: continuePoint,
      };
      
      // 在自定义模式下使用用户输入的提示词，在默认模式下使用默认提示词
      if (defaultParamFlag) {
        params = {
          ...params,
          prompt: promptText,
          style: styleText,
          title: titleText,
        };
      } else {
        // 在默认模式下使用默认提示词
        params.prompt = "Continue the music in a natural way";
      }
      
      console.log("Sending extension parameters:", params);
      
      // 启动扩展任务
      await extendMusic(params);
      
    } catch (error) {
      console.error('Error extending music:', error);
      toast({ 
        title: "Extension failed", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive" 
      });
    }
  }

  // 显示错误提示
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Extension failed",
        description: error.message || "An error occurred during music extension",
        variant: "destructive"
      });
    }
  }, [isError, error]);

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 计算进度百分比
  const progressPercent = 
    isSuccess ? 100 : 
    isLoading ? (progress.textGenerated ? 50 : 0) + (progress.firstAudioGenerated ? 40 : 0) + Math.min(attempts, 10) : 
    0;
    
  // 创建FloatingMusicTrack对象
  const createFloatingTrack = (audioUrl: string, title: string, imageUrl?: string, duration?: number): FloatingMusicTrack => {
    return {
      id: `ext-${Date.now()}`,
      title: title || "Extended Music",
      artist: "AI Extension",
      cover: imageUrl || "/placeholder.svg",
      duration: duration ? formatDuration(duration) : "0:00",
      audioUrl: audioUrl
    };
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
  
  // 确保解决ID比较问题的函数
  const isSameId = (id1: string | number | undefined, id2: string | number | undefined): boolean => {
    if (id1 === undefined || id2 === undefined) return false;
    return String(id1) === String(id2);
  };
  
  // 修改关闭播放器函数
  const handleClosePlayer = useCallback(() => {
    // 更新引用状态
    audioStateRef.current.currentTrack = null;
    audioStateRef.current.isPlaying = false;
    
    // 更新UI状态
    setCurrentTrack(null);
    setIsPlaying(false);
  }, []);
  
  // 播放原始音乐
  const handlePlayOriginal = useCallback(() => {
    if (!selectedTrack) return;
    
    // 如果已经在播放相同的曲目，则切换播放/暂停状态
    if (currentTrack && currentTrack.audioUrl === selectedTrack.audio_url) {
      handlePlayPauseToggle();
      return;
    }
    
    // 创建音轨对象
    const track = createFloatingTrack(
      selectedTrack.audio_url,
      selectedTrack.title || "Original Track",
      selectedTrack.image_url,
      selectedTrack.duration
    );
    
    // 更新引用状态
    audioStateRef.current.currentTrack = track;
    audioStateRef.current.isPlaying = true;
    
    // 更新UI状态
    setCurrentTrack(track);
    setIsPlaying(true);
  }, [selectedTrack, currentTrack, handlePlayPauseToggle]);
  
  // 播放扩展后的音乐
  const handlePlayExtended = useCallback(() => {
    if (!result?.sunoData?.[0]) return;
    
    const audioData = result.sunoData[0];
    // 优先使用主音频URL，如果没有则尝试stream URL
    const audioUrl = audioData.audioUrl || audioData.streamAudioUrl || "";
    
    if (!audioUrl) {
      console.error("No audio URL available for extended music");
      toast({
        title: "Playback error",
        description: "Could not find audio source for extended music",
        variant: "destructive"
      });
      return;
    }
    
    // 如果已经在播放相同的曲目，则切换播放/暂停状态
    if (currentTrack && currentTrack.audioUrl === audioUrl) {
      handlePlayPauseToggle();
      return;
    }
    
    // 创建音轨对象
    const track = createFloatingTrack(
      audioUrl,
      audioData.title || titleText,
      audioData.imageUrl || audioData.sourceImageUrl,
      audioData.duration
    );
    
    console.log("Playing extended track:", track);
    
    // 更新引用状态
    audioStateRef.current.currentTrack = track;
    audioStateRef.current.isPlaying = true;
    
    // 更新UI状态
    setCurrentTrack(track);
    setIsPlaying(true);
  }, [result, currentTrack, handlePlayPauseToggle, titleText]);
  
  // 切换收藏状态
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    
    toast({ 
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: currentTrack?.title || "This track"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 relative">
      <BackgroundAnimation />
      <Header />

      <main className="flex-grow pt-16 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Music Extension
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Music Selection & Settings */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <Music className="h-5 w-5 mr-2 text-purple-400" />
                  Select Music to Extend
                </h2>

                <MusicSelector onSelect={handleTrackSelect} selectedTrack={selectedTrack || undefined} />

                {selectedTrack && (
                  <div className="space-y-4 p-4 rounded-lg border border-purple-500/10 bg-black/20 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-200">Extension Settings</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="continue-point" className="flex items-center justify-between">
                        <span>Continue From</span>
                        <span className="text-sm text-purple-400">{formatDuration(continuePoint)}</span>
                      </Label>
                      <Slider
                        id="continue-point"
                        value={[continuePoint]}
                        min={0}
                        max={originalDuration}
                        step={1}
                        onValueChange={(values) => setContinuePoint(values[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Start</span>
                        <span>End of track</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="defaultParams" className="text-sm">Use Custom Parameters</Label>
                        <Switch 
                          id="defaultParams" 
                          checked={defaultParamFlag} 
                          onCheckedChange={setDefaultParamFlag}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                    </div>

                    {defaultParamFlag && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="title-input" className="flex items-center justify-between">
                            <span>Title</span>
                            <span className="text-xs text-gray-400">{titleText.length}/80</span>
                          </Label>
                          <Input
                            id="title-input"
                            value={titleText}
                            onChange={(e) => setTitleText(e.target.value)}
                            placeholder="Enter title for extended version"
                            className="border-purple-500/30 bg-black/40 text-gray-200"
                            maxLength={80}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="style-input" className="flex items-center justify-between">
                            <span>Style</span>
                            <span className="text-xs text-gray-400">{styleText.length}/200</span>
                          </Label>
                          <Textarea
                            id="style-input"
                            value={styleText}
                            onChange={(e) => setStyleText(e.target.value)}
                            placeholder="Enter style details (e.g., Rock, Energetic, Powerful drums)"
                            className="min-h-[60px] border-purple-500/30 bg-black/40 text-gray-200"
                            maxLength={200}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="prompt-input" className="flex items-center justify-between">
                            <span>Description/Prompt</span>
                            <span className="text-xs text-gray-400">{promptText.length}/3000</span>
                          </Label>
                          <Textarea
                            id="prompt-input"
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="Describe how you want to extend the music"
                            className="min-h-[100px] border-purple-500/30 bg-black/40 text-gray-200"
                            maxLength={3000}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleExtend}
                  disabled={!selectedTrack || isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white mt-4"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Scissors className="mr-2 h-5 w-5" />
                      Extend Music
                    </>
                  )}
                </Button>

                {isLoading && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {progress.textGenerated ? 
                          (progress.firstAudioGenerated ? "Finalizing..." : "First draft created...") : 
                          "Processing..."}
                      </span>
                      <span className="text-gray-400">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <div className="text-xs text-gray-400 mt-1">
                      Time elapsed: {Math.floor(elapsedTime)}s
                    </div>
                  </div>
                )}

                {isError && (
                  <div className="mt-4 p-3 rounded-md bg-red-900/20 border border-red-800/30 text-red-200 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Extension failed</p>
                      <p className="text-sm text-red-300 mt-1">{error?.message || "An unknown error occurred"}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 border-red-800/30 hover:bg-red-800/20 text-red-200"
                        onClick={retry}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h3 className="font-medium text-gray-200 mb-3">How It Works</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Our AI analyzes your music's structure, harmony, and style to create a natural extension that sounds
                  like part of the original composition.
                </p>
                <ol className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      1
                    </div>
                    <p>Select a track from your music library</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      2
                    </div>
                    <p>Choose where to continue from in the track</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      3
                    </div>
                    <p>Our AI extends your music while maintaining its style</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      4
                    </div>
                    <p>Listen to and download the extended version</p>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full">
                <h2 className="text-xl font-bold text-gray-200 mb-4">
                  Music Preview
                </h2>

                {!isSuccess ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-purple-500/10 bg-black/20 h-[400px]">
                    <Music className="h-16 w-16 text-purple-500/30 mb-4" />
                    <p className="text-gray-400 text-center max-w-md">
                      {selectedTrack
                        ? "Click 'Extend Music' to process your audio"
                        : "Select a track from your music library to extend"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Playback Controls */}
                    <div className="grid grid-cols-1 gap-6">
                      {/* Original Track */}
                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        <div className="flex items-start gap-4">
                          <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={selectedTrack?.image_url || "/placeholder.svg"}
                              alt={selectedTrack?.title || "Original Track"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-200">{selectedTrack?.title || "Original"}</h3>
                              <span className="text-xs text-gray-400">
                                {formatDuration(originalDuration)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-3">Original Track</p>
                            
                            {/* 使用封装的播放器组件 */}
                            <SimpleAudioPlayer 
                              src={selectedTrack?.audio_url}
                              title={selectedTrack?.title || "Original"}
                            />
                            
                            <div className="mt-2 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-300"
                                onClick={handlePlayOriginal}
                              >
                                {isPlaying && currentTrack?.audioUrl === selectedTrack?.audio_url ? (
                                  <Pause className="h-3.5 w-3.5 mr-1" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 mr-1" />
                                )}
                                {isPlaying && currentTrack?.audioUrl === selectedTrack?.audio_url ? "Pause" : "Play in Player"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Extended Track with improved UI */}
                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        {result?.sunoData?.[0] ? (
                          <>
                            <div className="flex items-start gap-4">
                              <div className="relative h-24 w-24 rounded-md overflow-hidden flex-shrink-0">
                                <Image
                                  src={result.sunoData[0].imageUrl || result.sunoData[0].sourceImageUrl || "/placeholder.svg"}
                                  alt={result.sunoData[0].title || titleText}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              
                              <div className="flex-grow">
                                <h3 className="font-medium text-gray-200 text-lg">{result.sunoData[0].title || titleText}</h3>
                                <p className="text-sm text-gray-400 mb-2">Extended with AI • {result.sunoData[0].modelName || "AI Model"}</p>
                                
                                {result.sunoData[0].tags && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {result.sunoData[0].tags.split(',').map((tag, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-black/40 border-purple-500/30 text-gray-300 text-xs"
                                      >
                                        {tag.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                  <span>Duration: {formatDuration(result.sunoData[0].duration || 0)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 px-2 ${isFavorite ? "text-red-400" : "text-gray-400 hover:text-red-400"}`}
                                    onClick={toggleFavorite}
                                  >
                                    <Heart className="h-3.5 w-3.5 mr-1" fill={isFavorite ? "#f87171" : "none"} />
                                    {isFavorite ? "Favorite" : "Add to favorites"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* 使用封装的播放器组件 */}
                            <div className="mt-3">
                              <SimpleAudioPlayer 
                                src={result.sunoData[0].audioUrl || result.sunoData[0].streamAudioUrl}
                                title={result.sunoData[0].title || titleText}
                                disabled={!isSuccess || (!result.sunoData[0].audioUrl && !result.sunoData[0].streamAudioUrl)}
                              />
                            </div>
                            
                            {/* 操作按钮 */}
                            <div className="mt-4 flex items-center justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-purple-500/30 bg-black/40 hover:bg-purple-900/20 text-gray-300"
                                onClick={handlePlayExtended}
                                disabled={!result.sunoData[0].audioUrl && !result.sunoData[0].streamAudioUrl}
                              >
                                {isPlaying && currentTrack?.audioUrl === (result.sunoData[0].audioUrl || result.sunoData[0].streamAudioUrl) ? (
                                  <Pause className="h-3.5 w-3.5 mr-1" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 mr-1" />
                                )}
                                {isPlaying && currentTrack?.audioUrl === (result.sunoData[0].audioUrl || result.sunoData[0].streamAudioUrl) ? "Pause" : "Play in Player"}
                              </Button>
                              
                              <a 
                                href={result.sunoData[0].audioUrl || result.sunoData[0].streamAudioUrl}
                                download={`${result.sunoData[0].title || 'extended-music'}.mp3`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                              >
                                <Download className="h-4 w-4" />
                                Download Extended Version
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8">
                            <AlertCircle className="h-10 w-10 text-purple-500/30 mb-2" />
                            <p className="text-gray-400 text-center">No extended music data available</p>
                            {/* 添加调试信息 */}
                            {isSuccess && result && (
                              <p className="text-xs text-gray-500 mt-2">
                                API returned response but no music data was found.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
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

