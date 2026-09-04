import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import PageTransition from './components/PageTransition.jsx'
import { RequireAdmin, RequireAuth, RequireGuest, RequireOfficer } from './components/RequireAuth.jsx'
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx'
import StartPage from './pages/StartPage.jsx'

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'))
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage.jsx'))
const CreateEventPage = lazy(() => import('./pages/admin/CreateEventPage.jsx'))
const EditEventPage = lazy(() => import('./pages/admin/EditEventPage.jsx'))
const EventAttendancePage = lazy(() => import('./pages/admin/EventAttendancePage.jsx'))
const EventRegistrationsPage = lazy(() => import('./pages/admin/EventRegistrationsPage.jsx'))
const MemberImportPage = lazy(() => import('./pages/admin/MemberImportPage.jsx'))
const MembersPage = lazy(() => import('./pages/admin/MembersPage.jsx'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage.jsx'))
const EventDetailPage = lazy(() => import('./pages/member/EventDetailPage.jsx'))
const EventsPage = lazy(() => import('./pages/member/EventsPage.jsx'))
const MemberDashboardPage = lazy(() => import('./pages/member/MemberDashboardPage.jsx'))
const ProfilePage = lazy(() => import('./pages/member/ProfilePage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

export default function App() {
  const location = useLocation()

  return (
    <AppShell>
      <RouteErrorBoundary key={location.key}>
        <Suspense fallback={<RouteLoadingScreen />}>
          <Routes>
          <Route path="/" element={<StartPage />} />
          <Route
            path="/login"
            element={
              <PageTransition key={location.pathname}>
                <RequireGuest><LoginPage /></RequireGuest>
              </PageTransition>
            }
          />
          <Route
            path="/register"
            element={
              <PageTransition key={location.pathname}>
                <RequireGuest><RegisterPage /></RequireGuest>
              </PageTransition>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PageTransition key={location.pathname}>
                <RequireGuest><ForgotPasswordPage /></RequireGuest>
              </PageTransition>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PageTransition key={location.pathname}>
                <ResetPasswordPage />
              </PageTransition>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PageTransition key={location.pathname}>
                <RequireGuest><VerifyEmailPage /></RequireGuest>
              </PageTransition>
            }
          />
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
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
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
              <RequireOfficer>
                <AdminEventsPage />
              </RequireOfficer>
            }
          />
          <Route
            path="/admin/events/new"
            element={
              <RequireOfficer>
                <CreateEventPage />
              </RequireOfficer>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <RequireOfficer>
                <EditEventPage />
              </RequireOfficer>
            }
          />
          <Route
            path="/admin/events/:id/attendance"
            element={
              <RequireOfficer>
                <EventAttendancePage />
              </RequireOfficer>
            }
          />
          <Route
            path="/admin/events/:id/registrations"
            element={
              <RequireOfficer>
                <EventRegistrationsPage />
              </RequireOfficer>
            }
          />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </AppShell>
  )
}

function RouteLoadingScreen() {
  return (
    <section
      aria-live="polite"
      className="mx-auto min-h-[50vh] max-w-6xl px-6 py-16 text-[var(--bp-text-dim)] lg:px-10"
    >
      <p className="mono text-xs font-bold uppercase tracking-[.14em]">Loading page...</p>
    </section>
  )
}
