import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../contexts/AuthContext"
import { inputClass, PrimaryButton } from "../components/UI/CivicUI"

function SuperAdminLogin() {
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

      // Check if user is SUPER_ADMIN
      if (user.role !== "SUPER_ADMIN") {
        setError("Unauthorized access")
        return
      }

      // If role is SUPER_ADMIN, login and navigate
      login(user, token)
      navigate("/superadmin/dashboard")

    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100svh-4.25rem)] flex">
      <div className="hidden lg:flex w-[48%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1600&auto=format&fit=crop"
          alt="Forest canopy light"
          className="absolute inset-0 w-full h-full object-cover hero-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest/70 to-forest/40" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <p className="font-display text-4xl font-semibold tracking-tight">CivicConnect</p>
          <p className="mt-4 text-lg text-white/80 max-w-sm leading-relaxed">
            Super Admin command center — users, departments, city workload, and complaint moderation.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-stone">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden mb-8">
            <p className="font-display text-3xl font-semibold text-forest">CivicConnect</p>
          </div>

          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-moss mb-2">
            Super Admin
          </p>
          <h1 className="font-display text-3xl font-semibold text-forest">Command portal</h1>
          <p className="mt-2 text-stone-muted">
            Sign in to operate the civic complaint platform
          </p>

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
                placeholder="admin@example.com"
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

            <PrimaryButton
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-[15px] ${
                loading ? "!bg-stone-dark !text-stone-muted cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in…" : "Sign in"}
            </PrimaryButton>
          </form>

          <p className="text-center text-sm text-stone-muted mt-6">
            Not an admin?{" "}
            <Link to="/login" className="text-moss font-semibold hover:text-forest">
              Citizen login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLogin
