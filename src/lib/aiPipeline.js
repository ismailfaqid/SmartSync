import { getOpenAIKey } from './storage'
import { getSupabaseClient } from './supabase'

const SYSTEM_PROMPT = `You are an expert academic and professional note-taker. Process the following speech transcript segment from a live seminar. 
1. Filter out filler words, stutters, chitchat, or audio noise.
2. Extract key facts, data points, or main arguments.
3. Output valid JSON in the exact structure:
{
  "heading": "Clear, Short Section Title",
  "bullet_points": ["First core takeaway", "Second key point or statistic", "Third actionable item"]
}`

/**
 * Robust fetch with exponential backoff for transcription & summarization resilience
 */
async function fetchWithRetry(url, options, maxRetries = 3, initialDelayMs = 1000) {
  let attempt = 0
  let delay = initialDelayMs

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options)

      // If rate limited (429) or temporary server error (500, 502, 503, 504), retry
      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        attempt++
        if (attempt >= maxRetries) return response
        console.warn(`[AI Pipeline] Received status ${response.status}. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
        continue
      }

      return response
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) throw err
      console.warn(`[AI Pipeline] Network fetch error. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`, err)
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2
    }
  }
}

/**
 * Transcribes audio blob using OpenAI Whisper API with overlapping chunk context
 * @param {Blob} audioBlob - 30s audio recording blob
 * @param {string} previousContext - Trailing text from previous chunk for boundary continuity
 */
export async function transcribeAudioWithWhisper(audioBlob, previousContext = '') {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    throw new Error('OpenAI API Key is not configured on client and backend proxy is offline.')
  }

  const formData = new FormData()
  const extension = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('wav') ? 'wav' : 'webm'
  formData.append('file', audioBlob, `chunk_${Date.now()}.${extension}`)
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')

  // Pass trailing context from previous chunk into Whisper prompt to handle overlapping audio cleanly
  if (previousContext && previousContext.trim()) {
    // Keep last 150 characters to guide vocabulary and boundary continuation
    const promptSnippet = previousContext.trim().slice(-150)
    formData.append('prompt', promptSnippet)
  }

  const response = await fetchWithRetry('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Whisper API failed with HTTP ${response.status}`)
  }

  const data = await response.json()
  return data.text || ''
}

/**
 * Summarizes transcript into structured bullet points with GPT-4o,
 * incorporating previous notes context to eliminate duplicate points across overlapping segments.
 */
export async function summarizeTranscriptWithGPT4o(transcriptText, previousNotesContext = []) {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    return generateFallbackStructuredNote(transcriptText)
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ]

  // Add context of previous 2 note headings/bullets so GPT-4o avoids repeating takeaways
  if (previousNotesContext && previousNotesContext.length > 0) {
    const contextSummary = previousNotesContext.slice(-2).map((n) => `Heading: ${n.heading}\nPoints: ${(n.bullet_points || []).join('; ')}`).join('\n---\n')
    messages.push({
      role: 'user',
      content: `Here are the takeaways already recorded in earlier segments of this lecture:\n${contextSummary}\n\nEnsure new bullet points do not duplicate these points.`
    })
    messages.push({
      role: 'assistant',
      content: 'Understood. I will extract only new insights, data, and distinct arguments without repeating previous bullet points.'
    })
  }

  messages.push({
    role: 'user',
    content: transcriptText
  })

  const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `GPT-4o failed with HTTP ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from GPT-4o')

  try {
    const parsed = JSON.parse(content)
    const usage = data.usage || {}
    // Calculate cost based on GPT-4o pricing (~$2.50/M input, ~$10.00/M output)
    const promptTokens = usage.prompt_tokens || 350
    const completionTokens = usage.completion_tokens || 120
    const estCost = (promptTokens / 1000000) * 2.5 + (completionTokens / 1000000) * 10.0

    return {
      heading: parsed.heading || 'Live Takeaway Segment',
      bullet_points: Array.isArray(parsed.bullet_points) && parsed.bullet_points.length > 0
        ? parsed.bullet_points
        : ['Core insight recorded from live speech chunk.'],
      estCost,
      tokensUsed: promptTokens + completionTokens
    }
  } catch (err) {
    console.error('Failed to parse GPT-4o JSON:', err)
    return generateFallbackStructuredNote(transcriptText)
  }
}

/**
 * Secure Backend Proxy Call: Calls server endpoint if available to keep keys off the client
 */
export async function processAudioViaServerProxy(audioBlob, previousContext, sessionId, organizerSecret) {
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, `chunk_${Date.now()}.webm`)
    formData.append('previousContext', previousContext || '')
    formData.append('sessionId', sessionId)
    if (organizerSecret) formData.append('organizerSecret', organizerSecret)

    const response = await fetch('/api/process-audio', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }
    return null
  } catch (err) {
    // If backend proxy is not mounted, fall back cleanly
    return null
  }
}

/**
 * Heuristic fallback parser when running offline or without API key
 */
export function generateFallbackStructuredNote(text) {
  if (!text || text.trim().length === 0) {
    return {
      heading: 'Live Speech Takeaway',
      bullet_points: ['Spoken insights recorded from podium microphone.'],
      estCost: 0,
      tokensUsed: 0
    }
  }

  const clean = text.trim()
  
  // Try splitting by punctuation first
  let sentences = clean
    .split(/(?<=[.?!;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)

  // If no punctuation was provided by speech recognition, split into natural ~12-word bullet chunks
  if (sentences.length <= 1) {
    const words = clean.split(/\s+/)
    if (words.length > 15) {
      sentences = []
      const chunkSize = Math.max(10, Math.ceil(words.length / 3))
      for (let i = 0; i < words.length; i += chunkSize) {
        sentences.push(words.slice(i, i + chunkSize).join(' '))
      }
    } else {
      sentences = [clean]
    }
  }

  // Derive a smart title from the first sentence or keywords
  const firstSentence = sentences[0] || clean
  const words = firstSentence.split(/\s+/).slice(0, 6).join(' ')
  const heading = words.charAt(0).toUpperCase() + words.slice(1)

  // Clean bullet points
  const bullet_points = sentences.slice(0, 4).map((s) => {
    const capital = s.charAt(0).toUpperCase() + s.slice(1)
    return capital.endsWith('.') ? capital : `${capital}.`
  })

  return {
    heading: heading || 'Live Technical Takeaway',
    bullet_points: bullet_points.length > 0 ? bullet_points : ['Key insight recorded from live speech.'],
    estCost: 0.001,
    tokensUsed: Math.min(clean.length, 120)
  }
}

/**
 * Saves note directly to Supabase with sequence_number and idempotency_hash
 */
export async function saveNoteToSupabase(sessionId, heading, bulletPoints, timestampMarker, sequenceNumber, idempotencyHash) {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('lecture_notes')
      .insert([
        {
          session_id: sessionId,
          sequence_number: sequenceNumber,
          idempotency_hash: idempotencyHash,
          heading,
          bullet_points: bulletPoints,
          timestamp_marker: timestampMarker,
        },
      ])
      .select()
      .single()

    if (error) {
      // If code is 23505 (unique constraint violation on idempotency_hash), it's a caught duplicate!
      if (error.code === '23505') {
        console.log('[Supabase RLS/Idempotency] Prevented duplicate note insert')
        return null
      }
      console.warn('Supabase insert note error:', error.message)
      return null
    }

    return data
  } catch (e) {
    console.warn('Supabase query error:', e)
    return null
  }
}
