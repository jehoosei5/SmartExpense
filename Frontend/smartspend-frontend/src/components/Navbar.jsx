import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.clear()
    navigate('/login')
  }

  const links = [
    { path: '/',         label: 'Dashboard' },
    { path: '/expenses', label: 'Expenses'  },
    { path: '/chat',     label: 'AI Chat'   },
    { path: '/sync',     label: 'Sync'      },
    { path: '/profile',  label: 'Profile'   }
  ]

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 text-white px-6 py-4 flex items-center justify-between shadow-2xl">
      {/* Logo */}
      <div className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white drop-shadow-md">
        SmartSpend <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">AI</span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-8">
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

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm font-semibold text-slate-400 hover:text-white transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
      >
        Logout
      </button>
    </nav>
  )
}