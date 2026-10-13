import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Ensure the filename extension matches the content type so Groq parses correctly
    const contentType = audioFile.type || 'audio/wav'
    const ext = contentType.includes('mp4') ? 'mp4'
      : contentType.includes('webm') ? 'webm'
      : 'wav'
    const namedFile = new File([audioFile], `audio.${ext}`, { type: contentType })

    const transcription = await groq.audio.transcriptions.create({
      file: namedFile,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json',
    })

    return NextResponse.json({ transcript: transcription.text })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
