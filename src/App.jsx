import React, { useState, useEffect } from 'react'

const BRAND_IMAGES = [
  {
    id: 'texture',
    label: 'Brand Texture',
    src: '/banner.png',
    alt: 'Mizaan Technologies official textured leather branding and software engineering identity',
  },
  {
    id: 'mockup',
    label: 'Product Mockup',
    src: '/branding-mockup.png',
    alt: 'Mizaan Technologies apparel mockup and translucent smart card digital product design',
  },
]

export default function App() {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [copiedKey, setCopiedKey] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activeImage = BRAND_IMAGES[activeImageIndex]

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Auto slide images every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % BRAND_IMAGES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen w-full bg-[#090204] text-zinc-100 flex flex-col justify-between selection:bg-red-600 selection:text-white relative overflow-hidden font-sans">
      {/* Subtle Ambient Red Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-red-950/20 blur-[150px]" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-[#3b050d]/25 blur-[140px]" />
      </div>

      {/* Top Minimal Navigation */}
      <header className="relative z-10 w-full border-b border-white/[0.06] bg-[#090204]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" aria-label="Mizaan Technologies Home">
            <img
              src="/mizaan-transparent.png"
              alt="Mizaan Technologies - Custom Software Engineering & AI Solutions Logo"
              className="h-38 w-auto object-contain brightness-110"
            />
            <span className="sr-only">Mizaan Technologies</span>
          </a>

        </div>
      </header>

      {/* Main Single Section */}
      <main className="relative z-10 flex-1 flex items-center py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Left: Minimal Typography & Essential Contacts */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
              
              <div className="space-y-3">
                <h1 className="sr-only">Mizaan Technologies | Custom Software Development, AI Solutions & Enterprise IT Engineering</h1>
                <h2 className="text-4xl text-zinc-200 pt-2 font-light">
                  New identity and visual direction in progress.
                </h2>
              </div>

              {/* Minimalist Contact Details */}
              <div className="pt-2 border-t border-white/[0.08] space-y-4">
                
                {/* Email */}
                <div className="flex items-center justify-between group">
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider w-20">
                    Email
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="mailto:hello@mizaantech.co.in"
                      className="text-sm text-zinc-200 hover:text-white hover:underline underline-offset-4 transition-colors font-mono"
                    >
                      hello@mizaantech.co.in
                    </a>
                    <button
                      onClick={() => handleCopy('hello@mizaantech.co.in', 'email')}
                      className="text-zinc-500 hover:text-red-400 text-xs font-mono transition-colors px-1.5 py-0.5"
                      title="Copy email"
                    >
                      {copiedKey === 'email' ? (
                        <span className="text-red-400 font-semibold">copied</span>
                      ) : (
                        'copy'
                      )}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center justify-between group">
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider w-20">
                    Phone
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:+917448552778"
                      className="text-sm text-zinc-200 hover:text-white hover:underline underline-offset-4 transition-colors font-mono"
                    >
                      +91 744 855 2778
                    </a>
                    <button
                      onClick={() => handleCopy('+91 744 855 2778', 'phone')}
                      className="text-zinc-500 hover:text-red-400 text-xs font-mono transition-colors px-1.5 py-0.5"
                      title="Copy phone"
                    >
                      {copiedKey === 'phone' ? (
                        <span className="text-red-400 font-semibold">copied</span>
                      ) : (
                        'copy'
                      )}
                    </button>
                  </div>
                </div>

                {/* Info / ilahtech.in */}
                <div className="flex items-center justify-between group">
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider w-20">
                    More info
                  </div>
                  <div>
                    <a
                      href="https://ilahtech.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-200 hover:text-red-400 hover:underline underline-offset-4 transition-colors font-mono inline-flex items-center gap-1"
                    >
                      <span>ilahtech.in</span>
                      <span className="text-xs">↗</span>
                    </a>
                  </div>
                </div>

              </div>

            </div>

            {/* Right: Focused Image Presentation */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              
              {/* Primary Image Viewport with Smooth Auto Slide */}
              <div
                onClick={() => setIsFullscreen(true)}
                className="relative aspect-[16/10] sm:aspect-[16/9.5] w-full rounded-2xl overflow-hidden bg-black/50 border border-white/10 group cursor-pointer shadow-2xl transition-all duration-500 hover:border-red-500/40"
              >
                {BRAND_IMAGES.map((img, idx) => (
                  <img
                    key={img.id}
                    src={img.src}
                    alt={img.alt}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ease-in-out ${
                      idx === activeImageIndex
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] bg-[#090204]/80 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div>© 2026 Mizaan Technologies</div>
          <div>
            For more info visit{' '}
            <a
              href="https://ilahtech.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ilahtech.in
            </a>
          </div>
        </div>
      </footer>

      {/* Fullscreen Modal Lightbox */}
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center">
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-4 text-xs font-mono text-zinc-400">
              <span>{activeImage.label}</span>
              <span>•</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFullscreen(false)
                }}
                className="hover:text-white transition-colors"
              >
                Press ESC or click anywhere to close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
