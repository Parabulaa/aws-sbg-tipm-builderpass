import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import { RequireAdmin, RequireAuth } from './components/RequireAuth.jsx'
import StartPage from './pages/StartPage.jsx'
import AdminEventsPage from './pages/admin/AdminEventsPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import EventAttendancePage from './pages/admin/EventAttendancePage.jsx'
import EventRegistrationsPage from './pages/admin/EventRegistrationsPage.jsx'
import MemberImportPage from './pages/admin/MemberImportPage.jsx'
import MembersPage from './pages/admin/MembersPage.jsx'
import CreateEventPage from './pages/admin/CreateEventPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import EventDetailPage from './pages/member/EventDetailPage.jsx'
import EventsPage from './pages/member/EventsPage.jsx'
import MemberDashboardPage from './pages/member/MemberDashboardPage.jsx'
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
          path="/events"
          element={
            <RequireAuth>
              <EventsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/events/:id"
          element={
            <RequireAuth>
              <EventDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/members"
          element={<RequireAdmin><MembersPage /></RequireAdmin>}
        />
        <Route
          path="/admin/members/import"
          element={<RequireAdmin><MemberImportPage /></RequireAdmin>}
        />
        <Route
          path="/admin/events"
          element={
            <RequireAdmin>
              <AdminEventsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/events/new"
          element={
            <RequireAdmin>
              <CreateEventPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/events/:id/attendance"
          element={
            <RequireAdmin>
              <EventAttendancePage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/events/:id/registrations"
          element={
            <RequireAdmin>
              <EventRegistrationsPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
