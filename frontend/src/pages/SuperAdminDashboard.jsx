import { useState, useEffect, useContext, useMemo } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users as UsersIcon,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ListTodo,
  TrendingUp,
  Shield,
  RefreshCw,
} from "lucide-react"
import API from "../services/api"
import { AuthContext } from "../contexts/AuthContext"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import SidebarShell from "../components/Layout/SidebarShell"
import {
  PageHeader,
  Panel,
  SummaryCard,
  LoadingBlock,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  PriorityPill,
  inputClass,
  EmptyState,
} from "../components/UI/CivicUI"
import PriorityZonesMap from "../components/UI/PriorityZonesMap"

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "complaints", label: "Complaints", icon: FileText },
]

const formatDate = (dateString) => {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const rolePillClass = (role) => {
  if (role === "SUPER_ADMIN") return "bg-moss-pale text-forest"
  if (role === "DEPARTMENT_ADMIN") return "bg-forest/10 text-forest"
  return "bg-stone text-stone-muted"
}

const errDetail = (error, fallback) => {
  const detail = error?.response?.data?.detail ?? error?.response?.data
  if (typeof detail === "string") return detail
  return fallback
}

function BarRow({ label, value, total, color = "bg-moss" }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
        <span className="font-medium text-forest truncate">{label}</span>
        <span className="text-stone-muted tabular-nums shrink-0">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DetailModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-forest-deep/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative bg-surface rounded-xl shadow-lift border border-stone-dark w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-stone-dark flex items-center justify-between shrink-0">
          <h3 className="font-display text-lg font-semibold text-forest">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-muted hover:bg-stone hover:text-forest"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  )
}

function SuperAdminDashboard() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("overview")
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 8

  const [complaintSearch, setComplaintSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [complaintPage, setComplaintPage] = useState(1)
  const complaintsPerPage = 8
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
  })
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" })
  const [editingDept, setEditingDept] = useState(null)
  const [promoteDraft, setPromoteDraft] = useState({})

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtimeRefresh(() => fetchData(true), ["complaint", "notification"])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [usersRes, departmentsRes, complaintsRes] = await Promise.all([
        API.get("/superadmin/users"),
        API.get("/superadmin/departments"),
        API.get("/superadmin/complaints"),
      ])
      setUsers(usersRes.data)
      setDepartments(departmentsRes.data)
      setComplaints(complaintsRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      showMessage("error", "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    window.setTimeout(() => setMessage({ type: "", text: "" }), 3500)
  }

  const analytics = useMemo(() => {
    const byStatus = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0 }
    const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 }
    const byRole = { USER: 0, DEPARTMENT_ADMIN: 0, SUPER_ADMIN: 0 }
    const byDept = {}
    const byCategory = {}

    for (const c of complaints) {
      const status = (c.status || "NEW").toUpperCase()
      const priority = (c.priority || "MEDIUM").toUpperCase()
      byStatus[status] = (byStatus[status] || 0) + 1
      byPriority[priority] = (byPriority[priority] || 0) + 1
      const deptName = c.department?.name || "Unassigned"
      byDept[deptName] = (byDept[deptName] || 0) + 1
      const cat = c.category || "Other"
      byCategory[cat] = (byCategory[cat] || 0) + 1
    }

    for (const u of users) {
      byRole[u.role] = (byRole[u.role] || 0) + 1
    }

    const total = complaints.length
    const resolved = byStatus.RESOLVED || 0
    const open = total - resolved
    const highOpen = complaints.filter(
      (c) => (c.priority || "").toUpperCase() === "HIGH" && (c.status || "") !== "RESOLVED"
    ).length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

    const recent = [...complaints]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)

    const attention = complaints
      .filter((c) => (c.status || "") !== "RESOLVED")
      .sort((a, b) => {
        const pr = { HIGH: 0, MEDIUM: 1, LOW: 2 }
        const pa = pr[(a.priority || "MEDIUM").toUpperCase()] ?? 1
        const pb = pr[(b.priority || "MEDIUM").toUpperCase()] ?? 1
        if (pa !== pb) return pa - pb
        return (b.upvotes || 0) - (a.upvotes || 0)
      })
      .slice(0, 5)

    const deptRows = departments.map((d) => {
      const deptComplaints = complaints.filter((c) => c.department?.id === d.id)
      const admins = users.filter(
        (u) => u.department?.id === d.id && u.role === "DEPARTMENT_ADMIN"
      )
      const openCount = deptComplaints.filter((c) => c.status !== "RESOLVED").length
      return {
        ...d,
        complaintCount: deptComplaints.length,
        openCount,
        adminCount: admins.length,
        admins,
      }
    })

    return {
      byStatus,
      byPriority,
      byRole,
      byDept,
      byCategory,
      total,
      resolved,
      open,
      highOpen,
      resolutionRate,
      recent,
      attention,
      deptRows,
    }
  }, [complaints, users, departments])

  const categories = useMemo(() => {
    const set = new Set(complaints.map((c) => c.category).filter(Boolean))
    return [...set].sort()
  }, [complaints])

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim()
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      String(u.id).includes(q)
    const matchesRole = roleFilter ? u.role === roleFilter : true
    return matchesSearch && matchesRole
  })

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage))
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [userSearch, roleFilter])

  const filteredComplaints = complaints.filter((c) => {
    const q = complaintSearch.toLowerCase().trim()
    const hay = `${c.title || ""} ${c.description || ""} ${c.category || ""}`.toLowerCase()
    return (
      (!q || hay.includes(q)) &&
      (!statusFilter || c.status === statusFilter) &&
      (!priorityFilter || c.priority === priorityFilter) &&
      (!departmentFilter || String(c.department?.id || "") === departmentFilter) &&
      (!categoryFilter || c.category === categoryFilter)
    )
  })

  const totalComplaintPages = Math.max(1, Math.ceil(filteredComplaints.length / complaintsPerPage))
  const paginatedComplaints = filteredComplaints.slice(
    (complaintPage - 1) * complaintsPerPage,
    complaintPage * complaintsPerPage
  )

  useEffect(() => {
    setComplaintPage(1)
  }, [complaintSearch, statusFilter, priorityFilter, departmentFilter, categoryFilter])

  const handleCreateDepartment = async (e) => {
    e.preventDefault()
    if (!newDepartment.name.trim()) {
      showMessage("error", "Department name is required")
      return
    }
    try {
      setActionLoading(true)
      await API.post("/superadmin/departments", newDepartment)
      showMessage("success", "Department created")
      setNewDepartment({ name: "", description: "" })
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to create department"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateDepartment = async (e) => {
    e.preventDefault()
    if (!editingDept) return
    try {
      setActionLoading(true)
      await API.put(`/superadmin/departments/${editingDept.id}`, {
        name: editingDept.name,
        description: editingDept.description,
      })
      showMessage("success", "Department updated")
      setEditingDept(null)
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to update department"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return
    try {
      setActionLoading(true)
      await API.delete(`/superadmin/users/${userId}`)
      showMessage("success", "User deleted")
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to delete user"))
    } finally {
      setActionLoading(false)
    }
  }

  const handlePromote = async (userId) => {
    const departmentId = promoteDraft[userId]
    if (!departmentId) {
      showMessage("error", "Select a department before promoting")
      return
    }
    try {
      setActionLoading(true)
      await API.put(`/superadmin/promote/${userId}?departmentId=${departmentId}`)
      showMessage("success", "User promoted to department admin")
      setPromoteDraft((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to promote user"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDemote = async (userId) => {
    if (!window.confirm("Demote this admin back to a citizen account?")) return
    try {
      setActionLoading(true)
      await API.put(`/superadmin/demote/${userId}`)
      showMessage("success", "Admin demoted to citizen")
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to demote user"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm("Delete this department? It must have no admins or complaints.")) return
    try {
      setActionLoading(true)
      await API.delete(`/superadmin/departments/${deptId}`)
      showMessage("success", "Department deleted")
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to delete department"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm("Permanently delete this complaint?")) return
    try {
      setActionLoading(true)
      await API.delete(`/superadmin/complaints/${complaintId}`)
      showMessage("success", "Complaint deleted")
      setSelectedComplaint(null)
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to delete complaint"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !newAdmin.departmentId) {
      showMessage("error", "All fields are required")
      return
    }
    try {
      setActionLoading(true)
      await API.post("/superadmin/create-admin", {
        ...newAdmin,
        departmentId: Number(newAdmin.departmentId),
      })
      showMessage("success", "Department admin created")
      setNewAdmin({ name: "", email: "", password: "", departmentId: "" })
      fetchData(true)
    } catch (error) {
      showMessage("error", errDetail(error, "Failed to create admin"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const sidebarNavItems = NAV_ITEMS.map((item) => ({
    label: item.label,
    icon: item.icon,
    active: activeSection === item.id,
    onClick: () => setActiveSection(item.id),
    badge:
      item.id === "complaints" && analytics.highOpen > 0 ? analytics.highOpen : undefined,
  }))

  const maxDeptLoad = Math.max(1, ...analytics.deptRows.map((d) => d.complaintCount))

  return (
    <SidebarShell
      navItems={sidebarNavItems}
      portalLabel="Super Admin"
      user={user}
      onLogout={handleLogout}
      contentClassName="max-w-[1400px]"
      topBarContent={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-semibold text-stone-muted uppercase tracking-wide">
            Live ops
          </span>
          <SecondaryButton
            type="button"
            onClick={() => fetchData(true)}
            className="!py-1.5 !px-3 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </SecondaryButton>
        </div>
      }
    >
      {message.text && (
        <div
          className={`fixed top-20 right-4 z-[2100] px-5 py-3 rounded-xl shadow-lift border text-sm font-semibold ${
            message.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-moss-pale border-moss/30 text-forest"
          }`}
        >
          {message.text}
        </div>
      )}

      {activeSection === "overview" && (
        <div className="space-y-6 animate-fade-up">
          <PageHeader
            eyebrow="Command center"
            title="System overview"
            description="City-wide health: open work, resolution rate, department load, and priority risk."
          />

          {loading ? (
            <LoadingBlock label="Loading command center…" />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <SummaryCard
                  label="Users"
                  count={users.length}
                  hint="All accounts"
                  icon={UsersIcon}
                />
                <SummaryCard
                  label="Departments"
                  count={departments.length}
                  hint="Active units"
                  icon={Building2}
                />
                <SummaryCard
                  label="Open cases"
                  count={analytics.open}
                  hint="Not resolved"
                  icon={ListTodo}
                  total={analytics.total || 1}
                />
                <SummaryCard
                  label="In progress"
                  count={analytics.byStatus.IN_PROGRESS || 0}
                  hint="Being handled"
                  icon={Loader2}
                  total={analytics.total || 1}
                />
                <SummaryCard
                  label="Resolved"
                  count={analytics.resolved}
                  hint={`${analytics.resolutionRate}% rate`}
                  icon={CheckCircle2}
                  total={analytics.total || 1}
                />
                <SummaryCard
                  label="High priority"
                  count={analytics.highOpen}
                  hint="Open urgent"
                  icon={AlertTriangle}
                  total={analytics.total || 1}
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                <Panel className="p-5 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-moss" />
                    <h2 className="font-display text-lg font-semibold text-forest">Status mix</h2>
                  </div>
                  <div className="space-y-3">
                    <BarRow
                      label="New"
                      value={analytics.byStatus.NEW || 0}
                      total={analytics.total}
                      color="bg-rose-500"
                    />
                    <BarRow
                      label="In progress"
                      value={analytics.byStatus.IN_PROGRESS || 0}
                      total={analytics.total}
                      color="bg-amber-500"
                    />
                    <BarRow
                      label="Resolved"
                      value={analytics.byStatus.RESOLVED || 0}
                      total={analytics.total}
                      color="bg-moss"
                    />
                  </div>
                  <div className="mt-5 pt-4 border-t border-stone-dark">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-muted mb-3">
                      Priority mix
                    </p>
                    <div className="space-y-3">
                      <BarRow
                        label="High"
                        value={analytics.byPriority.HIGH || 0}
                        total={analytics.total}
                        color="bg-rose-600"
                      />
                      <BarRow
                        label="Medium"
                        value={analytics.byPriority.MEDIUM || 0}
                        total={analytics.total}
                        color="bg-amber-500"
                      />
                      <BarRow
                        label="Low"
                        value={analytics.byPriority.LOW || 0}
                        total={analytics.total}
                        color="bg-emerald-600"
                      />
                    </div>
                  </div>
                </Panel>

                <Panel className="p-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-display text-lg font-semibold text-forest">
                        Department workload
                      </h2>
                      <p className="text-sm text-stone-muted">Open vs total complaints by unit</p>
                    </div>
                    <SecondaryButton type="button" onClick={() => setActiveSection("departments")}>
                      Manage
                    </SecondaryButton>
                  </div>
                  {analytics.deptRows.length === 0 ? (
                    <EmptyState
                      title="No departments"
                      description="Create a department to start routing complaints."
                    />
                  ) : (
                    <div className="space-y-3">
                      {analytics.deptRows
                        .sort((a, b) => b.openCount - a.openCount)
                        .map((d) => (
                          <div
                            key={d.id}
                            className="rounded-xl border border-stone-dark bg-stone/40 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div>
                                <p className="font-semibold text-forest">{d.name}</p>
                                <p className="text-xs text-stone-muted">
                                  {d.adminCount} admin{d.adminCount === 1 ? "" : "s"} ·{" "}
                                  {d.openCount} open / {d.complaintCount} total
                                </p>
                              </div>
                              {d.adminCount === 0 && (
                                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
                                  No admin
                                </span>
                              )}
                            </div>
                            <div className="h-2 rounded-full bg-surface border border-stone-dark overflow-hidden">
                              <div
                                className="h-full bg-forest rounded-full"
                                style={{
                                  width: `${Math.round((d.complaintCount / maxDeptLoad) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Panel className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold text-forest">
                      Needs attention
                    </h2>
                    <SecondaryButton type="button" onClick={() => setActiveSection("complaints")}>
                      View all
                    </SecondaryButton>
                  </div>
                  {analytics.attention.length === 0 ? (
                    <p className="text-sm text-stone-muted">No open complaints right now.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {analytics.attention.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedComplaint(c)
                            setActiveSection("complaints")
                          }}
                          className="w-full text-left rounded-xl border border-stone-dark bg-surface hover:bg-moss-pale/40 p-3.5 transition-colors"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <PriorityPill priority={c.priority} />
                            <StatusPill status={c.status} />
                            <span className="text-xs text-stone-muted tabular-nums">
                              {c.upvotes || 0} votes
                            </span>
                          </div>
                          <p className="font-semibold text-forest truncate">
                            {c.title || "Untitled"}
                          </p>
                          <p className="text-xs text-stone-muted mt-0.5">
                            {c.department?.name || "Unassigned"} · {formatDate(c.createdAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel className="p-5">
                  <h2 className="font-display text-lg font-semibold text-forest mb-4">
                    Recent filings
                  </h2>
                  {analytics.recent.length === 0 ? (
                    <p className="text-sm text-stone-muted">No complaints yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {analytics.recent.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start justify-between gap-3 py-2.5 border-b border-stone-dark/50 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-forest truncate">
                              {c.title || "Untitled"}
                            </p>
                            <p className="text-xs text-stone-muted">
                              {c.user?.name || "Citizen"} · {c.department?.name || "—"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <StatusPill status={c.status} />
                            <p className="text-[11px] text-stone-muted mt-1">
                              {formatDate(c.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    id: "users",
                    label: "People",
                    title: "Manage users",
                    body: "Promote citizens, create officers, remove accounts.",
                    icon: Shield,
                  },
                  {
                    id: "departments",
                    label: "Org",
                    title: "Departments",
                    body: "Create units and keep staffing coverage healthy.",
                    icon: Building2,
                  },
                  {
                    id: "complaints",
                    label: "Moderation",
                    title: "All complaints",
                    body: "Filter city-wide issues and remove bad reports.",
                    icon: FileText,
                  },
                ].map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveSection(card.id)}
                    className="text-left bg-surface rounded-xl border border-stone-dark shadow-soft p-5 hover:shadow-lift transition-shadow group"
                  >
                    <card.icon className="w-5 h-5 text-moss mb-3" />
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-moss mb-1">
                      {card.label}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-forest group-hover:text-forest-soft">
                      {card.title}
                    </h3>
                    <p className="text-sm text-stone-muted mt-1">{card.body}</p>
                  </button>
                ))}
              </div>

              {complaints.length > 0 && (
                <Panel className="p-6">
                  <h2 className="font-display text-xl font-semibold text-forest mb-1">
                    City priority zones
                  </h2>
                  <p className="text-sm text-stone-muted mb-4">
                    High, Medium, and Low circle zones across every mapped complaint
                  </p>
                  <PriorityZonesMap complaints={complaints} height="24rem" />
                </Panel>
              )}
            </>
          )}
        </div>
      )}

      {activeSection === "users" && (
        <div className="space-y-6 animate-fade-up">
          <PageHeader
            eyebrow="Access control"
            title="Users & officers"
            description="Create department admins, promote citizens into departments, or demote officers."
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <Panel className="p-5 lg:col-span-2">
              <h3 className="font-display text-lg font-semibold text-forest mb-4">
                Create department admin
              </h3>
              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="email"
                  placeholder="Work email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="password"
                  placeholder="Temporary password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className={inputClass}
                />
                <select
                  value={newAdmin.departmentId}
                  onChange={(e) => setNewAdmin({ ...newAdmin, departmentId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <div className="md:col-span-2">
                  <PrimaryButton type="submit" disabled={actionLoading}>
                    {actionLoading ? "Creating…" : "Create admin"}
                  </PrimaryButton>
                </div>
              </form>
            </Panel>

            <Panel className="p-5">
              <h3 className="font-display text-lg font-semibold text-forest mb-3">Role mix</h3>
              <div className="space-y-3">
                <BarRow label="Citizens" value={analytics.byRole.USER || 0} total={users.length} />
                <BarRow
                  label="Dept admins"
                  value={analytics.byRole.DEPARTMENT_ADMIN || 0}
                  total={users.length}
                  color="bg-forest"
                />
                <BarRow
                  label="Super admins"
                  value={analytics.byRole.SUPER_ADMIN || 0}
                  total={users.length}
                  color="bg-emerald-700"
                />
              </div>
            </Panel>
          </div>

          <Panel className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                type="text"
                placeholder="Search name, email, or ID…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={`${inputClass} sm:max-w-sm`}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`${inputClass} sm:max-w-[200px]`}
              >
                <option value="">All roles</option>
                <option value="USER">Citizen</option>
                <option value="DEPARTMENT_ADMIN">Dept Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <p className="text-sm text-stone-muted self-center tabular-nums sm:ml-auto">
                {filteredUsers.length} account{filteredUsers.length === 1 ? "" : "s"}
              </p>
            </div>

            {loading ? (
              <LoadingBlock label="Loading users…" />
            ) : filteredUsers.length === 0 ? (
              <EmptyState title="No users found" description="Try adjusting search or role filters." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-dark">
                        <th className="pb-3 pr-3 font-semibold text-stone-muted">User</th>
                        <th className="pb-3 pr-3 font-semibold text-stone-muted">Role</th>
                        <th className="pb-3 pr-3 font-semibold text-stone-muted">Department</th>
                        <th className="pb-3 font-semibold text-stone-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-stone-dark/60 hover:bg-moss-pale/30 align-top"
                        >
                          <td className="py-3.5 pr-3">
                            <p className="font-medium text-forest">{u.name}</p>
                            <p className="text-xs text-stone-muted">{u.email}</p>
                            <p className="text-[11px] text-stone-muted tabular-nums mt-0.5">
                              ID {u.id}
                            </p>
                          </td>
                          <td className="py-3.5 pr-3">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${rolePillClass(u.role)}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 text-stone-muted">
                            {u.department?.name || "—"}
                          </td>
                          <td className="py-3.5">
                            {u.role === "SUPER_ADMIN" ? (
                              <span className="text-xs text-stone-muted">Protected</span>
                            ) : (
                              <div className="flex flex-col gap-2 min-w-[12rem]">
                                {u.role === "USER" && (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <select
                                      value={promoteDraft[u.id] || ""}
                                      onChange={(e) =>
                                        setPromoteDraft((prev) => ({
                                          ...prev,
                                          [u.id]: e.target.value,
                                        }))
                                      }
                                      className="bg-surface border border-stone-dark text-ink py-1.5 px-2 rounded-lg text-xs font-medium"
                                    >
                                      <option value="">Dept…</option>
                                      {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          {d.name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handlePromote(u.id)}
                                      disabled={actionLoading}
                                      className="text-xs font-semibold text-forest hover:underline disabled:opacity-50"
                                    >
                                      Promote
                                    </button>
                                  </div>
                                )}
                                {u.role === "DEPARTMENT_ADMIN" && (
                                  <button
                                    type="button"
                                    onClick={() => handleDemote(u.id)}
                                    disabled={actionLoading}
                                    className="text-xs font-semibold text-amber-800 hover:underline disabled:opacity-50 text-left"
                                  >
                                    Demote to citizen
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={actionLoading}
                                  className="text-xs font-semibold text-rose-700 hover:underline disabled:opacity-50 text-left"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-5 gap-3">
                  <SecondaryButton
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </SecondaryButton>
                  <span className="text-sm text-stone-muted tabular-nums">
                    Page {currentPage} of {totalUserPages}
                  </span>
                  <SecondaryButton
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalUserPages))}
                    disabled={currentPage >= totalUserPages}
                  >
                    Next
                  </SecondaryButton>
                </div>
              </>
            )}
          </Panel>
        </div>
      )}

      {activeSection === "departments" && (
        <div className="space-y-6 animate-fade-up">
          <PageHeader
            eyebrow="Organization"
            title="Departments"
            description="Build the org chart, cover staffing gaps, and tune department details."
          />

          <Panel className="p-5 md:p-6">
            <h3 className="font-display text-lg font-semibold text-forest mb-4">
              Create department
            </h3>
            <form onSubmit={handleCreateDepartment} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Department name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDepartment.description}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, description: e.target.value })
                }
                className={inputClass}
              />
              <PrimaryButton type="submit" disabled={actionLoading} className="shrink-0">
                {actionLoading ? "Creating…" : "Create"}
              </PrimaryButton>
            </form>
          </Panel>

          <div className="grid md:grid-cols-2 gap-4">
            {loading ? (
              <LoadingBlock label="Loading departments…" />
            ) : analytics.deptRows.length === 0 ? (
              <EmptyState
                title="No departments yet"
                description="Create a department to assign admins and complaints."
              />
            ) : (
              analytics.deptRows
                .sort((a, b) => b.complaintCount - a.complaintCount)
                .map((dept) => (
                  <Panel key={dept.id} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h4 className="font-display text-lg font-semibold text-forest truncate">
                          {dept.name}
                        </h4>
                        <p className="text-sm text-stone-muted mt-1">
                          {dept.description || "No description"}
                        </p>
                      </div>
                      {dept.adminCount === 0 && (
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
                          Unstaffed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-lg bg-stone/50 border border-stone-dark p-2.5 text-center">
                        <p className="text-lg font-display font-semibold text-forest tabular-nums">
                          {dept.adminCount}
                        </p>
                        <p className="text-[11px] text-stone-muted font-semibold uppercase">
                          Admins
                        </p>
                      </div>
                      <div className="rounded-lg bg-stone/50 border border-stone-dark p-2.5 text-center">
                        <p className="text-lg font-display font-semibold text-forest tabular-nums">
                          {dept.openCount}
                        </p>
                        <p className="text-[11px] text-stone-muted font-semibold uppercase">Open</p>
                      </div>
                      <div className="rounded-lg bg-stone/50 border border-stone-dark p-2.5 text-center">
                        <p className="text-lg font-display font-semibold text-forest tabular-nums">
                          {dept.complaintCount}
                        </p>
                        <p className="text-[11px] text-stone-muted font-semibold uppercase">
                          Total
                        </p>
                      </div>
                    </div>

                    {dept.admins.length > 0 && (
                      <p className="text-xs text-stone-muted mb-4">
                        Officers: {dept.admins.map((a) => a.name).join(", ")}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <SecondaryButton
                        type="button"
                        onClick={() =>
                          setEditingDept({
                            id: dept.id,
                            name: dept.name,
                            description: dept.description || "",
                          })
                        }
                      >
                        Edit
                      </SecondaryButton>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(dept.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                      {dept.adminCount === 0 && (
                        <SecondaryButton type="button" onClick={() => setActiveSection("users")}>
                          Assign admin
                        </SecondaryButton>
                      )}
                    </div>
                  </Panel>
                ))
            )}
          </div>
        </div>
      )}

      {activeSection === "complaints" && (
        <div className="space-y-6 animate-fade-up">
          <PageHeader
            eyebrow="Moderation"
            title="All complaints"
            description="Search city-wide filings, inspect details, and remove invalid reports."
          />

          {!loading && complaints.length > 0 && (
            <Panel className="p-6">
              <h2 className="font-display text-lg font-semibold text-forest mb-1">
                Filtered priority zones
              </h2>
              <p className="text-sm text-stone-muted mb-4">
                Map updates with your current search and filters
              </p>
              <PriorityZonesMap complaints={filteredComplaints} height="20rem" />
            </Panel>
          )}

          <Panel className="p-5 md:p-6">
            {loading ? (
              <LoadingBlock label="Loading complaints…" />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search title, description, category…"
                    value={complaintSearch}
                    onChange={(e) => setComplaintSearch(e.target.value)}
                    className={`${inputClass} sm:max-w-xs`}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`${inputClass} sm:max-w-[160px]`}
                  >
                    <option value="">All status</option>
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className={`${inputClass} sm:max-w-[160px]`}
                  >
                    <option value="">All priority</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className={`${inputClass} sm:max-w-[180px]`}
                  >
                    <option value="">All departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`${inputClass} sm:max-w-[160px]`}
                  >
                    <option value="">All categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredComplaints.length === 0 ? (
                  <EmptyState
                    title="No complaints found"
                    description="Try a different search or clear your filters."
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-stone-dark">
                            <th className="pb-3 pr-3 font-semibold text-stone-muted">Complaint</th>
                            <th className="pb-3 pr-3 font-semibold text-stone-muted">Dept</th>
                            <th className="pb-3 pr-3 font-semibold text-stone-muted">Status</th>
                            <th className="pb-3 pr-3 font-semibold text-stone-muted">Priority</th>
                            <th className="pb-3 pr-3 font-semibold text-stone-muted">Votes</th>
                            <th className="pb-3 font-semibold text-stone-muted">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedComplaints.map((c) => (
                            <tr
                              key={c.id}
                              className="border-b border-stone-dark/60 hover:bg-moss-pale/30"
                            >
                              <td className="py-3 pr-3 max-w-[240px]">
                                <p className="font-medium text-forest truncate">
                                  {c.title || c.description}
                                </p>
                                <p className="text-xs text-stone-muted">
                                  #{c.id} · {c.category || "—"} · {formatDate(c.createdAt)}
                                </p>
                              </td>
                              <td className="py-3 pr-3 text-stone-muted">
                                {c.department?.name || "—"}
                              </td>
                              <td className="py-3 pr-3">
                                <StatusPill status={c.status} />
                              </td>
                              <td className="py-3 pr-3">
                                <PriorityPill priority={c.priority} />
                              </td>
                              <td className="py-3 pr-3 tabular-nums text-moss font-semibold">
                                {c.upvotes || 0}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedComplaint(c)}
                                    className="text-sm font-semibold text-forest hover:underline"
                                  >
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComplaint(c.id)}
                                    disabled={actionLoading}
                                    className="text-sm font-semibold text-rose-700 hover:text-rose-900 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-sm text-stone-muted mt-4">
                      Showing {(complaintPage - 1) * complaintsPerPage + 1}–
                      {Math.min(complaintPage * complaintsPerPage, filteredComplaints.length)} of{" "}
                      {filteredComplaints.length}
                    </p>

                    <div className="flex justify-between items-center mt-4 gap-3">
                      <SecondaryButton
                        onClick={() => setComplaintPage((prev) => Math.max(prev - 1, 1))}
                        disabled={complaintPage === 1}
                      >
                        Previous
                      </SecondaryButton>
                      <span className="text-sm text-stone-muted tabular-nums">
                        Page {complaintPage} of {totalComplaintPages}
                      </span>
                      <SecondaryButton
                        onClick={() =>
                          setComplaintPage((prev) => Math.min(prev + 1, totalComplaintPages))
                        }
                        disabled={complaintPage >= totalComplaintPages}
                      >
                        Next
                      </SecondaryButton>
                    </div>
                  </>
                )}
              </>
            )}
          </Panel>
        </div>
      )}

      <DetailModal
        open={!!editingDept}
        onClose={() => setEditingDept(null)}
        title="Edit department"
      >
        {editingDept && (
          <form onSubmit={handleUpdateDepartment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-stone-muted mb-1.5">
                Name
              </label>
              <input
                className={inputClass}
                value={editingDept.name}
                onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-stone-muted mb-1.5">
                Description
              </label>
              <textarea
                className={`${inputClass} min-h-[6rem] resize-y`}
                value={editingDept.description}
                onChange={(e) =>
                  setEditingDept({ ...editingDept, description: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <SecondaryButton type="button" onClick={() => setEditingDept(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={actionLoading}>
                {actionLoading ? "Saving…" : "Save changes"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </DetailModal>

      <DetailModal
        open={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint detail"
      >
        {selectedComplaint && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill status={selectedComplaint.status} />
              <PriorityPill priority={selectedComplaint.priority} />
              <span className="text-xs text-stone-muted self-center">
                {selectedComplaint.category}
              </span>
            </div>
            <h4 className="font-display text-xl font-semibold text-forest">
              {selectedComplaint.title || "Untitled"}
            </h4>
            <p className="text-sm text-stone-muted leading-relaxed whitespace-pre-wrap">
              {selectedComplaint.description}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-stone-muted">Citizen</p>
                <p className="text-forest font-medium">
                  {selectedComplaint.user?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-muted">Department</p>
                <p className="text-forest font-medium">
                  {selectedComplaint.department?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-muted">Votes</p>
                <p className="text-forest font-medium tabular-nums">
                  {selectedComplaint.upvotes || 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-muted">Filed</p>
                <p className="text-forest font-medium">
                  {formatDate(selectedComplaint.createdAt)}
                </p>
              </div>
            </div>
            {selectedComplaint.remarks && (
              <div className="rounded-xl bg-moss-pale/50 border border-stone-dark p-3">
                <p className="text-xs font-semibold uppercase text-moss mb-1">Remarks</p>
                <p className="text-sm text-forest">{selectedComplaint.remarks}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setSelectedComplaint(null)}>
                Close
              </SecondaryButton>
              <button
                type="button"
                onClick={() => handleDeleteComplaint(selectedComplaint.id)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50"
              >
                Delete complaint
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </SidebarShell>
  )
}

export default SuperAdminDashboard
