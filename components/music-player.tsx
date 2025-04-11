"use client"

import { useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"

interface MusicTrack {
  id: string | number
  title: string
  artist: string
  duration: string
  genre: string
  cover: string
}

interface MusicPlayerProps {
  isOpen: boolean
  currentTrack: MusicTrack | null
  onClose: () => void
  compact?: boolean
}

export default function MusicPlayer({ isOpen, currentTrack, onClose, compact = false }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)

  // Simulate progress when playing
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 0.5, 100))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, progress])

  // Auto-play when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsPlaying(true)
      setProgress(0)
    }
  }, [currentTrack])

  if (!isOpen || !currentTrack) return null

  const togglePlay = () => setIsPlaying(!isPlaying)
  const toggleMute = () => setIsMuted(!isMuted)

  const handleClose = () => {
    setIsPlaying(false)
    setProgress(0)
    onClose()
  }

  // Compact player for embedding in other components
  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full flex-shrink-0 border-purple-500/30 hover:bg-purple-900/20 text-gray-300"
            onClick={togglePlay}
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
              onValueChange={(values) => setProgress(values[0])}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(currentTrack.duration, progress)}</span>
              <span>{currentTrack.duration}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-purple-500/20 py-1 px-4 z-50 animate-fadeIn">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={currentTrack.cover || "/placeholder.svg"}
              alt={currentTrack.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <h4 className="text-xs font-medium text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-gray-400">{currentTrack.artist}</p>
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
              onClick={togglePlay}
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
              onValueChange={(values) => setProgress(values[0])}
            />
            <div className="flex justify-between mt-0.5 text-[10px] text-gray-400">
              <span>{formatTime(currentTrack.duration, progress)}</span>
              <span>{currentTrack.duration}</span>
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
              onValueChange={(values) => {
                setVolume(values[0])
                setIsMuted(values[0] === 0)
              }}
            />
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-purple-900/20"
            onClick={handleClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper function to format time based on progress
function formatTime(durationStr: string, progressPercent: number) {
  const [mins, secs] = durationStr.split(":").map(Number)
  const totalSeconds = mins * 60 + secs
  const currentSeconds = Math.floor(totalSeconds * (progressPercent / 100))

  const currentMins = Math.floor(currentSeconds / 60)
  const currentSecs = currentSeconds % 60

  return `${currentMins}:${currentSecs.toString().padStart(2, "0")}`
}

