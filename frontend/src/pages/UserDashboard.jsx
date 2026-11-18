// UserDashboard.jsx - Citizen Dashboard for CivicConnect
// A modern, friendly dashboard for citizens to track their complaints

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { IMAGE_BASE_URL } from "../config";
import { ClipboardList, ListTodo, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader, StatusPill, SkeletonGrid, SummaryCard } from "../components/UI/CivicUI";
import { useRealtimeRefresh } from "../contexts/RealtimeContext";

const getStatusColor = (status) => {
  switch (status) {
    case "RESOLVED": return "bg-moss";
    case "IN_PROGRESS": return "bg-amber-500";
    default: return "bg-rose-500";
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case "HIGH": return "bg-rose-50 text-rose-700";
    case "MEDIUM": return "bg-amber-50 text-amber-800";
    default: return "bg-stone text-stone-muted";
  }
};

const getCategoryLabel = (category) => category || "Other";

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
};

// Status Tracker Component
const StatusTracker = ({ currentStatus }) => {
  const stages = [
    { key: "NEW", label: "Reported" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "RESOLVED", label: "Resolved" },
  ];
  const currentIndex = stages.findIndex((s) => s.key === currentStatus);

  return (
    <div className="bg-surface rounded-xl shadow-soft p-6 border border-stone-dark">
      <h3 className="font-display text-lg font-semibold text-forest mb-6">Status tracker</h3>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-stone-dark -z-10">
          <div
            className="h-full bg-moss transition-all duration-500"
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                index <= currentIndex ? "bg-moss text-white" : "bg-stone-dark text-stone-muted"
              }`}
            >
              {index + 1}
            </div>
            <p className={`text-xs mt-2 font-medium ${index <= currentIndex ? "text-ink" : "text-stone-muted"}`}>
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Complaint Card Component
const ComplaintCard = ({ complaint, onViewDetails }) => (
  <div className="bg-surface rounded-xl shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden group border border-stone-dark">
    {complaint.imageUrl && (
      <div className="relative h-40 overflow-hidden">
        <img
          src={`${IMAGE_BASE_URL}${complaint.imageUrl}`}
          alt={complaint.title || "Issue"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/50 to-transparent"></div>
        <div className="absolute bottom-3 left-3">
          <span className="bg-surface/95 text-forest text-xs px-2.5 py-1 rounded-md font-semibold">
            {getCategoryLabel(complaint.category)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`${getPriorityBadge(complaint.priority)} px-2 py-1 rounded-md text-xs font-bold`}>
            {complaint.priority}
          </span>
        </div>
      </div>
    )}

    <div className="p-5">
      {!complaint.imageUrl && (
        <div className="flex justify-between items-start mb-3">
          <span className="bg-stone text-forest text-xs px-2.5 py-1 rounded-md font-semibold">
            {getCategoryLabel(complaint.category)}
          </span>
          <span className={`${getPriorityBadge(complaint.priority)} px-2 py-1 rounded-md text-xs font-bold`}>
            {complaint.priority}
          </span>
        </div>
      )}

      <h3 className="font-display text-lg font-semibold text-forest mb-2 group-hover:text-moss transition-colors">
        {complaint.title || "Untitled Issue"}
      </h3>

      <p className="text-stone-muted text-sm mb-4 line-clamp-2">
        {complaint.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(complaint.status)}`}></span>
          <StatusPill status={complaint.status} />
        </div>
        <span className="text-stone-muted text-sm">{formatDate(complaint.createdAt)}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-stone-dark">
        <div className="text-stone-muted text-sm font-medium">
          {complaint.upvotes || 0} supports
        </div>
        <button
          onClick={() => onViewDetails(complaint.id)}
          className="text-moss hover:text-forest font-semibold text-sm transition-colors"
        >
          View details
        </button>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = ({ onReportIssue }) => (
  <div className="text-center py-14 px-6 bg-surface rounded-xl border border-stone-dark border-dashed">
    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-moss-pale flex items-center justify-center">
      <ClipboardList className="w-6 h-6 text-moss" strokeWidth={1.75} />
    </div>
    <h3 className="font-display text-xl font-semibold text-forest mb-2">No complaints yet</h3>
    <p className="text-stone-muted mb-6 max-w-sm mx-auto text-sm leading-relaxed">
      Report an issue in your neighborhood to track status and get department attention.
    </p>
    <button
      onClick={onReportIssue}
      className="btn-lift bg-forest text-white px-6 py-3 rounded-xl font-semibold text-sm"
    >
      Report new issue
    </button>
  </div>
);

