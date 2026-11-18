import { useEffect, useState, useContext } from "react"
import { useParams, useLocation } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../contexts/AuthContext"
import { IMAGE_BASE_URL } from "../config"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import {
  PageHeader,
  StatusPill,
  PriorityPill,
  Panel,
  LoadingBlock,
  PrimaryButton,
} from "../components/UI/CivicUI"
import { SinglePriorityMap } from "../components/UI/PriorityZonesMap"

function ComplaintDetails() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useContext(AuthContext)
  const [complaint, setComplaint] = useState(null)
  const [error, setError] = useState("")
  const [info, setInfo] = useState(location.state?.message || "")
  const [voteMsg, setVoteMsg] = useState("")

  const fetchComplaint = async () => {
    try {
      const res = await API.get(`/complaints/${id}`)
      setComplaint(res.data)
    } catch {
      setError("Failed to load complaint")
    }
  }

  useEffect(() => {
    fetchComplaint()
    if (location.state?.message) {
      setInfo(location.state.message)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useRealtimeRefresh((event) => {
    if (!event?.complaintId || String(event.complaintId) === String(id)) {
      fetchComplaint()
    }
  }, ["complaint", "notification"])

  const handleUpvote = async () => {
    setVoteMsg("")
    try {
      const res = await API.post(`/votes?userId=${user.id}&complaintId=${id}`)
      if (res.data?.complaint) {
        setComplaint(res.data.complaint)
      } else {
        fetchComplaint()
      }
      setVoteMsg(res.data?.message || "Your support has been added to this complaint.")
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg =
        typeof detail === "string"
          ? detail
          : "You have already supported this complaint."
      setVoteMsg(msg)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusProgress = (status) => {
    switch (status) {
      case "NEW":
        return 33
      case "IN_PROGRESS":
        return 66
      case "RESOLVED":
        return 100
      default:
        return 0
    }
  }

  const getStatusBarColor = (status) => {
    switch (status) {
      case "RESOLVED":
        return "bg-moss"
      case "IN_PROGRESS":
        return "bg-amber-500"
      default:
        return "bg-rose-500"
    }
  }

  if (error) {
    return (
      <div className="max-w-4xl w-full mx-auto animate-fade-up">
        <Panel className="p-8 text-center border-rose-200 bg-rose-50">
          <p className="text-rose-700 font-medium">{error}</p>
        </Panel>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl w-full mx-auto animate-fade-up">
        <LoadingBlock label="Loading complaint…" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl w-full mx-auto animate-fade-up">
      <PageHeader
        eyebrow={complaint.category || "General"}
        title={complaint.title || "Civic Issue Report"}
        description={`Reported ${formatDate(complaint.createdAt)}`}
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <StatusPill status={complaint.status} />
            <PriorityPill priority={complaint.priority} />
          </div>
        }
      />

      {info && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm mb-4">
          <p className="font-semibold text-forest mb-1">Similar issue — review before supporting</p>
          <p className="font-medium text-amber-800/90">{info}</p>
          {location.state?.needsSupport && (
            <p className="mt-2 text-sm text-stone-muted">
              If this matches what you saw, use <span className="font-semibold text-forest">Support this issue</span> below.
            </p>
          )}
        </div>
      )}

      {voteMsg && (
        <div className="bg-moss-pale border border-moss/20 text-forest p-4 rounded-xl text-sm font-medium mb-4">
          {voteMsg}
        </div>
      )}

      {complaint.imageUrl && (
        <Panel className="overflow-hidden mb-6">
          <div className="relative h-72 md:h-80 bg-stone">
            <img
              src={`${IMAGE_BASE_URL}${complaint.imageUrl}`}
              alt="Complaint"
              className="w-full h-full object-cover"
            />
          </div>
        </Panel>
      )}

      <Panel className="p-6 md:p-8 mb-6 space-y-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-muted mb-1">
              Community support
            </p>
            <p className="font-display text-3xl font-semibold text-forest tabular-nums">
              {complaint.upvotes || 0}
            </p>
          </div>
        </div>

        <div className="bg-stone/50 rounded-xl p-4 border border-stone-dark">
          <div className="flex justify-between text-sm font-medium text-stone-muted mb-2">
            <span>Status</span>
            <span className="capitalize text-forest">
              {complaint.status?.replace("_", " ").toLowerCase() || "new"}
            </span>
          </div>
          <div className="h-2.5 bg-stone-dark rounded-full overflow-hidden">
            <div
              className={`h-full ${getStatusBarColor(complaint.status)} transition-all duration-500`}
              style={{ width: `${getStatusProgress(complaint.status)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-muted mt-2">
            <span>New</span>
            <span>In progress</span>
            <span>Resolved</span>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-forest mb-2">
            Description
          </h2>
          <p className="text-stone-muted leading-relaxed">{complaint.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone/50 rounded-xl p-4 border border-stone-dark">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-muted mb-1">
              Department
            </p>
            <p className="font-semibold text-forest">
              {complaint.department?.name || "Pending assignment"}
            </p>
          </div>

          <div className="bg-stone/50 rounded-xl p-4 border border-stone-dark">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-muted mb-1">
              Community support
            </p>
            <p className="font-semibold text-forest">
              {complaint.upvotes || 0} votes
            </p>
          </div>

          <div className="bg-stone/50 rounded-xl p-4 border border-stone-dark">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-muted mb-1">
              Reported on
            </p>
            <p className="font-semibold text-forest">{formatDate(complaint.createdAt)}</p>
          </div>

          <div className="bg-stone/50 rounded-xl p-4 border border-stone-dark">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-muted mb-1">
              Last updated
            </p>
            <p className="font-semibold text-forest">{formatDate(complaint.updatedAt)}</p>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden mb-6 p-6">
        <h2 className="font-display text-lg font-semibold text-forest">Location & priority zone</h2>
        <p className="text-stone-muted text-sm mt-0.5 mb-4">
          Zone color matches this complaint’s priority (High / Medium / Low)
        </p>
        <SinglePriorityMap complaint={complaint} height="18rem" />
      </Panel>

      {user && (
        <Panel className={`p-6 ${location.state?.needsSupport || location.state?.fromDuplicate ? "ring-2 ring-moss/30" : ""}`}>
          <p className="text-sm text-stone-muted mb-3">
            Supporting adds your voice so the department can prioritize this report.
          </p>
          <PrimaryButton onClick={handleUpvote} className="w-full py-3.5 text-[15px] bg-moss hover:bg-moss-light">
            Support this issue · {complaint.upvotes || 0} community votes
          </PrimaryButton>
        </Panel>
      )}
    </div>
  )
}

export default ComplaintDetails
