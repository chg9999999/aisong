"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FileAudio, RefreshCw, Download, Info, Check, AlertCircle } from "lucide-react"
import Header from "@/components/header"
import BackgroundAnimation from "@/components/background-animation"
import { MusicUploader } from "@/components/music-uploader"
import AudioWaveform from "@/components/audio-waveform"
import { useWavConversionPolling } from "@/hooks/business/useWavConversionPolling"
import { toast } from "@/components/ui/use-toast"

interface MusicTrack {
  id: string
  title: string
  audio_url: string
  duration: number
  image_url?: string
}

export default function WavConversionPage() {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | File | null>(null)
  const [originalAudioUrl, setOriginalAudioUrl] = useState("")

  // 使用新的WAV转换轮询Hook
  const {
    isLoading,
    isSuccess,
    isError,
    result,
    error,
    convertToWav,
    retry,
    elapsedTime,
    attempts,
    progress
  } = useWavConversionPolling();

  const handleTrackSelect = (track: MusicTrack | File) => {
    setSelectedTrack(track)
    
    // 设置原始音频URL
    if ('id' in track) {
      setOriginalAudioUrl(track.audio_url)
    } else {
      setOriginalAudioUrl(URL.createObjectURL(track))
    }
  }

  const handleConvert = async () => {
    if (!selectedTrack) return

    try {
      // 准备参数
      const params = {
        audioId: 'id' in selectedTrack ? selectedTrack.id : '',
        taskId: 'id' in selectedTrack ? selectedTrack.id : undefined
      };
      
      // 启动转换任务
      await convertToWav(params);
      
    } catch (error) {
      console.error('Error converting to WAV:', error);
      toast({ 
        title: "Conversion failed", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive" 
      });
    }
  }

  // 显示错误提示
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Conversion failed",
        description: error.message || "An error occurred during WAV conversion",
        variant: "destructive"
      });
    }
  }, [isError, error]);

  // 计算进度百分比，WAV转换不提供阶段性进度，所以我们基于尝试次数估算
  const progressPercent = isSuccess ? 100 : isLoading ? Math.min(progress, 95) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 relative">
      <BackgroundAnimation />
      <Header />

      <main className="flex-grow pt-16 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            WAV Conversion
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Upload & Settings */}
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
                  onClick={handleConvert}
                  disabled={!selectedTrack || isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white mt-4"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileAudio className="mr-2 h-5 w-5" />
                      Convert to WAV
                    </>
                  )}
                </Button>

                {isLoading && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Converting...</span>
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
                      <p className="font-medium">Conversion failed</p>
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
                <h3 className="font-medium text-gray-200 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-purple-400" />
                  About WAV Conversion
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  WAV files offer lossless audio quality, making them ideal for professional audio production,
                  mastering, and archiving.
                </p>
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>Lossless audio quality with no compression artifacts</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>Industry standard format for professional audio work</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>Compatible with virtually all audio software and hardware</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>Ideal for further editing, mixing, and mastering</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-8">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <FileAudio className="h-5 w-5 mr-2 text-purple-400" />
                  Converted Files
                </h2>

                {!isSuccess ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-purple-500/10 bg-black/20 h-[400px]">
                    <FileAudio className="h-16 w-16 text-purple-500/30 mb-4" />
                    <p className="text-gray-400 text-center max-w-md">
                      {selectedTrack
                        ? "Click 'Convert to WAV' to process your audio file"
                        : "Select a track from your music library to convert it to high-quality WAV format"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-200">Conversion Complete</h3>
                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500/30">
                          Success
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-400 mb-4">
                        Your audio file has been successfully converted to WAV format, providing lossless audio quality for professional use.
                      </p>

                      <div className="h-32 bg-black/40 rounded-lg mb-4">
                        <AudioWaveform audioUrl={originalAudioUrl} isPlaying={false} />
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        onClick={() => window.open(result?.wavUrl, '_blank')}
                        disabled={!result?.wavUrl}
                      >
                        <Download className="mr-2 h-5 w-5" />
                        Download WAV File
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                      <h3 className="font-medium text-gray-200 mb-3">File Details</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-purple-900/30 flex items-center justify-center">
                          <FileAudio className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-200">
                            {'id' in selectedTrack! ? (selectedTrack as MusicTrack).title : (selectedTrack as File).name.replace(/\.[^/.]+$/, "")}.wav
                          </p>
                          <div className="flex items-center text-xs text-gray-400 gap-2">
                            <span>WAV</span>
                            <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                            <span>Lossless</span>
                            <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                            <span>{'id' in selectedTrack! ? formatDuration((selectedTrack as MusicTrack).duration) : "00:00"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">
                        WAV files are significantly larger than compressed formats but offer perfect audio quality. The converted file preserves all the original audio details.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                      <h3 className="font-medium text-gray-200 mb-3">What's Next?</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Now that you've converted your file to WAV format, you can:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="border-purple-500/30 hover:bg-purple-900/20 text-gray-300 justify-start"
                          onClick={() => {
                            setSelectedTrack(null);
                          }}
                        >
                          <FileAudio className="h-4 w-4 mr-2" />
                          Convert More Files
                        </Button>
                        <Button
                          variant="outline"
                          className="border-purple-500/30 hover:bg-purple-900/20 text-gray-300 justify-start"
                          onClick={() => window.open(result?.wavUrl, '_blank')}
                          disabled={!result?.wavUrl}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download WAV File
                        </Button>
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

// Helper function to format duration
function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

