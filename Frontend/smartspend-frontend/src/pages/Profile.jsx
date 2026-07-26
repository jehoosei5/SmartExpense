import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
// Added deleteAccount to imports
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
  const strengthColor = pwStrength <= 2 ? 'bg-red-400' : pwStrength <= 4 ? 'bg-yellow-400' : 'bg-green-500'
  const strengthWidth = pwStrength <= 2 ? 'w-1/3' : pwStrength <= 4 ? 'w-2/3' : 'w-full'

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Profile Settings</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {infoMsg && (
              <p className={`text-sm ${infoMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>
                {infoMsg}
              </p>
            )}
            <button
              type="button"
              onClick={handleUpdateInfo}
              disabled={infoSaving}
              className="w-full bg-blue-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              {infoSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            {user?.is_oauth_user ? 'Set Account Password' : 'Change Password'}
          </h2>
          <div className="space-y-4">
            {!user?.is_oauth_user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {showOld ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strengthColor} ${strengthWidth}`} />
                  </div>
                  <p className={`text-xs font-medium mt-1 ${
                    pwStrength <= 2 ? 'text-red-500' :
                    pwStrength <= 4 ? 'text-yellow-500' : 'text-green-600'
                  }`}>{strengthLabel} password</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  confirmPassword && confirmPassword !== newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>
                {pwMsg}
              </p>
            )}
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={pwSaving}
              className="w-full bg-blue-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              {pwSaving ? 'Updating...' : user?.is_oauth_user ? 'Set Password' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-1">Danger Zone</h2>
          <p className="text-sm text-red-600 mb-4 opacity-80">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-white border border-red-200 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
          >
            Delete Account Permanently
          </button>
        </div>

      </div>
    </div>
  )
}