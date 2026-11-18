import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from "react-leaflet"
import L from "leaflet"
import { Fragment, useEffect, useMemo, useState } from "react"
import "leaflet/dist/leaflet.css"

/** Priority circle-zone styling — High / Medium / Low */
export const PRIORITY_ZONES = {
  HIGH: {
    label: "High",
    color: "#B91C1C",
    fill: "#EF4444",
    radius: 450,
    iconColor: "red",
  },
  MEDIUM: {
    label: "Medium",
    color: "#B45309",
    fill: "#F59E0B",
    radius: 320,
    iconColor: "orange",
  },
  LOW: {
    label: "Low",
    color: "#166534",
    fill: "#22C55E",
    radius: 220,
    iconColor: "green",
  },
}

const CLUSTER_METERS = 350

function zoneFor(priority) {
  const key = (priority || "MEDIUM").toUpperCase()
  return PRIORITY_ZONES[key] || PRIORITY_ZONES.MEDIUM
}

function haversineMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Merge nearby same-priority complaints into circular zones */
function buildCircleZones(complaints) {
  const byPriority = { HIGH: [], MEDIUM: [], LOW: [] }
  for (const c of complaints) {
    const key = (c.priority || "MEDIUM").toUpperCase()
    const bucket = byPriority[key] ? key : "MEDIUM"
    byPriority[bucket].push(c)
  }

  const zones = []
  for (const [priority, items] of Object.entries(byPriority)) {
    const remaining = [...items]
    while (remaining.length) {
      const seed = remaining.shift()
      const seedPos = [Number(seed.latitude), Number(seed.longitude)]
      const members = [seed]
      for (let i = remaining.length - 1; i >= 0; i--) {
        const pos = [Number(remaining[i].latitude), Number(remaining[i].longitude)]
        if (haversineMeters(seedPos, pos) <= CLUSTER_METERS) {
          members.push(remaining.splice(i, 1)[0])
        }
      }

      const lats = members.map((m) => Number(m.latitude))
      const lngs = members.map((m) => Number(m.longitude))
      const center = [
        lats.reduce((s, v) => s + v, 0) / lats.length,
        lngs.reduce((s, v) => s + v, 0) / lngs.length,
      ]

      const style = zoneFor(priority)
      let farthest = 0
      for (const m of members) {
        farthest = Math.max(
          farthest,
          haversineMeters(center, [Number(m.latitude), Number(m.longitude)])
        )
      }
      const radius = Math.max(style.radius, farthest + style.radius * 0.45)

      zones.push({
        id: `${priority}-${members.map((m) => m.id).join("-")}`,
        priority,
        center,
        radius,
        style,
        members,
        count: members.length,
      })
    }
  }
  return zones
}

const iconCache = {}
function priorityMarkerIcon(priority) {
  const zone = zoneFor(priority)
  const key = zone.label
  if (iconCache[key]) return iconCache[key]
  iconCache[key] = new L.Icon({
    iconUrl: `https://maps.google.com/mapfiles/ms/icons/${zone.iconColor}-dot.png`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  })
  return iconCache[key]
}

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 15 })
  }, [map, points])
  return null
}

export function PriorityZoneLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
      {Object.entries(PRIORITY_ZONES).map(([key, zone]) => (
        <span key={key} className="inline-flex items-center gap-2 text-stone-muted">
          <span
            className="w-5 h-5 rounded-full border-2 shadow-sm"
            style={{
              backgroundColor: `${zone.fill}55`,
              borderColor: zone.color,
            }}
          />
          {zone.label} circle zone
        </span>
      ))}
    </div>
  )
}

/**
 * Map with High / Medium / Low priority circle zones.
 */
