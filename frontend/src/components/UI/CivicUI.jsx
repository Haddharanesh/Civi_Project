export function StatusPill({ status }) {
  const styles = {
    RESOLVED: "bg-moss-pale text-moss",
    IN_PROGRESS: "bg-amber-50 text-amber-800",
    NEW: "bg-rose-50 text-rose-700",
  }
  const label = (status || "NEW").replace("_", " ")
  return (
    <span className={`status-pill ${styles[status] || styles.NEW}`}>
      {label}
    </span>
  )
}

export function PriorityPill({ priority }) {
  const styles = {
    HIGH: "bg-rose-50 text-rose-700",
    MEDIUM: "bg-amber-50 text-amber-800",
    LOW: "bg-moss-pale text-moss",
  }
  return (
    <span className={`status-pill ${styles[priority] || styles.MEDIUM}`}>
      {priority || "MEDIUM"}
    </span>
  )
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-fade-up">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-moss mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-stone-muted max-w-xl text-[15px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Panel({ children, className = "" }) {
  return (
    <div className={`bg-surface rounded-xl border border-stone-dark shadow-soft ${className}`}>
      {children}
    </div>
  )
}

export function SummaryCard({ label, count, hint, icon: Icon, total, trend }) {
  const pct = total ? Math.min(100, Math.round(((Number(count) || 0) / total) * 100)) : null
  return (
    <div className="bg-surface rounded-xl border border-stone-dark shadow-soft p-5 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-muted truncate">{label}</p>
          <p className="font-display text-3xl md:text-4xl font-semibold text-forest mt-2 tabular-nums">{count}</p>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-moss-pale flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-moss" strokeWidth={2} />
          </div>
        )}
      </div>

      {pct !== null && (
        <div className="mt-3.5 h-1.5 bg-stone rounded-full overflow-hidden">
          <div className="h-full bg-moss rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}

      {(hint || trend) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {hint && <p className="text-xs text-stone-muted">{hint}</p>}
          {trend && (
            <span
              className={`text-xs font-semibold tabular-nums ${
                trend.direction === "down" ? "text-rose-600" : "text-moss"
              }`}
            >
              {trend.direction === "down" ? "▼" : "▲"} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action, icon: Icon }) {
  return (
    <div className="text-center py-14 px-6 bg-surface rounded-xl border border-stone-dark border-dashed">
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-moss-pale flex items-center justify-center">
          <Icon className="w-6 h-6 text-moss" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-forest mb-2">{title}</h3>
      {description && (
        <p className="text-stone-muted mb-6 max-w-sm mx-auto text-sm leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}

export function LoadingBlock({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-dark border-t-moss" />
      <p className="text-sm text-stone-muted">{label}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-stone-dark overflow-hidden animate-pulse">
      <div className="h-40 bg-stone-dark/60" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-stone-dark/60 rounded" />
        <div className="h-3 w-full bg-stone-dark/40 rounded" />
        <div className="h-3 w-4/5 bg-stone-dark/40 rounded" />
        <div className="h-8 w-full bg-stone-dark/30 rounded-lg mt-2" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6, className = "" }) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonSummaryCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl border border-stone-dark p-5 animate-pulse">
          <div className="h-3 w-16 bg-stone-dark/50 rounded" />
          <div className="h-8 w-10 bg-stone-dark/60 rounded mt-3" />
        </div>
      ))}
    </div>
  )
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`btn-lift px-5 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-soft disabled:opacity-60 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl border border-stone-dark bg-surface text-forest text-sm font-semibold hover:bg-moss-pale/60 disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
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
  )
}

export const inputClass =
  "w-full px-4 py-3 rounded-lg border border-stone-dark bg-stone/50 text-ink placeholder:text-stone-muted/70 focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss focus:bg-surface transition-all"
