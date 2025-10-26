'use client'

export function StatsSection() {
  return (
    <section id="stats" className="relative bg-black border-t border-white/10 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <h2 className="text-6xl md:text-7xl font-black text-white tracking-tight">Why Choose AuraFun?</h2>

            <div className="space-y-8">
              {[
                {
                  title: "For Creators",
                  items: ["Launch tokens instantly", "Build loyal communities", "Earn from growth"],
                },
                {
                  title: "For Fans",
                  items: ["Support creators directly", "Earn token rewards", "Participate in governance"],
                },
                {
                  title: "For Everyone",
                  items: ["Transparent economics", "Secure smart contracts", "Community-driven"],
                },
              ].map((group, idx) => (
                <div key={idx}>
                  <h3 className="font-bold text-xl text-white mb-4">{group.title}</h3>
                  <ul className="space-y-3">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-10 space-y-8">
            <div className="space-y-3">
              <p className="text-sm text-gray-400 font-semibold">Total Community Value</p>
              <p className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                $50M+
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white/5 p-6 border border-white/10 hover:border-emerald-400/50 transition-colors">
                <p className="text-sm text-gray-400 mb-2 font-semibold">Active Creators</p>
                <p className="text-3xl font-black text-emerald-400">2.5K+</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-6 border border-white/10 hover:border-cyan-400/50 transition-colors">
                <p className="text-sm text-gray-400 mb-2 font-semibold">Avg. Vault Health</p>
                <p className="text-3xl font-black text-cyan-400">158%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