export default function PriorityZonesMap({
  complaints = [],
  height = "24rem",
  showFilters = true,
  defaultFilter = "ALL",
}) {
  const [filter, setFilter] = useState(defaultFilter)

  const located = useMemo(
    () =>
      (complaints || []).filter(
        (c) =>
          c?.latitude != null &&
          c?.longitude != null &&
          !Number.isNaN(Number(c.latitude)) &&
          !Number.isNaN(Number(c.longitude))
      ),
    [complaints]
  )

  const visible = useMemo(() => {
    if (filter === "ALL") return located
    return located.filter((c) => (c.priority || "MEDIUM").toUpperCase() === filter)
  }, [located, filter])

  const circleZones = useMemo(() => buildCircleZones(visible), [visible])

  const points = useMemo(
    () => visible.map((c) => [Number(c.latitude), Number(c.longitude)]),
    [visible]
  )

  const center = points[0] || [11.6643, 78.146]

  if (located.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-stone-dark bg-stone/40 flex items-center justify-center text-sm text-stone-muted"
        style={{ height }}
      >
        No mapped complaints yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PriorityZoneLegend />
        {showFilters && (
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "All zones" },
              { id: "HIGH", label: "High" },
              { id: "MEDIUM", label: "Medium" },
              { id: "LOW", label: "Low" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filter === opt.id
                    ? "bg-forest text-white"
                    : "bg-stone text-forest hover:bg-moss-pale"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="rounded-xl overflow-hidden border border-stone-dark relative z-0 isolate"
        style={{ height }}
      >
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />

          {/* Soft outer ring + filled inner circle = clear zone look */}
          {circleZones.map((zone) => (
            <Fragment key={zone.id}>
              <Circle
                center={zone.center}
                radius={zone.radius * 1.12}
                pathOptions={{
                  color: zone.style.color,
                  fillColor: zone.style.fill,
                  fillOpacity: 0.08,
                  weight: 1,
                  opacity: 0.35,
                  dashArray: "6 8",
                }}
              />
              <Circle
                center={zone.center}
                radius={zone.radius}
                pathOptions={{
                  color: zone.style.color,
                  fillColor: zone.style.fill,
                  fillOpacity: 0.28,
                  weight: 3,
                  opacity: 0.9,
                }}
              >
                <Tooltip sticky>
                  <span className="font-semibold">
                    {zone.style.label} zone · {zone.count} issue{zone.count > 1 ? "s" : ""}
                  </span>
                </Tooltip>
                <Popup>
                  <div className="text-sm min-w-[11rem]">
                    <p className="font-bold mb-1" style={{ color: zone.style.color }}>
                      {zone.style.label} priority circle zone
                    </p>
                    <p className="text-xs text-stone-muted mb-2">
                      {zone.count} complaint{zone.count > 1 ? "s" : ""} in this area
                    </p>
                    <ul className="text-xs space-y-1 max-h-28 overflow-y-auto">
                      {zone.members.slice(0, 6).map((m) => (
                        <li key={m.id}>• {m.title || "Untitled issue"}</li>
                      ))}
                      {zone.members.length > 6 && (
                        <li>+{zone.members.length - 6} more</li>
                      )}
                    </ul>
                  </div>
                </Popup>
              </Circle>
            </Fragment>
          ))}

          {visible.map((c) => {
            const zone = zoneFor(c.priority)
            const position = [Number(c.latitude), Number(c.longitude)]
            return (
              <Marker key={c.id} position={position} icon={priorityMarkerIcon(c.priority)}>
                <Popup>
                  <div className="text-sm min-w-[10rem]">
                    <p className="font-semibold text-forest mb-1">{c.title || "Complaint"}</p>
                    <p className="text-xs text-stone-muted mb-1">{c.category || "General"}</p>
                    <p className="text-xs">
                      <span className="font-bold" style={{ color: zone.color }}>
                        {zone.label} priority
                      </span>
                      {" · "}
                      {(c.status || "NEW").replace("_", " ")}
                    </p>
                    <p className="text-xs mt-1">{c.upvotes || 0} supporters</p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      <p className="text-xs text-stone-muted">
        Colored <strong>circle zones</strong> group nearby issues — High (red), Medium (amber), Low (green).
        Hover a circle for the zone label; click for complaints inside it.
      </p>
    </div>
  )
}

/** Single complaint map with a clear circle zone */
export function SinglePriorityMap({ complaint, height = "18rem" }) {
  if (!complaint?.latitude || !complaint?.longitude) {
    return (
      <div
        className="rounded-xl border border-dashed border-stone-dark bg-stone/40 flex items-center justify-center text-sm text-stone-muted"
        style={{ height }}
      >
        Location not available
      </div>
    )
  }

  const zone = zoneFor(complaint.priority)
  const position = [Number(complaint.latitude), Number(complaint.longitude)]

  return (
    <div className="space-y-2">
      <PriorityZoneLegend />
      <div
        className="rounded-xl overflow-hidden border border-stone-dark relative z-0 isolate"
        style={{ height }}
      >
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Circle
            center={position}
            radius={zone.radius * 1.15}
            pathOptions={{
              color: zone.color,
              fillColor: zone.fill,
              fillOpacity: 0.1,
              weight: 1,
              opacity: 0.4,
              dashArray: "6 8",
            }}
          />
          <Circle
            center={position}
            radius={zone.radius}
            pathOptions={{
              color: zone.color,
              fillColor: zone.fill,
              fillOpacity: 0.3,
              weight: 3,
              opacity: 0.95,
            }}
          >
            <Tooltip direction="top" permanent offset={[0, -8]}>
              {zone.label} circle zone
            </Tooltip>
          </Circle>
          <Marker position={position} icon={priorityMarkerIcon(complaint.priority)}>
            <Popup>
              <strong>{zone.label} priority circle zone</strong>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  )
}
