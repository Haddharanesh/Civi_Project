import { useContext, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../../services/api"
import { AuthContext } from "../../contexts/AuthContext"

const QUICK_PROMPTS = [
  "How do I report an issue?",
  "Track my complaints",
  "What is duplicate detection?",
  "Which department handles what?",
]

function CivicChatbot() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (messages.length === 0) {
      setMessages([
        {
          role: "bot",
          text: user?.name
            ? `Hi ${user.name} — I’m CivicBot. Ask me about reporting, tracking, duplicates, or departments.`
            : "Hi — I’m CivicBot. Ask me how CivicConnect works, or log in for personal shortcuts.",
          suggestions: QUICK_PROMPTS,
          links: user
            ? [
                { label: "Report issue", path: "/report" },
                { label: "My dashboard", path: "/dashboard" },
              ]
            : [
                { label: "Citizen login", path: "/login" },
                { label: "Sign up", path: "/signup" },
              ],
        },
      ])
    }
  }, [open, user, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const sendMessage = async (raw) => {
    const text = (raw || "").trim()
    if (!text || sending) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", text }])
    setSending(true)

    try {
      const res = await API.post("/chat", { message: text })
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.data.reply,
          suggestions: res.data.suggestions || [],
          links: res.data.links || [],
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry — I couldn’t reach the assistant just now. Try again in a moment.",
          suggestions: QUICK_PROMPTS,
          links: [],
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-1.5rem,22rem)] h-[min(70vh,28rem)] bg-surface border border-stone-dark rounded-2xl shadow-lift flex flex-col overflow-hidden animate-fade-up">
          <div className="bg-forest text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-lg leading-tight">CivicBot</p>
              <p className="text-xs text-white/70">Civic help · always available</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/90"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-stone/40">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-forest text-white rounded-br-md"
                      : "bg-surface border border-stone-dark text-ink rounded-bl-md shadow-soft"
                  }`}
                >
                  {msg.text}

                  {msg.role === "bot" && msg.links?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {msg.links.map((link) => (
                        <button
                          key={link.path + link.label}
                          type="button"
                          onClick={() => {
                            setOpen(false)
                            navigate(link.path)
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-moss-pale text-forest hover:bg-moss/15"
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.role === "bot" && msg.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={sending}
                          onClick={() => sendMessage(s)}
                          className="text-xs font-medium px-2.5 py-1 rounded-full border border-stone-dark text-stone-muted hover:border-moss hover:text-forest bg-stone/50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="text-xs text-stone-muted px-1">CivicBot is typing…</div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-stone-dark bg-surface flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about reporting, status…"
              className="flex-1 px-3 py-2 rounded-xl border border-stone-dark bg-stone/40 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-lift px-3.5 py-2 rounded-xl bg-forest text-white text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-lift w-14 h-14 rounded-2xl bg-forest text-white shadow-lift flex items-center justify-center"
        aria-label={open ? "Close CivicBot" : "Open CivicBot"}
      >
        {open ? (
          <span className="text-xl font-semibold">✕</span>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}

export default CivicChatbot
