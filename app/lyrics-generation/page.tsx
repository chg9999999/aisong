"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Copy, Download, Mic, Music, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import Header from "@/components/header"
import BackgroundAnimation from "@/components/background-animation"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"
import { useLyricsGeneration } from "@/hooks"
import { LyricsData } from "@/types/api"

export default function LyricsGenerationPage() {
  const [prompt, setPrompt] = useState("")
  const [generatedLyrics, setGeneratedLyrics] = useState<{version1: string; version2: string}>({
    version1: "",
    version2: ""
  })
  
  // 添加复制状态跟踪
  const [copyStatus, setCopyStatus] = useState<{
    version1: boolean;
    version2: boolean;
  }>({
    version1: false,
    version2: false
  })
  
  // 使用新的歌词生成Hook
  const {
    status,
    data: lyricsData,
    error,
    generateLyrics,
    attempts,
    elapsedTime
  } = useLyricsGeneration();
  
  // 判断是否正在生成中
  const isGenerating = status === 'polling';
  
  // 当歌词数据变化时，更新UI
  useEffect(() => {
    console.log('[歌词页面] lyricsData变化:', lyricsData);
    console.log('[歌词页面] 当前状态:', status);
    
    if (lyricsData && lyricsData.length > 0) {
      console.log('[歌词页面] 歌词数据有效，准备更新UI');
      const version1 = lyricsData[0]?.text || "";
      const version2 = lyricsData.length > 1 ? lyricsData[1]?.text || "" : "";
      
      console.log('[歌词页面] 设置歌词:', { version1, version2 });
      
      setGeneratedLyrics({
        version1,
        version2
      });
      
      // 如果状态是success，显示成功消息
      if (status === 'success') {
        toast({
          title: "Success",
          description: `Lyrics generated in ${elapsedTime.toFixed(1)}s`,
        });
      }
    }
  }, [lyricsData, status, elapsedTime]);
  
  // 当出错时显示错误消息
  useEffect(() => {
    if (status === 'error' && error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during lyrics generation",
        variant: "destructive",
      });
    }
  }, [status, error]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for your lyrics",
        variant: "destructive",
      })
      return
    }

    try {
      // 显示初始加载状态
      toast({
        title: "Generating",
        description: "Starting lyrics generation...",
      })
      
      // 调用新的生成方法 - 只传递prompt参数
      await generateLyrics({ prompt: prompt.trim() });
    } catch (error) {
      console.error("Error generating lyrics:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const handleCopyLyrics = (version: string) => {
    const lyricsToCopy = version === "version1" ? generatedLyrics.version1 : generatedLyrics.version2
    navigator.clipboard.writeText(lyricsToCopy)
    
    // 更新复制状态
    setCopyStatus(prev => ({
      ...prev,
      [version]: true
    }))
    
    // 显示醒目的复制成功浮层
    toast({
      description: "Lyrics copied to clipboard successfully!",
      action: (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      ),
    })
    
    // 重置复制状态（3秒后）
    setTimeout(() => {
      setCopyStatus(prev => ({
        ...prev,
        [version]: false
      }))
    }, 3000)
  }
  
  const handleCreateMusic = (lyricsVersion: string) => {
    // 这里应实现创建音乐的功能
    const lyrics = lyricsVersion === "version1" ? generatedLyrics.version1 : generatedLyrics.version2
    
    toast({
      title: "Creating Music",
      description: `Preparing to create music for ${lyricsVersion === "version1" ? "Version 1" : "Version 2"}`,
    })
    
    // 实际项目中，这里应该导航到音乐生成页面或开始API调用
    console.log("Creating music with lyrics:", lyrics)
  }

  // 计算提示词剩余字符数
  const remainingChars = 200 - prompt.length

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 relative">
      <BackgroundAnimation />
      <Header />

      <main className="flex-grow pt-16 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            AI Lyrics Generation
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Simplified Input */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <Mic className="h-5 w-5 mr-2 text-purple-400" />
                  Lyrics Generator
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="prompt">Describe your lyrics</Label>
                      <span className={`text-xs ${remainingChars < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {remainingChars} characters remaining
                      </span>
                    </div>
                    <Textarea
                      id="prompt"
                      placeholder="Describe the lyrics you want to generate (e.g., 'A song about finding hope in difficult times')"
                      className="border-purple-500/30 bg-black/40 text-gray-200 min-h-[120px] focus:border-purple-500 transition-all duration-300"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      maxLength={200}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Be specific about the theme, tone, and emotion you want to convey in your lyrics.
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim() || prompt.length > 200}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Generating... ({elapsedTime.toFixed(1)}s)
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Lyrics
                      </>
                    )}
                  </Button>
                  
                  {isGenerating && (
                    <div className="w-full bg-gray-700/30 h-1 mt-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full"
                        style={{ 
                          width: `${Math.min((elapsedTime / 8) * 100, 100)}%`,
                          transition: 'width 0.3s ease-in-out',
                          animation: 'pulse 1.5s ease-in-out infinite'
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generation Tips */}
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4">
                <h2 className="text-lg font-bold text-gray-200 mb-3">Tips for Better Results</h2>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Be specific about the theme or story you want to tell</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Mention the desired emotion or mood (sad, uplifting, energetic)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Include genre references if you have a specific style in mind</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Specify structural elements if needed (verses, chorus, bridge)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Panel - Dual Output */}
            <div className="lg:col-span-8">
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 h-full">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                  <Music className="h-5 w-5 mr-2 text-purple-400" />
                  Generated Lyrics
                </h2>

                {isGenerating ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 rounded-lg border border-purple-500/10 bg-black/20">
                    <RefreshCw className="h-16 w-16 text-purple-500/70 mb-4 animate-spin" />
                    <p className="text-gray-400 text-center max-w-md">
                      {elapsedTime < 3 
                        ? "Starting lyrics generation..." 
                        : elapsedTime < 6
                        ? "Creating your lyrics..."
                        : "Almost there, finalizing your lyrics..."}
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                      {elapsedTime.toFixed(1)} seconds elapsed
                    </div>
                  </div>
                ) : (!generatedLyrics.version1 && !generatedLyrics.version2) ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 rounded-lg border border-purple-500/10 bg-black/20">
                    <Music className="h-16 w-16 text-purple-500/30 mb-4" />
                    <p className="text-gray-400 text-center max-w-md">
                      Your generated lyrics will appear here. Enter a prompt and click "Generate Lyrics"
                      to create two different versions of AI-powered song lyrics.
                    </p>
                    <p className="text-gray-500 text-center text-sm mt-2">
                      Generation usually takes 4-8 seconds
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Version 1 */}
                    {generatedLyrics.version1 && (
                      <Card className="border-purple-500/20 bg-black/40">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-md text-gray-200">Version 1</CardTitle>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant={copyStatus.version1 ? "default" : "ghost"}
                                    size="sm" 
                                    onClick={() => handleCopyLyrics("version1")}
                                    className={`h-8 px-2 ${copyStatus.version1 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'text-gray-300 hover:text-white hover:bg-purple-900/20'}`}
                                  >
                                    {copyStatus.version1 ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy to clipboard</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent pr-2">
                            <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                              {generatedLyrics.version1}
                            </pre>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-1 pb-3">
                          <Button 
                            onClick={() => handleCreateMusic("version1")}
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                          >
                            <Music className="h-4 w-4 mr-2" />
                            Create Music with These Lyrics
                          </Button>
                        </CardFooter>
                      </Card>
                    )}

                    {/* Version 2 */}
                    {generatedLyrics.version2 && (
                      <Card className="border-purple-500/20 bg-black/40">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-md text-gray-200">Version 2</CardTitle>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant={copyStatus.version2 ? "default" : "ghost"}
                                    size="sm" 
                                    onClick={() => handleCopyLyrics("version2")}
                                    className={`h-8 px-2 ${copyStatus.version2 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'text-gray-300 hover:text-white hover:bg-purple-900/20'}`}
                                  >
                                    {copyStatus.version2 ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy to clipboard</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent pr-2">
                            <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                              {generatedLyrics.version2}
                            </pre>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-1 pb-3">
                          <Button 
                            onClick={() => handleCreateMusic("version2")}
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                          >
                            <Music className="h-4 w-4 mr-2" />
                            Create Music with These Lyrics
                          </Button>
                        </CardFooter>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEO友好内容区域 - 图文并茂 */}
          <div className="mt-16 relative z-10">
            <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Transform Your Ideas into Professional Lyrics with AI
            </h2>
            
            {/* 顶部特色区块 */}
            <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">
                  AI-Powered Lyrics Generation for Musicians & Songwriters
                </h3>
                <p className="mb-4 text-gray-300">
                  Our advanced AI lyrics generator creates professional-quality song lyrics in seconds. 
                  Simply describe what you want, and our AI will craft complete, structured lyrics 
                  with verses, choruses, and bridges that match your vision.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-black/40 border border-purple-500/20 rounded-lg p-3">
                    <span className="block text-2xl font-bold text-purple-400">1000+</span>
                    <span className="text-xs text-gray-400">Songs Created</span>
                  </div>
                  <div className="bg-black/40 border border-purple-500/20 rounded-lg p-3">
                    <span className="block text-2xl font-bold text-purple-400">10+</span>
                    <span className="text-xs text-gray-400">Music Genres</span>
                  </div>
                  <div className="bg-black/40 border border-purple-500/20 rounded-lg p-3">
                    <span className="block text-2xl font-bold text-purple-400">5s</span>
                    <span className="text-xs text-gray-400">Average Generation Time</span>
                  </div>
                  <div className="bg-black/40 border border-purple-500/20 rounded-lg p-3">
                    <span className="block text-2xl font-bold text-purple-400">100%</span>
                    <span className="text-xs text-gray-400">Original Content</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative w-full max-w-[300px] h-[200px] rounded-xl overflow-hidden border border-purple-500/30">
                  <Image 
                    src="/images/ai-lyrics-generation.jpg" 
                    alt="AI Lyrics Generation" 
                    fill 
                    style={{ objectFit: 'cover' }} 
                  />
                </div>
              </div>
            </div>

            {/* 特性列表 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-black/30 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
                <div className="mb-3 w-12 h-12 bg-purple-900/40 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Creative Variety</h3>
                <p className="text-gray-300 text-sm">
                  Generate multiple versions of lyrics from a single prompt, allowing you to choose
                  the style and tone that best matches your vision.
                </p>
              </div>
              
              <div className="bg-black/30 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
                <div className="mb-3 w-12 h-12 bg-purple-900/40 rounded-lg flex items-center justify-center">
                  <Music className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Direct to Music</h3>
                <p className="text-gray-300 text-sm">
                  One-click transform your favorite lyrics into complete musical compositions with
                  our integrated music generation technology.
                </p>
              </div>
              
              <div className="bg-black/30 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
                <div className="mb-3 w-12 h-12 bg-purple-900/40 rounded-lg flex items-center justify-center">
                  <Copy className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Ready to Use</h3>
                <p className="text-gray-300 text-sm">
                  Copy generated lyrics with one click and use them in your creative process or
                  share them with collaborators for your music projects.
                </p>
              </div>
            </div>
            
            {/* 底部CTA */}
            <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4 text-white">
                Ready to Create Amazing Lyrics?
              </h3>
              <p className="max-w-2xl mx-auto mb-6 text-gray-300">
                Start generating professional-quality lyrics for your songs today. Enter a prompt above or
                explore our advanced features to create complete songs with AI.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Your First Lyrics
                </Button>
                <Button size="lg" variant="outline" className="border-purple-500/40 hover:bg-purple-500/20 text-gray-200">
                  <Music className="h-5 w-5 mr-2" />
                  Explore Music Generation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

