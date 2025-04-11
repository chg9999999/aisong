"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Clock, Scissors, Download, Share, AlertCircle } from "lucide-react"
import Header from "@/components/header"
import BackgroundAnimation from "@/components/background-animation"
import { MusicUploader } from "@/components/music-uploader"
import MusicPlayer from "@/components/music-player"
import AudioWaveform from "@/components/audio-waveform"
import { toast } from "@/components/ui/use-toast"
import { useMusicExtensionPolling } from "@/hooks/business/useMusicExtensionPolling"

interface MusicTrack {
  id: string
  title: string
  audio_url: string
  duration: number
  image_url?: string
}

interface VersionInfo {
  id: string
  style: string
  timestamp: string
}

export default function MusicExtensionPage() {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | File | null>(null)
  const [customStyle, setCustomStyle] = useState("")
  const [extensionLength, setExtensionLength] = useState(30)
  const [style, setStyle] = useState("match")
  const [originalAudioUrl, setOriginalAudioUrl] = useState("")
  const [originalDuration, setOriginalDuration] = useState(0)
  const [versions, setVersions] = useState<VersionInfo[]>([])
  
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
  const handleTrackSelect = (track: MusicTrack | File) => {
    setSelectedTrack(track)
    
    // 设置原始音频URL
    if ('id' in track) {
      setOriginalAudioUrl(track.audio_url)
      setOriginalDuration(track.duration)
    } else {
      setOriginalAudioUrl(URL.createObjectURL(track))
      setOriginalDuration(0) // 暂时无法获取文件时长
    }
  }

  // 处理音乐扩展
  const handleExtend = async () => {
    if (!selectedTrack) return

    try {
      // 准备参数
      const params = {
        audioId: 'id' in selectedTrack ? selectedTrack.id : '',
        defaultParamFlag: true,
        prompt: style === "custom" ? customStyle : `Extend the music for ${extensionLength} seconds in ${style} style`,
        style: style,
        title: 'Extended Version',
        continueAt: 0,
      };
      
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

  // 扩展成功后更新版本记录
  useEffect(() => {
    if (isSuccess && result) {
      // 添加新版本到历史记录
      const newVersion: VersionInfo = {
        id: result.extendedMusic.id,
        style: style,
        timestamp: new Date().toISOString()
      };
      setVersions(prev => [newVersion, ...prev]);
    }
  }, [isSuccess, result, style]);

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 计算进度百分比
  const progressPercent = 
    isSuccess ? 100 : 
    isLoading ? (progress.textGenerated ? 50 : 0) + (progress.firstAudioGenerated ? 40 : 0) + Math.min(attempts, 10) : 
    0;

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
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h2 className="text-xl font-bold text-gray-200 mb-4">
                  Select Music
                </h2>

                <MusicUploader 
                  onSelect={handleTrackSelect}
                  selectedTrack={selectedTrack || undefined}
                />

                {selectedTrack && (
                  <div className="space-y-4 p-4 rounded-lg border border-purple-500/10 bg-black/20 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-200">Extension Settings</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="extension-length" className="flex items-center justify-between">
                        <span>Extension Length</span>
                        <span className="text-sm text-purple-400">{extensionLength} seconds</span>
                      </Label>
                      <Slider
                        id="extension-length"
                        value={[extensionLength]}
                        min={10}
                        max={120}
                        step={5}
                        onValueChange={(values) => setExtensionLength(values[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style">Style Matching</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger id="style" className="border-purple-500/30 bg-black/40 text-gray-200">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                          <SelectItem value="match">Match Original Style</SelectItem>
                          <SelectItem value="enhance">Enhance Original Style</SelectItem>
                          <SelectItem value="variation">Create Variation</SelectItem>
                          <SelectItem value="custom">Custom Style</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {style === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-style">Custom Style Description</Label>
                        <Input
                          id="custom-style"
                          placeholder="E.g., 'More energetic with stronger drums'"
                          className="border-purple-500/30 bg-black/40 text-gray-200 focus:border-purple-500"
                          value={customStyle}
                          onChange={(e) => setCustomStyle(e.target.value)}
                        />
                      </div>
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
                    <p>Select a track from your music library or upload your own</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      2
                    </div>
                    <p>Choose how long you want to extend it</p>
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
                    <p>Download the extended version for your projects</p>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-8">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-400" />
                  Music Preview
                </h2>

                {!isSuccess ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-purple-500/10 bg-black/20 h-[400px]">
                    <Clock className="h-16 w-16 text-purple-500/30 mb-4" />
                    <p className="text-gray-400 text-center max-w-md">
                      {selectedTrack
                        ? "Click 'Extend Music' to process your audio file"
                        : "Select a track from your music library to extend"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Combined Waveform View */}
                    <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                      <h3 className="font-medium text-gray-200 mb-3">Combined Waveform</h3>
                      <div className="relative h-32">
                        <AudioWaveform 
                          audioUrl={originalAudioUrl}
                          className="opacity-50"
                        />
                        <div className="absolute right-0 top-0 bottom-0 w-[30%]">
                          <AudioWaveform 
                            audioUrl={result?.extendedMusic.audioUrl || ""}
                            className="bg-gradient-to-l from-purple-600/20"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="bg-black/40 text-purple-400 border-purple-500/30">
                              Extended
                            </Badge>
                          </div>
                        </div>
                        <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                      </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Original Track */}
                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-200">Original</h3>
                          <span className="text-xs text-gray-400">
                            {formatDuration(originalDuration)}
                          </span>
                        </div>
                        <MusicPlayer
                          isOpen={true}
                          currentTrack={{
                            id: Number('id' in selectedTrack! ? selectedTrack.id : 0),
                            title: 'id' in selectedTrack! ? selectedTrack.title : (selectedTrack as File).name,
                            artist: "",
                            duration: formatDuration(originalDuration),
                            genre: "",
                            cover: 'id' in selectedTrack! ? selectedTrack.image_url || "" : ""
                          }}
                          onClose={() => {}}
                          compact={true}
                        />
                      </div>

                      {/* Extended Track */}
                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-200">Extended Version</h3>
                          <span className="text-xs text-gray-400">
                            +{extensionLength}s
                          </span>
                        </div>
                        <MusicPlayer
                          isOpen={true}
                          currentTrack={{
                            id: 0,
                            title: result?.extendedMusic.title || "Extended Version",
                            artist: "",
                            duration: formatDuration(originalDuration + extensionLength),
                            genre: "",
                            cover: result?.extendedMusic.imageUrl || ('id' in selectedTrack! ? selectedTrack.image_url || "" : "")
                          }}
                          onClose={() => {}}
                          compact={true}
                        />
                      </div>
                    </div>

                    {/* Version History & Actions */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Version History */}
                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-200">Version History</h3>
                          <Button variant="ghost" size="sm" className="text-purple-400">
                            View All
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {versions.length > 0 ? (
                            versions.map((version) => (
                              <div key={version.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-900/10">
                                <div className="flex items-center gap-3">
                                  <div className="text-sm text-gray-200">{version.style}</div>
                                  <div className="text-xs text-gray-400">{new Date(version.timestamp).toLocaleString()}</div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  Load
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-2">No previous versions yet</p>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        <h3 className="font-medium text-gray-200 mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="border-purple-500/30 hover:bg-purple-900/20 text-gray-300 justify-start"
                            onClick={() => setStyle(prev => prev === "match" ? "variation" : "match")}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Different Style
                          </Button>
                          <Button
                            variant="outline"
                            className="border-purple-500/30 hover:bg-purple-900/20 text-gray-300 justify-start"
                            disabled={!isSuccess}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            className="border-purple-500/30 hover:bg-purple-900/20 text-gray-300 justify-start"
                            disabled={!isSuccess}
                          >
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

