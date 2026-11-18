import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import API from "../../services/api"
import { useRealtime, useRealtimeRefresh } from "../../contexts/RealtimeContext"

const formatTime = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function NotificationDropdown({
  user,
  viewAllLink = "/notifications",
  notificationsApi = "/notifications/my",
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { unread, refreshUnread } = useRealtime()
  const isDepartment = notificationsApi.includes("department")

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await API.get(notificationsApi)
      const list = (res.data || []).map((n) => ({
        ...n,
        read: n.read ?? n.is_read ?? false,
      }))
      setNotifications(list)
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id])

  useRealtimeRefresh(() => {
    if (isOpen) fetchNotifications()
  }, ["notification", "complaint"])

  const markAsRead = async (notification) => {
    if (notification.read) return
    try {
      await API.put(`/notifications/${notification.id}/read`)
      setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
      refreshUnread()
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification)
    setIsOpen(false)
    if (notification.complaintId) {
      navigate(isDepartment ? "/department/review" : `/complaint/${notification.complaintId}`)
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const unreadCount = isDepartment
    ? unread.departmentUnread || unreadNotifications.length
    : unread.userUnread || unreadNotifications.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-lg transition-colors ${
          isOpen ? "bg-moss-pale text-forest" : "text-forest hover:bg-stone"
        }`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-5 px-1 bg-rose-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface rounded-xl shadow-lift border border-stone-dark overflow-hidden z-50 animate-fade-up">
          <div className="px-4 py-3 bg-forest text-white flex items-center justify-between">
            <h3 className="font-display font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-white/15 px-2 py-1 rounded-md">{unreadCount} new</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-stone-muted text-sm">Loading…</div>
            ) : unreadNotifications.length === 0 ? (
              <div className="p-8 text-center text-stone-muted text-sm">No unread notifications</div>
            ) : (
              <div className="divide-y divide-stone-dark">
                {unreadNotifications.slice(0, 7).map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left px-4 py-3 hover:bg-moss-pale/40 transition-colors bg-moss-pale/20"
                  >
                    <p className="text-sm text-ink font-medium">{notification.message}</p>
                    <p className="text-xs text-stone-muted mt-1">{formatTime(notification.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {viewAllLink && (
            <div className="px-4 py-3 bg-stone border-t border-stone-dark">
              <Link
                to={viewAllLink}
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-moss font-semibold hover:text-forest"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
