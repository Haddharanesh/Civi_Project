import { Link, useLocation } from "react-router-dom"
import { useContext, useState, useEffect, useRef } from "react"
import { AuthContext } from "../../contexts/AuthContext"
import { useRealtime, useRealtimeRefresh } from "../../contexts/RealtimeContext"
import API from "../../services/api"
import CivicChatbot from "../UI/CivicChatbot"
import CreatorCredit from "../UI/CreatorCredit"

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

const NotificationDropdown = ({ user, light = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const { unread } = useRealtime()

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
      const res = await API.get(`/notifications/my`)
      setNotifications(res.data.reverse())
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useRealtimeRefresh(() => {
    if (isOpen) fetchNotifications()
  }, ["notification", "complaint"])

  const unreadCount = unread.userUnread || notifications.filter((n) => !n.read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 transition-colors rounded-lg ${
          light
            ? isOpen
              ? "bg-white/20 text-white"
              : "text-white/90 hover:bg-white/10"
            : isOpen
              ? "bg-moss-pale text-forest"
              : "text-forest hover:bg-stone"
        }`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-5 px-1 bg-rose-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-surface rounded-xl shadow-lift border border-stone-dark overflow-hidden z-50 animate-fade-up">
          <div className="px-4 py-3 bg-forest text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-white/15 px-2 py-1 rounded-md">{unreadCount} new</span>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-stone-muted text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-stone-muted text-sm">No notifications yet</div>
            ) : (
              <div className="divide-y divide-stone-dark">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-stone transition-colors ${
                      !notification.read ? "bg-moss-pale/40" : ""
                    }`}
                  >
                    <p className={`text-sm ${notification.read ? "text-stone-muted" : "text-ink font-medium"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-stone-muted mt-1">{formatTime(notification.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-stone border-t border-stone-dark">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-moss font-semibold hover:text-forest transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

const glassLink = (active) =>
  `px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
    active ? "bg-white/20 text-white" : "text-white/90 hover:text-white hover:bg-white/10"
  }`

const lightLink = (active) =>
  `px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
    active
      ? "bg-moss-pale text-forest ring-1 ring-moss/25"
      : "text-forest hover:bg-moss-pale/70"
  }`

const PublicNavbar = () => {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const isHome = location.pathname === "/"
  const logoHref = !user
    ? "/"
    : user.role === "SUPER_ADMIN"
      ? "/superadmin/dashboard"
      : user.role === "DEPARTMENT_ADMIN"
        ? "/department/dashboard"
        : "/dashboard"

  const link = isHome ? glassLink : lightLink

  const inner = (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-5 md:py-3">
      <Link to={logoHref} className="flex items-center gap-2.5 shrink-0">
        <div
          className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-display text-sm font-bold ${
            isHome ? "bg-white text-forest" : "bg-forest text-white"
          }`}
        >
          CC
        </div>
        <span
          className={`font-display text-lg md:text-xl font-semibold tracking-tight ${
            isHome ? "text-white" : "text-forest"
          }`}
        >
          CivicConnect
        </span>
      </Link>

      <div className="flex items-center gap-1 md:gap-1.5">
        {!user && (
          <>
            <Link to="/login" className={link(location.pathname === "/login")}>
              Login
            </Link>
            <Link
              to="/signup"
              className={`btn-lift ml-1 px-4 py-2 text-sm font-semibold rounded-xl ${
                isHome ? "bg-white text-forest hover:bg-stone" : "bg-forest text-white hover:bg-forest-soft"
              }`}
            >
              Sign Up
            </Link>
          </>
        )}

        {user && (
          <>
            {user.role === "USER" && (
              <>
                <Link to="/my-complaints" className={`hidden md:inline-flex ${link(location.pathname === "/my-complaints")}`}>
                  My Complaints
                </Link>
                <Link to="/public-reports" className={`hidden md:inline-flex ${link(location.pathname === "/public-reports")}`}>
                  Public Reports
                </Link>
                <Link
                  to="/report"
                  className={`btn-lift px-3.5 py-2 text-sm font-semibold rounded-xl ${
                    isHome ? "bg-moss text-white hover:bg-moss-light" : "bg-forest text-white hover:bg-forest-soft"
                  }`}
                >
                  Report issue
                </Link>
                <NotificationDropdown user={user} light={isHome} />
              </>
            )}

            {user.role === "DEPARTMENT_ADMIN" && (
              <Link
                to="/department/dashboard"
                className={`btn-lift px-3.5 py-2 text-sm font-semibold rounded-xl ${
                  isHome ? "bg-white text-forest" : "bg-forest text-white"
                }`}
              >
                Department portal
              </Link>
            )}

            {user.role === "SUPER_ADMIN" && (
              <Link
                to="/superadmin/dashboard"
                className={`btn-lift px-3.5 py-2 text-sm font-semibold rounded-xl ${
                  isHome ? "bg-white text-forest" : "bg-forest text-white"
                }`}
              >
                Admin portal
              </Link>
            )}

            <Link
              to={
                user.role === "SUPER_ADMIN"
                  ? "/superadmin/dashboard"
                  : user.role === "DEPARTMENT_ADMIN"
                    ? "/department/profile"
                    : "/profile"
              }
              className={`flex items-center gap-2 ml-1 pl-1.5 pr-2.5 py-1 rounded-xl border ${
                isHome ? "border-white/20 bg-white/10" : "border-stone-dark bg-stone"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-moss flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span
                className={`hidden sm:inline text-sm font-semibold max-w-[90px] truncate ${
                  isHome ? "text-white" : "text-forest"
                }`}
              >
                {user.name}
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  )

  if (isHome) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4">
        <nav className="pointer-events-auto mx-auto max-w-6xl rounded-2xl border border-white/15 bg-forest-deep/70 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(10,42,31,0.55)]">
          {inner}
        </nav>
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-dark bg-surface/95 backdrop-blur-md shadow-sm">
      <nav className="max-w-[1200px] mx-auto">{inner}</nav>
    </header>
  )
}

const PublicLayout = ({ children }) => {
  const location = useLocation()
  const isHome = location.pathname === "/"
  const isAuth = location.pathname === "/login" || location.pathname === "/signup"

  return (
    <div className="min-h-screen bg-stone">
      <PublicNavbar />
      <main
        className={
          isHome
            ? ""
            : isAuth
              ? ""
              : "max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-10"
        }
      >
        {children}
      </main>
      {!isAuth && (
        <footer
          className={`border-t px-4 py-4 ${
            isHome
              ? "border-white/10 bg-forest-deep text-center"
              : "border-stone-dark bg-surface text-center"
          }`}
        >
          <CreatorCredit light={isHome} />
        </footer>
      )}
      <CivicChatbot />
    </div>
  )
}

export default PublicLayout
