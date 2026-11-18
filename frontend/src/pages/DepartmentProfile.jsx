import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import {
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
} from "../components/UI/CivicUI"
import { getDepartmentTheme } from "../utils/departmentTheme"

function DepartmentProfile() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const theme = getDepartmentTheme(user)

  const handleLogout = () => {
    logout()
    navigate("/department-login")
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || "D"

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <PageHeader
        eyebrow={theme.short}
        title="Department profile"
        description="Your officer account and department assignment."
        action={
          <PrimaryButton
            onClick={handleLogout}
            className="bg-rose-700 hover:bg-rose-800"
          >
            Log out
          </PrimaryButton>
        }
      />

      <Panel className="p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div
            className="w-20 h-20 rounded-xl text-white flex items-center justify-center font-display text-3xl font-semibold shadow-soft"
            style={{ backgroundColor: theme.accent }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl font-semibold text-forest truncate">
              {user?.name || "Department Admin"}
            </h2>
            <p className="text-stone-muted mt-1 truncate">{user?.email || "N/A"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="status-pill bg-stone text-forest">Department admin</span>
              <span
                className="status-pill font-semibold"
                style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
              >
                {user?.department?.name || theme.short}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Panel className="p-6">
          <h3 className="font-display text-lg font-semibold text-forest mb-4">Account information</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold tracking-wide uppercase text-stone-muted">Email</dt>
              <dd className="mt-1 text-forest font-medium">{user?.email || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide uppercase text-stone-muted">Role</dt>
              <dd className="mt-1 text-forest font-medium">{user?.role || "DEPARTMENT_ADMIN"}</dd>
            </div>
          </dl>
        </Panel>

        <Panel className="p-6">
          <h3 className="font-display text-lg font-semibold text-forest mb-4">Department details</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold tracking-wide uppercase text-stone-muted">Account status</dt>
              <dd className="mt-1 text-moss font-medium">Active</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide uppercase text-stone-muted">User ID</dt>
              <dd className="mt-1 text-forest font-medium tabular-nums">{user?.id || "N/A"}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/department/review"
          className="bg-surface rounded-xl border border-stone-dark shadow-soft p-5 hover:shadow-lift transition-shadow"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-2">Queue</p>
          <h3 className="font-display font-semibold text-forest mb-1">Review complaints</h3>
          <p className="text-sm text-stone-muted">Manage citizen complaints</p>
        </Link>

        <Link
          to="/department/reports"
          className="bg-surface rounded-xl border border-stone-dark shadow-soft p-5 hover:shadow-lift transition-shadow"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-2">Analytics</p>
          <h3 className="font-display font-semibold text-forest mb-1">Reports</h3>
          <p className="text-sm text-stone-muted">View department reports</p>
        </Link>

        <Link
          to="/department/notifications"
          className="bg-surface rounded-xl border border-stone-dark shadow-soft p-5 hover:shadow-lift transition-shadow"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-2">Inbox</p>
          <h3 className="font-display font-semibold text-forest mb-1">Notifications</h3>
          <p className="text-sm text-stone-muted">Stay updated on alerts</p>
        </Link>
      </div>

      <div className="mt-8 flex justify-center">
        <SecondaryButton onClick={handleLogout} className="text-rose-700 border-rose-200 hover:bg-rose-50">
          Log out of department portal
        </SecondaryButton>
      </div>
    </div>
  )
}

export default DepartmentProfile
