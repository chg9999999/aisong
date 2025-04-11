"use client"

import { useEffect, useRef } from "react"

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Musical note class
    class MusicNote {
      x: number
      y: number
      size: number
      speed: number
      opacity: number
      rotation: number
      rotationSpeed: number
      noteType: string
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 20 + 10 // Size between 10 and 30
        this.speed = Math.random() * 0.5 + 0.2 // Speed between 0.2 and 0.7
        this.opacity = Math.random() * 0.5 + 0.1 // Opacity between 0.1 and 0.6
        this.rotation = Math.random() * Math.PI * 2 // Random initial rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.02 // Rotation speed, can be positive or negative

        // Different musical note types
        const noteTypes = ["♩", "♪", "♫", "♬", "𝄞", "𝅘𝅥𝅮", "𝅘𝅥𝅯", "𝄢"]
        this.noteType = noteTypes[Math.floor(Math.random() * noteTypes.length)]

        // Color palette - purples and blues
        const colors = [
          "rgba(139, 92, 246, opacity)", // purple-500
          "rgba(124, 58, 237, opacity)", // purple-600
          "rgba(79, 70, 229, opacity)", // indigo-600
          "rgba(59, 130, 246, opacity)", // blue-500
          "rgba(255, 255, 255, opacity)", // white (for some contrast)
        ]

        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      draw() {
        ctx.save()

        // Translate to the position where we want to draw the note
        ctx.translate(this.x, this.y)

        // Rotate the note
        ctx.rotate(this.rotation)

        // Set the font size and style
        ctx.font = `${this.size}px Arial`
        ctx.fillStyle = this.color.replace("opacity", `${this.opacity}`)
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Draw the musical note
        ctx.fillText(this.noteType, 0, 0)

        // Add a subtle glow effect for larger notes
        if (this.size > 20) {
          ctx.shadowColor = this.color.replace("opacity", "0.5")
          ctx.shadowBlur = 10
          ctx.fillText(this.noteType, 0, 0)
          ctx.shadowBlur = 0
        }

        ctx.restore()
      }

      update() {
        // Move note upward
        this.y -= this.speed

        // Rotate the note
        this.rotation += this.rotationSpeed

        // If note moves off the top of the screen, reset it to the bottom
        if (this.y < -this.size) {
          this.y = canvas.height + this.size
          this.x = Math.random() * canvas.width
        }

        // Add a slight horizontal drift
        this.x += Math.sin(this.y * 0.01) * 0.5

        // Ensure note stays within canvas bounds horizontally
        if (this.x > canvas.width + this.size) this.x = -this.size
        if (this.x < -this.size) this.x = canvas.width + this.size
      }
    }

    // Create music notes
    const notes: MusicNote[] = []
    const noteCount = Math.min(Math.max(canvas.width, canvas.height) * 0.05, 80) // Responsive note count

    for (let i = 0; i < noteCount; i++) {
      notes.push(new MusicNote())
    }

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw notes
      notes.forEach((note) => {
        note.update()
        note.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      resizeCanvas()

      // Adjust note count on resize
      const newNoteCount = Math.min(Math.max(canvas.width, canvas.height) * 0.05, 80)

      // Add more notes if needed
      if (newNoteCount > notes.length) {
        for (let i = notes.length; i < newNoteCount; i++) {
          notes.push(new MusicNote())
        }
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-[#0a0a0f]/95" />
}

