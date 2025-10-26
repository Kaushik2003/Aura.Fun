"use client"

import { Zap } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black/50 backdrop-blur px-6 py-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-black font-bold" />
                            </div>
                            <span className="font-bold text-white">AuraFun</span>
                        </div>
                        <p className="text-sm text-gray-400">Creator tokens on Celo</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Pricing
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Security
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Resources</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Docs
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Community
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Privacy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Terms
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition font-medium">
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400 gap-4">
                    <p>&copy; 2025 AuraFun. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition font-medium">
                            Twitter
                        </a>
                        <a href="#" className="hover:text-white transition font-medium">
                            Discord
                        </a>
                        <a href="#" className="hover:text-white transition font-medium">
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
