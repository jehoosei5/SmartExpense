import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login, register, googleLogin } from '../api/client'
import toast from 'react-hot-toast'

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password) {
  return {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
}

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = validatePassword(password)
  const passed = Object.values(checks).filter(Boolean).length
  const strength = passed <= 2 ? 'Weak' : passed <= 4 ? 'Medium' : 'Strong'
  const colors = { Weak: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]', Medium: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]', Strong: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' }
  const widths = { Weak: 'w-1/3', Medium: 'w-2/3', Strong: 'w-full' }

  return (
    <div className="mt-3">
      <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colors[strength]} ${widths[strength]}`} />
      </div>
      <p className={`text-xs font-semibold mt-2 tracking-wide ${
        strength === 'Weak' ? 'text-rose-400' :
        strength === 'Medium' ? 'text-yellow-400' : 'text-emerald-400'
      }`}>{strength} password</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
        {[
          { key: 'length',  label: '8+ chars' },
          { key: 'upper',   label: 'Uppercase' },
          { key: 'lower',   label: 'Lowercase' },
          { key: 'number',  label: 'Number' },
          { key: 'special', label: 'Special char' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`text-xs ${checks[key] ? 'text-emerald-400 drop-shadow-[0_0_2px_rgba(16,185,129,0.8)]' : 'text-slate-600'}`}>
              {checks[key] ? '✓' : '○'}
            </span>
            <span className={`text-xs ${checks[key] ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister]   = useState(false)
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [touched, setTouched]         = useState({ email: false, password: false })

  const emailValid     = validateEmail(email)
  const passwordChecks = validatePassword(password)
  const passwordValid  = Object.values(passwordChecks).every(Boolean)
  const emailError     = touched.email && email && !emailValid ? 'Please enter a valid email address' : ''

  async function handleSubmit() {
    setTouched({ email: true, password: true })
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    if (!emailValid) { toast.error('Please enter a valid email address'); return }
    if (isRegister && !passwordValid) { toast.error('Password does not meet all requirements'); return }
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password, displayName)
        setIsRegister(false)
        setEmail('')
        setPassword('')
        setTouched({ email: false, password: false })
        toast.success('Account created! Please login.')
      } else {
        const res = await login(email, password)
        localStorage.setItem('access_token', res.data.access_token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        toast.success('Logged in successfully')
        navigate('/')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin(credentialResponse) {
    setLoading(true)
    try {
      const res = await googleLogin(credentialResponse.credential)
      localStorage.setItem('access_token', res.data.access_token)
      localStorage.setItem('refresh_token', res.data.refresh_token)
      toast.success('Logged in successfully')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 flex items-center justify-center px-4 relative overflow-hidden selection:bg-cyan-500/30 font-sans transition-colors duration-200">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-64 h-64 md:w-[500px] md:h-[500px] bg-cyan-500/20 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 md:w-[500px] md:h-[500px] bg-fuchsia-500/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />

      <div className="bg-white dark:bg-white/[0.03] backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-lg dark:shadow-2xl p-6 sm:p-10 w-full max-w-md relative z-10 transition-all duration-500 hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(34,211,238,0.1)]">
        
        {/* Subtle top glare effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:block hidden" />

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-900 dark:from-blue-100 dark:to-white drop-shadow-sm dark:drop-shadow-md">
            SmartSpend <span className="text-emerald-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">AI</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium tracking-wide">Your intelligent expense tracker</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-slate-100 dark:bg-white/5 backdrop-blur-md rounded-xl p-1.5 mb-8 border border-slate-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setTouched({ email: false, password: false }) }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${
              !isRegister ? 'bg-white dark:bg-cyan-500/20 text-emerald-600 dark:text-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-slate-200 dark:border-cyan-500/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setTouched({ email: false, password: false }) }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${
              isRegister ? 'bg-white dark:bg-fuchsia-500/20 text-rose-600 dark:text-fuchsia-400 shadow-sm dark:shadow-[0_0_15px_rgba(217,70,239,0.2)] border border-slate-200 dark:border-fuchsia-500/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                autoComplete="off"
                className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              placeholder="you@example.com"
              autoComplete="off"
              className={`w-full bg-white dark:bg-black/20 border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                emailError ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500/50 bg-rose-50 dark:bg-rose-500/5' : 'border-slate-200 dark:border-white/10 focus:ring-cyan-500/50 focus:border-cyan-400'
              }`}
            />
            {emailError && <p className="text-rose-400 text-xs mt-2 font-medium">{emailError}</p>}
            {touched.email && email && emailValid && (
              <p className="text-emerald-400 text-xs mt-2 font-medium">✓ Valid email</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {isRegister && <PasswordStrength password={password} />}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 hover:bg-emerald-700 dark:hover:from-cyan-500 dark:hover:to-blue-500 text-white py-3 rounded-xl font-bold tracking-wide shadow-md dark:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Secure Login'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-300 dark:to-white/20" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-300 dark:to-white/20" />
          </div>

          {/* Google Login */}
          <div className="flex justify-center opacity-90 hover:opacity-100 transition-opacity [&_iframe]:!bg-transparent dark:[&_iframe]:!bg-transparent">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => toast.error('Google login failed')}
              shape="pill"
            />
          </div>

        </div>
      </div>
    </div>
  )
}