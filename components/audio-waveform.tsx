"use client"

import { useEffect, useRef } from "react"

interface AudioWaveformProps {
  isPlaying?: boolean
  audioUrl?: string
  className?: string
  volume?: number
}

export default function AudioWaveform({ 
  isPlaying = false, 
  audioUrl, 
  className = "",
  volume = 1
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element when audioUrl changes
  useEffect(() => {
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      } else if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Audio playback error:", error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw waveform
    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.strokeStyle = isPlaying ? "#a78bfa" : "#4b5563"

    // Generate random waveform
    ctx.moveTo(0, height / 2)

    for (let i = 0; i < width; i += 5) {
      const y = isPlaying
        ? height / 2 + Math.sin(i * 0.05) * 20 + Math.random() * 10
        : height / 2 + Math.sin(i * 0.05) * 15

      ctx.lineTo(i, y)
    }

    ctx.stroke()

    // Animation frame for playing state
    let animationId: number

    if (isPlaying) {
      let offset = 0

      const animate = () => {
        ctx.clearRect(0, 0, width, height)

        // Add glow effect
        ctx.shadowBlur = 10
        ctx.shadowColor = "#a78bfa"

        ctx.beginPath()
        ctx.lineWidth = 2

        // Create gradient for the waveform
        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, "#a78bfa") // Purple
        gradient.addColorStop(0.5, "#93c5fd") // Blue
        gradient.addColorStop(1, "#a78bfa") // Purple

        ctx.strokeStyle = gradient

        offset += 0.1

        for (let i = 0; i < width; i += 5) {
          const y = height / 2 + Math.sin((i + offset) * 0.05) * 20 + Math.random() * 10

          if (i === 0) {
            ctx.moveTo(i, y)
          } else {
            ctx.lineTo(i, y)
          }
        }

        ctx.stroke()

        // Remove glow for next frame
        ctx.shadowBlur = 0

        animationId = requestAnimationFrame(animate)
      }

      animate()
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isPlaying])

  return (
    <div className={`w-full h-full ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={100} 
        className="w-full h-full"
      />
    </div>
  )
}


