import { HAD_CREATIONS } from "../../config"

/**
 * Creator watermark (had_creations).
 * Visible in footers so shared demos show the author's name.
 */
export default function CreatorCredit({ className = "", light = false }) {
  return (
    <p
      data-creator={HAD_CREATIONS.key}
      className={`text-xs tracking-wide ${
        light ? "text-white/60" : "text-stone-muted"
      } ${className}`}
    >
      <span className="font-semibold opacity-90">{HAD_CREATIONS.credit}</span>
    </p>
  )
}
