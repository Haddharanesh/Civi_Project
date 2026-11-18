import { useContext, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import API from "../services/api"
import { ClipboardList, ListTodo, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import {
  PageHeader,
  SummaryCard,
  Panel,
  LoadingBlock,
  StatusPill,
  PriorityPill,
} from "../components/UI/CivicUI"
import PriorityZonesMap from "../components/UI/PriorityZonesMap"
import { getDepartmentTheme } from "../utils/departmentTheme"

function DepartmentDashboard() {
  const { user } = useContext(AuthContext)
  const theme = getDepartmentTheme(user)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState([])

  useEffect(() => {
    fetchStats()
    fetchComplaints()
  }, [])

  useRealtimeRefresh(() => {
    fetchStats(true)
    fetchComplaints(true)
  }, ["complaint", "notification"])

  const fetchStats = async (silent = false) => {
    try {
      const res = await API.get("/department/dashboard/stats")
      setStats(res.data)
    } catch (err) {
      console.error("Failed to fetch department stats:", err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/department/complaints")
      setComplaints(res.data)
    } catch (err) {
      console.error("Failed to fetch complaints:", err)
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading dashboard…" />
  }

  // Default values if fields are missing
  const total = stats?.TOTAL || 0
  const newCount = stats?.NEW || 0
  const inProgressCount = stats?.IN_PROGRESS || 0
  const resolvedCount = stats?.RESOLVED || 0
  const highPriorityCount = stats?.HIGH_PRIORITY || 0

  // Calculate resolved percentage
  const resolvedPercentage = total > 0 ? Math.round((resolvedCount / total) * 100) : 0

  const topSupported = [...complaints]
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    .slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto animate-fade-up">
      <PageHeader
        eyebrow={theme.short}
        title="Operations dashboard"
        description={`Welcome back, ${user?.name || "officer"}. Track workload, priority issues, and resolution progress.`}
        action={
          <Link
            to="/department/review"
            className="btn-lift px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: theme.accent }}
          >
            Review queue
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard label="Total" count={total} hint="All assigned" icon={ClipboardList} />
        <SummaryCard label="New" count={newCount} hint="Awaiting action" icon={ListTodo} total={total} />
        <SummaryCard label="In progress" count={inProgressCount} hint="Being handled" icon={Loader2} total={total} />
        <SummaryCard label="Resolved" count={resolvedCount} hint="Closed" icon={CheckCircle2} total={total} />
        <SummaryCard label="High priority" count={highPriorityCount} hint="Needs attention" icon={AlertTriangle} total={total} />
      </div>

      {complaints.length > 0 && (
        <Panel className="p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-forest mb-1">Priority zones map</h2>
          <p className="text-sm text-stone-muted mb-4">
            High, Medium, and Low priority areas based on assigned complaints
          </p>
          <PriorityZonesMap complaints={complaints} height="26rem" />
        </Panel>
      )}

      {topSupported.length > 0 && (
        <Panel className="p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-forest mb-1">Most supported complaints</h2>
          <p className="text-sm text-stone-muted mb-4">
            Prioritize issues with the highest community vote counts
          </p>
          <div className="space-y-3">
            {topSupported.map((c, index) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 rounded-xl bg-stone/60 border border-stone-dark"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-sm font-bold tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-forest truncate">{c.title || "Untitled"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-stone-muted">{c.category}</span>
                      <StatusPill status={c.status} />
                      <PriorityPill priority={c.priority} />
                    </div>
                  </div>
                </div>
                <span className="ml-3 shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface text-moss font-bold text-sm border border-stone-dark tabular-nums">
                  {c.upvotes || 0} votes
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/department/review"
          className="bg-surface rounded-xl border border-stone-dark shadow-soft p-6 hover:shadow-lift transition-shadow group"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-2">Queue</p>
          <h3 className="font-display text-lg font-semibold text-forest mb-1 group-hover:text-forest-soft">
            Review complaints
          </h3>
          <p className="text-sm text-stone-muted">Manage and update citizen issues</p>
        </Link>

        <Link
          to="/department/reports"
          className="bg-surface rounded-xl border border-stone-dark shadow-soft p-6 hover:shadow-lift transition-shadow group"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-2">Analytics</p>
          <h3 className="font-display text-lg font-semibold text-forest mb-1 group-hover:text-forest-soft">
            Reports
          </h3>
          <p className="text-sm text-stone-muted">View department performance</p>
        </Link>

        <Link
          to="/department/profile"
          className="bg-surface rounded-xl border border-stone-dark shadow-soft p-6 hover:shadow-lift transition-shadow group"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-2">Account</p>
          <h3 className="font-display text-lg font-semibold text-forest mb-1 group-hover:text-forest-soft">
            My profile
          </h3>
          <p className="text-sm text-stone-muted">Account and department details</p>
        </Link>
      </div>

      {total > 0 && (
        <Panel className="p-6">
          <h2 className="font-display text-xl font-semibold text-forest mb-6">Performance overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e7e2d9"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#1f7a54"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${Math.round((resolvedCount / total) * 352)} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-2xl font-semibold text-forest tabular-nums">{resolvedPercentage}%</span>
                </div>
              </div>
              <p className="text-forest font-medium">Resolution rate</p>
              <p className="text-sm text-stone-muted">{resolvedPercentage}% complaints resolved</p>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e7e2d9"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${Math.round(((newCount + inProgressCount) / total) * 352)} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-2xl font-semibold text-forest tabular-nums">{100 - resolvedPercentage}%</span>
                </div>
              </div>
              <p className="text-forest font-medium">Pending rate</p>
              <p className="text-sm text-stone-muted">{100 - resolvedPercentage}% complaints pending</p>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e7e2d9"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e11d48"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${Math.round((highPriorityCount / total) * 352)} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-2xl font-semibold text-forest tabular-nums">{Math.round((highPriorityCount / total) * 100)}%</span>
                </div>
              </div>
              <p className="text-forest font-medium">High priority</p>
              <p className="text-sm text-stone-muted">{highPriorityCount} high priority complaints</p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}

export default DepartmentDashboard
