import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API from "../services/api"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import {
  PageHeader,
  Panel,
  EmptyState,
  LoadingBlock,
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

const getTypeLabel = (type) => {
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
      return "Alert"
  }
}

const normalizeNotification = (n) => ({
  ...n,
  read: n.read ?? n.is_read ?? false,
})

function DepartmentNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all") // all, unread

  useEffect(() => {
    fetchNotifications()
  }, [])

  useRealtimeRefresh(() => fetchNotifications(true), ["notification", "complaint"])

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await API.get("/notifications/department")
      setNotifications((res.data || []).map(normalizeNotification))
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      if (!silent) setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/department/mark-all-read")
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return <LoadingBlock label="Loading notifications…" />
  }

  return (
    <div className="animate-fade-up max-w-3xl">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Stay updated on complaint activity in your department."
        action={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm text-moss hover:text-forest font-semibold transition-colors"
            >
              Mark all as read
            </button>
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description={
            filter === "unread"
              ? "You're all caught up."
              : "You'll receive notifications about new complaints here."
          }
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="divide-y divide-stone-dark">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-stone/40 transition-colors cursor-pointer ${
                  !notification.read ? "bg-moss-pale/30" : ""
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase ${
                      notification.read
                        ? "bg-stone text-stone-muted"
                        : "bg-moss-pale text-moss"
                    }`}
                  >
                    {getTypeLabel(notification.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${notification.read ? "text-stone-muted" : "text-forest font-medium"}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-stone-muted">
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.complaintId && (
                        <Link
                          to="/department/review"
                          className="text-xs text-moss hover:text-forest font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View complaint
                        </Link>
                      )}
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="w-2 h-2 bg-moss rounded-full shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link
          to="/department/review"
          className="bg-surface rounded-xl p-4 border border-stone-dark hover:shadow-lift transition-shadow"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-1">Queue</p>
          <p className="font-display font-semibold text-forest">Review complaints</p>
          <p className="text-sm text-stone-muted mt-0.5">Manage incoming issues</p>
        </Link>
        <Link
          to="/department/reports"
          className="bg-surface rounded-xl p-4 border border-stone-dark hover:shadow-lift transition-shadow"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-1">Analytics</p>
          <p className="font-display font-semibold text-forest">Department reports</p>
          <p className="text-sm text-stone-muted mt-0.5">View analytics</p>
        </Link>
      </div>
    </div>
  )
}

export default DepartmentNotifications
