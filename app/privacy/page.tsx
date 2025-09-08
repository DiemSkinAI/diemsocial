'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Privacy() {
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
          Privacy is Important
        </h1>

        {/* Content */}
        <div className="space-y-8 text-gray-300 text-lg leading-relaxed">
          <p>
            We take privacy seriously. As AI becomes more powerful than our society is ready to accept, 
            we recognize the immense responsibility that comes with this technology. We are embracing 
            these advances to help people express themselves and create amazing content, but we do so 
            with great care and responsibility.
          </p>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">How We Handle Your Photos</h2>
            
            <div className="space-y-4">
              <p>
                <strong className="text-white">No Storage:</strong> Every photo you upload is processed 
                immediately and then permanently deleted from our servers. We don&apos;t save, store, or keep 
                any copy of your personal photos.
              </p>
              
              <p>
                <strong className="text-white">Temporary Processing:</strong> Your images exist on our 
                servers only for the brief moment needed to generate your result - typically 15-30 seconds.
              </p>
              
              <p>
                <strong className="text-white">Generated Results:</strong> Even the photos we create for 
                you are automatically removed from our servers after generation. Download your result 
                immediately, as we don&apos;t store it.
              </p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-4">Simple Process</h3>
            <div className="space-y-2">
              <p>1. Upload photos from your phone</p>
              <p>2. We process and generate your result</p>
              <p>3. Download your generated photo</p>
              <p>4. All data is automatically deleted</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">We Are a Service, Not Storage</h2>
            
            <p>
              DiemSocial is designed as a processing service, not a storage platform. Think of us like 
              a photo booth - you use our service to create something amazing, take your result with you, 
              and nothing remains behind.
            </p>
            
            <p>
              We believe this approach gives you complete control over your personal data while still 
              enabling the creative possibilities that AI technology offers.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Additional Protections</h2>
            
            <div className="space-y-4">
              <p>
                <strong className="text-white">Secure Processing:</strong> All image processing happens 
                in secure, encrypted environments with no human access to your photos.
              </p>
              
              <p>
                <strong className="text-white">No Analytics Tracking:</strong> We don&apos;t track your usage 
                patterns, build profiles, or use your data for advertising purposes.
              </p>
              
              <p>
                <strong className="text-white">Local Processing Where Possible:</strong> When technically 
                feasible, we process data locally in your browser to minimize server interaction.
              </p>
              
              <p>
                <strong className="text-white">Regular Security Audits:</strong> Our systems undergo 
                regular security reviews to ensure your data remains protected during the brief processing window.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-12">
            <p className="text-sm text-gray-400">
              If you have any questions about our privacy practices, please contact us. 
              This policy reflects our commitment to responsible AI development and your right to privacy.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
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