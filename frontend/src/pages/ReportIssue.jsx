import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import { Link, useNavigate } from "react-router-dom"
import L from "leaflet"

import "leaflet/dist/leaflet.css"
import API from "../services/api"
import { IMAGE_BASE_URL } from "../config"
import { StatusPill, PriorityPill, PrimaryButton, SecondaryButton } from "../components/UI/CivicUI"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

function LocationPicker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      })
    },
  })
  return null
}

const categories = [
  { value: "ROAD", label: "Road / Pothole" },
  { value: "WASTE", label: "Garbage / Sanitation" },
  { value: "ELECTRICITY", label: "Streetlight / Power" },
  { value: "WATER", label: "Water Leakage" },
  { value: "OTHER", label: "Other" },
]

function SimilarComplaintCard({
  complaint,
  message,
  alreadySupported,
  supporting,
  onViewDetails,
  onSupport,
  onDismiss,
}) {
  if (!complaint) return null

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 md:p-6 mb-6 animate-fade-up">
      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-amber-800 mb-1">
        Similar issue found
      </p>
      <h2 className="font-display text-xl font-semibold text-forest mb-2">
        Review before supporting
      </h2>
      <p className="text-sm text-stone-muted mb-5 leading-relaxed">{message}</p>

      <div className="bg-surface rounded-xl border border-stone-dark overflow-hidden shadow-soft">
        <div className="md:flex">
          {complaint.imageUrl ? (
            <div className="md:w-44 h-40 md:h-auto shrink-0 bg-stone">
              <img
                src={`${IMAGE_BASE_URL}${complaint.imageUrl}`}
                alt={complaint.title || "Similar complaint"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          <div className="p-4 md:p-5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusPill status={complaint.status} />
              <PriorityPill priority={complaint.priority} />
              {complaint.category && (
                <span className="text-xs font-semibold text-stone-muted uppercase tracking-wide">
                  {complaint.category}
                </span>
              )}
            </div>

            <h3 className="font-display text-lg font-semibold text-forest mb-1 truncate">
              {complaint.title || "Existing civic issue"}
            </h3>
            <p className="text-sm text-stone-muted line-clamp-3 mb-3">
              {complaint.description}
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-stone-muted mb-4">
              <span>
                <span className="font-semibold text-forest">{complaint.upvotes || 0}</span> supporters
              </span>
              {complaint.department?.name && <span>{complaint.department.name}</span>}
              {complaint.createdAt && (
                <span>
                  Reported {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <PrimaryButton type="button" onClick={onViewDetails} className="sm:flex-1">
                View details
              </PrimaryButton>
              {!alreadySupported ? (
                <PrimaryButton
                  type="button"
                  onClick={onSupport}
                  disabled={supporting}
                  className="sm:flex-1 bg-moss hover:bg-moss-light"
                >
                  {supporting ? "Adding support…" : "Support this issue"}
                </PrimaryButton>
              ) : (
                <span className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-moss-pale text-moss">
                  Already supported
                </span>
              )}
              <SecondaryButton type="button" onClick={onDismiss} className="sm:flex-1">
                Keep editing my report
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ReportIssue = () => {
  const navigate = useNavigate()

  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("ROAD")
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [location, setLocation] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mapKey, setMapKey] = useState(0)

  const [similar, setSimilar] = useState(null)
  const [similarMessage, setSimilarMessage] = useState("")
  const [alreadySupported, setAlreadySupported] = useState(false)
  const [supporting, setSupporting] = useState(false)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setMapKey((prev) => prev + 1)
      },
      () => console.log("Location permission denied")
    )
  }, [])

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setMapKey((prev) => prev + 1)
      },
      () => setError("Location permission denied. Please select manually.")
    )
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setImage(file)
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  const clearSimilar = () => {
    setSimilar(null)
    setSimilarMessage("")
    setAlreadySupported(false)
  }

  const handleViewDetails = () => {
    if (!similar?.id) return
    navigate(`/complaint/${similar.id}`, {
      state: {
        fromDuplicate: true,
        message: similarMessage,
        alreadySupported,
        needsSupport: !alreadySupported,
      },
    })
  }

  const handleSupport = async () => {
    if (!similar?.id) return
    setSupporting(true)
    setError("")
    try {
      const res = await API.post(`/votes?complaintId=${similar.id}`)
      setMessage(res.data?.message || "Your support has been added.")
      setAlreadySupported(true)
      setTimeout(() => {
        navigate(`/complaint/${similar.id}`, {
          state: {
            fromDuplicate: true,
            message: res.data?.message || "Your support has been added to this complaint.",
            voteAdded: true,
          },
        })
      }, 800)
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg =
        typeof detail === "string"
          ? detail
          : "Unable to add support. You may have already supported this issue."
      setError(msg)
      setAlreadySupported(true)
    } finally {
      setSupporting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")
    clearSimilar()

    if (!image) {
      setError("Please upload an image of the issue")
      return
    }

    if (!location) {
      setError("Please select a location on the map")
      return
    }

    if (!description.trim()) {
      setError("Please provide a description")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("description", description)
      formData.append("category", category)
      formData.append("latitude", location.lat)
      formData.append("longitude", location.lng)
      formData.append("image", image)

      const res = await API.post("/complaints", formData)
      const data = res.data

      if (data?.isDuplicate && data?.complaint?.id) {
        setSimilar(data.complaint)
        setSimilarMessage(
          data.message ||
            "A similar complaint already exists nearby. Review it before adding your support."
        )
        setAlreadySupported(Boolean(data.alreadySupported))
        setLoading(false)
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      setMessage("Issue reported successfully! Redirecting…")
      setTimeout(() => {
        navigate("/dashboard")
      }, 1500)

      setDescription("")
      setCategory("ROAD")
      setImage(null)
      setPreview(null)
      setLocation(null)
      setMapKey((prev) => prev + 1)
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg =
        typeof detail === "string"
          ? detail
          : detail?.error || detail?.message || "Failed to submit report. Please try again."
      setError(msg)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-moss mb-2">Step by step</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest">Report a civic issue</h1>
        <p className="mt-2 text-stone-muted">Describe → pin the map → add a photo → submit</p>
      </div>

      {similar && (
        <SimilarComplaintCard
          complaint={similar}
          message={similarMessage}
          alreadySupported={alreadySupported}
          supporting={supporting}
          onViewDetails={handleViewDetails}
          onSupport={handleSupport}
          onDismiss={clearSimilar}
        />
      )}

      <div className="bg-surface rounded-xl shadow-soft p-6 md:p-8 border border-stone-dark">
        {message && (
          <div className="bg-moss-pale border border-moss/20 text-forest p-4 rounded-lg mb-6 font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-3">
              Issue category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value)
                    clearSimilar()
                  }}
                  className={`p-3.5 rounded-lg text-sm font-medium transition-all border ${
                    category === cat.value
                      ? "border-moss bg-moss-pale text-forest"
                      : "border-stone-dark bg-stone/40 text-stone-muted hover:border-moss/40"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-2">
              Description
            </label>
            <textarea
              rows="4"
              className="w-full border border-stone-dark p-4 rounded-lg focus:ring-2 focus:ring-moss/40 focus:border-moss transition-all bg-stone/30 focus:bg-surface"
              placeholder="Describe the issue — street name, landmarks, how long it's been there."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (similar) clearSimilar()
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-2">Photo</label>
            <div
              className={`relative border border-dashed rounded-lg p-6 text-center transition-all ${
                preview ? "border-moss bg-moss-pale/40" : "border-stone-dark hover:border-moss/50"
              }`}
            >
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-soft" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null)
                      setPreview(null)
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <p className="text-stone-muted text-sm">Click to upload a clear photo of the issue</p>
                  <p className="text-stone-muted/70 text-xs">PNG or JPG up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ display: preview ? "none" : "block" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-stone-muted mb-2">
              Location
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={location ? location.lat.toFixed(6) : ""}
                readOnly
                placeholder="Latitude"
                className="w-full px-4 py-3 border border-stone-dark rounded-lg bg-stone/40 text-stone-muted text-sm"
              />
              <input
                type="text"
                value={location ? location.lng.toFixed(6) : ""}
                readOnly
                placeholder="Longitude"
                className="w-full px-4 py-3 border border-stone-dark rounded-lg bg-stone/40 text-stone-muted text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="btn-lift px-4 py-2 bg-moss hover:bg-moss-light text-white rounded-lg font-medium text-sm"
              >
                Use current location
              </button>
              <span className="text-sm text-stone-muted">or click the map</span>
            </div>

            <div className="h-80 rounded-xl overflow-hidden border border-stone-dark">
              <MapContainer
                key={mapKey}
                center={location ? [location.lat, location.lng] : [11.6643, 78.146]}
                zoom={13}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker setLocation={setLocation} />
                {location && <Marker position={[location.lat, location.lng]} />}
              </MapContainer>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(similar)}
            className={`btn-lift w-full py-3.5 rounded-lg text-[15px] font-semibold ${
              loading || similar
                ? "bg-stone-dark text-stone-muted cursor-not-allowed"
                : "bg-forest text-white hover:bg-forest-soft"
            }`}
          >
            {loading ? "Checking for similar issues…" : similar ? "Review similar issue above" : "Submit report"}
          </button>

          {similar && (
            <p className="text-center text-sm text-stone-muted">
              Or{" "}
              <button type="button" onClick={clearSimilar} className="text-moss font-semibold hover:underline">
                dismiss and edit your report
              </button>
              . Prefer the full page?{" "}
              <Link to={`/complaint/${similar.id}`} state={{ fromDuplicate: true, needsSupport: !alreadySupported }} className="text-moss font-semibold hover:underline">
                Open details
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default ReportIssue
