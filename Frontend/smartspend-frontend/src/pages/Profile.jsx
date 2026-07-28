import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getMe, updateMe, deleteAccount } from '../api/client'

const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR']

function validatePassword(password) {
  return {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
}

export default function Profile() {
  const navigate = useNavigate()

  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)

  // Name & currency form
  const [displayName, setDisplayName] = useState('')
  const [currency, setCurrency]       = useState('GHS')
  const [infoSaving, setInfoSaving]   = useState(false)
  const [infoMsg, setInfoMsg]         = useState('')

  // Password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld]         = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [pwSaving, setPwSaving]       = useState(false)
  const [pwMsg, setPwMsg]             = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    try {
      const res = await getMe()
      setUser(res.data)
      setDisplayName(res.data.display_name || '')
      setCurrency(res.data.default_currency || 'GHS')
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear()
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateInfo() {
    setInfoMsg('')
    setInfoSaving(true)
    try {
      const res = await updateMe({ display_name: displayName, default_currency: currency })
      setUser(res.data) 
      setDisplayName(res.data.display_name)
      setCurrency(res.data.default_currency)
      setInfoMsg('✓ Profile updated successfully')
    } catch (err) {
      setInfoMsg(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setInfoSaving(false)
    }
  }

  async function handleUpdatePassword() {
    setPwMsg('')
    if (!user?.is_oauth_user && !oldPassword) {
        setPwMsg('Please enter your current password')
        return
    }
    if (!newPassword || !confirmPassword) {
      setPwMsg('Please fill in all new password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg('New passwords do not match')
      return
    }
    const checks = validatePassword(newPassword)
    if (!Object.values(checks).every(Boolean)) {
      setPwMsg('New password does not meet all requirements')
      return
    }
    setPwSaving(true)
    try {
      const payload = { new_password: newPassword }
      if (!user?.is_oauth_user) {
          payload.old_password = oldPassword
      }
      const res = await updateMe(payload)
      setUser(res.data) 
      setPwMsg('✓ Password changed successfully')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwMsg(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  // Deletion logic
  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you absolutely sure? This will permanently delete your account and all your financial data. This action cannot be undone."
    )
    if (!confirmed) return

    try {
      await deleteAccount()
      localStorage.clear()
      navigate('/login')
    } catch (err) {
      setInfoMsg(err.response?.data?.detail || 'Failed to delete account')
    }
  }

  const pwChecks = validatePassword(newPassword)
  const pwStrength = Object.values(pwChecks).filter(Boolean).length
  const strengthLabel = pwStrength <= 2 ? 'Weak' : pwStrength <= 4 ? 'Medium' : 'Strong'
  const strengthColor = pwStrength <= 2 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : pwStrength <= 4 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
  const strengthWidth = pwStrength <= 2 ? 'w-1/3' : pwStrength <= 4 ? 'w-2/3' : 'w-full'

  const inputClasses = "w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all shadow-inner"
  const labelClasses = "block text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase"
  const cardClasses = "bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:p-8 mb-8 shadow-2xl relative overflow-hidden hover:shadow-[0_0_40px_rgba(34,211,238,0.05)] transition-shadow duration-500"

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1c] to-indigo-950 flex flex-col items-center justify-center relative selection:bg-cyan-500/30">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1c] to-indigo-950 text-slate-100 font-sans selection:bg-cyan-500/30 relative pb-12 overflow-x-hidden">
      <Navbar />

      <div className="absolute top-20 right-1/4 w-64 h-64 md:w-[600px] md:h-[600px] bg-cyan-500/10 rounded-full blur-[80px] md:blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 md:w-[500px] md:h-[500px] bg-fuchsia-500/10 rounded-full blur-[80px] md:blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-10 relative z-10">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg mb-2">Profile Settings</h1>
          <div className="inline-flex items-center justify-center bg-white/5 border border-white/10 rounded-full px-5 py-1.5 backdrop-blur-md">
            <span className="text-cyan-400 text-sm font-bold tracking-wide">{user?.email}</span>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className={cardClasses}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <h2 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
            <span className="text-cyan-400 text-2xl">👤</span> Personal Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className={labelClasses}>Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">Email address cannot be changed.</p>
            </div>
            
            <div>
              <label className={labelClasses}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={inputClasses}
              />
            </div>
            
            <div>
              <label className={labelClasses}>Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`${inputClasses} appearance-none`}
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
            </div>
            
            {infoMsg && (
              <div className={`p-4 rounded-xl border ${infoMsg.includes('✓') ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <p className={`text-sm font-bold flex items-center gap-2 ${infoMsg.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {infoMsg}
                </p>
              </div>
            )}
            
            <button
              type="button"
              onClick={handleUpdateInfo}
              disabled={infoSaving}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 mt-4"
            >
              {infoSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className={cardClasses}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <h2 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
            <span className="text-cyan-400 text-2xl">🔒</span> {user?.is_oauth_user ? 'Set Account Password' : 'Change Password'}
          </h2>
          
          <div className="space-y-6">
            {!user?.is_oauth_user && (
              <div>
                <label className={labelClasses}>Current Password</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClasses} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                  >
                    {showOld ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            )}
            
            <div>
              <label className={labelClasses}>New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClasses} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                >
                  {showNew ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              
              {newPassword && (
                <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/5">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${strengthColor} ${strengthWidth}`} />
                  </div>
                  <p className={`text-xs font-bold mt-3 tracking-widest uppercase ${
                    pwStrength <= 2 ? 'text-rose-400' :
                    pwStrength <= 4 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>{strengthLabel} password</p>
                </div>
              )}
            </div>
            
            <div>
              <label className={labelClasses}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-black/20 border rounded-xl px-5 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner ${
                  confirmPassword && confirmPassword !== newPassword 
                    ? 'border-rose-500/50 focus:ring-rose-500/50 bg-rose-500/5' 
                    : 'border-white/10 focus:ring-cyan-500/50 focus:border-cyan-400'
                }`}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-rose-400 mt-2 font-bold tracking-wide">Passwords do not match</p>
              )}
            </div>
            
            {pwMsg && (
              <div className={`p-4 rounded-xl border ${pwMsg.includes('✓') ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <p className={`text-sm font-bold flex items-center gap-2 ${pwMsg.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pwMsg}
                </p>
              </div>
            )}
            
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={pwSaving}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 mt-4"
            >
              {pwSaving ? 'Updating...' : user?.is_oauth_user ? 'Set Password' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-500/5 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
          <h2 className="text-xl font-bold text-rose-500 mb-2 flex items-center gap-2 tracking-tight group-hover:text-rose-400 transition-colors">
            ⚠️ Danger Zone
          </h2>
          <p className="text-sm text-rose-400/80 mb-6 font-medium leading-relaxed">
            Once you delete your account, there is no going back. All your financial data, parsed expenses, and settings will be permanently wiped. Please be certain.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-rose-500/20 hover:text-rose-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all"
          >
            Delete Account Permanently
          </button>
        </div>

      </div>
    </div>
  )
}