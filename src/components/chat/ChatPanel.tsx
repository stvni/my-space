import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude_api_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveKey = () => {
    localStorage.setItem('claude_api_key', apiKey)
    setShowKeyInput(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    if (!apiKey) { setShowKeyInput(true); return }

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system:
            'You are a helpful personal assistant inside My Space dashboard. Be concise, practical, and friendly. Help with planning, reminders, ZHAW studies, gym, nutrition, skincare, and style.',
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const text = data.content?.[0]?.text ?? '(no response)'
      setMessages((m) => [...m, { role: 'assistant', content: text }])
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-surface2 border border-border text-chrome-dim hover:text-chrome-bright hover:border-chrome/30 flex items-center justify-center shadow-lg transition-colors"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
      >
        {open ? <X size={16} /> : <MessageSquare size={16} />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-20 right-5 z-50 w-80 h-[480px] surface-glass rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-green-500/70" />
              <span className="text-chrome text-sm font-medium">Claude</span>
              <button
                onClick={() => setShowKeyInput((s) => !s)}
                className="ml-auto text-chrome-dim hover:text-chrome text-xs font-mono"
              >
                {apiKey ? 'key ✓' : 'set key'}
              </button>
            </div>

            {/* API key input */}
            <AnimatePresence>
              {showKeyInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border"
                >
                  <div className="p-3 flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-chrome font-mono outline-none focus:border-chrome/30"
                    />
                    <button
                      onClick={saveKey}
                      className="px-3 py-1.5 bg-surface2 border border-border rounded-lg text-xs text-chrome hover:border-chrome/30 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-chrome-dim text-xs text-center mt-8 leading-relaxed">
                  Ask me anything — planning, study help,<br />
                  workout advice, nutrition, skincare…
                </p>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-surface2 border border-border text-chrome'
                        : 'bg-surface border border-border/50 text-chrome-dim'
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-border/50 rounded-xl px-3 py-2">
                    <Loader2 size={12} className="text-chrome-dim animate-spin" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message Claude…"
                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-chrome placeholder-chrome-dim/50 outline-none focus:border-chrome/30 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg bg-surface2 border border-border text-chrome-dim hover:text-chrome disabled:opacity-40 flex items-center justify-center transition-colors"
              >
                <Send size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
