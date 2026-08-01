import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { getAlerts, markAlertRead } from '../api/client'
import toast from 'react-hot-toast'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [alerts, setAlerts] = useState([])
  const { theme, toggleTheme } = useTheme()
  const notifRef = useRef(null)

  useEffect(() => {
    loadAlerts()
    
    // Close dropdown on click outside
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [])

  async function loadAlerts() {
    try {
      const res = await getAlerts()
      setAlerts(res.data)
      
      // Check if there are any alerts for the CURRENT month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const recentAlerts = res.data.filter(a => {
        const d = new Date(a.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const toastAlreadyShown = sessionStorage.getItem('budget_toast_shown');

      if (recentAlerts.length > 0 && !toastAlreadyShown) {
        sessionStorage.setItem('budget_toast_shown', 'true');
        // Extract category and percentage from the alerts
        const categoriesWithPercent = recentAlerts.map(a => {
          const cat = a.title.replace('Budget Alert: ', '');
          const match = a.message.match(/reached (\d+)%/);
          const percent = match ? match[1] : '90';
          return { cat, percent };
        });

        // Deduplicate by picking the latest alert for each category
        const uniqueCatMap = new Map();
        categoriesWithPercent.forEach(c => uniqueCatMap.set(c.cat, c.percent));

        toast((t) => (
          <div>
            <div className="font-bold mb-1">⚠️ Warning: Budget Limits Reached!</div>
            <ul className="m-0 pl-5 text-sm list-disc">
              {Array.from(uniqueCatMap.entries()).map(([cat, percent]) => (
                <li key={cat}>
                  <strong>{cat}</strong>: {percent}% capacity
                </li>
              ))}
            </ul>
          </div>
        ), {
          icon: '🚨',
          style: {
            borderRadius: '10px',
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
          },
          duration: 6000,
        });
      }
    } catch (err) {
      console.error("Failed to load alerts", err)
    }
  }

  async function handleAlertClick(id) {
    try {
      await markAlertRead(id)
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch (err) {
      console.error("Failed to mark alert as read", err)
    }
  }

  const unreadCount = alerts.filter(a => !a.is_read).length

  function handleLogout() {
    localStorage.clear()
    navigate('/login')
  }

  const links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/expenses',  label: 'Expenses'  },
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
          
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <div 
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.id)}
                        className={`px-4 py-3 cursor-pointer transition-colors duration-200 border-b border-slate-50 dark:border-white/5 last:border-0 ${!alert.is_read ? 'bg-slate-50 dark:bg-slate-700/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-semibold ${!alert.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{alert.title}</span>
                          {!alert.is_read && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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