"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

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
            href="#"
            className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
          >
            Features
          </Link>
          <Link
            href="#"
            className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
          >
            Pricing
          </Link>
          <Link
            href="#"
            className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
          >
            Showcase
          </Link>
          <Link
            href="#"
            className={`text-sm font-medium ${scrolled ? "text-gray-300" : "text-white/90"} hover:text-purple-400 transition-colors duration-300`}
          >
            Resources
          </Link>
        </nav>
        <div className="hidden md:flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-4 ${scrolled ? "text-gray-300 hover:bg-purple-950/30" : "text-white hover:bg-white/10"} hover:text-purple-400 transition-all duration-300`}
          >
            Log In
          </Button>
          <Button
            size="sm"
            className={`h-8 px-4 ${
              scrolled
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-glow-purple-sm"
                : "bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20"
            } transition-all duration-300 hover:shadow-glow-purple`}
          >
            Sign Up
          </Button>
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
                href="#"
                className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Features
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Pricing
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Showcase
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Resources
              </Link>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-purple-500/30 text-gray-300 hover:text-purple-400 hover:bg-purple-950/30"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Sign Up
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

