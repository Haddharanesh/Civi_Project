import { Link } from "react-router-dom"
import { MapPin, CheckCircle2, ArrowRight, Zap, ShieldCheck } from "lucide-react"

const HERO_IMG =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop"

const STEPS = [
  {
    icon: MapPin,
    step: "01",
    title: "Describe the issue",
    body: "Add a short note, category, and pin the exact spot on the map.",
  },
  {
    icon: Zap,
    step: "02",
    title: "We route it smartly",
    body: "Duplicates gather community support. New issues go to the right department.",
  },
  {
    icon: CheckCircle2,
    step: "03",
    title: "Track the outcome",
    body: "Follow status updates and department remarks until it's resolved.",
  },
]

const Home = () => {
  return (
    <div className="text-ink overflow-hidden bg-surface">
      {/* Full-bleed photo hero */}
      <section className="relative min-h-[100svh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={HERO_IMG}
            alt="Tree canopy over a city park path"
            className="h-full w-full object-cover hero-kenburns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest/65 to-forest/25" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-16 pt-32 md:pt-28 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-xs font-semibold tracking-wide uppercase animate-fade-up">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
            Built for citizens &amp; local government
          </span>

          <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.08] animate-fade-up-delay">
            Report what breaks.
            <br />
            Rally your street. Get it fixed.
          </h1>

          <p className="mt-6 max-w-xl mx-auto text-base md:text-lg text-white/80 leading-relaxed animate-fade-up-delay">
            A calmer way for citizens to flag civic issues, back the ones that matter, and follow progress in real time.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3 animate-fade-up-delay-2">
            <Link
              to="/login"
              className="btn-lift inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-forest font-semibold text-[15px]"
            >
              Report an issue
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <Link
              to="/public-reports"
              className="btn-lift inline-flex justify-center items-center px-7 py-3.5 rounded-lg border border-white/35 text-white font-semibold text-[15px] hover:bg-white/10"
            >
              Browse public reports
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-stone py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-moss mb-3">How it works</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-forest max-w-lg tracking-tight">
            Three quiet steps from street to solution
          </h2>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((item) => (
              <li
                key={item.step}
                className="bg-surface rounded-2xl border border-stone-dark p-6 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-moss-pale flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-moss" strokeWidth={2} />
                </div>
                <span className="font-display text-moss text-xs font-bold tracking-widest">{item.step}</span>
                <h3 className="mt-2 font-display text-xl font-semibold text-forest">{item.title}</h3>
                <p className="mt-2 text-stone-muted text-[15px] leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="relative px-6 py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1800&auto=format&fit=crop"
            alt="City skyline at dusk"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-forest/85" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
            Your street is waiting for a voice
          </h2>
          <p className="mt-4 text-white/70 text-lg max-w-lg mx-auto">
            Create a free account and start improving the place you call home.
          </p>
          <Link
            to="/signup"
            className="btn-lift mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-forest font-semibold"
          >
            Create free account
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
