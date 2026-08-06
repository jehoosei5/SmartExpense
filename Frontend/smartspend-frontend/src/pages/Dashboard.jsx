import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useTheme } from '../contexts/ThemeContext'
import { getDashboard, getMonthly, getCategories2, getExpenses, getMe, getProactiveInsight } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

// Vibrant cyberpunk/neon color palette for Donut Charts
const COLORS_INC = ['#34d399', '#10b981', '#059669', '#047857', '#6ee7b7']
const COLORS_EXP = ['#fb7185', '#f43f5e', '#e11d48', '#be123c', '#fda4af']
const COLORS_SAV = ['#e879f9', '#d946ef', '#c026d3', '#a21caf', '#f0abfc']

const formatCurrency = (amount, currency = 'GHS') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function DonutChartCard({ title, data, colors, type }) {
  const total = data.reduce((sum, item) => sum + Number(item.total), 0)

  return (
    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-lg dark:shadow-2xl relative overflow-hidden flex flex-col flex-1 min-h-[180px] group transition-all hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
      <h3 className="font-extrabold text-xs text-slate-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest relative z-10">
        <span className="w-2.5 h-2.5 rounded-full shadow-md dark:shadow-[0_0_8px_rgba(255,255,255,0.8)] ring-2 ring-white/50 dark:ring-black/50" style={{ backgroundColor: colors[0] }} />
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-xs flex-1 flex items-center justify-center font-medium">No {type} data</p>
      ) : (
        <div className="flex items-center justify-between flex-1 gap-4 relative z-10">
          <div className="w-[110px] h-[110px] drop-shadow-md">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={52}
                  paddingAngle={4}
                  stroke="none"
                  cornerRadius={4}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-2 overflow-hidden">
            {data.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs group/item hover:bg-slate-50 dark:hover:bg-white/5 p-1 -mx-1 rounded-lg transition-colors">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors" title={item.category}>{item.category}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold shrink-0">{Number(item.total).toLocaleString()}</span>
              </div>
            ))}
            {data.length > 4 && (
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mt-1">+ {data.length - 4} more</div>
            )}
            <div className="flex items-center justify-between text-xs font-black mt-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-slate-900 dark:text-white text-sm">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, amount, color = 'blue', sub = '', currency = 'GHS', onClick, icon }) {
  const styles = {
    blue:   'from-blue-500/5 to-cyan-500/5 border-blue-500/20 hover:border-blue-500/40 shadow-blue-500/5',
    green:  'from-emerald-500/5 to-teal-500/5 border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-500/5',
    red:    'from-rose-500/5 to-orange-500/5 border-rose-500/20 hover:border-rose-500/40 shadow-rose-500/5',
    purple: 'from-fuchsia-500/5 to-purple-500/5 border-fuchsia-500/20 hover:border-fuchsia-500/40 shadow-fuchsia-500/5',
  }
  const textColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-rose-600 dark:text-rose-400',
    purple: 'text-fuchsia-600 dark:text-fuchsia-400',
  }
  const iconBgs = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    purple: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  }

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900/50 bg-gradient-to-br ${styles[color]} border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-lg group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
        {icon && (
          <div className={`p-2 rounded-xl ${iconBgs[color]} shadow-sm`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl lg:text-3xl font-extrabold tracking-tight drop-shadow-sm ${textColors[color]} relative z-10`}>
        {formatCurrency(Number(amount || 0), currency)}
      </p>
      {sub && <p className="text-xs mt-3 text-slate-500 dark:text-slate-500 font-medium relative z-10 flex items-center gap-1">{sub}</p>}
    </div>
  )
}

function BreakdownGroup({ type, items, headerColorClass, headerBgClass, rowColorClass, excessColorClass, excessBgClass }) {
  if (items.length === 0) return null

  const totals = items.reduce((acc, c) => {
    acc.tracked += c.total
    acc.budgeted += c.budgeted
    return acc
  }, { tracked: 0, budgeted: 0 })

  const totalPercent = totals.budgeted > 0 ? ((totals.tracked / totals.budgeted) * 100).toFixed(0) : 0
  const isIncome = type === 'Income'
  
  let totalRemaining = 0
  let totalExcess = 0

  return (
    <div className="mb-6">
      <div className={`px-3 py-1.5 font-bold text-sm uppercase tracking-widest rounded-t-lg ${headerBgClass}`}>
        {type}
      </div>
      <div 
        className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-b-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
              <th className="py-2 px-3 font-semibold w-1/3">Category</th>
              <th className="py-2 px-3 font-semibold text-right">Tracked</th>
              <th className="py-2 px-3 font-semibold text-right">Budgeted</th>
              <th className="py-2 px-3 font-semibold text-right">% Compl.</th>
              <th className="py-2 px-3 font-semibold text-right">Remaining</th>
              <th className="py-2 px-3 font-semibold text-right">Excess</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {items.map((c, i) => {
              const percent = c.budgeted > 0 ? ((c.total / c.budgeted) * 100).toFixed(0) : 0
              
              let remaining = '-'
              let excess = '-'
              
              const rem = Math.max(0, c.budgeted - c.total)
              const exc = Math.max(0, c.total - c.budgeted)
              
              if (rem > 0) {
                remaining = rem
                totalRemaining += rem
              }
              if (exc > 0) {
                excess = exc
                totalExcess += exc
              }

              const isGoodExcess = type === 'Income' || type === 'Savings'
              const pctClass = percent > 100 
                ? (isGoodExcess ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400') 
                : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'

              return (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                  <td className="py-2 px-3 text-slate-800 dark:text-white font-medium">{c.category}</td>
                  <td className="py-2 px-3 text-right text-slate-900 dark:text-white">{Number(c.total).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-300">{c.budgeted > 0 ? Number(c.budgeted).toLocaleString() : '-'}</td>
                  <td className="py-2 px-3 text-right">
                    {c.budgeted > 0 ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pctClass}`}>
                        {percent}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-300">{remaining.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-bold ${excess !== '-' ? excessColorClass : 'text-slate-400 dark:text-slate-500'}`}>
                    {excess !== '-' ? (
                      <span className={`px-1.5 py-0.5 rounded ${excessBgClass}`}>{excess.toLocaleString()}</span>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 dark:border-white/10 font-bold bg-slate-50 dark:bg-white/5">
              <td className="py-2 px-3 text-slate-900 dark:text-white">Total</td>
              <td className={`py-2 px-3 text-right ${rowColorClass}`}>{totals.tracked.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-slate-900 dark:text-white">{totals.budgeted > 0 ? totals.budgeted.toLocaleString() : '-'}</td>
              <td className="py-2 px-3 text-right text-slate-900 dark:text-white">{totals.budgeted > 0 ? `${totalPercent}%` : '-'}</td>
              <td className="py-2 px-3 text-right text-slate-900 dark:text-white">{totalRemaining > 0 ? totalRemaining.toLocaleString() : '-'}</td>
              <td className="py-2 px-3 text-right text-slate-900 dark:text-white">{totalExcess > 0 ? totalExcess.toLocaleString() : '-'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-xl dark:shadow-2xl">
        <p className="text-slate-900 dark:text-white font-bold mb-2 pb-2 border-b border-slate-200 dark:border-white/10">{label}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-slate-600 dark:text-slate-300 w-16">{entry.name}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(Number(entry.value), payload[0]?.payload?.currency || 'GHS')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [summary, setSummary]   = useState(null)
  const [monthly, setMonthly]   = useState([])
  const [catData, setCatData]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [insights, setInsights] = useState([])
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
  const [insightExpanded, setInsightExpanded] = useState(false)
  const [insightLoading, setInsightLoading] = useState(true)

  const [filterType, setFilterType] = useState('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [userProfile, setUserProfile] = useState(null)

  // Chart Toggles
  const [showIncome, setShowIncome] = useState(true)
  const [showExpenses, setShowExpenses] = useState(true)
  const [showSavings, setShowSavings] = useState(true)
  const [showBudget, setShowBudget] = useState(true)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('')
  const [modalTransactions, setModalTransactions] = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  const computeDateRange = () => {
    let startDate = null;
    let endDate = null;
    const now = new Date();

    if (filterType === 'today') {
      startDate = now.toISOString().split('T')[0];
      endDate = startDate;
    } else if (filterType === 'this_week') {
      const first = now.getDate() - now.getDay();
      const firstDay = new Date(now.setDate(first));
      const lastDay = new Date(now.setDate(first + 6));
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
    } else if (filterType === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
    } else if (filterType === 'last_6_months') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
    } else if (filterType === 'custom') {
      startDate = customStart || null;
      endDate = customEnd || null;
    }
    return { startDate, endDate };
  }

  const handleCardClick = async (type) => {
    setModalType(type)
    setModalOpen(true)
    setModalLoading(true)
    setModalTransactions([])

    try {
      const typeFilter = type === 'Net Balance' ? null : type
      const { startDate, endDate } = computeDateRange();

      const filters = {}
      if (typeFilter) filters.type = typeFilter
      if (startDate) filters.start_date = startDate
      if (endDate) filters.end_date = endDate

      const res = await getExpenses(filters)
      setModalTransactions(res.data.expenses)
    } catch (error) {
      console.error(error)
    } finally {
      setModalLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        const { startDate, endDate } = computeDateRange();

        // 1. Fetch fast dashboard data and render charts immediately
        const [s, m, c, u] = await Promise.all([
          getDashboard(startDate, endDate),
          getMonthly(null, startDate, endDate),
          getCategories2(null, startDate, endDate),
          getMe()
        ])
        setSummary(s.data)
        setMonthly(m.data)
        setCatData(c.data)
        setUserProfile(u.data)

        if (u.data.is_onboarded === false) {
          navigate('/onboarding')
          return
        }

        setLoading(false)

        // 2. Fetch AI Insights asynchronously in the background so it doesn't block the UI
        setInsightLoading(true)
        getProactiveInsight(startDate, endDate)
          .then(i => {
            const fetchedInsights = i.data.insights || [{title: "Keep tracking", details: "Log more expenses to get personalized insights!"}];
            setInsights(fetchedInsights)
            setCurrentInsightIndex(Math.floor(Math.random() * fetchedInsights.length))
          })
          .catch(() => {
            setInsights([{title: "Keep tracking", details: 'Keep tracking your expenses and budgets to build better financial habits!'}])
          })
          .finally(() => {
            setInsightLoading(false)
          })

      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear()
          navigate('/login')
        } else {
          setError('Failed to load dashboard data')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filterType, customStart, customEnd, navigate])

  if (loading && !summary) return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-xl backdrop-blur-md shadow-lg">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    </div>
  )

  const incomeCats = catData.filter(d => d.type === 'Income')
  const expensesCats = catData.filter(d => d.type === 'Expenses')
  const savingsCats = catData.filter(d => d.type === 'Savings')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30 transition-colors duration-200">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 py-6 md:px-6 md:py-8 relative">
        <div className="absolute top-20 left-10 w-64 h-64 md:w-96 md:h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[80px] md:blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />

        {/* Top Header Row (Excel Style) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg shrink-0">Budget Dashboard</h1>
            
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shrink-0">
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="bg-transparent border-none text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-0 cursor-pointer font-medium pl-2 pr-6 py-1 appearance-none"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="all_time">All Time</option>
                <option value="custom">Custom...</option>
              </select>
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400 -ml-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>

            {filterType === 'custom' && (
              <div className="flex items-center gap-2 shrink-0">
                 <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none" />
                 <span className="text-slate-500">to</span>
                 <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none" />
              </div>
            )}
          </div>
        </div>

        {/* 4 Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard 
            label="Total Income" 
            amount={summary?.income} 
            color="green" 
            sub={`Total for ${filterType.replace('_', ' ')}`}
            currency={userProfile?.default_currency}
            onClick={() => handleCardClick('Income')} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
          />
          <StatCard 
            label="Total Expenses" 
            amount={summary?.expenses} 
            color="red" 
            sub={`Total for ${filterType.replace('_', ' ')}`}
            currency={userProfile?.default_currency}
            onClick={() => handleCardClick('Expenses')} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
          />
          <StatCard 
            label="Total Savings" 
            amount={summary?.savings} 
            color="purple" 
            sub="Dedicated savings"
            currency={userProfile?.default_currency}
            onClick={() => handleCardClick('Savings')} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>}
          />
          <StatCard 
            label="Net Cash Flow" 
            amount={summary?.balance} 
            color="blue" 
            sub="Surplus / Deficit"
            currency={userProfile?.default_currency}
            onClick={() => handleCardClick('Net Balance')} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
          />
        </div>

        {/* Spending Trends Analysis */}
        <div className="mb-8 bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
          
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest relative z-10">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            Spending Trends Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center md:text-left flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Avg per Transaction</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency((summary?.expenses || 0) / (expensesCats.reduce((acc, c) => acc + c.count, 0) || 1), userProfile?.default_currency)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{expensesCats.reduce((acc, c) => acc + c.count, 0)} expense transactions</p>
            </div>
            
            <div className="text-center md:text-left flex flex-col justify-center md:border-l md:border-slate-200 dark:md:border-white/10 md:pl-8">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Top Category</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                {summary?.top_category || 'N/A'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {summary?.top_category_amount ? formatCurrency(summary.top_category_amount, userProfile?.default_currency) : '0'} spent
              </p>
            </div>

            <div className="text-center md:text-left flex flex-col justify-center md:border-l md:border-slate-200 dark:md:border-white/10 md:pl-8">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Savings Rate</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary?.income > 0 ? (((summary.income - summary.expenses) / summary.income) * 100).toFixed(1) : 0}%
              </p>
              <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, summary?.income > 0 ? (((summary.income - summary.expenses) / summary.income) * 100) : 0))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Proactive AI Insight Banner */}
        {userProfile?.tracking_focus === 'Everything + AI insights' && (
          <div 
            onClick={() => setInsightExpanded(!insightExpanded)}
            className="mb-8 relative overflow-hidden bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 border border-indigo-500/20 dark:border-indigo-400/30 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl backdrop-blur-2xl group cursor-pointer transition-all duration-500 hover:shadow-indigo-500/20 hover:border-indigo-400/50 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-fuchsia-500/30 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />
            
            <div className="flex items-start md:items-center gap-5 relative z-10 w-full">
              <div className="shrink-0 p-4 bg-white dark:bg-indigo-900/50 rounded-2xl border border-indigo-100 dark:border-indigo-400/30 shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500 mt-1 md:mt-0">
                <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    SmartSpend AI Insight
                    {insightLoading && <span className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '0ms'}}></span><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '150ms'}}></span><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '300ms'}}></span></span>}
                  </h4>
                  
                  {!insightLoading && insights.length > 1 && (
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 ml-4 shrink-0 bg-white/50 dark:bg-black/20 rounded-full px-2 py-1 backdrop-blur-md border border-indigo-200 dark:border-indigo-500/30" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          setCurrentInsightIndex(prev => prev === 0 ? insights.length - 1 : prev - 1)
                          setInsightExpanded(false)
                        }}
                        className="p-1 hover:bg-indigo-500/20 rounded-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-xs font-bold">{currentInsightIndex + 1} / {insights.length}</span>
                      <button 
                        onClick={() => {
                          setCurrentInsightIndex(prev => prev === insights.length - 1 ? 0 : prev + 1)
                          setInsightExpanded(false)
                        }}
                        className="p-1 hover:bg-indigo-500/20 rounded-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-900 dark:text-white text-sm md:text-lg font-bold leading-relaxed pr-2 drop-shadow-sm">
                  {insightLoading ? "Analyzing your latest financial data..." : insights[currentInsightIndex]?.title}
                </p>
                {insightExpanded && !insightLoading && (
                  <div className="mt-4 pt-4 border-t border-indigo-500/20 dark:border-indigo-400/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-slate-700 dark:text-indigo-100/90 text-sm md:text-base leading-relaxed font-medium">
                      {insights[currentInsightIndex]?.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* Left Column: Breakdown Table */}
          <div className="lg:col-span-5 bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-lg dark:shadow-2xl overflow-hidden flex flex-col h-[700px]">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Category Breakdown</h3>
            <div 
              className="overflow-y-auto flex-1 pr-2" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
              <div className="hide-scroll overflow-x-auto">
                <BreakdownGroup 
                type="Income" 
                items={incomeCats} 
                headerBgClass="bg-emerald-500 text-slate-900" 
                rowColorClass="text-emerald-400"
                excessColorClass="text-emerald-400"
                excessBgClass="bg-emerald-500/20"
              />
              <BreakdownGroup 
                type="Expenses" 
                items={expensesCats} 
                headerBgClass="bg-rose-500 text-white" 
                rowColorClass="text-rose-400"
                excessColorClass="text-rose-400"
                excessBgClass="bg-rose-500/20"
              />
              {userProfile?.tracking_focus !== 'Income & Expenses only' && (
                <BreakdownGroup 
                  type="Savings" 
                  items={savingsCats} 
                  headerBgClass="bg-fuchsia-500 text-white" 
                  rowColorClass="text-fuchsia-400"
                  excessColorClass="text-fuchsia-400"
                  excessBgClass="bg-fuchsia-500/20"
                />
              )}
              </div>
            </div>
          </div>

          {/* Middle Column: Donut Charts */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-[700px]">
            <DonutChartCard title="Income Tracked" type="income" data={incomeCats} colors={COLORS_INC} />
            <DonutChartCard title="Expenses Tracked" type="expenses" data={expensesCats} colors={COLORS_EXP} />
            {userProfile?.tracking_focus !== 'Income & Expenses only' && (
              <DonutChartCard title="Savings Tracked" type="savings" data={savingsCats} colors={COLORS_SAV} />
            )}
          </div>

          {/* Right Column: Bar Chart */}
          <div className="lg:col-span-4 bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-lg dark:shadow-2xl flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white uppercase tracking-wider">Tracked vs Budgeted</h3>
              
              {/* Checkboxes like Excel */}
              <div className="flex flex-wrap gap-3 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300">
                  <input type="checkbox" checked={showIncome} onChange={e => setShowIncome(e.target.checked)} className="accent-emerald-500" /> Income
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300">
                  <input type="checkbox" checked={showExpenses} onChange={e => setShowExpenses(e.target.checked)} className="accent-rose-500" /> Expenses
                </label>
                {userProfile?.tracking_focus !== 'Income & Expenses only' && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-300">
                    <input type="checkbox" checked={showSavings} onChange={e => setShowSavings(e.target.checked)} className="accent-fuchsia-500" /> Savings
                  </label>
                )}
                <div className="w-px h-4 bg-slate-300 dark:bg-white/20 mx-1" />
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  <input type="checkbox" checked={showBudget} onChange={e => setShowBudget(e.target.checked)} className="accent-slate-500" /> Budget
                </label>
              </div>
            </div>

            {monthly.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No chart data</div>
            ) : (
              <div className="flex-1 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 20, right: 0, left: -20, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#ffffff08' : '#00000008'} vertical={false} />
                    <XAxis dataKey="month_name" xAxisId="tracked" stroke={theme === 'dark' ? '#64748b' : '#cbd5e1'} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dy={15} />
                    <XAxis dataKey="month_name" xAxisId="budget" hide />
                    
                    <YAxis stroke={theme === 'dark' ? '#64748b' : '#cbd5e1'} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip content={<CustomChartTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                    <Legend verticalAlign="bottom" wrapperStyle={{ position: 'relative', marginTop: '20px', fontSize: '12px' }} iconType="circle" />
                    
                    {/* Budgeted Bars (Wider, fainter background bars) */}
                    {showBudget && showIncome && <Bar xAxisId="budget" dataKey="income_budget" name="Inc. Budget" fill="#10b981" fillOpacity={0.15} radius={[4,4,0,0]} barSize={14} />}
                    {showBudget && showExpenses && <Bar xAxisId="budget" dataKey="expenses_budget" name="Exp. Budget" fill="#f43f5e" fillOpacity={0.15} radius={[4,4,0,0]} barSize={14} />}
                    {showBudget && showSavings && <Bar xAxisId="budget" dataKey="savings_budget" name="Sav. Budget" fill="#d946ef" fillOpacity={0.15} radius={[4,4,0,0]} barSize={14} />}

                    {/* Tracked Bars (Thinner, solid foreground bars) */}
                    {showIncome && <Bar xAxisId="tracked" dataKey="income" name="Income" fill="#10b981" radius={[2,2,0,0]} barSize={6} />}
                    {showExpenses && <Bar xAxisId="tracked" dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[2,2,0,0]} barSize={6} />}
                    {showSavings && <Bar xAxisId="tracked" dataKey="savings" name="Savings" fill="#d946ef" radius={[2,2,0,0]} barSize={6} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Transactions Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${modalType === 'Income' ? 'bg-emerald-500' : modalType === 'Expenses' ? 'bg-rose-500' : modalType === 'Savings' ? 'bg-fuchsia-500' : 'bg-blue-500'}`} />
                {modalType} Transactions
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {modalLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : modalTransactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No transactions found for this period.
                </div>
              ) : (
                <div className="space-y-3">
                  {modalTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{tx.category || tx.type}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tx.date} {tx.details && `• ${tx.details}`}</p>
                      </div>
                      <p className={`font-bold ${tx.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : tx.type === 'Expenses' ? 'text-rose-600 dark:text-rose-400' : 'text-fuchsia-600 dark:text-fuchsia-400'}`}>
                        {tx.type === 'Expenses' ? '-' : '+'}{formatCurrency(Number(tx.amount), tx.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}