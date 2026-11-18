import { useContext } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, ClipboardCheck, BarChart3, Bell, User } from "lucide-react"
import { AuthContext } from "../../contexts/AuthContext"
import { useRealtime } from "../../contexts/RealtimeContext"
import NotificationDropdown from "../UI/NotificationDropdown"
import CivicChatbot from "../UI/CivicChatbot"
import SidebarShell from "./SidebarShell"
import { getDepartmentTheme } from "../../utils/departmentTheme"

const DepartmentLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const { unread } = useRealtime()
  const theme = getDepartmentTheme(user)

  const handleLogout = () => {
    logout()
    navigate("/department-login")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone">
        <header className="sticky top-0 z-50 border-b border-stone-dark bg-surface/95 backdrop-blur-md shadow-sm">
          <nav className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-forest text-white flex items-center justify-center font-display text-sm font-bold">
                CC
              </div>
              <span className="font-display text-xl font-semibold text-forest tracking-tight">CivicConnect</span>
            </div>
          </nav>
        </header>
        <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-10">{children}</main>
      </div>
    )
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/department/dashboard" },
    { label: "Review", icon: ClipboardCheck, to: "/department/review" },
    { label: "Reports", icon: BarChart3, to: "/department/reports" },
    { label: "Notifications", icon: Bell, to: "/department/notifications", badge: unread.departmentUnread },
    { label: "Profile", icon: User, to: "/department/profile" },
  ]

  return (
    <SidebarShell
      navItems={navItems}
      portalLabel={theme.short}
      user={user}
      onLogout={handleLogout}
      logoStyle={{ backgroundColor: theme.logoBg }}
      activeNavClassName={theme.activeNav}
      topBarContent={
        <NotificationDropdown user={user} viewAllLink="/department/notifications" notificationsApi="/notifications/department" />
      }
    >
      {children}
      <CivicChatbot />
    </SidebarShell>
  )
}

export default DepartmentLayout
