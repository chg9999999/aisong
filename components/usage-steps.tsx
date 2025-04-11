import { ArrowRight } from "lucide-react"

export default function UsageSteps() {
  return (
    <section className="w-full py-12 md:py-24 bg-black relative">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-black/30 backdrop-blur-xl px-3 py-1 text-sm text-purple-400">
            <span>Simple 3 Steps</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Create AI Music Effortlessly
          </h2>

          <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
            No musical expertise needed, create high-quality music in three simple steps
          </p>
        </div>

        {/* Process steps - horizontal layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mx-auto mb-20">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center relative p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-transparent border-2 border-purple-500 mb-6">
              <span className="text-2xl font-bold text-purple-400">1</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Choose Your Style</h3>
            <p className="text-gray-400">
              Select your preferred genre, mood, and musical style. Our AI will generate music that perfectly matches
              your preferences.
            </p>

            {/* Arrow - only visible on desktop */}
            <div className="hidden md:block absolute -right-4 top-8 transform translate-x-1/2">
              <ArrowRight className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center relative p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-transparent border-2 border-blue-500 mb-6">
              <span className="text-2xl font-bold text-blue-400">2</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Customize Settings</h3>
            <p className="text-gray-400">
              Adjust tempo, instruments, and arrangement parameters to achieve exactly the musical effect you envision.
            </p>

            {/* Arrow - only visible on desktop */}
            <div className="hidden md:block absolute -right-4 top-8 transform translate-x-1/2">
              <ArrowRight className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-transparent border-2 border-indigo-500 mb-6">
              <span className="text-2xl font-bold text-indigo-400">3</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Generate & Export</h3>
            <p className="text-gray-400">
              Click generate and let our AI create music for you. Download high-quality audio files ready for your
              projects.
            </p>
          </div>
        </div>

        {/* Button positioned BELOW the steps and ABOVE the Testimonials section */}
        <div className="flex justify-center mt-8">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-purple-500/20 transition-all duration-300 text-lg">
            Start Creating Now
          </button>
        </div>
      </div>
    </section>
  )
}

