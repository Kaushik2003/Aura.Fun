"use client"

import { ChevronRight, Settings } from "lucide-react"

const carouselItems = [
  {
    id: 1,
    avatar: "👩‍🎨",
    name: "Felicia",
    background: "bg-purple-100",
    text: "FEL",
    description: "Creative designer with colorful style"
  },
  {
    id: 2,
    avatar: "👨‍💻",
    name: "Alex",
    background: "bg-gray-100",
    text: "AJS",
    description: "Tech enthusiast with green glasses"
  },
  {
    id: 3,
    avatar: "👨‍🎓",
    name: "Marcus",
    background: "bg-purple-100",
    text: "mare",
    description: "Curly-haired developer with smartphone"
  }
]

export function TrendingBlocks() {

  return (
    <section className="relative bg-black py-24 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-gray-600 text-sm text-gray-300 mb-6">
            Gallery
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Trending Creators
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            "Where Influence Meets Value" - Simple, memorable, captures the core concept
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-12 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full">
              Latest Creators
            </span>
          </div>
          
          <h3 className="text-3xl font-bold text-white mb-3">
            Creator Card
          </h3>
          

          {/* Cards Display */}
          <div className="flex gap-6 justify-center">
            {carouselItems.map((item) => (
              <div key={item.id} className="flex-shrink-0">
                <div className={`${item.background} rounded-xl p-6 text-center relative overflow-hidden w-64 h-80`}>
                  <div className="text-6xl mb-4">{item.avatar}</div>
                  <div className="absolute top-4 right-4 text-white/60 text-lg font-bold">
                    {item.text}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">{item.name}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {carouselItems.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h3 className="text-3xl font-bold text-white">
              Each Creator is Important
            </h3>
          </div>
          
          <p className="text-xl text-gray-300 mb-8">
            Built to <span className="font-bold text-pink-500">run</span>. Built to <span className="font-bold text-pink-500">scale</span>.
          </p>

          {/* Arrows */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col gap-1">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-gray-400"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-gray-400"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-gray-400"></div>
            </div>
          </div>

          {/* CTA Button */}
          <a 
            href="/vaults"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Settings className="w-5 h-5" />
            Get started
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
