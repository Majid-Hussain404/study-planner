import { useState, type FormEvent } from 'react'
import { ArrowLeft, LoaderCircle, Send, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const suggestions = [
  'What should I study today?',
  'Which subject needs the most attention?',
  'Help me recover from missed sessions.',
]

export function AssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function sendMessage(content: string) {
    const message = content.trim()
    if (!message || sending) return
    if (!supabase) {
      setError('Connect your Supabase project before using the assistant.')
      return
    }
    setError('')
    setInput('')
    setSending(true)
    const previousMessages = messages.slice(-12)
    setMessages((current) => [...current, { role: 'user', content: message }])
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) throw new Error('Your sign-in has expired. Please sign in again.')
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          history: previousMessages.map(({ role, content: previousContent }) => ({ role, content: previousContent })),
        }),
      })
      const result = await response.json() as { reply?: string; error?: string }
      if (!response.ok) throw new Error(result.error ?? 'The assistant could not answer. Please try again.')
      setMessages((current) => [...current, { role: 'assistant', content: result.reply ?? 'I could not produce a reply.' }])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not answer. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(input)
  }

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#758075] hover:text-[#214d3c]"><ArrowLeft size={16} /> Back to dashboard</Link>
        <header className="mt-8">
          <p className="flex items-center gap-2 text-sm text-[#416b4c]"><Sparkles size={16} /> Personal study support</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Study assistant</h1>
          <p className="mt-2 text-sm text-[#687369]">Ask for advice based on your subjects, topics, deadlines, and recent sessions.</p>
        </header>

        <section aria-label="Conversation" aria-live="polite" className="mt-6 min-h-[340px] space-y-4 rounded-2xl border border-[#e5e8df] bg-white p-4 sm:p-6">
          {messages.length === 0 ? <div className="flex min-h-[290px] flex-col items-center justify-center text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#edf3e8] text-[#416b4c]"><Sparkles size={21} /></span>
            <h2 className="mt-4 font-semibold">Hi{user?.user_metadata.full_name ? `, ${user.user_metadata.full_name}` : ''}. What would help you study today?</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => <Button key={suggestion} variant="outline" size="sm" className="h-auto whitespace-normal rounded-full px-3 py-2" onClick={() => void sendMessage(suggestion)} disabled={sending}>{suggestion}</Button>)}
            </div>
          </div> : messages.map((message, index) => <article key={`${index}-${message.role}`} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-[#214d3c] text-white' : 'bg-[#f1f4ed] text-[#26332a]'}`}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide opacity-70">{message.role === 'user' ? 'You' : 'Study assistant'}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </article>)}
          {sending && <p className="flex items-center gap-2 text-sm text-[#758075]"><LoaderCircle size={16} className="animate-spin" /> Checking your study data…</p>}
        </section>

        {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2 rounded-2xl border border-[#e5e8df] bg-white p-2">
          <label className="sr-only" htmlFor="assistant-message">Your message</label>
          <textarea id="assistant-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={1200} rows={2} placeholder="Ask about your study plan…" className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#9aa39a]" disabled={sending} />
          <Button type="submit" disabled={sending || !input.trim()} className="mb-1 mr-1 size-10 rounded-xl bg-[#214d3c] p-0 text-white hover:bg-[#193d30]" aria-label="Send message">
            {sending ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-[#7a847a]">Your question and relevant study data are sent securely to the app server for a response.</p>
      </div>
    </main>
  )
}
