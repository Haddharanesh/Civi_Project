import axios from "axios"
import { API_BASE_URL } from "../config"

const API = axios.create({
  baseURL: API_BASE_URL,
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = Boolean(localStorage.getItem("token"))
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      if (hadToken) {
        window.dispatchEvent(new Event("civic:unauthorized"))
        const path = window.location.pathname
        const onAuthPage =
          path.includes("login") || path.includes("signup") || path === "/"
        if (!onAuthPage) {
          window.location.assign("/login")
        }
      }
    }
    return Promise.reject(error)
  }
)

export default API
