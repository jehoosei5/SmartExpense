import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getMe, updateMe, deleteAccount } from '../api/client'
import toast from 'react-hot-toast'

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
  const [country, setCountry] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [profession, setProfession] = useState('')
  const [currency, setCurrency]       = useState('GHS')
  const [reportFrequency, setReportFrequency] = useState('NONE')
  const [trackingFocus, setTrackingFocus] = useState('Everything + AI insights')
  const [infoSaving, setInfoSaving]   = useState(false)

  // Password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld]         = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [pwSaving, setPwSaving]       = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    try {
      const res = await getMe()
      setUser(res.data)
      setDisplayName(res.data.display_name || '')
      setCountry(res.data.country || '')
      setPhoneNumber(res.data.phone_number || '')
      setProfession(res.data.profession || '')
      setCurrency(res.data.default_currency || 'GHS')
      setReportFrequency(res.data.report_frequency || 'NONE')
      setTrackingFocus(res.data.tracking_focus || 'Everything + AI insights')
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
    setInfoSaving(true)
    try {
      const res = await updateMe({ 
        display_name: displayName, 
        country,
        phone_number: phoneNumber,
        profession,
        default_currency: currency, 
        report_frequency: reportFrequency, 
        tracking_focus: trackingFocus 
      })
      setUser(res.data) 
      setDisplayName(res.data.display_name || '')
      setCountry(res.data.country || '')
      setPhoneNumber(res.data.phone_number || '')
      setProfession(res.data.profession || '')
      setCurrency(res.data.default_currency || 'GHS')
      setReportFrequency(res.data.report_frequency)
      setTrackingFocus(res.data.tracking_focus)
      toast.success('Profile updated successfully')
      
      if (trackingFocus !== user?.tracking_focus) {
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setInfoSaving(false)
    }
  }

  async function handleUpdatePassword() {
    if (!user?.is_oauth_user && !oldPassword) {
        toast.error('Please enter your current password')
        return
    }
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all new password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    const checks = validatePassword(newPassword)
    if (!Object.values(checks).every(Boolean)) {
      toast.error('New password does not meet all requirements')
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
      toast.success('Password changed successfully')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
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
      toast.success('Account deleted successfully')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete account')
    }
  }

  const pwChecks = validatePassword(newPassword)
  const pwStrength = Object.values(pwChecks).filter(Boolean).length
  const strengthLabel = pwStrength <= 2 ? 'Weak' : pwStrength <= 4 ? 'Medium' : 'Strong'
  const strengthColor = pwStrength <= 2 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : pwStrength <= 4 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
  const strengthWidth = pwStrength <= 2 ? 'w-1/3' : pwStrength <= 4 ? 'w-2/3' : 'w-full'

  const inputClasses = "w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all shadow-sm dark:shadow-inner"
  const labelClasses = "block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-2 uppercase"
  const cardClasses = "bg-white dark:bg-white/[0.02] backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-5 md:p-8 mb-8 shadow-sm dark:shadow-2xl relative overflow-hidden hover:shadow-md dark:hover:shadow-[0_0_40px_rgba(34,211,238,0.05)] transition-shadow duration-500"

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 flex flex-col items-center justify-center relative selection:bg-cyan-500/30 transition-colors duration-200">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-cyan-500/30 border-t-emerald-600 dark:border-t-cyan-400 rounded-full animate-spin drop-shadow-none dark:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30 relative pb-12 overflow-x-hidden transition-colors duration-200">
      <Navbar />

      <div className="absolute top-20 right-1/4 w-64 h-64 md:w-[600px] md:h-[600px] bg-cyan-500/10 rounded-full blur-[80px] md:blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 md:w-[500px] md:h-[500px] bg-fuchsia-500/10 rounded-full blur-[80px] md:blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-10 relative z-10">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg mb-2">Profile Settings</h1>
          <div className="inline-flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-5 py-1.5 backdrop-blur-md">
            <span className="text-emerald-600 dark:text-cyan-400 text-sm font-bold tracking-wide">{user?.email}</span>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className={cardClasses}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:block hidden" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight flex items-center gap-3">
            <span className="text-emerald-600 dark:text-cyan-400 text-2xl">👤</span> Personal Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className={labelClasses}>Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-5 py-3.5 text-sm text-slate-500 cursor-not-allowed"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Ghana"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+233 24 000 0000"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Profession</label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Software Engineer"
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
                  <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={labelClasses}>Email Reports</label>
              <select
                value={reportFrequency}
                onChange={(e) => setReportFrequency(e.target.value)}
                className={`${inputClasses} appearance-none`}
              >
                <option value="NONE" className="bg-white dark:bg-slate-900">Off (Do not send reports)</option>
                <option value="WEEKLY" className="bg-white dark:bg-slate-900">Weekly (Every Sunday)</option>
                <option value="MONTHLY" className="bg-white dark:bg-slate-900">Monthly (1st of the month)</option>
              </select>
              <p className="text-xs text-slate-500 mt-2 font-medium">Receive automated spending summaries.</p>
            </div>
            
            <div>
              <label className={labelClasses}>Tracking Focus</label>
              <select
                value={trackingFocus}
                onChange={(e) => setTrackingFocus(e.target.value)}
                className={`${inputClasses} appearance-none`}
              >
                <option value="Income & Expenses only" className="bg-white dark:bg-slate-900">Income & Expenses only</option>
                <option value="Income, Expenses & Savings" className="bg-white dark:bg-slate-900">Income, Expenses & Savings</option>
                <option value="Everything + AI insights" className="bg-white dark:bg-slate-900">Everything + AI insights</option>
              </select>
              <p className="text-xs text-slate-500 mt-2 font-medium">Determines what sections (Savings, Budget) appear in your dashboard.</p>
            </div>
            
            <button
              type="button"
              onClick={handleUpdateInfo}
              disabled={infoSaving}
              className="w-full bg-emerald-600 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 hover:bg-emerald-700 dark:hover:from-cyan-500 dark:hover:to-blue-500 text-white py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest shadow-sm dark:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 mt-4"
            >
              {infoSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className={cardClasses}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:block hidden" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight flex items-center gap-3">
            <span className="text-emerald-600 dark:text-cyan-400 text-2xl">🔒</span> {user?.is_oauth_user ? 'Set Account Password' : 'Change Password'}
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
                    className="absolute right-4 top-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
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
                  className="absolute right-4 top-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
                >
                  {showNew ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              
              {newPassword && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/5">
                  <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${strengthColor} ${strengthWidth}`} />
                  </div>
                  <p className={`text-xs font-bold mt-3 tracking-widest uppercase ${
                    pwStrength <= 2 ? 'text-rose-600 dark:text-rose-400' :
                    pwStrength <= 4 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'
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
                className={`w-full bg-white dark:bg-black/20 border rounded-xl px-5 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-sm dark:shadow-inner ${
                  confirmPassword && confirmPassword !== newPassword 
                    ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500/50 bg-rose-50 dark:bg-rose-500/5' 
                    : 'border-slate-200 dark:border-white/10 focus:ring-cyan-500/50 focus:border-cyan-400'
                }`}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-bold tracking-wide">Passwords do not match</p>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={pwSaving}
              className="w-full bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 mt-4"
            >
              {pwSaving ? 'Updating...' : user?.is_oauth_user ? 'Set Password' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50 dark:bg-rose-500/5 backdrop-blur-xl border border-rose-200 dark:border-rose-500/20 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent dark:block hidden" />
          <h2 className="text-xl font-bold text-rose-600 dark:text-rose-500 mb-2 flex items-center gap-2 tracking-tight group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
            ⚠️ Danger Zone
          </h2>
          <p className="text-sm text-rose-600 dark:text-rose-400/80 mb-6 font-medium leading-relaxed">
            Once you delete your account, there is no going back. All your financial data, parsed expenses, and settings will be permanently wiped. Please be certain.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-rose-200 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all"
          >
            Delete Account Permanently
          </button>
        </div>

      </div>
    </div>
  )
}