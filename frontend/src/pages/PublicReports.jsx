import { useEffect, useState, useContext, useMemo } from "react"
import { Link } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../contexts/AuthContext"
import { IMAGE_BASE_URL } from "../config"
import { Search } from "lucide-react"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import { useToast } from "../contexts/ToastContext"
import {
  PageHeader,
  StatusPill,
  PriorityPill,
  Panel,
  EmptyState,
  SecondaryButton,
  FilterSelect,
  SkeletonGrid,
} from "../components/UI/CivicUI"
import PriorityZonesMap from "../components/UI/PriorityZonesMap"

const formatDate = (dateString) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const ComplaintCard = ({ complaint, onUpvote, user }) => {
  const hasVoted = user && complaint.votedBy?.includes(user.id)

  return (
    <div className="bg-surface rounded-xl shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden group border border-stone-dark">
      {complaint.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={`${IMAGE_BASE_URL}${complaint.imageUrl}`}
            alt={complaint.title || "Issue"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/50 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span className="bg-surface/95 text-forest text-xs px-2.5 py-1 rounded-md font-semibold">
              {complaint.category || "General"}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <PriorityPill priority={complaint.priority} />
          </div>
        </div>
      )}

      <div className="p-5">
        {!complaint.imageUrl && (
          <div className="flex justify-between items-start mb-3">
            <span className="bg-stone text-forest text-xs px-2.5 py-1 rounded-md font-semibold">
              {complaint.category || "General"}
            </span>
            <PriorityPill priority={complaint.priority} />
          </div>
        )}

        <h3 className="font-display text-lg font-semibold text-forest mb-2 group-hover:text-moss transition-colors">
          {complaint.title || "Untitled Issue"}
        </h3>

        <p className="text-stone-muted text-sm mb-4 line-clamp-2">
          {complaint.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <StatusPill status={complaint.status} />
          <span className="text-stone-muted text-sm">{formatDate(complaint.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-stone-dark">
          <button
            onClick={() => onUpvote(complaint.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              hasVoted
                ? "bg-moss-pale text-moss"
                : "bg-stone text-stone-muted hover:bg-moss-pale/60 hover:text-forest"
            }`}
          >
            Support · {complaint.upvotes || 0}
          </button>
          <Link
            to={`/complaint/${complaint.id}`}
            className="text-moss hover:text-forest font-semibold text-sm transition-colors"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  )
}

function PublicReports() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useContext(AuthContext)
  const { showToast } = useToast()

  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const fetchComplaints = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await API.get("/complaints/public")
      setComplaints(res.data)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch complaints", err)
      if (!silent) setError("Failed to load public reports. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  useRealtimeRefresh(() => fetchComplaints(true), ["complaint"])

  const priorityOrder = (priority) => {
    switch (priority) {
      case "HIGH":
        return 3
      case "MEDIUM":
        return 2
      case "LOW":
        return 1
      default:
        return 0
    }
  }

  const filteredAndSortedComplaints = useMemo(() => {
    let result = [...complaints]

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      result = result.filter(
        (c) => c.category?.toLowerCase() === categoryFilter.toLowerCase()
      )
    }

    if (priorityFilter !== "all") {
      result = result.filter((c) => c.priority === priorityFilter)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt)
        case "priority-high":
          return priorityOrder(b.priority) - priorityOrder(a.priority)
        case "priority-low":
          return priorityOrder(a.priority) - priorityOrder(b.priority)
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    return result
  }, [complaints, statusFilter, categoryFilter, priorityFilter, sortBy])

  const handleUpvote = async (id) => {
    if (!user) {
      showToast("Please login to vote", { type: "info" })
      return
    }

    try {
      await API.post(`/votes?userId=${user.id}&complaintId=${id}`)
      showToast("Your support has been added.", { type: "success" })
      fetchComplaints()
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg =
        typeof detail === "string"
          ? detail
          : "You have already supported this complaint."
      showToast(msg, { type: "error" })
    }
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setCategoryFilter("all")
    setPriorityFilter("all")
    setSortBy("newest")
  }

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    sortBy !== "newest"

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Community"
        title="Public reports"
        description="Browse and support issues reported by your neighbors"
      />

      <Panel className="p-4 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All status" },
                { value: "NEW", label: "Pending" },
                { value: "IN_PROGRESS", label: "In progress" },
                { value: "RESOLVED", label: "Resolved" },
              ]}
            />
            <FilterSelect
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "All categories" },
                { value: "road", label: "Road" },
                { value: "waste", label: "Waste" },
                { value: "water", label: "Water" },
                { value: "electricity", label: "Electricity" },
              ]}
            />
            <FilterSelect
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "all", label: "All priority" },
                { value: "HIGH", label: "High" },
                { value: "MEDIUM", label: "Medium" },
                { value: "LOW", label: "Low" },
              ]}
            />
            <FilterSelect
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
                { value: "priority-high", label: "Priority high" },
                { value: "priority-low", label: "Priority low" },
              ]}
            />
          </div>

          {hasActiveFilters && (
            <SecondaryButton onClick={clearFilters}>Clear filters</SecondaryButton>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-stone-dark">
          <p className="text-sm text-stone-muted">
            Showing{" "}
            <span className="font-semibold text-forest">
              {filteredAndSortedComplaints.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-forest">{complaints.length}</span>{" "}
            reports
          </p>
        </div>
      </Panel>

      {loading && <SkeletonGrid count={6} />}

      {!loading && error && (
        <Panel className="p-6 text-center border-rose-200 bg-rose-50">
          <p className="text-rose-700">{error}</p>
        </Panel>
      )}

      {!loading && !error && filteredAndSortedComplaints.length === 0 && (
        <EmptyState
          icon={Search}
          title="No public reports found"
          description="Try adjusting your filters to see more results."
          action={
            hasActiveFilters ? (
              <SecondaryButton onClick={clearFilters}>Clear filters</SecondaryButton>
            ) : null
          }
        />
      )}

      {!loading && !error && filteredAndSortedComplaints.length > 0 && (
        <>
          <Panel className="p-6 mb-8">
            <h2 className="font-display text-xl font-semibold text-forest mb-1">Priority zones</h2>
            <p className="text-sm text-stone-muted mb-4">
              See High, Medium, and Low priority areas across public reports
            </p>
            <PriorityZonesMap complaints={filteredAndSortedComplaints} height="24rem" />
          </Panel>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onUpvote={handleUpvote}
                user={user}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && complaints.length > 0 && (
        <div className="text-center mt-8">
          <Link
            to="/analytics"
            className="text-moss font-semibold hover:text-forest transition-colors"
          >
            View analytics
          </Link>
        </div>
      )}
    </div>
  )
}

export default PublicReports
