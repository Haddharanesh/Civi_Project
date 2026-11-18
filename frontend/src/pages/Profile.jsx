import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import API from "../services/api"
import { IMAGE_BASE_URL } from "../config"
import { ClipboardList, ListTodo, Loader2, CheckCircle2 } from "lucide-react"
import {
  PageHeader,
  StatusPill,
  Panel,
  SummaryCard,
  EmptyState,
  LoadingBlock,
  PrimaryButton,
  SecondaryButton,
} from "../components/UI/CivicUI"

const formatDate = (dateString) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const ComplaintCard = ({ complaint, onViewDetails }) => (
  <div className="bg-stone/40 rounded-xl border border-stone-dark overflow-hidden group hover:shadow-soft transition-shadow">
    {complaint.imageUrl && (
      <div className="relative h-32 overflow-hidden">
        <img
          src={`${IMAGE_BASE_URL}${complaint.imageUrl}`}
          alt={complaint.title || "Issue"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/40 to-transparent" />
      </div>
    )}

    <div className="p-4">
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="bg-stone text-forest text-xs px-2.5 py-1 rounded-md font-semibold">
          {complaint.category || "General"}
        </span>
        <StatusPill status={complaint.status} />
      </div>

      <h3 className="font-display text-base font-semibold text-forest mb-1 group-hover:text-moss transition-colors line-clamp-1">
        {complaint.title || "Untitled Issue"}
      </h3>

      <p className="text-stone-muted text-sm mb-3 line-clamp-2">
        {complaint.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-stone-muted text-xs">{formatDate(complaint.createdAt)}</span>
        <button
          onClick={() => onViewDetails(complaint.id)}
          className="text-moss hover:text-forest font-semibold text-xs transition-colors"
        >
          View details
        </button>
      </div>
    </div>
  </div>
)

function Profile() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate("/login")
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await API.get("/complaints/my")
        setComplaints(res.data)
      } catch (err) {
        console.error("Failed to fetch complaints", err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchComplaints()
    }
  }, [user])

  if (!user) return null

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "NEW").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  }

  const handleViewDetails = (id) => {
    navigate(`/complaint/${id}`)
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Manage your account and review your recent reports"
        action={
          <button
            onClick={handleLogout}
            className="btn-lift px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm"
          >
            Logout
          </button>
        }
      />

      <Panel className="p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 bg-forest rounded-xl flex items-center justify-center text-3xl text-white font-display font-bold">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="flex-1">
            <h2 className="font-display text-2xl font-semibold text-forest">
              {user.name}
            </h2>
            <p className="text-stone-muted mt-1">{user.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="px-3 py-1 rounded-md text-sm font-semibold bg-moss-pale text-moss">
                Citizen
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total" count={stats.total} hint="All reports" icon={ClipboardList} />
        <SummaryCard label="Pending" count={stats.pending} hint="Awaiting review" icon={ListTodo} total={stats.total} />
        <SummaryCard label="In progress" count={stats.inProgress} hint="Being worked on" icon={Loader2} total={stats.total} />
        <SummaryCard label="Resolved" count={stats.resolved} hint="Completed" icon={CheckCircle2} total={stats.total} />
      </div>

      <Panel className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest">My complaints</h2>
            <p className="text-stone-muted text-sm mt-1">Your recent reports</p>
          </div>
          <PrimaryButton onClick={() => navigate("/report")}>
            New complaint
          </PrimaryButton>
        </div>

        {loading ? (
          <LoadingBlock label="Loading your complaints…" />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints yet"
            description="Start by reporting an issue in your community."
            action={
              <PrimaryButton onClick={() => navigate("/report")}>
                Report your first issue
              </PrimaryButton>
            }
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.slice(0, 6).map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {complaints.length > 6 && (
          <div className="text-center mt-6">
            <SecondaryButton onClick={() => navigate("/dashboard")}>
              View all complaints
            </SecondaryButton>
          </div>
        )}
      </Panel>

      <div className="grid md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate("/report")}
          className="text-left bg-moss rounded-xl p-6 text-white hover:shadow-lift transition-all duration-300"
        >
          <h3 className="font-display font-semibold text-lg mb-1">Report issue</h3>
          <p className="text-white/70 text-sm">Submit a new civic complaint</p>
        </button>

        <button
          type="button"
          onClick={() => navigate("/public-reports")}
          className="text-left bg-forest-soft rounded-xl p-6 text-white hover:shadow-lift transition-all duration-300"
        >
          <h3 className="font-display font-semibold text-lg mb-1">Public reports</h3>
          <p className="text-white/70 text-sm">Browse community issues</p>
        </button>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="text-left bg-forest rounded-xl p-6 text-white hover:shadow-lift transition-all duration-300"
        >
          <h3 className="font-display font-semibold text-lg mb-1">Notifications</h3>
          <p className="text-white/70 text-sm">Stay updated on your reports</p>
        </button>
      </div>
    </div>
  )
}

export default Profile