// Filter Dropdown Component
const FilterDropdown = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-stone-muted uppercase tracking-wide">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-surface border border-stone-dark text-ink py-2 px-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-moss/40"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Main User Dashboard Component
const UserDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchComplaints = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await API.get("/complaints/my");
      setComplaints(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      if (!silent) setError("Failed to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useRealtimeRefresh(() => fetchComplaints(true), ["complaint", "notification"]);

  // Compute stats from complaints
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "NEW").length,
    inProgress: complaints.filter(c => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter(c => c.status === "RESOLVED").length
  };

  // Filter and sort complaints
  const filteredAndSortedComplaints = useMemo(() => {
    let result = [...complaints];

    // Apply filters
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter(c => c.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (priorityFilter !== "all") {
      result = result.filter(c => c.priority === priorityFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "priority-high":
          return priorityOrder(b.priority) - priorityOrder(a.priority);
        case "priority-low":
          return priorityOrder(a.priority) - priorityOrder(b.priority);
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return result;
  }, [complaints, statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Priority order for sorting
  const priorityOrder = (priority) => {
    switch (priority) {
      case "HIGH": return 3;
      case "MEDIUM": return 2;
      case "LOW": return 1;
      default: return 0;
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/complaint/${id}`);
  };

  const handleReportIssue = () => {
    navigate("/report");
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSortBy("newest");
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all" || sortBy !== "newest";

  return (
    <div className="animate-fade-up">
        <PageHeader
          eyebrow="Citizen portal"
          title="My dashboard"
          description="Welcome back — here's your complaint overview."
          action={
            <button
              onClick={handleReportIssue}
              className="btn-lift px-5 py-2.5 rounded-lg bg-moss text-white font-semibold text-sm"
            >
              Report issue
            </button>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Total" count={stats.total} icon={ClipboardList} />
          <SummaryCard label="Pending" count={stats.pending} icon={ListTodo} total={stats.total} />
          <SummaryCard label="In progress" count={stats.inProgress} icon={Loader2} total={stats.total} />
          <SummaryCard label="Resolved" count={stats.resolved} icon={CheckCircle2} total={stats.total} />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Column - Complaints */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filters and Sort Controls */}
            <div className="bg-surface rounded-xl shadow-soft p-4 border border-stone-dark">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                  <FilterDropdown
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: "all", label: "All status" },
                      { value: "NEW", label: "Pending" },
                      { value: "IN_PROGRESS", label: "In progress" },
                      { value: "RESOLVED", label: "Resolved" }
                    ]}
                  />
                  <FilterDropdown
                    label="Category"
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={[
                      { value: "all", label: "All categories" },
                      { value: "road", label: "Road" },
                      { value: "waste", label: "Waste" },
                      { value: "water", label: "Water" },
                      { value: "electricity", label: "Electricity" }
                    ]}
                  />
                  <FilterDropdown
                    label="Priority"
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                    options={[
                      { value: "all", label: "All priority" },
                      { value: "HIGH", label: "High" },
                      { value: "MEDIUM", label: "Medium" },
                      { value: "LOW", label: "Low" }
                    ]}
                  />
                  <FilterDropdown
                    label="Sort by"
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      { value: "newest", label: "Newest first" },
                      { value: "oldest", label: "Oldest first" },
                      { value: "priority-high", label: "Priority high" },
                      { value: "priority-low", label: "Priority low" }
                    ]}
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-stone-muted hover:text-ink hover:bg-stone rounded-lg transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-stone-dark">
                <p className="text-sm text-stone-muted">
                  Showing <span className="font-semibold text-ink">{filteredAndSortedComplaints.length}</span> of <span className="font-semibold text-ink">{complaints.length}</span> complaints
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && <SkeletonGrid count={4} className="md:grid-cols-2 lg:grid-cols-2" />}

            {/* Error State */}
            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredAndSortedComplaints.length === 0 && (
              <EmptyState onReportIssue={handleReportIssue} />
            )}

            {/* Complaints Grid */}
            {!loading && !error && filteredAndSortedComplaints.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredAndSortedComplaints.map((complaint) => (
                  <ComplaintCard 
                    key={complaint.id} 
                    complaint={complaint} 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}

            {/* View All Link */}
            {!loading && !error && complaints.length > 0 && (
              <div className="text-center">
                <button
                  onClick={() => navigate("/my-complaints")}
                  className="text-moss font-semibold hover:text-forest transition-colors"
                >
                  View all complaints
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <StatusTracker currentStatus="IN_PROGRESS" />

            <div className="rounded-xl p-5 text-white bg-forest">
              <h3 className="font-display text-lg font-semibold mb-1">Quick action</h3>
              <p className="text-white/75 text-sm mb-4 leading-relaxed">
                See something wrong in your neighborhood?
              </p>
              <button
                onClick={() => navigate("/report")}
                className="btn-lift w-full bg-white text-forest py-2.5 rounded-xl font-semibold text-sm"
              >
                Report new issue
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default UserDashboard;

