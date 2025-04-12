"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Music, User, LogOut, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { user, profile, signOut, isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [scrolled])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl py-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-slate-500/30 after:to-transparent after:shadow-[0_1px_3px_0px_rgba(94,94,120,0.2)]"
          : "bg-transparent py-3"
      }`}
    >
      <div className="container flex items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Music
            className={`h-5 w-5 ${scrolled ? "text-purple-400" : "text-white"} group-hover:text-purple-300 transition-colors duration-300`}
          />
          <span
            className={`text-base font-bold ${scrolled ? "text-gray-200" : "text-white"} group-hover:text-purple-300 transition-colors duration-300`}
          >
            MusicAI
          </span>
        </Link>
        <nav className="hidden md:flex gap-5">
          <Link
            href="/text-to-music"
            className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
          >
            Text to Music
          </Link>
          <Link
            href="/lyrics-generation"
            className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
          >
            Lyrics
          </Link>
          <Link
            href="/vocal-separation"
            className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
          >
            Vocal Separation
          </Link>
          {isAuthenticated && (
            <Link
              href="/my-music"
              className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
            >
              My Music
            </Link>
          )}
        </nav>
        <div className="hidden md:flex gap-4 items-center">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-4 ${scrolled ? "text-gray-300 hover:bg-purple-950/30" : "text-white hover:bg-white/10"} hover:text-purple-400 transition-all duration-300 flex items-center gap-2`}
                >
                  <User className="h-4 w-4" />
                  <span>{profile?.username || user?.email?.split('@')[0] || 'Account'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-purple-500/20 bg-black/95 backdrop-blur-xl text-gray-200">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-music" className="flex items-center gap-2 cursor-pointer">
                    <Music className="h-4 w-4" />
                    <span>My Music</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700/50" />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-4 ${scrolled ? "text-gray-300 hover:bg-purple-950/30" : "text-white hover:bg-white/10"} hover:text-purple-400 transition-all duration-300`}
                asChild
              >
                <Link href="/auth/login">Log In</Link>
              </Button>
              <Button
                size="sm"
                className={`h-8 px-4 ${
                  scrolled
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-glow-purple-sm"
                    : "bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20"
                } transition-all duration-300 hover:shadow-glow-purple`}
                asChild
              >
                <Link href="/auth/login?tab=register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden ${scrolled ? "text-gray-300 hover:bg-purple-950/30" : "text-white hover:bg-white/10"} hover:text-purple-400 transition-all duration-300`}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-purple-500/20 bg-black/95 backdrop-blur-xl text-gray-200">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/text-to-music"
                className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Text to Music
              </Link>
              <Link
                href="/lyrics-generation"
                className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Lyrics
              </Link>
              <Link
                href="/vocal-separation"
                className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Vocal Separation
              </Link>
              {isAuthenticated && (
                <Link
                  href="/my-music"
                  className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
                >
                  My Music
                </Link>
              )}
              <div className="flex flex-col gap-2 mt-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start border-purple-500/30 text-gray-300 hover:text-purple-400 hover:bg-purple-950/30 gap-2"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-purple-500/30 text-gray-300 hover:text-purple-400 hover:bg-purple-950/30"
                      asChild
                    >
                      <Link href="/auth/login">Log In</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      asChild
                    >
                      <Link href="/auth/login?tab=register">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

