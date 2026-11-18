import { useState, useEffect } from "react"
import API from "../services/api"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ClipboardList, ListTodo, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import {
  PageHeader,
  SummaryCard,
  Panel,
  LoadingBlock,
} from "../components/UI/CivicUI"
import PriorityZonesMap from "../components/UI/PriorityZonesMap"

const CHART = {
  forest: "#0f3d2e",
  moss: "#1f7a54",
  amber: "#f59e0b",
  rose: "#e11d48",
}

function DepartmentReports() {
  const [stats, setStats] = useState({
    TOTAL: 0,
    NEW: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    HIGH_PRIORITY: 0
  })
  const [priorityData, setPriorityData] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtimeRefresh(() => fetchData(true), ["complaint", "notification"])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [statsRes, priorityRes, complaintsRes] = await Promise.all([
        API.get("/department/dashboard/stats"),
        API.get("/department/reports/priority"),
        API.get("/department/complaints"),
      ])
      setStats(statsRes.data)
      setPriorityData(formatPriorityData(priorityRes.data))
      setComplaints(complaintsRes.data || [])
    } catch (err) {
      console.error("Failed to fetch reports:", err)
      if (!silent) setError("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  const formatPriorityData = (data) => {
    return Object.entries(data).map(([priority, count]) => ({
      name: priority,
      value: count
    }))
  }

  const statusData = [
    { name: "NEW", value: stats.NEW, color: CHART.rose },
    { name: "IN_PROGRESS", value: stats.IN_PROGRESS, color: CHART.amber },
    { name: "RESOLVED", value: stats.RESOLVED, color: CHART.moss }
  ]

  const COLORS = [CHART.rose, CHART.amber, CHART.moss, CHART.forest]

  if (loading) {
    return <LoadingBlock label="Loading reports…" />
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-up">
      <PageHeader
        eyebrow="Analytics"
        title="Department reports"
        description="Status distribution, priority breakdown, and resolution metrics for your department."
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <SummaryCard label="Total" count={stats.TOTAL} hint="All complaints" icon={ClipboardList} />
        <SummaryCard label="New" count={stats.NEW} hint="Pending" icon={ListTodo} total={stats.TOTAL} />
        <SummaryCard label="In progress" count={stats.IN_PROGRESS} hint="Processing" icon={Loader2} total={stats.TOTAL} />
        <SummaryCard label="Resolved" count={stats.RESOLVED} hint="Completed" icon={CheckCircle2} total={stats.TOTAL} />
        <SummaryCard label="High priority" count={stats.HIGH_PRIORITY} hint="Urgent" icon={AlertTriangle} total={stats.TOTAL} />
      </div>

      {complaints.length > 0 && (
        <Panel className="p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-forest mb-1">Priority zones</h2>
          <p className="text-sm text-stone-muted mb-4">
            High, Medium, and Low priority areas for your department
          </p>
          <PriorityZonesMap complaints={complaints} height="24rem" />
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel className="p-6">
          <h2 className="font-display text-lg font-semibold text-forest mb-4">Status distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-display text-lg font-semibold text-forest mb-4">Priority breakdown</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e2d9" />
                <XAxis dataKey="name" stroke="#6b655c" fontSize={12} />
                <YAxis stroke="#6b655c" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#faf8f5",
                    border: "1px solid #e7e2d9",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-forest mb-4">Performance metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-stone/50 rounded-xl border border-stone-dark">
            <div className="text-xs font-semibold tracking-wide uppercase text-stone-muted mb-1">Resolution rate</div>
            <div className="font-display text-2xl font-semibold text-forest tabular-nums">
              {stats.TOTAL > 0 ? Math.round((stats.RESOLVED / stats.TOTAL) * 100) : 0}%
            </div>
          </div>
          <div className="text-center p-4 bg-stone/50 rounded-xl border border-stone-dark">
            <div className="text-xs font-semibold tracking-wide uppercase text-stone-muted mb-1">In progress rate</div>
            <div className="font-display text-2xl font-semibold text-forest tabular-nums">
              {stats.TOTAL > 0 ? Math.round((stats.IN_PROGRESS / stats.TOTAL) * 100) : 0}%
            </div>
          </div>
          <div className="text-center p-4 bg-stone/50 rounded-xl border border-stone-dark">
            <div className="text-xs font-semibold tracking-wide uppercase text-stone-muted mb-1">New rate</div>
            <div className="font-display text-2xl font-semibold text-forest tabular-nums">
              {stats.TOTAL > 0 ? Math.round((stats.NEW / stats.TOTAL) * 100) : 0}%
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}

export default DepartmentReports
