import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login, register, googleLogin } from '../api/client'

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
  const colors = { Weak: 'bg-red-400', Medium: 'bg-yellow-400', Strong: 'bg-green-500' }
  const widths = { Weak: 'w-1/3', Medium: 'w-2/3', Strong: 'w-full' }

  return (
    <div className="mt-2">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colors[strength]} ${widths[strength]}`} />
      </div>
      <p className={`text-xs font-medium mt-1 ${
        strength === 'Weak' ? 'text-red-500' :
        strength === 'Medium' ? 'text-yellow-500' : 'text-green-600'
      }`}>{strength} password</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
        {[
          { key: 'length',  label: 'At least 8 characters' },
          { key: 'upper',   label: 'Uppercase letter (A-Z)' },
          { key: 'lower',   label: 'Lowercase letter (a-z)' },
          { key: 'number',  label: 'Number (0-9)' },
          { key: 'special', label: 'Special character (!@#...)' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`text-xs ${checks[key] ? 'text-green-500' : 'text-gray-400'}`}>
              {checks[key] ? '✓' : '○'}
            </span>
            <span className={`text-xs ${checks[key] ? 'text-green-600' : 'text-gray-400'}`}>
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
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [touched, setTouched]         = useState({ email: false, password: false })

  const emailValid     = validateEmail(email)
  const passwordChecks = validatePassword(password)
  const passwordValid  = Object.values(passwordChecks).every(Boolean)
  const emailError     = touched.email && email && !emailValid ? 'Please enter a valid email address' : ''
  const isGoogleError  = error.includes('Google')

  async function handleSubmit() {
    setTouched({ email: true, password: true })
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (!emailValid) { setError('Please enter a valid email address'); return }
    if (isRegister && !passwordValid) { setError('Password does not meet all requirements'); return }
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password, displayName)
        setIsRegister(false)
        setEmail('')
        setPassword('')
        setTouched({ email: false, password: false })
        setError('Account created! Please login.')
      } else {
        const res = await login(email, password)
        localStorage.setItem('access_token', res.data.access_token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin(credentialResponse) {
    setError('')
    setLoading(true)
    try {
      const res = await googleLogin(credentialResponse.credential)
      localStorage.setItem('access_token', res.data.access_token)
      localStorage.setItem('refresh_token', res.data.refresh_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">SmartSpend AI</h1>
          <p className="text-gray-500 mt-1">Your AI-powered expense tracker</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); setTouched({ email: false, password: false }) }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              !isRegister ? 'bg-white shadow text-blue-900' : 'text-gray-500'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); setTouched({ email: false, password: false }) }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              isRegister ? 'bg-white shadow text-blue-900' : 'text-gray-500'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              placeholder="you@example.com"
              autoComplete="off"
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            {touched.email && email && emailValid && (
              <p className="text-green-600 text-xs mt-1">✓ Valid email</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {isRegister && <PasswordStrength password={password} />}
          </div>

          {/* Error message — shows Google button if it's a Google account error */}
          {error && (
            <div>
              <p className={`text-sm ${error.includes('created') ? 'text-green-600' : 'text-red-500'}`}>
                {error}
              </p>
              {isGoogleError && (
                <div className="mt-3 flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => setError('Google login failed')}
                    width="368"
                    text="signin_with_google"
                    shape="rectangular"
                    theme="filled_blue"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-900 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError('Google login failed')}
              width="368"
              text="signin_with_google"
              shape="rectangular"
              theme="outline"
            />
          </div>

        </div>
      </div>
    </div>
  )
}