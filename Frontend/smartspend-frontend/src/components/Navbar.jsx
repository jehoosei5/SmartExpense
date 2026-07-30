import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

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
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-lg dark:shadow-2xl transition-colors duration-200">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-100 dark:to-white drop-shadow-sm dark:drop-shadow-md">
          SmartSpend <span className="text-emerald-600 dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">AI</span>
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
                    ? 'text-emerald-600 dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="block h-0.5 w-full bg-emerald-600 dark:bg-cyan-400 rounded-full mt-1 dark:drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                )}
              </Link>
            )
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 focus:outline-none"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white focus:outline-none p-2 -mr-2"
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
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4 shadow-xl">
          {links.map(link => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'text-emerald-600 dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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