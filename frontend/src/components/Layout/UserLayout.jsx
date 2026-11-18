import { useContext } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, FileText, Megaphone, PlusCircle, Bell, User } from "lucide-react"
import { AuthContext } from "../../contexts/AuthContext"
import { useRealtime } from "../../contexts/RealtimeContext"
import NotificationDropdown from "../UI/NotificationDropdown"
import CivicChatbot from "../UI/CivicChatbot"
import SidebarShell from "./SidebarShell"

const UserLayout = ({ children, onLogout }) => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const { unread } = useRealtime()

  const handleLogout = () => {
    if (onLogout) return onLogout()
    logout()
    navigate("/login")
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "My Complaints", icon: FileText, to: "/my-complaints" },
    { label: "Public Reports", icon: Megaphone, to: "/public-reports" },
    { label: "Report Issue", icon: PlusCircle, to: "/report" },
    { label: "Notifications", icon: Bell, to: "/notifications", badge: unread.userUnread },
    { label: "Profile", icon: User, to: "/profile" },
  ]

  return (
    <SidebarShell
      navItems={navItems}
      portalLabel="Citizen portal"
      user={user}
      onLogout={handleLogout}
      topBarContent={<NotificationDropdown user={user} />}
    >
      {children}
      <CivicChatbot />
    </SidebarShell>
  )
}

export default UserLayout
