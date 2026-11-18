/** Nature accent colors per department — used on Department portal chrome */

const THEMES = {
  "Public Works Department": {
    key: "works",
    short: "Public Works",
    accent: "#4A5568", // slate
    accentSoft: "#E8EBEF",
    logoBg: "#4A5568",
    label: "text-[#4A5568]",
    ring: "ring-[#4A5568]/25",
    bar: "border-b-[#4A5568]",
    activeNav: "bg-[#E8EBEF] text-[#3D4654] ring-1 ring-[#4A5568]/20",
  },
  "Sanitation Department": {
    key: "sanitation",
    short: "Sanitation",
    accent: "#6B7C3E", // olive
    accentSoft: "#EEF2E3",
    logoBg: "#6B7C3E",
    label: "text-[#6B7C3E]",
    ring: "ring-[#6B7C3E]/25",
    bar: "border-b-[#6B7C3E]",
    activeNav: "bg-[#EEF2E3] text-[#556332] ring-1 ring-[#6B7C3E]/20",
  },
  "Electricity Board": {
    key: "electricity",
    short: "Electricity",
    accent: "#B45309", // amber
    accentSoft: "#FEF3C7",
    logoBg: "#B45309",
    label: "text-[#B45309]",
    ring: "ring-[#B45309]/25",
    bar: "border-b-[#B45309]",
    activeNav: "bg-[#FEF3C7] text-[#92400E] ring-1 ring-[#B45309]/20",
  },
  "Water Supply Department": {
    key: "water",
    short: "Water Supply",
    accent: "#0F766E", // teal
    accentSoft: "#CCFBF1",
    logoBg: "#0F766E",
    label: "text-[#0F766E]",
    ring: "ring-[#0F766E]/25",
    bar: "border-b-[#0F766E]",
    activeNav: "bg-[#CCFBF1] text-[#115E59] ring-1 ring-[#0F766E]/20",
  },
  "General Municipal Department": {
    key: "general",
    short: "General",
    accent: "#1F7A54", // moss
    accentSoft: "#E6F2EC",
    logoBg: "#1F7A54",
    label: "text-moss",
    ring: "ring-moss/25",
    bar: "border-b-moss",
    activeNav: "bg-moss-pale text-forest ring-1 ring-moss/25",
  },
}

const FALLBACK = THEMES["General Municipal Department"]

export function getDepartmentName(userOrDepartment) {
  if (!userOrDepartment) return null
  if (typeof userOrDepartment === "string") return userOrDepartment
  if (userOrDepartment.name) return userOrDepartment.name
  if (userOrDepartment.department?.name) return userOrDepartment.department.name
  if (typeof userOrDepartment.department === "string") return userOrDepartment.department
  return null
}

export function getDepartmentTheme(userOrDepartment) {
  const name = getDepartmentName(userOrDepartment)
  return (name && THEMES[name]) || FALLBACK
}

export { THEMES as DEPARTMENT_THEMES }
