import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API from "../services/api"
import { BellOff } from "lucide-react"
import { useRealtime, useRealtimeRefresh } from "../contexts/RealtimeContext"
import {
  PageHeader,
  Panel,
  EmptyState,
  SecondaryButton,
} from "../components/UI/CivicUI"

const formatTime = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const typeLabel = (type) => {
  switch (type) {
    case "STATUS_UPDATE":
      return "Status"
    case "REMARK":
      return "Remark"
    case "NEW_COMPLAINT":
      return "New"
    case "SUBMITTED":
      return "Submitted"
    case "SUPPORT":
      return "Support"
    default:
      return "Update"
  }
}

const normalizeNotification = (n) => ({
  ...n,
  read: n.read ?? n.is_read ?? false,
})

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")
  const { refreshUnread } = useRealtime()

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await API.get("/notifications/my")
      setNotifications((res.data || []).map(normalizeNotification))
      setError("")
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      if (!silent) setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useRealtimeRefresh(() => fetchNotifications(true), ["notification", "complaint"])

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`)
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      refreshUnread()
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/mark-all-read")
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
      refreshUnread()
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="animate-fade-up max-w-3xl">
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          description="Stay updated on your complaint status"
        />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-stone-dark p-4 animate-pulse">
              <div className="h-4 w-24 bg-stone-dark/50 rounded mb-3" />
              <div className="h-3 w-full bg-stone-dark/40 rounded mb-2" />
              <div className="h-3 w-1/3 bg-stone-dark/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up max-w-3xl">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Stay updated on your complaint status"
        action={
          unreadCount > 0 ? (
            <SecondaryButton onClick={markAllAsRead}>Mark all as read</SecondaryButton>
          ) : null
        }
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-forest text-white"
              : "bg-surface text-stone-muted hover:bg-stone border border-stone-dark"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "unread"
              ? "bg-forest text-white"
              : "bg-surface text-stone-muted hover:bg-stone border border-stone-dark"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {error && (
        <Panel className="p-4 mb-4 border-rose-200 bg-rose-50">
          <p className="text-rose-700 text-sm">{error}</p>
        </Panel>
      )}

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={
            filter === "unread" ? "No unread notifications" : "No notifications yet"
          }
          description={
            filter === "unread"
              ? "You're all caught up."
              : "We'll notify you when there are updates on your complaints."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Panel
              key={notification.id}
              className={`p-4 cursor-pointer transition-shadow hover:shadow-lift ${
                !notification.read ? "ring-1 ring-moss/30 bg-moss-pale/20" : ""
              }`}
            >
              <div
                className="flex items-start gap-4"
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`status-pill text-[11px] ${
                        notification.read
                          ? "bg-stone text-stone-muted"
                          : "bg-moss-pale text-moss"
                      }`}
                    >
                      {typeLabel(notification.type)}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-moss rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      notification.read
                        ? "text-stone-muted"
                        : "text-forest font-medium"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-stone-muted">
                      {formatTime(notification.createdAt)}
                    </span>
                    {notification.complaintId && (
                      <Link
                        to={`/complaint/${notification.complaintId}`}
                        className="text-xs text-moss hover:text-forest font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View complaint
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
