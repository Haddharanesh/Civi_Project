import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, LogOut } from "lucide-react"
import CreatorCredit from "../UI/CreatorCredit"

/**
 * Reusable sidebar app shell for authenticated portals (user, department, superadmin).
 * navItems: [{ label, icon: LucideIcon, to?, onClick?, active?, badge? }]
 * Items with `to` render as router Links; items with `onClick` render as buttons
 * (for in-page tab switching, e.g. the superadmin dashboard sections).
 */
export default function SidebarShell({
  navItems,
  portalLabel,
  logoLetter = "CC",
  logoStyle,
  activeNavClassName,
  user,
  onLogout,
  topBarContent,
  contentClassName,
  children,
}) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (item) =>
    typeof item.active === "boolean" ? item.active : item.to === location.pathname

  const navLinkClass = (active) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full text-left ${
      active
        ? activeNavClassName || "bg-moss-pale text-forest ring-1 ring-moss/25"
        : "text-stone-muted hover:bg-moss-pale/50 hover:text-forest"
    }`

  const renderNavItem = (item, onNavigate) => {
    const active = isActive(item)
    const content = (
      <>
        <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
        <span className="truncate">{item.label}</span>
        {Boolean(item.badge) && (
          <span className="ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
      </>
    )

    if (item.to) {
      return (
        <Link key={item.label} to={item.to} onClick={onNavigate} className={navLinkClass(active)}>
          {content}
        </Link>
      )
    }

    return (
      <button
        key={item.label}
        type="button"
        onClick={() => {
          item.onClick?.()
          onNavigate?.()
        }}
        className={navLinkClass(active)}
      >
        {content}
      </button>
    )
  }

  const renderSidebarContent = (onNavigate, closeable) => (
    <>
      <div className="h-16 flex items-center justify-between px-5 border-b border-stone-dark shrink-0">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl bg-forest text-white flex items-center justify-center font-display text-sm font-bold shrink-0"
            style={logoStyle}
          >
            {logoLetter}
          </div>
          <div className="leading-tight min-w-0">
            <span className="font-display text-base font-semibold text-forest tracking-tight block truncate">
              CivicConnect
            </span>
            {portalLabel && (
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-moss">{portalLabel}</span>
            )}
          </div>
        </Link>
        {closeable && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-stone-muted hover:bg-stone shrink-0"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => renderNavItem(item, onNavigate))}
      </nav>

      <div className="p-3 border-t border-stone-dark shrink-0 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-moss flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-forest truncate">{user?.name || "—"}</p>
            <p className="text-xs text-stone-muted truncate">{user?.email || ""}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-stone-muted hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <CreatorCredit className="px-2 pb-1" />
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-stone">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-stone-dark bg-surface">
        {renderSidebarContent()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-forest-deep/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface flex flex-col shadow-lift animate-fade-up">
            {renderSidebarContent(() => setMobileOpen(false), true)}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 min-w-0">
        <header className="sticky top-0 z-20 h-16 flex items-center gap-3 px-4 md:px-6 border-b border-stone-dark bg-surface/95 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-forest hover:bg-stone"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {topBarContent}
        </header>
        <main className={`px-4 md:px-6 py-8 md:py-10 mx-auto ${contentClassName || "max-w-[1200px]"}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
