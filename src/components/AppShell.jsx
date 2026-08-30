import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppShell({ children }) {
  const { profile, session, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const navigate = useNavigate()

  const navItems = session
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/events', label: 'Events' },
        ...(profile?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin' }] : []),
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link className="text-xl font-bold tracking-tight text-slate-950" to="/" onClick={closeMenu}>
            BuilderPass
          </Link>
          <button
            aria-controls="site-navigation"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="hidden items-center gap-5 md:flex">
            <nav className="flex items-center gap-6" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-950'}`
                  }
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {session && (
              <button
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-950"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut size={17} />
                Log out
              </button>
            )}
          </div>
        </div>
        {isMenuOpen && (
          <div className="border-t border-slate-200 px-5 py-3 md:hidden">
            <nav id="site-navigation" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <NavLink
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  key={item.to}
                  onClick={closeMenu}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {session && (
              <button
                className="mt-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut size={17} />
                Log out
              </button>
            )}
          </div>
        )}
        {logoutError && <p className="mx-auto max-w-6xl px-5 py-2 text-sm text-red-700">{logoutError}</p>}
      </header>
      <main>{children}</main>
    </div>
  )
}
