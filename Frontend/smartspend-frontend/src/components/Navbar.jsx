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
    <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      {/* Logo */}
      <div className="text-xl font-bold tracking-tight">
        SmartSpend <span className="text-blue-300">AI</span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-6">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium transition-all hover:text-blue-300 ${
              location.pathname === link.path
                ? 'text-white border-b-2 border-blue-300 pb-0.5'
                : 'text-blue-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-blue-200 hover:text-white transition-all"
      >
        Logout
      </button>
    </nav>
  )
}