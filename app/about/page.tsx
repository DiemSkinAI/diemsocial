'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function About() {
  const router = useRouter()

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#000000' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Main title */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-12">
          About Us
        </h1>

        {/* Hero Image */}
        <div className="mb-12">
          <Image 
            src="/office.jpeg" 
            alt="Our Team" 
            className="w-full rounded-lg"
            width={800}
            height={500}
            style={{
              width: '100%',
              height: 'auto'
            }}
            priority
          />
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 text-lg leading-relaxed">
          <p>
            We come from different industries - technology, design, finance, and media - but we&apos;ve all 
            found ourselves meeting at the AI playground. What started as curiosity about artificial 
            intelligence has evolved into a shared vision for the future of digital creativity.
          </p>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">The Change We See Coming</h2>
            
            <p>
              We believe a huge transformation is on the horizon. Social media platforms will soon feature 
              90% AI-generated content, and the line between human creativity and artificial intelligence 
              will blur beyond recognition. This isn&apos;t a distant future - it&apos;s happening now, and we want 
              to be at the forefront of this revolution.
            </p>
            
            <p>
              Our team recognized early that this shift would fundamentally change how people express 
              themselves online. Instead of being passive observers, we decided to build the tools that 
              will empower everyone to participate in this new creative landscape.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Cutting-Edge Technology</h2>
            
            <p>
              We use the most advanced AI models available, constantly pushing the boundaries of what&apos;s 
              possible. Our algorithms are designed to cross the gap between recognizable real photos 
              and AI-generated content - creating results so seamless that the distinction becomes irrelevant.
            </p>
            
            <p>
              <strong className="text-white">Daily Improvements:</strong> Our algorithms learn and evolve 
              every day. What you see today is just the beginning - tomorrow&apos;s results will be even better, 
              more refined, and more true to your vision.
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="space-y-3">
              <p><strong className="text-white">Transparency First:</strong> We&apos;re open about our technology and our process. No black boxes, no hidden agendas.</p>
              <p><strong className="text-white">Privacy by Design:</strong> Your data is never stored or used for training. Every interaction is private and secure.</p>
              <p><strong className="text-white">Human-Centered:</strong> Despite our focus on AI, we never forget that real people are using our tools for real purposes.</p>
              <p><strong className="text-white">Continuous Learning:</strong> We listen to user feedback and constantly refine our approach based on real-world usage.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Our Commitment</h2>
            
            <p>
              We&apos;re not just building another photo editing app - we&apos;re crafting the future of digital 
              self-expression. Every feature we develop, every algorithm we refine, and every update we 
              release is guided by one principle: empowering you to create content that feels authentically you.
            </p>
            
            <p>
              As we navigate this exciting intersection of technology and creativity, we remain committed 
              to responsible innovation. We believe that powerful AI tools should be accessible, safe, 
              and designed with the user&apos;s best interests at heart.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">The Road Ahead</h2>
            
            <p>
              This is just the beginning. As AI technology continues to evolve at breakneck speed, we&apos;re 
              positioning ourselves and our users to ride the wave rather than be swept away by it. 
              We&apos;re building not just for today&apos;s capabilities, but for the incredible possibilities that 
              lie just around the corner.
            </p>
            
            <p>
              Join us as we pioneer the next chapter of digital creativity. Together, we&apos;re not just 
              adapting to the future - we&apos;re creating it.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-12">
            <p className="text-sm text-gray-400">
              Ready to experience the cutting edge of AI-powered creativity? 
              <span className="text-white ml-2">Let&apos;s create something amazing together.</span>
            </p>
          </div>
        </div>

        {/* Diem logo and Made in Toronto badge - at bottom of content */}
        <div className="mt-16 mb-4 md:mt-8 md:mb-8 flex justify-end items-center gap-3 pr-4">
          <Image 
            src="/diem-logo.png" 
            alt="Diem Logo" 
            className="w-4 md:w-15 opacity-60 hover:opacity-80 transition-opacity mr-6"
            width={60}
            height={60}
            style={{
              width: 'auto',
              height: 'auto'
            }}
          />
          <Image 
            src="/toronto.png" 
            alt="Made in Toronto" 
            className="w-5 md:w-20 opacity-60 hover:opacity-80 transition-opacity"
            width={80}
            height={80}
            style={{
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </div>
    </div>
  )
}