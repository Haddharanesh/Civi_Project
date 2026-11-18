import { Routes, Route, Navigate } from "react-router-dom"
import { useContext } from "react"
import PublicLayout from "./components/Layout/PublicLayout"
import UserLayout from "./components/Layout/UserLayout"
import DepartmentLayout from "./components/Layout/DepartmentLayout"
import { AuthContext, isDepartmentAdmin } from "./contexts/AuthContext"
import "./App.css"

// Pages
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ReportIssue from "./pages/ReportIssue"
import IssueDetail from "./pages/IssueDetail"
import MyComplaints from "./pages/MyComplaints"
import Notifications from "./pages/Notifications"
import Analytics from "./pages/Analytics"
import Profile from "./pages/Profile"
import PublicReports from "./pages/PublicReports"
import ComplaintDetails from "./pages/ComplaintDetails"
import UserDashboard from "./pages/UserDashboard"
import DepartmentLogin from "./pages/DepartmentLogin"
import DepartmentDashboard from "./pages/DepartmentDashboard"
import DepartmentReview from "./pages/DepartmentReview"
import DepartmentReports from "./pages/DepartmentReports"
import DepartmentNotifications from "./pages/DepartmentNotifications"
import DepartmentProfile from "./pages/DepartmentProfile"
import SuperAdminLogin from "./pages/SuperAdminLogin"
import SuperAdminDashboard from "./pages/SuperAdminDashboard"

// Route protection components
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext)
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.some(role => role === user.role)) {
    if (isDepartmentAdmin(user)) {
      return <Navigate to="/department/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

// Redirect based on user role
const RoleBasedRedirect = () => {
  const { user } = useContext(AuthContext)
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (isDepartmentAdmin(user)) {
    return <Navigate to="/department/dashboard" replace />
  }
  
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Public Routes - Green Theme */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
        
        {/* User Routes - Green Theme (Protected) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><UserDashboard /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-complaints" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><MyComplaints /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/public-reports" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><PublicReports /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/report" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><ReportIssue /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/complaint/:id" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><ComplaintDetails /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><Notifications /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><Analytics /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><Profile /></UserLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/issue/:id" 
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserLayout><IssueDetail /></UserLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Department Routes - Blue Theme (Department Login Page - No Auth Required) */}
        <Route path="/department-login" element={<DepartmentLayout><DepartmentLogin /></DepartmentLayout>} />
        
        {/* Super Admin Routes - Dark/Gold Theme */}
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        
        <Route 
          path="/superadmin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Department Routes - Blue Theme (Protected) */}
        <Route 
          path="/department/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["DEPARTMENT_ADMIN"]}>
              <DepartmentLayout><DepartmentDashboard /></DepartmentLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/department/review" 
          element={
            <ProtectedRoute allowedRoles={["DEPARTMENT_ADMIN"]}>
              <DepartmentLayout><DepartmentReview /></DepartmentLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/department/reports" 
          element={
            <ProtectedRoute allowedRoles={["DEPARTMENT_ADMIN"]}>
              <DepartmentLayout><DepartmentReports /></DepartmentLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/department/profile" 
          element={
            <ProtectedRoute allowedRoles={["DEPARTMENT_ADMIN"]}>
              <DepartmentLayout><DepartmentProfile /></DepartmentLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/department/notifications" 
          element={
            <ProtectedRoute allowedRoles={["DEPARTMENT_ADMIN"]}>
              <DepartmentLayout><DepartmentNotifications /></DepartmentLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Role-based redirect */}
        <Route path="/redirect" element={<RoleBasedRedirect />} />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
