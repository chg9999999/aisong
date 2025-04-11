"use client"

import { useState, useEffect, useRef, RefObject, useCallback } from "react"
import Image from "next/image"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

export interface MusicTrack {
  id: string | number
  title: string
  artist: string
  cover: string
  duration: string
  audioUrl?: string
  streamUrl?: string
}

interface AudioRefState {
  isPlaying: boolean
  currentTrack: MusicTrack | null
  audioElement: HTMLAudioElement | null
}

interface FloatingPlayerProps {
  track: MusicTrack
  onClose: () => void
  isPlaying: boolean
  onPlayPauseToggle: () => void
  audioRef?: RefObject<AudioRefState>
}

export default function FloatingPlayer({ track, onClose, isPlaying, onPlayPauseToggle, audioRef }: FloatingPlayerProps) {
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  
  // 内部音频引用，在没有外部引用时使用
  const internalAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // 存储上一个trackId，用于比较是否更改了曲目
  const prevTrackIdRef = useRef<string | number | null>(null)
  
  // 用于确定是使用外部还是内部音频引用
  const getAudioElement = useCallback((): HTMLAudioElement | null => {
    if (audioRef && audioRef.current && audioRef.current.audioElement) {
      return audioRef.current.audioElement
    }
    return internalAudioRef.current
  }, [audioRef])
  
  // 初始化音频元素
  useEffect(() => {
    // 如果有外部音频引用，确保它已初始化
    if (audioRef && !audioRef.current.audioElement) {
      audioRef.current.audioElement = new Audio()
    } 
    // 如果没有外部引用，使用内部引用
    else if (!audioRef && !internalAudioRef.current) {
      internalAudioRef.current = new Audio()
    }
    
    const audioElement = getAudioElement()
    
    if (audioElement) {
      // 设置音频事件监听
      const handleMetadata = () => {
        setDuration(audioElement.duration)
      }
      
      const handleTimeUpdate = () => {
        setCurrentTime(audioElement.currentTime)
        setProgress((audioElement.currentTime / audioElement.duration) * 100 || 0)
      }
      
      const handleEnded = () => {
        onPlayPauseToggle()
      }
      
      audioElement.addEventListener('loadedmetadata', handleMetadata)
      audioElement.addEventListener('timeupdate', handleTimeUpdate)
      audioElement.addEventListener('ended', handleEnded)
      
      // 清理函数
      return () => {
        audioElement.removeEventListener('loadedmetadata', handleMetadata)
        audioElement.removeEventListener('timeupdate', handleTimeUpdate)
        audioElement.removeEventListener('ended', handleEnded)
      }
    }
  }, [audioRef, onPlayPauseToggle, getAudioElement])
  
  // 处理曲目变化
  useEffect(() => {
    const audioElement = getAudioElement()
    const trackChanged = prevTrackIdRef.current !== track.id
    
    if (audioElement) {
      // 只有当曲目ID变化时才重新加载音频
      if (trackChanged) {
        console.log("曲目已更改，加载新音频源:", track.id)
        prevTrackIdRef.current = track.id
        
        // 尝试多种可能的音频源格式
        const audioSource = track.audioUrl || track.streamUrl
        
        if (audioSource) {
          // 保存当前播放位置（如果是同一首歌）
          const currentPosition = audioElement.currentTime
          const wasPlaying = !audioElement.paused
          
          // 更新音频源
          audioElement.src = audioSource
          audioElement.load()
          
          // 加载完成后设置播放状态
          audioElement.addEventListener('loadeddata', () => {
            if (isPlaying) {
              audioElement.play().catch((err: Error) => {
                console.error("播放音频失败:", err)
                // 尝试使用备用URL
                if (track.streamUrl && track.streamUrl !== audioSource) {
                  console.log("尝试使用备用音频源:", track.streamUrl)
                  audioElement.src = track.streamUrl
                  audioElement.load()
                  audioElement.play().catch((err2: Error) => {
                    console.error("备用音频源播放失败:", err2)
                  })
                }
              })
            }
          }, { once: true })
        } else {
          console.error("没有有效的音频源URL")
        }
      }
    }
  }, [track.id, track.audioUrl, track.streamUrl, getAudioElement, isPlaying])
  
  // 处理播放/暂停状态变化
  useEffect(() => {
    const audioElement = getAudioElement()
    
    if (audioElement) {
      // 只在播放状态实际变化时操作
      if (isPlaying && audioElement.paused) {
        console.log("开始播放:", track.title)
        audioElement.play().catch(err => {
          console.error("播放失败:", err)
        })
      } else if (!isPlaying && !audioElement.paused) {
        console.log("暂停播放:", track.title)
        audioElement.pause()
      }
    }
  }, [isPlaying, getAudioElement, track.title])
  
  // 控制音量
  useEffect(() => {
    const audioElement = getAudioElement()
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted, getAudioElement])
  
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }
  
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }
  
  const handleProgressChange = (values: number[]) => {
    const newProgress = values[0]
    setProgress(newProgress)
    
    const audioElement = getAudioElement()
    if (audioElement) {
      const newTime = (newProgress / 100) * audioElement.duration
      audioElement.currentTime = newTime
      setCurrentTime(newTime)
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-purple-500/30 py-1 px-4 z-50 animate-fadeIn">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={track.cover || "/placeholder.svg?height=48&width=48"}
              alt={track.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <h4 className="text-xs font-medium text-white truncate">{track.title}</h4>
            <p className="text-xs text-gray-400">{track.artist}</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="flex items-center justify-center space-x-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-white hover:text-purple-400 hover:bg-purple-900/20"
              onClick={onPlayPauseToggle}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-0">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              className="py-0"
              onValueChange={handleProgressChange}
            />
            <div className="flex justify-between mt-0.5 text-[10px] text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{track.duration}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-1 justify-end">
          <div className="flex items-center space-x-2 w-32">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              className="py-0 w-24"
              onValueChange={handleVolumeChange}
            />
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-purple-900/20"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}


