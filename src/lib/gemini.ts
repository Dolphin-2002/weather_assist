import { GoogleGenAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  console.error('Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env.local file.')
}

const ai = new GoogleGenAI({ apiKey })

export async function sendMessageToGemini(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    return response.text ?? 'No response returned.'
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new Error('Failed to get response from AI.')
  }
}

/** Streams each generated text chunk for responsive chat interfaces. */
export async function streamMessageFromGemini(prompt: string) {
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env.local file.')
  }

  try {
    return await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
  } catch (error) {
    console.error('Gemini streaming error:', error)
    throw new Error('Failed to get a response from AI.')
  }
}
