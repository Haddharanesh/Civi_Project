import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import API from "../services/api"
import { IMAGE_BASE_URL } from "../config"
import { useRealtimeRefresh } from "../contexts/RealtimeContext"
import { useToast } from "../contexts/ToastContext"
import {
  PageHeader,
  StatusPill,
  PriorityPill,
  Panel,
  EmptyState,
  LoadingBlock,
  PrimaryButton,
  SecondaryButton,
  FilterSelect,
  inputClass,
} from "../components/UI/CivicUI"
import PriorityZonesMap, { SinglePriorityMap } from "../components/UI/PriorityZonesMap"

const formatDate = (dateString) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const priorityRank = (p) => {
  const key = (p || "MEDIUM").toUpperCase()
  if (key === "HIGH") return 0
  if (key === "LOW") return 2
  return 1
}

function useModalLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])
}

function ModalShell({ isOpen, onClose, children, wide = false }) {
  useModalLock(isOpen)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-forest-deep/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={`relative bg-surface rounded-xl shadow-lift border border-stone-dark w-full overflow-hidden max-h-[90vh] flex flex-col ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

const RemarksModal = ({ isOpen, onClose, complaint, onSubmit }) => {
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !complaint) return
    setRemarks(complaint.remarks || "")
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [isOpen, complaint])

  if (!complaint) return null

  const handleSubmit = async () => {
    if (!remarks.trim()) return
    setLoading(true)
    try {
      await onSubmit(complaint.id, remarks.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}>
      <div className="px-6 py-4 border-b border-stone-dark shrink-0">
        <h3 className="font-display text-lg font-semibold text-forest">Add remarks</h3>
        <p className="text-sm text-stone-muted mt-1 line-clamp-2">{complaint.title}</p>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <label
          htmlFor="dept-remarks"
          className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-2"
        >
          Remarks for citizen
        </label>
        <textarea
          id="dept-remarks"
          ref={textareaRef}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Share progress, next steps, or a resolution note for the citizen…"
          className={`${inputClass} resize-y min-h-[9rem]`}
          rows={6}
        />
        <p className="text-xs text-stone-muted mt-2">
          Citizens see this on their complaint details and get a notification.
        </p>
      </div>

      <div className="px-6 py-4 bg-stone/40 border-t border-stone-dark flex justify-end gap-3 shrink-0">
        <SecondaryButton type="button" onClick={onClose} disabled={loading}>
          Cancel
        </SecondaryButton>
        <PrimaryButton
          type="button"
          onClick={handleSubmit}
          disabled={loading || !remarks.trim()}
        >
          {loading ? "Saving…" : "Save remarks"}
        </PrimaryButton>
      </div>
    </ModalShell>
  )
}

const ViewComplaintModal = ({ isOpen, onClose, complaint }) => {
  if (!complaint) return null

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} wide>
      <div className="px-6 py-4 border-b border-stone-dark flex items-center justify-between shrink-0">
        <h3 className="font-display text-lg font-semibold text-forest">Complaint details</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-muted hover:bg-stone hover:text-forest transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={complaint.status} />
          <PriorityPill priority={complaint.priority} />
          <span className="text-xs text-stone-muted">{complaint.category}</span>
        </div>

        <h4 className="font-display text-xl font-semibold text-forest leading-snug">
          {complaint.title}
        </h4>

        {complaint.imageUrl && (
          <img
            src={`${IMAGE_BASE_URL}${complaint.imageUrl}`}
            alt={complaint.title}
            className="w-full h-48 object-cover rounded-xl border border-stone-dark"
          />
        )}

        {complaint.latitude != null && complaint.longitude != null && (
          <div>
            <span className="text-xs font-semibold tracking-wide uppercase text-stone-muted">
              Location & priority zone
            </span>
            <div className="mt-2">
              <SinglePriorityMap complaint={complaint} height="14rem" />
            </div>
            <p className="text-xs text-stone-muted mt-1 tabular-nums">
              {Number(complaint.latitude).toFixed(5)}, {Number(complaint.longitude).toFixed(5)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wide uppercase text-stone-muted">
              Community votes
            </span>
            <p className="font-medium text-forest mt-1 tabular-nums">{complaint.upvotes || 0}</p>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide uppercase text-stone-muted">
              Created
            </span>
            <p className="font-medium text-forest mt-1">{formatDate(complaint.createdAt)}</p>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold tracking-wide uppercase text-stone-muted">
            Description
          </span>
          <p className="text-stone-muted mt-1 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {complaint.remarks && (
          <div className="bg-moss-pale/50 rounded-xl p-4 border border-stone-dark">
            <span className="text-xs font-semibold tracking-wide uppercase text-moss">
              Department remarks
            </span>
            <p className="text-forest mt-1 leading-relaxed whitespace-pre-wrap">{complaint.remarks}</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-stone/40 border-t border-stone-dark shrink-0">
        <SecondaryButton type="button" onClick={onClose} className="w-full">
          Close
        </SecondaryButton>
      </div>
    </ModalShell>
  )
}

function DepartmentReview() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [viewComplaint, setViewComplaint] = useState(null)
  const [remarksModal, setRemarksModal] = useState({ open: false, complaint: null })
  const [updatingStatus, setUpdatingStatus] = useState({})
  const { showToast } = useToast()

  useEffect(() => {
    fetchComplaints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useRealtimeRefresh(() => fetchComplaints(true), ["complaint", "notification"])

  const fetchComplaints = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const endpoint =
        filter === "ALL"
          ? "/department/complaints"
          : `/department/complaints/filter?status=${filter}`
      const res = await API.get(endpoint)
      setComplaints(res.data)
      setError("")
    } catch (err) {
      console.error("Failed to fetch complaints:", err)
      if (!silent) setError("Failed to load complaints")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (complaintId, newStatus) => {
    try {
      setUpdatingStatus((prev) => ({ ...prev, [complaintId]: true }))
      await API.put(`/department/complaints/${complaintId}/status?status=${newStatus}`)
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
      )
      if (viewComplaint?.id === complaintId) {
        setViewComplaint((c) => (c ? { ...c, status: newStatus } : c))
      }
      showToast("Status updated.", { type: "success" })
    } catch (err) {
      console.error("Failed to update status:", err)
      showToast("Failed to update status", { type: "error" })
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [complaintId]: false }))
    }
  }

  const submitRemarks = async (complaintId, remarks) => {
    try {
      await API.put(
        `/department/complaints/${complaintId}/remarks?remarks=${encodeURIComponent(remarks)}`
      )
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, remarks } : c))
      )
      if (viewComplaint?.id === complaintId) {
        setViewComplaint((c) => (c ? { ...c, remarks } : c))
      }
      showToast("Remarks saved.", { type: "success" })
    } catch (err) {
      console.error("Failed to add remarks:", err)
      showToast("Failed to add remarks", { type: "error" })
      throw err
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading complaints…" />
  }

  const sorted = [...complaints].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority)
    if (pr !== 0) return pr
    return (b.upvotes || 0) - (a.upvotes || 0)
  })

  return (
    <div className="max-w-7xl mx-auto animate-fade-up">
      <PageHeader
        eyebrow="Review queue"
        title="Review complaints"
        description="Manage status, priority, and remarks for assigned citizen complaints."
        action={
          <FilterSelect
            label="Status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "ALL", label: "All" },
              { value: "NEW", label: "New" },
              { value: "IN_PROGRESS", label: "In progress" },
              { value: "RESOLVED", label: "Resolved" },
            ]}
          />
        }
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {complaints.length > 0 && (
        <Panel className="p-5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-forest">Priority areas</h2>
              <p className="text-sm text-stone-muted mt-0.5">
                Circle zones for your department queue — high urgency first in the list below
              </p>
            </div>
            <p className="text-xs font-semibold text-stone-muted tabular-nums">
              {complaints.length} complaint{complaints.length === 1 ? "" : "s"}
            </p>
          </div>
          <PriorityZonesMap complaints={complaints} height="20rem" />
        </Panel>
      )}

      {complaints.length === 0 ? (
        <EmptyState
          title="No complaints found"
          description={
            filter === "ALL"
              ? "No complaints have been assigned to your department yet."
              : `No ${filter.toLowerCase().replace("_", " ")} complaints.`
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((complaint) => (
            <Panel key={complaint.id} className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <StatusPill status={complaint.status} />
                    <PriorityPill priority={complaint.priority} />
                    <span className="text-xs font-medium text-stone-muted tracking-wide uppercase">
                      {complaint.category}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-forest leading-snug">
                    {complaint.title}
                  </h3>
                  {complaint.description && (
                    <p className="text-sm text-stone-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {complaint.description}
                    </p>
                  )}
                  <p className="text-sm text-stone-muted mt-2">
                    {formatDate(complaint.createdAt)}
                    <span className="mx-2 opacity-40">·</span>
                    <span className="tabular-nums font-medium text-moss">
                      {complaint.upvotes || 0} votes
                    </span>
                    {complaint.remarks ? (
                      <>
                        <span className="mx-2 opacity-40">·</span>
                        <span className="text-moss font-medium">Has remarks</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row sm:items-end gap-3 shrink-0 lg:min-w-[14rem]">
                  <div className="flex flex-col gap-1 flex-1 sm:min-w-[10rem]">
                    <label className="text-xs font-semibold text-stone-muted uppercase tracking-wide">
                      Update status
                    </label>
                    <select
                      value={complaint.status}
                      onChange={(e) => updateStatus(complaint.id, e.target.value)}
                      disabled={updatingStatus[complaint.id]}
                      className="bg-surface border border-stone-dark text-ink py-2.5 px-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-moss/40 disabled:opacity-60"
                    >
                      <option value="NEW">NEW</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <SecondaryButton type="button" onClick={() => setViewComplaint(complaint)}>
                      View
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      onClick={() => setRemarksModal({ open: true, complaint })}
                    >
                      Remarks
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <ViewComplaintModal
        isOpen={!!viewComplaint}
        onClose={() => setViewComplaint(null)}
        complaint={viewComplaint}
      />

      <RemarksModal
        isOpen={remarksModal.open}
        onClose={() => setRemarksModal({ open: false, complaint: null })}
        complaint={remarksModal.complaint}
        onSubmit={submitRemarks}
      />
    </div>
  )
}

export default DepartmentReview
