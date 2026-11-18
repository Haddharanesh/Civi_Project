import { createContext, useCallback, useContext, useState } from "react"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const STYLES = {
  success: "border-moss/30 bg-moss-pale text-forest [&_svg]:text-moss",
  error: "border-rose-200 bg-rose-50 text-rose-800 [&_svg]:text-rose-600",
  info: "border-stone-dark bg-surface text-ink [&_svg]:text-forest",
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info
          return (
            <div
              key={t.id}
              className={`animate-fade-up flex items-start gap-3 rounded-xl border shadow-lift px-4 py-3.5 backdrop-blur-sm ${STYLES[t.type] || STYLES.info}`}
              role="alert"
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
