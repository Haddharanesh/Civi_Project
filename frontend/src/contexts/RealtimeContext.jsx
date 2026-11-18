import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { AuthContext } from "./AuthContext"
import API from "../services/api"
import { API_ORIGIN } from "../config"

const RealtimeContext = createContext({
  connected: false,
  lastEvent: null,
  revision: 0,
  unread: { userUnread: 0, departmentUnread: 0 },
  refreshUnread: async () => {},
})

const IGNORE_TYPES = new Set(["connected", "ping"])
const MAX_RECONNECT_ATTEMPTS = 8

export function RealtimeProvider({ children }) {
  const { user } = useContext(AuthContext)
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const [revision, setRevision] = useState(0)
  const [unread, setUnread] = useState({ userUnread: 0, departmentUnread: 0 })
  const sourceRef = useRef(null)
  const reconnectTimer = useRef(null)

  const refreshUnread = useCallback(async () => {
    if (!user || (user.role !== "USER" && user.role !== "DEPARTMENT_ADMIN")) {
      setUnread({ userUnread: 0, departmentUnread: 0 })
      return false
    }
    if (!localStorage.getItem("token")) {
      return false
    }
    try {
      const res = await API.get("/notifications/unread/count")
      setUnread({
        userUnread: res.data?.userUnread || 0,
        departmentUnread: res.data?.departmentUnread || 0,
      })
      return true
    } catch (err) {
      if (err.response?.status === 401) {
        return false
      }
      return true
    }
  }, [user])

  useEffect(() => {
    refreshUnread()
  }, [refreshUnread])

  useEffect(() => {
    const clearReconnect = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    const disconnect = () => {
      clearReconnect()
      if (sourceRef.current) {
        sourceRef.current.close()
        sourceRef.current = null
      }
      setConnected(false)
    }

    if (!user) {
      disconnect()
      return undefined
    }

    let cancelled = false
    let attempt = 0

    const connect = async () => {
      if (cancelled) return
      disconnect()

      const token = localStorage.getItem("token")
      if (!token) return

      // Avoid SSE reconnect spam when the JWT is already invalid
      const authOk = await refreshUnread()
      if (!authOk || cancelled || !localStorage.getItem("token")) {
        return
      }

      const url = `${API_ORIGIN}/api/realtime/stream?token=${encodeURIComponent(token)}`
      const es = new EventSource(url)
      sourceRef.current = es

      es.onopen = () => {
        attempt = 0
        setConnected(true)
      }

      es.onmessage = (message) => {
        let event
        try {
          event = JSON.parse(message.data)
        } catch {
          return
        }
        if (IGNORE_TYPES.has(event.type)) return

        setLastEvent(event)
        setRevision((n) => n + 1)

        if (event.type === "notification") {
          refreshUnread()
        }
      }

      es.onerror = () => {
        setConnected(false)
        es.close()
        if (sourceRef.current === es) {
          sourceRef.current = null
        }
        if (cancelled) return
        if (!localStorage.getItem("token")) return

        attempt += 1
        if (attempt > MAX_RECONNECT_ATTEMPTS) return

        const delay = Math.min(1000 * 2 ** Math.min(attempt, 4), 15000)
        reconnectTimer.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }

    connect()

    const pollId = setInterval(() => {
      if (localStorage.getItem("token")) {
        refreshUnread()
      }
    }, 30000)

    const onUnauthorized = () => {
      cancelled = true
      disconnect()
    }
    window.addEventListener("civic:unauthorized", onUnauthorized)

    return () => {
      cancelled = true
      clearInterval(pollId)
      window.removeEventListener("civic:unauthorized", onUnauthorized)
      disconnect()
    }
  }, [user, refreshUnread])

  return (
    <RealtimeContext.Provider value={{ connected, lastEvent, revision, unread, refreshUnread }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeRefresh(onEvent, types = null) {
  const { lastEvent, revision } = useContext(RealtimeContext)
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent
  const typesKey = types ? types.join("|") : "*"

  useEffect(() => {
    if (!lastEvent || IGNORE_TYPES.has(lastEvent.type)) return
    if (types && !types.includes(lastEvent.type)) return
    handlerRef.current(lastEvent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, typesKey])
}

export function useRealtime() {
  return useContext(RealtimeContext)
}

export default RealtimeContext
