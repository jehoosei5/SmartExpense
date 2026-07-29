import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  function handleLogout() {
    localStorage.clear()
    navigate('/login')
  }

  const links = [
    { path: '/',         label: 'Dashboard' },
    { path: '/expenses', label: 'Expenses'  },
    { path: '/chat',     label: 'AI Chat'   },
    { path: '/sync',     label: 'Sync'      },
    { path: '/budgets',  label: 'Budgets'   },
    { path: '/profile',  label: 'Profile'   }
  ]

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10 text-white shadow-2xl">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="text-xl md:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white drop-shadow-md">
          SmartSpend <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">AI</span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(link => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="block h-0.5 w-full bg-cyan-400 rounded-full mt-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Desktop Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="hidden md:block text-sm font-semibold text-slate-400 hover:text-white transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          Logout
        </button>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-slate-400 hover:text-white focus:outline-none p-2 -mr-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4 shadow-xl">
          {links.map(link => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="text-left text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors duration-300 mt-2"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}