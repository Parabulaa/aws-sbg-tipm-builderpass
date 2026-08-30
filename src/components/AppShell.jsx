import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home' },
]

export default function AppShell({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function closeMenu() {
    setIsMenuOpen(false)
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
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
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
        </div>
        {isMenuOpen && (
          <nav className="border-t border-slate-200 px-5 py-3 md:hidden" id="site-navigation" aria-label="Mobile navigation">
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
        )}
      </header>
      <main>{children}</main>
    </div>
  )
}
