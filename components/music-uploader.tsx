"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Music, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface MusicTrack {
  id: string
  title: string
  audio_url: string
  duration: number
  image_url?: string
}

interface MusicUploaderProps {
  onSelect: (track: MusicTrack | File) => void
  selectedTrack?: MusicTrack | File
  className?: string
}

export function MusicUploader({ onSelect, selectedTrack, className = "" }: MusicUploaderProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('id, title, audio_url, duration, image_url')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTracks(data || [])
    } catch (error) {
      console.error('Error fetching tracks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelect(e.target.files[0])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library">Music Library</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredTracks.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No tracks found
                </div>
              ) : (
                filteredTracks.map((track) => (
                  <Button
                    key={track.id}
                    variant={selectedTrack && 'id' in selectedTrack && selectedTrack.id === track.id ? "default" : "ghost"}
                    className="w-full justify-start space-x-3"
                    onClick={() => onSelect(track)}
                  >
                    <Music className="h-5 w-5 text-purple-400" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{track.title}</div>
                      <div className="text-xs text-gray-400">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="upload">
          <div
            className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors duration-300"
            onClick={handleUploadClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />

            <Upload className="h-12 w-12 mx-auto text-purple-400 mb-4" />

            {selectedTrack && 'name' in selectedTrack ? (
              <div>
                <p className="text-gray-200 font-medium mb-1">{selectedTrack.name}</p>
                <p className="text-sm text-gray-400">{(selectedTrack.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-200 font-medium mb-1">Drag & drop or click to upload</p>
                <p className="text-sm text-gray-400">Supports MP3, WAV, FLAC, AAC (max 10MB)</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 