import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeOnboarding } from '../api/client'
import toast from 'react-hot-toast'
import { useTheme } from '../contexts/ThemeContext'
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
  ChartBarIcon,
  BanknotesIcon,
  CreditCardIcon,
  WalletIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'

const TRACKING_FOCUS_OPTIONS = [
  { id: 'basic', label: 'Income & Expenses only', description: 'Just the essentials. Simple and straightforward.' },
  { id: 'advanced', label: 'Income, Expenses & Savings', description: 'Track your full financial picture including goals.' },
  { id: 'pro', label: 'Everything + AI insights', description: 'Get proactive AI coaching to optimize your spending.', icon: SparklesIcon }
]

const INCOME_SOURCES = [
  'Employment/Salary',
  'Business/Self-employed',
  'Student allowance',
  'Freelance/Side hustle',
  'Mixed'
]

const INCOME_RANGES = [
  'Below GH₵500',
  'GH₵500 – GH₵1,500',
  'GH₵1,500 – GH₵5,000',
  'Above GH₵5,000',
  'Prefer not to say'
]

const PAYMENT_METHODS = [
  { id: 'Cash', icon: BanknotesIcon },
  { id: 'MoMo', icon: DevicePhoneMobileIcon },
  { id: 'Card', icon: CreditCardIcon },
  { id: 'Bank Transfer', icon: WalletIcon }
]

const CATEGORIES = [
  'Food', 'Transportation', 'Utilities', 'Clothing',
  'Entertainment', 'Education', 'Health', 'Savings',
  'Side Hustle', 'Family/Parents'
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tracking_focus: '',
    main_income_source: '',
    monthly_income_range: '',
    payment_methods: [],
    top_categories: []
  })

  const togglePaymentMethod = (method) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }))
  }

  const toggleCategory = (cat) => {
    setFormData(prev => {
      const isSelected = prev.top_categories.includes(cat)
      if (isSelected) {
        return { ...prev, top_categories: prev.top_categories.filter(c => c !== cat) }
      } else {
        if (prev.top_categories.length >= 5) {
          toast.error('You can select up to 5 categories')
          return prev
        }
        return { ...prev, top_categories: [...prev.top_categories, cat] }
      }
    })
  }

  const handleNext = () => {
    if (step === 1 && !formData.tracking_focus) {
      toast.error('Please select a tracking focus')
      return
    }
    if (step === 2) {
      if (!formData.main_income_source || !formData.monthly_income_range || formData.payment_methods.length === 0) {
        toast.error('Please complete all questions to proceed')
        return
      }
    }
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await completeOnboarding(formData)
      toast.success('Profile created successfully! Welcome aboard.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative z-10 flex flex-col min-h-[600px]">
        
        {/* Header / Progress */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">SmartSpend</h1>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Step {step} of 3</div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                step >= i ? 'bg-gradient-to-r from-blue-500 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-200 dark:bg-white/10'
              }`} />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 flex flex-col justify-center">
          
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">What do you want to track?</h2>
                <p className="text-slate-500 dark:text-slate-400">This helps us tailor your dashboard experience.</p>
              </div>
              <div className="space-y-3">
                {TRACKING_FOCUS_OPTIONS.map(opt => {
                  const Icon = opt.icon || ChartBarIcon
                  const isSelected = formData.tracking_focus === opt.label
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, tracking_focus: opt.label })}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg'
                          : 'border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-300'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-lg ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                          {opt.label}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{opt.description}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <CheckCircleIcon className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your financial profile</h2>
                <p className="text-slate-500 dark:text-slate-400">This helps the AI give you hyper-personalized coaching.</p>
              </div>

              {/* Income Source */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Main source of income</label>
                <div className="grid grid-cols-2 gap-2">
                  {INCOME_SOURCES.map(source => (
                    <button
                      key={source}
                      onClick={() => setFormData({ ...formData, main_income_source: source })}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.main_income_source === source
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-md'
                          : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                      } ${source === 'Mixed' ? 'col-span-2' : ''}`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              {/* Income Range */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Monthly income range <span className="opacity-50">(optional)</span></label>
                <select
                  value={formData.monthly_income_range}
                  onChange={(e) => setFormData({ ...formData, monthly_income_range: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="" disabled>Select a range</option>
                  {INCOME_RANGES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">How do you mostly pay?</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(method => {
                    const isSelected = formData.payment_methods.includes(method.id)
                    const Icon = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => togglePaymentMethod(method.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shadow-md'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-purple-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{method.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Top spending categories</h2>
                <p className="text-slate-500 dark:text-slate-400">Select up to 5 categories to prioritize them on your dashboard.</p>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Select up to 5</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                  formData.top_categories.length === 5 
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' 
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                }`}>
                  {formData.top_categories.length}/5 Selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => {
                  const isSelected = formData.top_categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`p-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-md transform scale-[1.02]'
                          : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-orange-300 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected && (
                        <CheckCircleIcon className="w-5 h-5" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold transition-colors px-4 py-2 rounded-xl"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
            >
              Continue
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || formData.top_categories.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Finish Setup'}
              <SparklesIcon className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
