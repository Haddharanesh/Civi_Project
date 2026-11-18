import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import { IMAGE_BASE_URL } from "../config"
import { ClipboardList, ListTodo, Loader2, CheckCircle2 } from "lucide-react"
import {
  PageHeader,
  StatusPill,
  PriorityPill,
  SummaryCard,
  EmptyState,
  PrimaryButton,
  SkeletonGrid,
  SkeletonSummaryCards,
} from "../components/UI/CivicUI"

function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 })
  const navigate = useNavigate()

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      new: data.filter((c) => c.status === "NEW").length,
      inProgress: data.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: data.filter((c) => c.status === "RESOLVED").length,
    })
  }

  const fetchComplaints = (silent = false) => {
    if (!silent) setLoading(true)
    API.get("/complaints/my")
      .then((res) => {
        setComplaints(res.data)
        calculateStats(res.data)
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  useRealtimeRefresh(() => fetchComplaints(true), ["complaint", "notification"])

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED":
        return "bg-moss"
      case "IN_PROGRESS":
        return "bg-amber-500"
      default:
        return "bg-rose-500"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          eyebrow="Your reports"
          title="My complaints"
          description="Track and manage your civic reports"
        />
        <SkeletonSummaryCards />
        <SkeletonGrid count={6} />
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Your reports"
        title="My complaints"
        description="Track and manage your civic reports"
        action={
          <PrimaryButton onClick={() => navigate("/report")}>
            Report an issue
          </PrimaryButton>
        }
      />

      {complaints.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Total" count={stats.total} icon={ClipboardList} />
          <SummaryCard label="New" count={stats.new} icon={ListTodo} total={stats.total} />
          <SummaryCard label="In progress" count={stats.inProgress} icon={Loader2} total={stats.total} />
          <SummaryCard label="Resolved" count={stats.resolved} icon={CheckCircle2} total={stats.total} />
        </div>
      )}

      {complaints.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No complaints yet"
          description="You haven't reported any civic issues yet. Be the first to make a difference in your community."
          action={
            <PrimaryButton onClick={() => navigate("/report")}>
              Report an issue
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-stone-muted text-sm">
              Showing {complaints.length} complaint
              {complaints.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="bg-surface rounded-xl shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden group border border-stone-dark"
              >
                {c.imageUrl && (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={`${IMAGE_BASE_URL}${c.imageUrl}`}
                      alt="Complaint"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-surface/95 text-forest text-xs px-2.5 py-1 rounded-md font-semibold">
                        {c.category || "General"}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <PriorityPill priority={c.priority} />
                    </div>
                  </div>
                )}

                <div className="p-5">
                  {!c.imageUrl && (
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-stone text-forest text-xs px-2.5 py-1 rounded-md font-semibold">
                        {c.category || "General"}
                      </span>
                      <PriorityPill priority={c.priority} />
                    </div>
                  )}

                  <h3 className="font-display text-lg font-semibold text-forest mb-2 group-hover:text-moss transition-colors">
                    {c.title || "Civic Issue Report"}
                  </h3>

                  <p className="text-stone-muted text-sm mb-4 line-clamp-2">
                    {c.description
                      ? c.description.substring(0, 100) + "…"
                      : "No description provided"}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-stone-muted mb-1">
                      <span>Progress</span>
                      <span className="capitalize">
                        {c.status?.replace("_", " ").toLowerCase() || "new"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(c.status)} transition-all duration-500`}
                        style={{
                          width:
                            c.status === "NEW"
                              ? "33%"
                              : c.status === "IN_PROGRESS"
                                ? "66%"
                                : "100%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="bg-stone rounded-lg p-3">
                      <p className="text-stone-muted text-xs mb-1">Reported</p>
                      <p className="font-semibold text-ink">{formatDate(c.createdAt)}</p>
                    </div>
                    <div className="bg-stone rounded-lg p-3">
                      <p className="text-stone-muted text-xs mb-1">Department</p>
                      <p className="font-semibold text-ink truncate">
                        {c.department?.name || "Pending"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-dark">
                    <StatusPill status={c.status} />
                    <span className="text-stone-muted text-sm font-medium">
                      {c.upvotes || 0} supports
                    </span>
                  </div>

                  <PrimaryButton
                    onClick={() => navigate(`/complaint/${c.id}`)}
                    className="mt-4 w-full"
                  >
                    View details
                  </PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MyComplaints
