import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="overflow-hidden border border-purple-500/20 bg-black/30 backdrop-blur-xl hover:shadow-glow-subtle transition-all duration-300 hover:scale-[1.02] group">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 backdrop-blur-sm group-hover:bg-purple-800/50 transition-colors duration-300">
            {icon}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-200 group-hover:text-purple-300 transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

