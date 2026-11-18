import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../contexts/AuthContext"
import { inputClass } from "../components/UI/CivicUI"

function DepartmentLogin() {
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

      // Block normal users
      if (user.role !== "DEPARTMENT_ADMIN") {
        setError("This account does not have department access.")
        return
      }

      // Allow department admin
      login(user, res.data.token)
      navigate("/department/dashboard")

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
          <p className="font-display text-4xl font-semibold tracking-tight">Department portal</p>
          <p className="mt-4 text-lg text-white/80 max-w-sm leading-relaxed">
            Review complaints, track resolutions, and serve your community.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-stone">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden mb-8">
            <p className="font-display text-3xl font-semibold text-forest">Department portal</p>
          </div>

          <h1 className="font-display text-3xl font-semibold text-forest">Department portal</h1>
          <p className="mt-2 text-stone-muted">Sign in with your department admin account</p>

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
                placeholder="department@example.com"
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
            Not a department admin?{" "}
            <Link to="/login" className="text-moss font-semibold hover:text-forest">
              Citizen login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default DepartmentLogin
