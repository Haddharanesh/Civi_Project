import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShieldCheck, MapPin, Users } from "lucide-react"
import API from "../services/api"
import { AuthContext } from "../contexts/AuthContext"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await API.post("/auth/login", { email, password })
      const user = res.data.user
      const token = res.data.token

      if (user.role === "SUPER_ADMIN") {
        login(user, token)
        navigate("/superadmin/dashboard")
        return
      }

      if (user.role === "DEPARTMENT_ADMIN") {
        login(user, token)
        navigate("/department/dashboard")
        return
      }

      login(user, token)
      navigate("/dashboard")
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Invalid email or password")
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
          src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1600&auto=format&fit=crop"
          alt="Forest canopy light"
          className="absolute inset-0 w-full h-full object-cover hero-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest/70 to-forest/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <p className="font-display text-2xl font-bold tracking-tight">CivicConnect</p>
          <div>
            <p className="font-display text-4xl font-bold tracking-tight leading-tight">
              Sign in to report issues, support your neighbors, and follow progress.
            </p>
            <div className="mt-10 space-y-4">
              {[
                { icon: MapPin, text: "Pin issues exactly where they happen" },
                { icon: Users, text: "Back the reports your neighbors already made" },
                { icon: ShieldCheck, text: "Routed straight to the right department" },
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

          <h1 className="font-display text-3xl font-semibold text-forest">Welcome back</h1>
          <p className="mt-2 text-stone-muted">Login to continue improving your city</p>

          {error && (
            <div className="mt-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                placeholder="Your password"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-stone-muted mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-moss font-semibold hover:text-forest">
              Sign up
            </Link>
          </p>
          <p className="text-center text-sm text-stone-muted mt-3">
            Department officer?{" "}
            <Link to="/department-login" className="text-forest font-semibold hover:underline">
              Department login
            </Link>
          </p>
          <p className="text-center text-sm text-stone-muted mt-3">
            System administrator?{" "}
            <Link to="/superadmin-login" className="text-forest font-semibold hover:underline">
              Super Admin access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
