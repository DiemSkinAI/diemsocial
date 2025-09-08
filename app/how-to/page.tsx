'use client'

import { ArrowLeft, CheckCircle, XCircle, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function HowTo() {
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
          How to Write Great Prompts for Your Photos
        </h1>

        {/* Content */}
        <div className="space-y-8 text-gray-300 text-lg leading-relaxed">
          <p>
            When you upload your front, side, and full-body photos, the app can place you into new scenes. 
            What you type in your prompt makes all the difference. Here&apos;s how to get results that look 
            natural, fun, and perfect for social media.
          </p>

          {/* Do's Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-white flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              Do&apos;s: What Works Well
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">1. Be clear about the scene</h3>
                <p className="mb-3">Say where you are and what&apos;s around you.</p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-2">
                  <p className="text-gray-300"><strong>Good:</strong> &ldquo;Me sitting on a café patio with a coffee cup on the table, sunny afternoon.&rdquo;</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400"><strong>Not great:</strong> &ldquo;Me outside.&rdquo;</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">2. Mention your vibe or mood</h3>
                <p className="mb-3">Describe your expression or the feeling.</p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-2">
                  <p className="text-gray-300"><strong>Good:</strong> &ldquo;Smiling and relaxed at the beach during sunset.&rdquo;</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400"><strong>Not great:</strong> &ldquo;At the beach.&rdquo;</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">3. Add simple details</h3>
                <p className="mb-3">Clothing, activity, or time of day can make it feel real.</p>
                <div className="space-y-2">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300"><strong>Good:</strong> &ldquo;Wearing casual jeans and sneakers, walking through a busy city street at night.&rdquo;</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300"><strong>Good:</strong> &ldquo;In a summer dress, standing in a field of flowers with soft morning light.&rdquo;</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">4. Keep yourself consistent</h3>
                <p className="mb-3">If you want the same look in different photos, don&apos;t change major things like hairstyle or body shape. Just change the setting or outfit.</p>
                <div className="space-y-2">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300"><strong>Good:</strong> &ldquo;Same person, but now wearing a suit at an office desk.&rdquo;</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300"><strong>Good:</strong> &ldquo;Same person, but in gym clothes at a modern gym.&rdquo;</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">5. Make edits step by step</h3>
                <p className="mb-3">Start with a simple scene, then add extras in your next prompt.</p>
                <div className="space-y-2">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300"><strong>Start:</strong> &ldquo;Standing on a wooden deck with the ocean in the background.&rdquo;</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300"><strong>Then add:</strong> &ldquo;Make it sunset, with warm golden light.&rdquo;</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300"><strong>Then add:</strong> &ldquo;Place a surfboard leaning on the railing.&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Don'ts Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-white flex items-center gap-3">
              <XCircle className="w-8 h-8" />
              Don&apos;ts: What to Avoid
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p><strong className="text-white">Don&apos;t be too vague.</strong> &ldquo;Make me look cool&rdquo; won&apos;t give you what you want.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p><strong className="text-white">Don&apos;t overload it.</strong> Skip stuffing every detail at once. Add them step by step.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p><strong className="text-white">Don&apos;t expect perfection first try.</strong> A couple refinements usually make it great.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p><strong className="text-white">Don&apos;t mix up your look.</strong> If you want the same person, don&apos;t suddenly ask for &ldquo;different hair color&rdquo; unless that&apos;s the goal.</p>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-white flex items-center gap-3">
              <Lightbulb className="w-8 h-8" />
              Easy Prompt Examples for Social Media Style Photos
            </h2>
            
            <div className="grid gap-3">
              {[
                "Me laughing with friends around a campfire at night, soft glow from the fire.",
                "Standing on a balcony in the city, holding a cup of coffee, morning light.",
                "At the gym lifting weights, focused expression, bright modern space.",
                "Walking down a beach with footprints in the sand, sunset behind me.",
                "At a stylish restaurant, sitting at a table with pasta and a glass of wine.",
                "On a hiking trail, wearing outdoor clothes, mountains in the distance.",
                "At a music festival, with colorful lights in the background, happy expression.",
                "Holding a skateboard at a skate park, sunny afternoon.",
                "In a cozy living room, sitting on a couch with a book.",
                "Standing in front of a car, nighttime city lights in the background."
              ].map((example, index) => (
                <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-300">&ldquo;{example}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formula Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">Quick Formula</h2>
            <div className="text-center text-xl mb-4">
              <span className="text-white">[You]</span> + 
              <span className="text-gray-300"> [Action/Mood]</span> + 
              <span className="text-gray-300"> [Place]</span> + 
              <span className="text-gray-300"> [Time/Lighting]</span> + 
              <span className="text-gray-300"> [Optional details]</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-200"><strong>Example:</strong></p>
              <p className="text-gray-300">&ldquo;<span className="text-white">Me</span> <span className="text-gray-300">smiling, holding an ice cream cone</span>, <span className="text-gray-300">on a busy street</span>, <span className="text-gray-300">in the evening</span> <span className="text-gray-300">with neon signs</span>.&rdquo;</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-12">
            <p className="text-sm text-gray-400">
              Remember: Great prompts come with practice. Start simple, be specific, and refine as you go. 
              <span className="text-white ml-2">Happy creating!</span>
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