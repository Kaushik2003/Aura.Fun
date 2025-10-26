'use client'

import { Rocket, Users, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Rocket,
    title: "Instant Launch",
    description:
      "Deploy your creator token in seconds with customizable parameters and automatic collateral management.",
  },
  {
    icon: Users,
    title: "Community Minting",
    description: "Fans mint tokens by providing collateral, creating sustainable economic models for creator growth.",
  },
  {
    icon: TrendingUp,
    title: "Dynamic Pricing",
    description: "Aura-based peg system ensures fair pricing that reflects community engagement and vault health.",
  },
  {
    icon: Shield,
    title: "Collateral Protection",
    description: "Multi-stage vault progression with health monitoring keeps the ecosystem stable and secure.",
  },
  {
    icon: Zap,
    title: "Stage Progression",
    description: "Unlock new capacity tiers as your community grows, rewarding early supporters and creators.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Monitor vault performance, community metrics, and token economics with live dashboards.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-black border-t border-white/10 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-6xl md:text-7xl font-black text-white tracking-tight">Powerful Features</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to launch and manage your creator token ecosystem
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 hover:border-emerald-400/50 hover:bg-white/10 transition-all duration-300"
            >
              <feature.icon className="h-12 w-12 text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
