import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import { RequireAdmin, RequireAuth } from './components/RequireAuth.jsx'
import StartPage from './pages/StartPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import MemberDashboardPage from './pages/member/MemberDashboardPage.jsx'
import AdminLandingPage from './pages/admin/AdminLandingPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <MemberDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLandingPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
