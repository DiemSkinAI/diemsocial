import { NextRequest, NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
    )
  ])
}

// Convert base64 data URL to file format for Google AI
function dataURLToFile(dataURL: string, filename: string) {
  const [header, base64Data] = dataURL.split(',')
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
  
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  }
}


export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] API Request started`)

  try {
    // Initialize Google Generative AI (Gemini API)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'GEMINI_API_KEY environment variable is required for image generation',
          processingTime: Date.now() - startTime
        },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    console.log(`[${new Date().toISOString()}] Initialized Google Generative AI client`)
    
    // Add early error handling for invalid requests
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      console.log(`[${new Date().toISOString()}] Invalid content-type: ${contentType}`)
      return NextResponse.json(
        { 
          error: 'Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }
    const formData = await request.formData()
    const roomImage = formData.get('roomImage') as string
    const inspirationImage = formData.get('inspirationImage') as string | null
    const description = formData.get('description') as string

    console.log(`[${new Date().toISOString()}] Form data extracted after ${Date.now() - startTime}ms`)

    if (!roomImage) {
      return NextResponse.json(
        { error: 'Room image is required' },
        { status: 400 }
      )
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: 'Please describe what changes you want' },
        { status: 400 }
      )
    }


    // Prepare image data for Google AI
    const roomImageFile = dataURLToFile(roomImage, 'room.jpg')
    
    // Extract original image dimensions from base64 data
    const base64Data = roomImage.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    console.log(`[${new Date().toISOString()}] Original image buffer size: ${buffer.length} bytes`)
    
    let parts: any[] = [roomImageFile]
    
    if (inspirationImage) {
      const inspirationImageFile = dataURLToFile(inspirationImage, 'inspiration.jpg')
      parts.push(inspirationImageFile)
    }


    // Construct the prompt based on whether we have inspiration image and description
    let promptText: string
    
    
    if (inspirationImage && description === 'auto-detect-from-inspiration') {
      // Two-step process: First analyze inspiration, then generate room modification
      
      // Step 1: Get material description from inspiration photo
      console.log(`[${new Date().toISOString()}] Step 1: Analyzing inspiration photo for material description`)
      
      const inspirationAnalysisModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash'
      })
      
      const analysisPrompt = `You are a professional stone and countertop specialist. Analyze this stone/marble image and provide an extremely detailed description focusing on: 1) Exact color (white, beige, gray tones), 2) Specific veining patterns (direction, thickness, color of veins), 3) Stone type (marble, granite, quartz), 4) Surface finish (polished, honed, etc), 5) Any unique characteristics. Be very specific about the veining pattern and colors to ensure exact replication.`

      const analysisResult = await inspirationAnalysisModel.generateContent([
        { text: analysisPrompt },
        dataURLToFile(inspirationImage, 'inspiration.jpg')
      ])
      
      const materialDescription = analysisResult.response.text().trim()
      console.log(`[${new Date().toISOString()}] AI detected material: ${materialDescription}`)
      
      // Step 2: Use the detected material description in the main prompt
      promptText = `You are an expert interior designer specializing in kitchen stone design. Transform the countertops and stone surfaces in this kitchen to EXACTLY match this description: ${materialDescription}. Pay special attention to replicating the exact veining patterns, colors, and surface characteristics. The result must be a precise visual match to the reference material.`
      
      // Update parts array to only include room image for generation step (mask already analyzed)
      parts = [roomImageFile, { text: promptText }]
    } else if (inspirationImage && description.trim()) {
      // Both inspiration and description provided - extract material from inspiration and combine
      console.log(`[${new Date().toISOString()}] Step 1: Analyzing inspiration photo to enhance user description`)
      
      const inspirationAnalysisModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash'
      })
      
      const analysisPrompt = `You are a professional stone and countertop specialist. Analyze this stone/marble image and provide an extremely detailed description focusing on: 1) Exact color (white, beige, gray tones), 2) Specific veining patterns (direction, thickness, color of veins), 3) Stone type (marble, granite, quartz), 4) Surface finish (polished, honed, etc), 5) Any unique characteristics. Be very specific about the veining pattern and colors to ensure exact replication.`

      const analysisResult = await inspirationAnalysisModel.generateContent([
        { text: analysisPrompt },
        dataURLToFile(inspirationImage, 'inspiration.jpg')
      ])
      
      const materialDescription = analysisResult.response.text().trim()
      console.log(`[${new Date().toISOString()}] AI detected material: ${materialDescription}`)
      console.log(`[${new Date().toISOString()}] User description: ${description}`)
      
      // Combine AI-detected material with user's description
      const combinedDescription = `${materialDescription}. Additional details: ${description}`
      console.log(`[${new Date().toISOString()}] Combined description: ${combinedDescription}`)
      
      promptText = `You are an expert interior designer specializing in kitchen stone design. Transform the countertops and stone surfaces in this kitchen to EXACTLY match this description: ${combinedDescription}. Pay special attention to replicating the exact veining patterns, colors, and surface characteristics. The result must be a precise visual match to the reference material.`
      
      // Update parts array to only include room image for generation step (mask already analyzed)
      parts = [roomImageFile, { text: promptText }]
    } else {
      // Description only workflow
      promptText = `You are an expert interior designer specializing in kitchen stone design. Transform the countertops and stone surfaces in this kitchen to match this description: ${description}. Pay attention to creating realistic stone characteristics and patterns.`
    }

    // Add text prompt (only if parts wasn't already modified in inspiration workflow)
    if (!inspirationImage || (inspirationImage && description.trim() && description !== 'auto-detect-from-inspiration')) {
      parts.push({ text: promptText })
    }

    console.log(`[${new Date().toISOString()}] Calling Gemini API for image generation`)
    const imageCount = parts.filter(p => typeof p === 'object' && 'inlineData' in p).length
    console.log(`[${new Date().toISOString()}] Number of images:`, imageCount)
    console.log(`[${new Date().toISOString()}] Prompt:`, promptText)

    // Get the Gemini 2.5 Flash Image model for image generation
    const modelName = 'gemini-2.5-flash-image-preview'  // Latest Nano Banana model for image generation
    console.log(`[${new Date().toISOString()}] Using model: ${modelName} via Gemini API`)
    
    const model = genAI.getGenerativeModel({
      model: modelName
    })

    // Generate content with timeout
    const GEMINI_TIMEOUT = 60000 // 60 seconds timeout
    console.log(`[${new Date().toISOString()}] Starting Gemini API request with ${GEMINI_TIMEOUT/1000}s timeout`)
    
    const generatePromise = model.generateContent({
      contents: [{
        role: 'user',
        parts: parts
      }]
    })

    let result;
    try {
      result = await withTimeout(generatePromise, GEMINI_TIMEOUT, 'Gemini API processing')
    } catch (geminiError: any) {
      console.error(`[${new Date().toISOString()}] Gemini API error:`, geminiError)
      
      // Check if this is an HTML response error
      if (geminiError.message?.includes('Unexpected token') && geminiError.message?.includes('<!DOCTYPE')) {
        throw new Error('Gemini API returned an HTML error page. This usually means: 1) Invalid API key, 2) Model not available, or 3) API temporarily unavailable.')
      }
      
      throw geminiError
    }

    const processingTime = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] Gemini API response received after ${processingTime}ms`)
    
    // Check if we have a valid response
    if (!result.response) {
      throw new Error('No response received from Gemini API')
    }

    const response = result.response
    console.log(`[${new Date().toISOString()}] Response candidates:`, response.candidates?.length)

    // For image generation, we need to handle the response differently
    // Gemini 2.5 Flash Image returns generated images as base64 data
    const candidate = response.candidates?.[0]
    if (!candidate) {
      throw new Error('No candidates in response')
    }

    // Extract generated images from Gemini 2.5 Flash Image response
    // This model can generate actual images, not just analyze them
    const images: { url: string; alt: string; caption: string }[] = []
    
    // Check if there are parts with image data (inline_data)
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          // Convert base64 to data URL for display
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          
          // Log generated image buffer size
          const generatedBuffer = Buffer.from(part.inlineData.data, 'base64')
          console.log(`[${new Date().toISOString()}] Generated image buffer size: ${generatedBuffer.length} bytes`)
          
          images.push({
            url: dataUrl,
            alt: promptText,
            caption: 'Generated with Gemini 2.5 Flash Image'
          })
          console.log(`[${new Date().toISOString()}] Found generated image with mime type: ${part.inlineData.mimeType}`)
        }
      }
    }
    
    // Get any text response as well
    const responseText = candidate?.content?.parts?.find(p => p.text)?.text || ''
    if (responseText) {
      console.log(`[${new Date().toISOString()}] Model response text:`, responseText)
    }

    // If no images were generated, check if it's because no countertop was detected
    if (images.length === 0) {
      console.log(`[${new Date().toISOString()}] No images found in response, response structure:`, JSON.stringify(candidate, null, 2))
      
      // Check if the response indicates no countertop was found
      const responseText = candidate?.content?.parts?.[0]?.text || ''
      if (responseText.toLowerCase().includes('countertop') && 
          (responseText.toLowerCase().includes('not') || responseText.toLowerCase().includes("isn't") || 
           responseText.toLowerCase().includes('no') || responseText.toLowerCase().includes('specify'))) {
        return NextResponse.json(
          { 
            error: 'No countertop detected in the uploaded image. DiemVision specializes in countertop visualization and requires a clear view of existing countertops to generate accurate replacements. Please upload an image that includes a kitchen countertop.'
          },
          { status: 400 }
        )
      }
      
      // For other cases, return a general error with helpful information
      return NextResponse.json(
        { 
          error: 'Image generation failed. The Gemini 2.5 Flash Image model did not return generated images. This could be due to content safety filters or prompt issues.',
          debug: {
            hasCandidate: !!candidate,
            hasContent: !!candidate?.content,
            hasParts: !!candidate?.content?.parts,
            partsCount: candidate?.content?.parts?.length || 0,
            responseText: responseText,
            modelUsed: modelName
          }
        },
        { status: 500 }
      )
    }

    console.log(`[${new Date().toISOString()}] Generated ${images.length} images`)
    console.log(`[${new Date().toISOString()}] Total request time: ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      images: images,
      prompt: promptText,
      description: 'Generated with Gemini 2.5 Flash Image Preview (Nano Banana)',
      processingTime: processingTime,
      provider: 'gemini-api'
    })

  } catch (error: any) {
    const errorTime = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Error after ${errorTime}ms:`, error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    
    // Ensure we always return JSON, never HTML
    try {
      if (error.message?.includes('timed out')) {
        return NextResponse.json(
          { 
            error: 'Request timed out. The AI service is taking too long. Please try again.',
            processingTime: errorTime
          },
          { status: 504 }
        )
      }

      // Handle Vertex AI authentication errors
      if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('permission')) {
        return NextResponse.json(
          { 
            error: 'Authentication failed. Please check your service account key and permissions.',
            processingTime: errorTime
          },
          { status: 401 }
        )
      }

      // Handle quota/billing errors
      if (error.message?.includes('quota') || error.message?.includes('billing') || error.message?.includes('429')) {
        return NextResponse.json(
          { 
            error: 'API quota exceeded or billing issue. Please check your Google Cloud account and ensure billing is enabled.',
            processingTime: errorTime
          },
          { status: 429 }
        )
      }

      // Handle 500 Internal Server Errors from Vertex AI
      if (error.message?.includes('500') || error.message?.includes('Internal Server Error') || error.message?.includes('Internal error encountered')) {
        return NextResponse.json(
          { 
            error: 'Vertex AI service is experiencing issues. This could be due to: 1) Service outage, 2) Quota/billing issues with your account, or 3) The model is temporarily unavailable. Please try again later or check your Google Cloud console.',
            processingTime: errorTime
          },
          { status: 503 }
        )
      }

      // Handle model not found errors
      if (error.message?.includes('404') || error.message?.includes('NOT_FOUND') || error.message?.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Model not found or not accessible. The Gemini 2.5 Flash Image model may not be available in your region or project.',
            processingTime: errorTime,
            debug: {
              errorMessage: error.message,
              model: 'gemini-2.5-flash-image-preview',
              region: 'global'
            }
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          error: error.message || 'Failed to process visualization. Please try again.',
          processingTime: errorTime,
          debug: {
            errorType: error.constructor.name,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
          }
        },
        { status: 500 }
      )
    } catch (secondaryError) {
      // Fallback if even the error handling fails
      console.error('Secondary error in error handler:', secondaryError)
      return new Response(
        JSON.stringify({
          error: 'Internal server error occurred during error handling',
          processingTime: errorTime
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}