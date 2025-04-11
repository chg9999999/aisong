"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Play, Download, Music, Video, RefreshCw, Settings, Palette, Type, ImageIcon, AlertCircle } from "lucide-react"
import Header from "@/components/header"
import BackgroundAnimation from "@/components/background-animation"
import { useMp4GenerationPolling } from "@/hooks/business/useMp4GenerationPolling"
import { toast } from "@/components/ui/use-toast"

export default function VideoGenerationPage() {
  const [file, setFile] = useState<File | null>(null)
  const [visualStyle, setVisualStyle] = useState("waveform")
  const [colorTheme, setColorTheme] = useState("purple")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [showLyrics, setShowLyrics] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 使用MP4视频生成轮询Hook
  const {
    isLoading,
    isSuccess,
    isError,
    result,
    error,
    generateMp4,
    retry,
    elapsedTime,
    attempts,
    progress
  } = useMp4GenerationPolling();

  // 显示错误提示
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Video generation failed",
        description: error.message || "An error occurred during video generation",
        variant: "destructive"
      });
    }
  }, [isError, error]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleGenerate = async () => {
    if (!file) return

    try {
      // 准备参数
      const params = {
        taskId: `task-${Date.now()}`, // 生成唯一的任务ID
        audioId: '', // 此处应该使用实际的音频ID，如果是上传的文件可能需要先上传
        captionMode: showLyrics ? 'lyrics' : 'none'
      };
      
      // 启动生成任务
      await generateMp4(params);
      
    } catch (error) {
      console.error('Error generating video:', error);
      toast({ 
        title: "Video generation failed", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive" 
      });
    }
  }

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 relative">
      <BackgroundAnimation />
      <Header />

      <main className="flex-grow pt-16 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            MP4 Video Generation
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Upload & Settings */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-400" />
                  Upload Audio
                </h2>

                <div
                  className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors duration-300 mb-4"
                  onClick={handleUploadClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="audio/*"
                    className="hidden"
                  />

                  <Music className="h-12 w-12 mx-auto text-purple-400 mb-4" />

                  {file ? (
                    <div>
                      <p className="text-gray-200 font-medium mb-1">{file.name}</p>
                      <p className="text-sm text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-200 font-medium mb-1">Drag & drop or click to upload</p>
                      <p className="text-sm text-gray-400">Supports MP3, WAV, FLAC, AAC (max 10MB)</p>
                    </div>
                  )}
                </div>

                <Tabs defaultValue="style" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="style">Visual Style</TabsTrigger>
                    <TabsTrigger value="text">Text & Captions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="style" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="visual-style">Visualization Style</Label>
                      <Select value={visualStyle} onValueChange={setVisualStyle}>
                        <SelectTrigger id="visual-style" className="border-purple-500/30 bg-black/40 text-gray-200">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                          <SelectItem value="waveform">Audio Waveform</SelectItem>
                          <SelectItem value="spectrum">Spectrum Analyzer</SelectItem>
                          <SelectItem value="particles">Particle System</SelectItem>
                          <SelectItem value="geometric">Geometric Patterns</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color-theme">Color Theme</Label>
                      <Select value={colorTheme} onValueChange={setColorTheme}>
                        <SelectTrigger id="color-theme" className="border-purple-500/30 bg-black/40 text-gray-200">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                          <SelectItem value="purple">Purple Gradient</SelectItem>
                          <SelectItem value="blue">Blue Ocean</SelectItem>
                          <SelectItem value="red">Red Energy</SelectItem>
                          <SelectItem value="green">Green Nature</SelectItem>
                          <SelectItem value="rainbow">Rainbow Spectrum</SelectItem>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="background">Background Style</Label>
                      <Select defaultValue="gradient">
                        <SelectTrigger id="background" className="border-purple-500/30 bg-black/40 text-gray-200">
                          <SelectValue placeholder="Select background" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                          <SelectItem value="gradient">Gradient Background</SelectItem>
                          <SelectItem value="solid">Solid Color</SelectItem>
                          <SelectItem value="particles">Particle Background</SelectItem>
                          <SelectItem value="noise">Noise Texture</SelectItem>
                          <SelectItem value="dark">Dark Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg border border-purple-500/30 bg-black/40 hover:border-purple-500/50 cursor-pointer transition-all duration-200">
                        <div className="aspect-video rounded bg-gradient-to-br from-purple-600 to-blue-600 mb-1"></div>
                        <p className="text-xs text-center text-gray-400">Purple</p>
                      </div>
                      <div className="p-2 rounded-lg border border-purple-500/10 bg-black/40 hover:border-purple-500/50 cursor-pointer transition-all duration-200">
                        <div className="aspect-video rounded bg-gradient-to-br from-blue-600 to-cyan-600 mb-1"></div>
                        <p className="text-xs text-center text-gray-400">Blue</p>
                      </div>
                      <div className="p-2 rounded-lg border border-purple-500/10 bg-black/40 hover:border-purple-500/50 cursor-pointer transition-all duration-200">
                        <div className="aspect-video rounded bg-gradient-to-br from-red-600 to-orange-600 mb-1"></div>
                        <p className="text-xs text-center text-gray-400">Red</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Video Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter video title"
                        className="border-purple-500/30 bg-black/40 text-gray-200 focus:border-purple-500"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtitle/Artist Name</Label>
                      <Input
                        id="subtitle"
                        placeholder="Enter subtitle or artist name"
                        className="border-purple-500/30 bg-black/40 text-gray-200 focus:border-purple-500"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-lyrics"
                        checked={showLyrics}
                        onChange={(e) => setShowLyrics(e.target.checked)}
                        className="rounded border-purple-500/30 bg-black/40 text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="show-lyrics">Show lyrics as subtitles</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="font-style">Font Style</Label>
                      <Select defaultValue="modern">
                        <SelectTrigger id="font-style" className="border-purple-500/30 bg-black/40 text-gray-200">
                          <SelectValue placeholder="Select font style" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                          <SelectItem value="modern">Modern Sans-Serif</SelectItem>
                          <SelectItem value="elegant">Elegant Serif</SelectItem>
                          <SelectItem value="bold">Bold Display</SelectItem>
                          <SelectItem value="minimal">Minimal Clean</SelectItem>
                          <SelectItem value="creative">Creative Handwritten</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleGenerate}
                  disabled={!file || isLoading}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-5 w-5" />
                      Generate Video
                    </>
                  )}
                </Button>

                {isLoading && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Processing...</span>
                      <span className="text-gray-400">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-gray-400 mt-1">
                      Time elapsed: {Math.floor(elapsedTime)}s
                    </div>
                  </div>
                )}
                
                {isError && (
                  <div className="mt-4 p-3 rounded-md bg-red-900/20 border border-red-800/30 text-red-200 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Generation failed</p>
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
                <h3 className="font-medium text-gray-200 mb-3">Video Generation Features</h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-start gap-2">
                    <Palette className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>Beautiful audio visualizations that react to your music</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Type className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>Customizable text overlays for title, artist, and lyrics</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Settings className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>Multiple visual styles and color themes to choose from</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ImageIcon className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p>High-quality MP4 output perfect for social media</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-8">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <Video className="h-5 w-5 mr-2 text-purple-400" />
                  Video Preview
                </h2>

                {!isSuccess ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-purple-500/10 bg-black/20 aspect-video">
                    <Video className="h-16 w-16 text-purple-500/30 mb-4" />
                    <p className="text-gray-400 text-center max-w-md">
                      {file
                        ? "Click 'Generate Video' to create your music visualization"
                        : "Upload an audio file to create a video visualization"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        poster="/placeholder.svg?height=720&width=1280"
                        onClick={togglePlayback}
                      >
                        <source src={result?.videoUrl || "#"} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>

                      {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-16 w-16 rounded-full border-white/50 bg-black/50 text-white hover:bg-black/70"
                            onClick={togglePlayback}
                          >
                            <Play className="h-8 w-8" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-200">
                          {title || file?.name.replace(/\.[^/.]+$/, "") || "Music Visualization"}
                        </h3>
                        <p className="text-sm text-gray-400">{subtitle || "Generated with MusicAI"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="border-purple-500/30 hover:bg-purple-900/20 text-gray-300"
                          onClick={retry}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Regenerate
                        </Button>
                        <Button 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                          onClick={() => window.open(result?.videoUrl, '_blank')}
                          disabled={!result?.videoUrl}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download MP4
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        <h3 className="font-medium text-gray-200 mb-2">Video Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-400">Resolution</p>
                            <p className="text-gray-200">1280 x 720 (HD)</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Duration</p>
                            <p className="text-gray-200">3:24</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Format</p>
                            <p className="text-gray-200">MP4 (H.264)</p>
                          </div>
                          <div>
                            <p className="text-gray-400">File Size</p>
                            <p className="text-gray-200">~24 MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                        <h3 className="font-medium text-gray-200 mb-2">Share Your Video</h3>
                        <p className="text-sm text-gray-400 mb-3">
                          Download and share your video on social media platforms:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-black/40 text-gray-300 border-purple-500/30">
                            YouTube
                          </Badge>
                          <Badge variant="outline" className="bg-black/40 text-gray-300 border-purple-500/30">
                            Instagram
                          </Badge>
                          <Badge variant="outline" className="bg-black/40 text-gray-300 border-purple-500/30">
                            TikTok
                          </Badge>
                          <Badge variant="outline" className="bg-black/40 text-gray-300 border-purple-500/30">
                            Facebook
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-purple-500/10 bg-black/20">
                      <h3 className="font-medium text-gray-200 mb-3">Try Different Styles</h3>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {["Waveform", "Spectrum", "Particles", "Geometric", "Minimal"].map((style, index) => (
                          <div
                            key={index}
                            className="p-2 rounded-lg border border-purple-500/10 bg-black/40 hover:border-purple-500/50 cursor-pointer transition-all duration-200"
                          >
                            <div className="aspect-video rounded bg-gradient-to-br from-purple-900/50 to-blue-900/50 mb-1"></div>
                            <p className="text-xs text-center text-gray-400">{style}</p>
                          </div>
                        ))}
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

