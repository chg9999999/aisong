import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"

interface TestimonialCardProps {
  name: string
  role: string
  image: string
  quote: string
}

export default function TestimonialCard({ name, role, image, quote }: TestimonialCardProps) {
  return (
    <Card className="overflow-hidden border border-purple-500/20 bg-black/30 backdrop-blur-xl hover:shadow-glow-subtle transition-all duration-300 hover:scale-[1.02] group">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border border-purple-500/20">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-purple-900/50 text-purple-200">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-medium text-gray-200 group-hover:text-purple-300 transition-colors duration-300">
              {name}
            </h3>
            <p className="text-sm text-gray-400">{role}</p>
          </div>
        </div>
        <div className="mt-4 flex">
          <Quote className="h-5 w-5 text-purple-500/50 mr-2 shrink-0 group-hover:text-purple-400 transition-colors duration-300" />
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{quote}</p>
        </div>
      </CardContent>
    </Card>
  )
}

