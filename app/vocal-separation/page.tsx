"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Download,
  Music,
  Mic,
  Volume2,
  VolumeX,
  RefreshCw,
  Headphones,
  AudioWaveformIcon as Waveform,
  AlertCircle
} from "lucide-react"
import Header from "@/components/header"
import BackgroundAnimation from "@/components/background-animation"
import { MusicUploader } from "@/components/music-uploader"
import AudioWaveform from "@/components/audio-waveform"
import { useVocalSeparationPolling } from "@/hooks/business/useVocalSeparationPolling"
import { VocalRemovalResult } from "@/types/music"

interface MusicTrack {
  id: string
  title: string
  audio_url: string
  duration: number
  image_url?: string
  task_id?: string
}

export default function VocalSeparationPage() {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | File | null>(null)
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)

  // 使用新的轮询Hook
  const {
    status,
    isLoading,
    isSuccess,
    isError,
    result,
    error,
    separateVocals,
    retry,
    elapsedTime,
    attempts
  } = useVocalSeparationPolling();

  // 计算轮询进度 (基于尝试次数和过去时间)
  const calculateProgress = () => {
    if (isSuccess) return 100;
    if (!isLoading) return 0;
    
    // 基于时间的简单进度估算，最多到95%
    // 假设任务大约需要60秒完成
    const timeBasedProgress = Math.min(95, (elapsedTime / 60) * 100);
    return Math.round(timeBasedProgress);
  };

  const handleTrackSelect = (track: MusicTrack | File) => {
    setSelectedTrack(track)
    setActiveTrack(null)
  }

  const handleProcess = async () => {
    if (!selectedTrack) return;
    
    try {
      // 根据API要求，必须同时提供 taskId 和 audioId
      // 如果是已有的音乐记录，从其中获取相关ID
      if ('id' in selectedTrack) {
        // 如果存在 task_id 属性，则使用它作为 taskId，否则使用 id 作为 taskId
        const taskId = selectedTrack.task_id || selectedTrack.id;
        const audioId = selectedTrack.id;

        await separateVocals({
          taskId,
          audioId
        });
      } else {
        // 对于文件上传的情况，需要先上传文件并获取 ID
        console.error('File upload for vocal separation is not implemented yet');
        // 这里应该实现文件上传逻辑，然后获取返回的ID用于分离
      }
    } catch (error) {
      console.error('Error starting vocal separation process:', error);
    }
  }

  const handlePlayPause = (track: string) => {
    if (activeTrack === track) {
      setIsPlaying(!isPlaying)
    } else {
      setActiveTrack(track)
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 当任务成功完成时，更新UI
  useEffect(() => {
    if (isSuccess && result) {
      // 任务完成，可以直接使用result数据
      console.log('Vocal separation completed successfully:', result);
    }
  }, [isSuccess, result]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 relative">
      <BackgroundAnimation />
      <Header />

      <main className="flex-grow pt-16 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Vocal Separation
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Upload */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h2 className="text-xl font-bold text-gray-200 mb-4">
                  Select Music
                </h2>

                <MusicUploader 
                  onSelect={handleTrackSelect}
                  selectedTrack={selectedTrack || undefined}
                />

                <Button
                  onClick={handleProcess}
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
                      <Mic className="mr-2 h-5 w-5" />
                      Separate Vocals
                    </>
                  )}
                </Button>

                {isLoading && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Processing... {attempts > 0 ? `(${attempts} checks)` : ''}</span>
                      <span className="text-gray-400">{calculateProgress()}%</span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2" />
                    <p className="text-xs text-gray-500">Time elapsed: {Math.round(elapsedTime)}s</p>
                  </div>
                )}

                {isError && error && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-300 text-sm">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{error.message || 'An error occurred during vocal separation'}</p>
                    </div>
                    <Button 
                      onClick={retry}
                      className="mt-2 bg-red-800/40 hover:bg-red-700/60 text-white text-xs h-7 px-2"
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h3 className="font-medium text-gray-200 mb-3">How It Works</h3>
                <ol className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      1
                    </div>
                    <p>Upload your audio file (song, recording, etc.)</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      2
                    </div>
                    <p>Our AI analyzes the audio and separates vocals from instruments</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-xs text-purple-400 mt-0.5">
                      3
                    </div>
                    <p>Download the separated tracks or use them in your projects</p>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-8">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <Headphones className="h-5 w-5 mr-2 text-purple-400" />
                  Separated Tracks
                </h2>

                {!isSuccess ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-purple-500/10 bg-black/20 h-[400px]">
                    <Waveform className="h-16 w-16 text-purple-500/30 mb-4" />
                    <p className="text-gray-400 text-center max-w-md">
                      {selectedTrack
                        ? "Click 'Separate Vocals' to process your audio file"
                        : "Upload or select a music track to get started"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Original Track */}
                    <div className="rounded-lg border border-purple-500/20 bg-black/40 p-4">
                      <div className="flex items-center mb-3">
                        <Music className="h-5 w-5 mr-2 text-blue-400" />
                        <h3 className="font-medium text-gray-200">Original Track</h3>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400"
                          onClick={() => handlePlayPause('original')}
                        >
                          {activeTrack === 'original' && isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        
                        <div className="flex-1">
                          <AudioWaveform 
                            audioUrl={result?.originalUrl || ''} 
                            isPlaying={activeTrack === 'original' && isPlaying}
                            volume={isMuted ? 0 : volume / 100}
                          />
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-400"
                          asChild
                        >
                          <a href={result?.originalUrl} download target="_blank">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Instrumental Track */}
                    <div className="rounded-lg border border-purple-500/20 bg-black/40 p-4">
                      <div className="flex items-center mb-3">
                        <Music className="h-5 w-5 mr-2 text-purple-400" />
                        <h3 className="font-medium text-gray-200">Instrumental</h3>
                        <Badge variant="outline" className="ml-2 bg-purple-900/30 text-purple-300 border-purple-500/30">
                          No Vocals
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-400"
                          onClick={() => handlePlayPause('instrumental')}
                        >
                          {activeTrack === 'instrumental' && isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        
                        <div className="flex-1">
                          <AudioWaveform 
                            audioUrl={result?.instrumentalUrl || ''} 
                            isPlaying={activeTrack === 'instrumental' && isPlaying}
                            volume={isMuted ? 0 : volume / 100}
                          />
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-purple-500/10 text-purple-400"
                          asChild
                        >
                          <a href={result?.instrumentalUrl} download target="_blank">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Vocals Track */}
                    <div className="rounded-lg border border-purple-500/20 bg-black/40 p-4">
                      <div className="flex items-center mb-3">
                        <Mic className="h-5 w-5 mr-2 text-green-400" />
                        <h3 className="font-medium text-gray-200">Vocals Only</h3>
                        <Badge variant="outline" className="ml-2 bg-green-900/30 text-green-300 border-green-500/30">
                          Isolated
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full bg-green-500/10 text-green-400"
                          onClick={() => handlePlayPause('vocals')}
                        >
                          {activeTrack === 'vocals' && isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        
                        <div className="flex-1">
                          <AudioWaveform 
                            audioUrl={result?.vocalUrl || ''} 
                            isPlaying={activeTrack === 'vocals' && isPlaying}
                            volume={isMuted ? 0 : volume / 100}
                          />
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-green-500/10 text-green-400"
                          asChild
                        >
                          <a href={result?.vocalUrl} download target="_blank">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Volume Controls */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-purple-500/20 bg-black/20">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        onClick={toggleMute}
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      
                      <Slider
                        value={[volume]}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => setVolume(value[0])}
                      />
                      
                      <span className="text-xs text-gray-400 w-8 text-right">
                        {volume}%
                      </span>
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

