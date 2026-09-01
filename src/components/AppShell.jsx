import { LogOut, Mail, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import GridBackground from './GridBackground.jsx'
import Logo from './Logo.jsx'

export default function AppShell({ children }) {
  const { profile, session, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isDataDensePage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard')

  // Every route change should land the user at the top of the new page —
  // the browser does not do this automatically for client-side navigation.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }, [location.pathname])

  // Clicking a nav link/logo that points at the page you're already on
  // (e.g. Home while on "/") won't trigger a route change, so it needs its
  // own explicit scroll-to-top.
  function scrollToTopIfSamePath(targetPath) {
    if (location.pathname === targetPath) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }
  }

  const isEventManager = ['OFFICER', 'ADMIN'].includes(profile?.role)

  const navItems = session
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/events', label: 'Events' },
        { to: '/profile', label: 'Profile' },
        ...(isEventManager ? [{ to: '/admin/events', label: 'Manage events' }] : []),
        ...(profile?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', end: true }] : []),
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/register', label: 'Register' },
        { to: '/login', label: 'Login' },
      ]

  function closeMenu() {
    setIsMenuOpen(false)
  }

  async function handleSignOut() {
    setLogoutError('')
    try {
      await signOut()
      closeMenu()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error.message || 'We could not sign you out. Please try again.')
    }
  }

  const linkClass = ({ isActive }) =>
    `mono text-sm font-bold uppercase tracking-[.16em] transition-colors duration-150 relative ${
      isActive
        ? 'text-[var(--bp-amber)] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[var(--bp-amber)]'
        : 'text-[var(--bp-text-dim)] hover:text-[var(--bp-text)]'
    }`

  // Signed-in users land on their dashboard when they click the logo;
  // guests go to the public landing page. Avoids bouncing an authenticated
  // user back to the marketing homepage from every internal page.
  const logoDestination = session ? '/dashboard' : '/'

  return (
    <div className="relative isolate min-h-screen text-[var(--bp-text)]">
      <GridBackground muted={isDataDensePage} />
      <div className="relative z-10 flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--bp-border)] bg-[var(--bp-bg)]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[90rem] items-center justify-between px-6 lg:px-10">
          <Link
            className="flex items-center gap-3 text-xl font-black tracking-tight text-[var(--bp-text)] hover:text-[var(--bp-amber)] transition-colors"
            to={logoDestination}
            onClick={() => {
              closeMenu()
              scrollToTopIfSamePath(logoDestination)
            }}
          >
            <Logo className="h-14 w-14" />
            <span className="hidden sm:inline">BUILDERPASS</span>
            <span className="sm:hidden">BP</span>
          </Link>

          <button
            aria-controls="site-navigation"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            className="border border-[var(--bp-border-strong)] p-2 text-[var(--bp-amber)] hover:bg-[var(--bp-amber)] hover:text-black transition-colors md:hidden"
            onClick={() => setIsMenuOpen((v) => !v)}
            type="button"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <nav className="flex items-center gap-7" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink
                  className={linkClass}
                  end={item.end}
                  key={item.to}
                  onClick={() => scrollToTopIfSamePath(item.to)}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {session && (
              <button
                className="mono inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)] hover:text-[var(--bp-amber)] transition-colors"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-[var(--bp-border)] px-5 py-4 md:hidden">
            <nav id="site-navigation" className="grid gap-4" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <NavLink
                  className={linkClass}
                  end={item.end}
                  key={item.to}
                  onClick={() => {
                    closeMenu()
                    scrollToTopIfSamePath(item.to)
                  }}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {session && (
              <button
                className="mono mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut size={15} />
                Logout
              </button>
            )}
          </div>
        )}

        {logoutError && (
          <p className="mx-auto max-w-[90rem] px-6 py-2 text-sm text-[var(--bp-danger)] lg:px-10">{logoutError}</p>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-[var(--bp-border)] bg-[var(--bp-bg)]">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-8 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-10">
          <div className="flex items-start gap-4">
            <Logo className="h-16 w-16" />
            <div>
              <p className="text-sm font-black tracking-tight text-[var(--bp-text)]">BUILDERPASS</p>
              <p className="mono mt-1 text-[11px] leading-relaxed text-[var(--bp-text-dim)]">
                AWS STUDENT BUILDER GROUP - TIP MANILA
                <br />
                BY BUILDERS. FOR BUILDERS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              aria-label="Email AWS SBG TIP Manila"
              className="grid h-10 w-10 place-items-center border border-[var(--bp-border-strong)] text-[var(--bp-amber)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:bg-[var(--bp-amber)] hover:text-black"
              href="mailto:aws.mnl@tip.edu.ph"
              title="aws.mnl@tip.edu.ph"
            >
              <Mail size={17} />
            </a>
            <a
              aria-label="AWS SBG TIP Manila on Facebook"
              className="grid h-10 w-10 place-items-center border border-[var(--bp-border-strong)] text-sm font-black text-[var(--bp-amber)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:bg-[var(--bp-amber)] hover:text-black"
              href="https://www.facebook.com/awssbgtip"
              rel="noreferrer"
              target="_blank"
              title="/awssbgtip"
            >
              f
            </a>
            <a
              aria-label="AWS SBG TIP Manila on LinkedIn"
              className="grid h-10 w-10 place-items-center border border-[var(--bp-border-strong)] text-xs font-black text-[var(--bp-amber)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:bg-[var(--bp-amber)] hover:text-black"
              href="https://www.linkedin.com/company/aws-cloud-clubs-tip-manila"
              rel="noreferrer"
              target="_blank"
              title="/awscloudclubtipm"
            >
              in
            </a>
          </div>

          <p className="mono text-[11px] leading-relaxed text-[var(--bp-text-dim)] lg:text-right">
            © {new Date().getFullYear()} AWS SBG TIP Manila.
            <br className="hidden lg:block" /> All rights reserved.
          </p>
        </div>
      </footer>
      </div>
    </div>
  )
}
