"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import {
  Play,
  Music,
  Sparkles,
  Zap,
  Users,
  HelpCircle,
  FileText,
  Mic,
  RefreshCw,
  FileAudio,
  Video,
  Globe,
  Gamepad2,
  Radio,
  Briefcase,
  Droplet,
  ArrowRight,
  Award,
  Shield,
  Pause,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MusicGenerator } from "@/components/music-generator"
import Header from "@/components/header"
import Footer from "@/components/footer"
import TestimonialCard from "@/components/testimonial-card"
import BackgroundAnimation from "@/components/background-animation"
import FloatingPlayer, { type MusicTrack } from "@/components/floating-player"
import Link from "next/link"
import UsageSteps from "@/components/usage-steps"
import { toast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'

// 音乐数据类型
interface MusicData {
  id: string
  title: string
  audio_url: string
  image_url?: string
  duration: number
  tags: string[]
  created_at: string
}

export default function Home() {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [musicTracks, setMusicTracks] = useState<MusicData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 从Supabase加载音乐数据
  useEffect(() => {
    async function loadMusicData() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('music_tracks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          console.error('Failed to fetch music data:', error)
          return
        }

        // 处理数据，确保tags字段是数组
        const processedData = (data || []).map(track => {
          // 处理tags字段，确保转换为数组格式
          let processedTags: string[] = []
          
          // 如果tags已经是数组，直接使用
          if (Array.isArray(track.tags)) {
            processedTags = track.tags
          } 
          // 如果tags是字符串
          else if (typeof track.tags === 'string') {
            // 移除可能存在的外层引号
            let tagsStr = track.tags.trim()
            if ((tagsStr.startsWith('"') && tagsStr.endsWith('"')) || 
                (tagsStr.startsWith("'") && tagsStr.endsWith("'"))) {
              tagsStr = tagsStr.substring(1, tagsStr.length - 1)
            }
            
            try {
              // 尝试解析JSON字符串
              const parsed = JSON.parse(tagsStr)
              if (Array.isArray(parsed)) {
                processedTags = parsed
              } else if (typeof parsed === 'string') {
                // 如果解析后还是字符串，再按分隔符分割
                processedTags = parsed.split(/,\s*|\s+/).filter(Boolean)
              } else {
                processedTags = [parsed.toString()]
              }
            } catch (e) {
              // 如果不是有效的JSON，按逗号或空格分割
              if (tagsStr.includes(',')) {
                // 优先使用逗号作为分隔符
                processedTags = tagsStr.split(',').map((tag: string) => tag.trim()).filter(Boolean)
              } else {
                // 其次使用空格作为分隔符
                processedTags = tagsStr.split(/\s+/).filter(Boolean)
              }
            }
          } 
          // 如果tags是对象或其他类型，转为字符串
          else if (track.tags !== null && track.tags !== undefined) {
            processedTags = [String(track.tags)]
          }
          
          // 打印调试信息
          console.log(`处理音乐 ${track.id}:`, {
            原始tags: track.tags,
            处理后tags: processedTags
          })
          
          return {
            ...track,
            tags: processedTags
          }
        })

        setMusicTracks(processedData)
      } catch (err) {
        console.error('Error loading music data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadMusicData()
  }, [])

  const handlePlayTrack = (track: MusicData) => {
    // 格式化时长显示
    const formatDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // 获取所有标签作为风格
    const style = Array.isArray(track.tags) && track.tags.length > 0 
      ? track.tags.join(' · ') 
      : 'Music'

    // 创建音轨对象
    const musicTrack: MusicTrack = {
      id: track.id,
      title: track.title,
      artist: style,
      duration: formatDuration(track.duration),
      cover: track.image_url || "/placeholder.svg",
      audioUrl: track.audio_url
    }

    if (currentTrack && currentTrack.id === track.id) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentTrack(musicTrack)
      setIsPlaying(true)
    }
  }

  const handleClosePlayer = () => {
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // 使用纯数值格式化日期（YYYY-MM-DD）
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 relative overflow-hidden pt-16 md:pt-20 pb-14">
      <BackgroundAnimation />
      <Header />
      <main className="flex-grow relative z-10">
        {/* Hero Section */}

        {/* 修改为更宽的布局，但与导航条宽度一致 */}
        <section className="relative w-full pt-16 pb-12 md:pt-24 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-purple-900/20 to-blue-900/20 z-0" />
          {/* Removed top border to avoid duplication with header border */}
          <div className="container relative z-10 px-4 md:px-6 pt-4 md:pt-6">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_550px] lg:gap-12 xl:grid-cols-[1.3fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-black/30 backdrop-blur-xl px-3 py-1 text-sm text-purple-400 w-fit animate-fadeIn">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  <span>AI-Powered Music Creation</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 animate-gradientFlow">
                  Create Original Songs with AI in Minutes
                </h1>
                <p className="max-w-[600px] text-gray-400 md:text-xl">
                  Turn your creative ideas into fully realized songs with our cutting-edge AI music generation
                  technology. Generate unlimited original music across any genre, style, or mood.
                </p>
                <div className="mt-4 mb-6">
                  <div className="flex flex-wrap gap-4 md:gap-6">
                    <div className="flex items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                        <Users className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="ml-2.5">
                        <p className="font-bold text-white">2M+</p>
                        <p className="text-xs text-gray-400">Global Users</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                        <Award className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="ml-2.5">
                        <p className="font-bold text-white">98%</p>
                        <p className="text-xs text-gray-400">Satisfaction Rate</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                        <Globe className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="ml-2.5">
                        <p className="font-bold text-white">150+</p>
                        <p className="text-xs text-gray-400">Countries</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none">
                      #1 Music AI Tool 2025
                    </Badge>

                    <div className="flex -space-x-2 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="inline-block h-8 w-8 rounded-full border-2 border-black/50 bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden"
                        >
                          <Image
                            src={`/placeholder.svg?height=32&width=32&text=${String.fromCharCode(65 + i)}`}
                            alt={`User ${i + 1}`}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-black/50 bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs font-bold">
                        +2k
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-purple-400 mr-1" />
                      <p className="text-sm text-gray-400">Trusted by professionals worldwide</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-glow-purple transition-all duration-300 hover:shadow-glow-purple-intense"
                  >
                    Start Creating
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-purple-500/30 backdrop-blur-xl bg-black/20 text-gray-200 hover:bg-purple-950/30 transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 shadow-glow-subtle animate-float">
                <MusicGenerator />
              </div>
            </div>
          </div>
        </section>

        {/* Sample Music Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121e] backdrop-blur-sm">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-black/30 backdrop-blur-xl px-3 py-1 text-sm text-purple-400">
                  <Music className="mr-1 h-3.5 w-3.5" />
                  <span>Sample Creations</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  Listen to AI-Generated Music
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Explore music created by our AI across different genres and styles.
                </p>
              </div>
            </div>

            {/* Music Tracks Grid */}
            <div className="mt-10">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-12 w-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>
              ) : musicTracks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No music tracks available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {musicTracks.map((track) => (
                    <div
                      key={track.id}
                      className={`rounded-lg border ${isPlaying && currentTrack?.id === track.id ? 'border-purple-500' : 'border-purple-500/20'} bg-black/30 backdrop-blur-xl p-2 hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.02] group cursor-pointer`}
                      onClick={() => handlePlayTrack(track)}
                    >
                      <div className="relative aspect-square w-full mb-2 overflow-hidden rounded-md">
                        <Image
                          src={track.image_url || "/placeholder.svg"}
                          alt={track.title}
                          fill
                          className={`object-cover transition-transform duration-500 ${isPlaying && currentTrack?.id === track.id ? 'scale-105' : 'group-hover:scale-105'}`}
                        />
                        <div className={`absolute inset-0 bg-black/50 ${isPlaying && currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 flex items-center justify-center`}>
                          <Button
                            size="icon"
                            className="h-10 w-10 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white"
                          >
                            {isPlaying && currentTrack?.id === track.id ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <h3 className={`font-medium text-sm ${isPlaying && currentTrack?.id === track.id ? 'text-purple-300' : 'text-gray-200 group-hover:text-purple-300'} transition-colors duration-300 truncate`}>
                          {track.title}
                        </h3>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-400 truncate">
                            {formatDate(track.created_at)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                        <div className="pt-1 flex flex-wrap gap-1">
                          {Array.isArray(track.tags) && track.tags.length > 0 && 
                            track.tags.slice(0, 3).map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/20 text-[10px]"
                              >
                                {tag}
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center mt-8">
                <Link href="/music-library">
                  <Button className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:bg-black/50 hover:border-purple-500/30 text-gray-300 transition-all duration-300">
                    Browse All Tracks
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 relative">
          <div className="absolute inset-0 bg-[#0a0a0f] z-0" />
          <div className="absolute inset-0 bg-grid-white/[0.02] z-0" />
          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-black/30 backdrop-blur-xl px-3 py-1 text-sm text-purple-400">
                  <Zap className="mr-1 h-3.5 w-3.5" />
                  <span>Powerful Features</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  Advanced AI Music Tools
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Our comprehensive suite of AI-powered music tools gives you everything you need to create, edit, and
                  share your music.
                </p>
              </div>
            </div>

            {/* Feature 1 - Left image, right text */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-24">
              <div className="w-full md:w-2/5 order-2 md:order-1">
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 shadow-glow-subtle hover:shadow-glow-purple transition-all duration-500 h-full">
                  <Image
                    src="/images/features/text-to-music.jpg"
                    width={400}
                    height={300}
                    alt="Text-to-Music Generation"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-3/5 order-1 md:order-2">
                <div className="space-y-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-200">Text-to-Music Generation</h3>
                  <p className="text-gray-400">
                    Simply describe the music style, mood, or scene you want, and our AI music generator will create
                    original music that matches your requirements.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Generate from simple descriptions</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Multiple styles available</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>No musical expertise needed</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/text-to-music">
                      <Button className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:bg-purple-900/30 hover:border-purple-500/40 text-gray-300 transition-all duration-300">
                        Try Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Right image, left text */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-24">
              <div className="w-full md:w-3/5">
                <div className="space-y-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                    <Mic className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-200">AI Lyrics Generation</h3>
                  <p className="text-gray-400">
                    Generate matching lyrics based on your theme or keywords, eliminating the struggle of writing lyrics
                    yourself.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Multiple lyrical styles</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Automatically matches music rhythm</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Supports multiple languages</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/lyrics-generation">
                      <Button className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:bg-purple-900/30 hover:border-purple-500/40 text-gray-300 transition-all duration-300">
                        Generate Lyrics <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/5">
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 shadow-glow-subtle hover:shadow-glow-purple transition-all duration-500 h-full">
                  <Image
                    src="/images/features/lyrics-generation.jpg"
                    width={400}
                    height={300}
                    alt="AI Lyrics Generation"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Feature 3 - Left image, right text */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-24">
              <div className="w-full md:w-2/5 order-2 md:order-1">
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 shadow-glow-subtle hover:shadow-glow-purple transition-all duration-500 h-full">
                  <Image
                    src="/images/features/vocal-separation.jpg"
                    width={400}
                    height={300}
                    alt="Vocal Separation"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-3/5 order-1 md:order-2">
                <div className="space-y-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                    <Music className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-200">Vocal Separation</h3>
                  <p className="text-gray-400">
                    Split generated music into separate vocal and instrumental tracks for further editing and creative
                    flexibility.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>High-quality track separation</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Fast processing</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Download tracks separately</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/vocal-separation">
                      <Button className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:bg-purple-900/30 hover:border-purple-500/40 text-gray-300 transition-all duration-300">
                        Separate Audio <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 - Right image, left text */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-24">
              <div className="w-full md:w-3/5">
                <div className="space-y-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                    <RefreshCw className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-200">Music Extension</h3>
                  <p className="text-gray-400">
                    Intelligently extend existing audio clips while maintaining stylistic consistency to create longer,
                    complete works.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Seamless extension of audio</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Maintains consistent style</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Adjustable parameters</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/music-extension">
                      <Button className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:bg-purple-900/30 hover:border-purple-500/40 text-gray-300 transition-all duration-300">
                        Extend Music <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/5">
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 shadow-glow-subtle hover:shadow-glow-purple transition-all duration-500 h-full">
                  <Image
                    src="/images/features/music-extension.jpg"
                    width={400}
                    height={300}
                    alt="Music Extension"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Feature 5 - Left image, right text */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-24">
              <div className="w-full md:w-2/5 order-2 md:order-1">
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 shadow-glow-subtle hover:shadow-glow-purple transition-all duration-500 h-full">
                  <Image
                    src="/images/features/wav-conversion.jpg"
                    width={400}
                    height={300}
                    alt="WAV Conversion"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-3/5 order-1 md:order-2">
                <div className="space-y-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                    <FileAudio className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-200">WAV Conversion</h3>
                  <p className="text-gray-400">
                    Convert AI-generated music to professional-grade WAV format for higher quality, suitable for
                    professional production.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>High-quality lossless conversion</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Professional audio format</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Preserves audio details</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/wav-conversion">
                      <Button className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:bg-purple-900/30 hover:border-purple-500/40 text-gray-300 transition-all duration-300">
                        Convert Audio <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 6 - Right image, left text */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-3/5">
                <div className="space-y-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm">
                    <Video className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-200">MP4 Video Generation</h3>
                  <p className="text-gray-400">
                    Automatically create video content based on AI-generated music, adding visual effects perfect for
                    social media sharing.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Automatic visual effects</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Subtitle support</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                      <span>Multiple visual styles</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/video-generation">
                      <Button className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:bg-purple-900/30 hover:border-purple-500/40 text-gray-300 transition-all duration-300">
                        Create Video <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/5">
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 shadow-glow-subtle hover:shadow-glow-purple transition-all duration-500 h-full">
                  <Image
                    src="/images/features/video-generation.jpg"
                    width={400}
                    height={300}
                    alt="MP4 Video Generation"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>

            {/* AI Music for Every Need Section */}
            <div className="mt-24">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="space-y-2">
                  <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-black/30 backdrop-blur-xl px-3 py-1 text-sm text-purple-400">
                    <Users className="mr-1 h-3.5 w-3.5" />
                    <span>Use Cases</span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                    AI Music for Every Need
                  </h2>
                  <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                    Our AI music generator provides perfect solutions for a wide range of applications and scenarios
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Social Media Content */}
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm mb-4">
                      <Globe className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-purple-300 transition-colors duration-300 mb-2">
                      Social Media Content
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Create engaging background music for TikTok, Instagram, YouTube and other platforms to boost
                      content appeal and interaction.
                    </p>
                  </div>
                </div>

                {/* Games & Applications */}
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm mb-4">
                      <Gamepad2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-purple-300 transition-colors duration-300 mb-2">
                      Games & Applications
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Develop immersive music and sound effects for games and applications to enhance user experience
                      and emotional engagement.
                    </p>
                  </div>
                </div>

                {/* Video Production */}
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm mb-4">
                      <Video className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-purple-300 transition-colors duration-300 mb-2">
                      Video Production
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Generate professional background music for ads, promotional videos, and short films to elevate
                      production quality.
                    </p>
                  </div>
                </div>

                {/* Podcasts & Audio */}
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm mb-4">
                      <Radio className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-purple-300 transition-colors duration-300 mb-2">
                      Podcasts & Audio
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Create professional intro music, transition sounds, and background tracks for podcasts and audio
                      content.
                    </p>
                  </div>
                </div>

                {/* Business Marketing */}
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm mb-4">
                      <Briefcase className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-purple-300 transition-colors duration-300 mb-2">
                      Business Marketing
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Develop unique audio identities for brands to use in advertising, presentations, and brand
                      promotions.
                    </p>
                  </div>
                </div>

                {/* Creative Projects */}
                <div className="rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-6 hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm mb-4">
                      <Droplet className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-purple-300 transition-colors duration-300 mb-2">
                      Creative Projects
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Get inspiration and professional music support for personal creative endeavors, art projects, and
                      indie films.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Guide Section - Illustration Style */}
        <UsageSteps />

        {/* Testimonials Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121e] backdrop-blur-sm">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-black/30 backdrop-blur-xl px-3 py-1 text-sm text-purple-400">
                  <Users className="mr-1 h-3.5 w-3.5" />
                  <span>Testimonials</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  What Our Users Say
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Hear from creators who have transformed their musical ideas with our AI platform.
                </p>
              </div>
            </div>
            <div className="mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              <TestimonialCard
                name="Alex Johnson"
                role="Music Producer"
                image="/placeholder.svg?height=100&width=100"
                quote="This AI music generator has completely transformed my workflow. I can now create high-quality backing tracks in minutes instead of hours."
              />
              <TestimonialCard
                name="Sarah Chen"
                role="Content Creator"
                image="/placeholder.svg?height=100&width=100"
                quote="As someone with no musical background, this tool has been a game-changer for my videos. I can create custom soundtracks that perfectly match my content."
              />
              <TestimonialCard
                name="Michael Rodriguez"
                role="Game Developer"
                image="/placeholder.svg?height=100&width=100"
                quote="The ability to generate adaptive music for different game scenarios has added a new dimension to my indie games. My players love the immersive experience."
              />
              <TestimonialCard
                name="Emily Taylor"
                role="Film Student"
                image="/placeholder.svg?height=100&width=100"
                quote="Creating original scores for my student films used to be impossible with my budget. Now I can make professional soundtracks that elevate my storytelling."
              />
              <TestimonialCard
                name="David Kim"
                role="Podcast Host"
                image="/placeholder.svg?height=100&width=100"
                quote="The royalty-free music I generate with this tool gives my podcast a professional edge without the licensing headaches."
              />
              <TestimonialCard
                name="Lisa Patel"
                role="Yoga Instructor"
                image="/placeholder.svg?height=100&width=100"
                quote="I create custom meditation and yoga music for my classes. My students always ask where I find such perfect ambient tracks."
              />
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="w-full py-12 md:py-24 relative">
          <div className="absolute inset-0 bg-[#0a0a0f] z-0" />
          <div className="absolute inset-0 bg-grid-white/[0.02] z-0" />
          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-black/30 backdrop-blur-xl px-3 py-1 text-sm text-purple-400">
                  <HelpCircle className="mr-1 h-3.5 w-3.5" />
                  <span>FAQs</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  Frequently Asked Questions
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Find answers to common questions about our AI music generator.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-5xl mt-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                  value="item-1"
                  className="border border-purple-500/20 bg-black/30 backdrop-blur-xl rounded-lg mb-4 hover:border-purple-500/40 transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 text-gray-200">
                    Do I need musical experience to use this platform?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-gray-400">
                    No, our AI music generator is designed to be accessible to everyone, regardless of musical
                    background. The intuitive interface and preset options make it easy to create professional-sounding
                    music without prior experience.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-2"
                  className="border border-purple-500/20 bg-black/30 backdrop-blur-xl rounded-lg mb-4 hover:border-purple-500/40 transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 text-gray-200">
                    Can I use the generated music commercially?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-gray-400">
                    Yes, all music created with our platform is royalty-free and can be used for commercial purposes. We
                    offer different licensing options depending on your needs, from personal projects to enterprise
                    solutions.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-3"
                  className="border border-purple-500/20 bg-black/30 backdrop-blur-xl rounded-lg mb-4 hover:border-purple-500/40 transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 text-gray-200">
                    What file formats can I export my music in?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-gray-400">
                    Our platform supports exporting in various formats including MP3, WAV, FLAC, and MIDI. You can also
                    export individual tracks or stems for further editing in your preferred digital audio workstation.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-4"
                  className="border border-purple-500/20 bg-black/30 backdrop-blur-xl rounded-lg mb-4 hover:border-purple-500/40 transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 text-gray-200">How does the AI create music?</AccordionTrigger>
                  <AccordionContent className="px-4 text-gray-400">
                    Our AI has been trained on millions of music pieces across various genres and styles. It uses deep
                    learning algorithms to understand patterns, harmonies, and structures in music, allowing it to
                    generate original compositions based on your input parameters.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-5"
                  className="border border-purple-500/20 bg-black/30 backdrop-blur-xl rounded-lg mb-4 hover:border-purple-500/40 transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 text-gray-200">
                    Can I edit the music after it's generated?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-gray-400">
                    Yes, you can edit the generated music directly in our platform with basic controls, or export it to
                    your preferred digital audio workstation for more advanced editing. We also provide MIDI export
                    options for maximum flexibility.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-6"
                  className="border border-purple-500/20 bg-black/30 backdrop-blur-xl rounded-lg hover:border-purple-500/40 transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 text-gray-200">
                    What subscription plans do you offer?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-gray-400">
                    We offer a range of subscription plans to suit different needs, from a free tier with basic features
                    to premium plans for professional creators. Visit our pricing page for detailed information on
                    features and limitations for each plan.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-r from-purple-900 to-blue-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] z-0" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                  Start Creating Amazing Music Today
                </h2>
                <p className="mx-auto max-w-[700px] text-blue-100/80 md:text-xl">
                  Join thousands of creators who are transforming their ideas into beautiful music with our AI platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-white text-purple-900 hover:bg-white/90 shadow-glow-white transition-all duration-300"
                >
                  Get Started for Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 transition-all duration-300"
                >
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Floating Music Player */}
      {currentTrack && (
        <FloatingPlayer 
          track={currentTrack} 
          onClose={handleClosePlayer} 
          isPlaying={isPlaying}
          onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
        />
      )}
    </div>
  )
}

