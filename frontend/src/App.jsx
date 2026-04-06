import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import RepDashboard from './pages/RepDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import RMDashboard from './pages/RMDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AboutPage from './pages/AboutPage'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' }}>Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  const getHome = () => {
    if (!user) return '/login'
    if (user.role === 'rep') return '/rep'
    if (user.role === 'manager') return '/manager'
    if (user.role === 'dm') return '/rm'
    if (user.role === 'admin') return '/admin'
    return '/login'
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/rep" element={
        <ProtectedRoute allowedRoles={['rep', 'admin']}>
          <RepDashboard />
        </ProtectedRoute>
      } />
      <Route path="/manager" element={
        <ProtectedRoute allowedRoles={['manager', 'admin']}>
          <ManagerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/rm" element={
        <ProtectedRoute allowedRoles={['dm', 'admin']}>
          <RMDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to={getHome()} />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}