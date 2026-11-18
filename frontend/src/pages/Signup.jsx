import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Megaphone, MapPin, CheckCircle2 } from "lucide-react"
import API from "../services/api"

function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      await API.post("/auth/register", { name, email, password })
      setMessage("Account created successfully. Redirecting to login…")
      setTimeout(() => navigate("/login"), 2000)
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-stone-dark bg-stone/50 text-ink placeholder:text-stone-muted/70 focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss focus:bg-surface transition-all"

  return (
    <div className="min-h-[calc(100svh-4.25rem)] flex">
      <div className="hidden lg:flex w-[48%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1600&auto=format&fit=crop"
          alt="Urban park path"
          className="absolute inset-0 w-full h-full object-cover hero-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest/70 to-forest/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <p className="font-display text-2xl font-bold tracking-tight">CivicConnect</p>
          <div>
            <p className="font-display text-4xl font-bold tracking-tight leading-tight">
              Join neighbors who report issues early and lift the ones that need attention most.
            </p>
            <div className="mt-10 space-y-4">
              {[
                { icon: Megaphone, text: "Make your street's issues heard" },
                { icon: MapPin, text: "Report with a photo and exact location" },
                { icon: CheckCircle2, text: "Watch it move from reported to resolved" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <p className="text-sm text-white/80">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-stone">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden mb-8">
            <p className="font-display text-3xl font-semibold text-forest">CivicConnect</p>
          </div>

          <h1 className="font-display text-3xl font-semibold text-forest">Create account</h1>
          <p className="mt-2 text-stone-muted">Start making your neighborhood heard</p>

          {message && (
            <div className="mt-6 bg-moss-pale border border-moss/20 text-forest text-sm p-3 rounded-lg text-center">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-1.5">
                Full name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Choose a password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-lift w-full py-3.5 rounded-lg text-[15px] font-semibold ${
                loading
                  ? "bg-stone-dark text-stone-muted cursor-not-allowed"
                  : "bg-forest text-white hover:bg-forest-soft"
              }`}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-stone-muted mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-moss font-semibold hover:text-forest">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
