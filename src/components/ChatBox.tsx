import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bot, RotateCcw } from 'lucide-react'
import { streamMessageFromGemini } from '../lib/gemini.ts'
import './ChatBox.css'

export default function ChatBox() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    responseRef.current?.scrollTo({ top: responseRef.current.scrollHeight, behavior: 'smooth' })
  }, [response, error])

  const handleSend = async () => {
    const prompt = input.trim()
    if (!prompt || loading) return

    setLoading(true)
    setResponse('')
    setError('')
    setInput('')

    try {
      const responseStream = await streamMessageFromGemini(prompt)

      for await (const chunk of responseStream) {
        if (chunk.text) {
          setResponse((previous) => previous + chunk.text)
        }
      }
    } catch (err) {
      console.error('Error fetching Gemini stream:', err)
      setError(err instanceof Error ? err.message : 'Unable to reach the AI assistant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetChat = () => {
    if (loading) return
    setInput('')
    setResponse('')
    setError('')
  }

  return (
    <div className="chat-box">
      <div className="chat-box__header">
        <div className="chat-box__identity">
          <span className="chat-box__icon"><Bot size={18} /></span>
          <div>
            <h3>Weather Assist AI</h3>
            <p>{loading ? 'Thinking through the forecast…' : 'Ask about the weather, wherever you are.'}</p>
          </div>
        </div>
        {(response || error) && (
          <button className="chat-box__reset" type="button" onClick={resetChat} disabled={loading}>
            <RotateCcw size={15} /> New question
          </button>
        )}
      </div>

      <div className="chat-box__response" ref={responseRef} aria-live="polite" aria-busy={loading}>
        {error ? (
          <p className="chat-box__error">{error}</p>
        ) : response ? (
          <p>{response}{loading && <span className="chat-box__cursor" aria-hidden="true" />}</p>
        ) : (
          <p className="chat-box__placeholder">Try “What should I pack for a rainy weekend?”</p>
        )}
      </div>

      <div className="chat-box__composer">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSend()}
          placeholder="Ask a weather question…"
          aria-label="Ask Weather Assist AI"
          disabled={loading}
        />
        <button type="button" onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Thinking…' : <>Ask <ArrowUpRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}
