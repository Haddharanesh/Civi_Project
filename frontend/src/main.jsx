import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { RealtimeProvider } from "./contexts/RealtimeContext"
import { ToastProvider } from "./contexts/ToastContext"
import App from "./App"
import "leaflet/dist/leaflet.css"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <RealtimeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </RealtimeProvider>
    </AuthProvider>
  </BrowserRouter>
)
