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
    <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-lg dark:shadow-2xl relative overflow-hidden flex flex-col flex-1 min-h-[180px]">
      <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full shadow-md dark:shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ backgroundColor: colors[0] }} />
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-xs flex-1 flex items-center justify-center">No {type} data</p>
      ) : (
        <div className="flex items-center justify-between flex-1 gap-2">
          <div className="w-[120px] h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-1.5 overflow-hidden">
            {data.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="text-slate-600 dark:text-slate-300 truncate" title={item.category}>{item.category}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-medium shrink-0">{Number(item.total).toLocaleString()}</span>
              </div>
            ))}
            {data.length > 4 && (
              <div className="text-xs text-slate-400 dark:text-slate-500 italic ml-3.5">+ {data.length - 4} more</div>
            )}
            <div className="flex items-center justify-between text-xs font-bold mt-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <span className="text-slate-500 dark:text-slate-400">Total</span>
              <span className="text-slate-900 dark:text-white">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, amount, color = 'blue', sub = '', onClick }) {
  const styles = {
    blue:   'border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]',
    green:  'border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    red:    'border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
    purple: 'border-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.1)]',
  }
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-6 bg-white/[0.03] backdrop-blur-xl border ${styles[color]} transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.06] hover:shadow-2xl group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl lg:text-3xl font-bold mt-2 tracking-tight drop-shadow-md">
        {formatCurrency(Number(amount || 0), sub)}
      </p>
      {sub && <p className="text-xs mt-3 text-slate-500 font-medium">{sub}</p>}
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
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden transition-colors duration-200">
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
          
          <div className="flex flex-wrap items-center gap-4 xl:gap-8 shrink-0">
             <div className="text-center bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-xl">
               <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">Total Income</p>
               <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(Number(summary?.income || 0), userProfile?.default_currency)}</p>
             </div>
             <div className="text-center bg-rose-500/10 border border-rose-500/20 px-6 py-2 rounded-xl">
               <p className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-widest font-bold">Total Expenses</p>
               <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(Number(summary?.expenses || 0), userProfile?.default_currency)}</p>
             </div>
             <div className="text-center bg-blue-500/10 border border-blue-500/20 px-6 py-2 rounded-xl">
               <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest font-bold">Period Balance</p>
               <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(Number(summary?.balance || 0), userProfile?.default_currency)}</p>
             </div>
          </div>
        </div>

        {/* Proactive AI Insight Banner */}
        <div 
          onClick={() => setInsightExpanded(!insightExpanded)}
          className="mb-6 relative overflow-hidden bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-lg backdrop-blur-xl group cursor-pointer transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-500/30"
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="flex items-start md:items-center gap-4 relative z-10 w-full">
            <div className="shrink-0 p-3 bg-indigo-500/20 rounded-full border border-indigo-500/30 animate-pulse mt-1 md:mt-0">
              <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  SmartSpend AI Insight
                  {insightLoading && <span className="flex gap-1"><span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '0ms'}}></span><span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '150ms'}}></span><span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '300ms'}}></span></span>}
                </h4>
                
                {!insightLoading && insights.length > 1 && (
                  <div className="flex items-center gap-2 text-indigo-400 ml-4 shrink-0" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setCurrentInsightIndex(prev => prev === 0 ? insights.length - 1 : prev - 1)
                        setInsightExpanded(false)
                      }}
                      className="p-1 hover:bg-indigo-500/20 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-xs font-semibold">{currentInsightIndex + 1}/{insights.length}</span>
                    <button 
                      onClick={() => {
                        setCurrentInsightIndex(prev => prev === insights.length - 1 ? 0 : prev + 1)
                        setInsightExpanded(false)
                      }}
                      className="p-1 hover:bg-indigo-500/20 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-700 dark:text-slate-200 text-sm md:text-base font-bold leading-relaxed pr-2">
                {insightLoading ? "Analyzing your latest financial data..." : insights[currentInsightIndex]?.title}
              </p>
              {insightExpanded && !insightLoading && (
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed border-t border-indigo-500/20 pt-2 animate-in fade-in slide-in-from-top-1">
                  {insights[currentInsightIndex]?.details}
                </p>
              )}
            </div>
          </div>
        </div>

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
                <BreakdownGroup 
                  type="Savings" 
                  items={savingsCats} 
                  headerBgClass="bg-fuchsia-500 text-white" 
                  rowColorClass="text-fuchsia-400"
                  excessColorClass="text-fuchsia-400"
                  excessBgClass="bg-fuchsia-500/20"
                />
              </div>
            </div>
          </div>

          {/* Middle Column: Donut Charts */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-[700px]">
            <DonutChartCard title="Income Tracked" type="income" data={incomeCats} colors={COLORS_INC} />
            <DonutChartCard title="Expenses Tracked" type="expenses" data={expensesCats} colors={COLORS_EXP} />
            <DonutChartCard title="Savings Tracked" type="savings" data={savingsCats} colors={COLORS_SAV} />
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
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-300">
                  <input type="checkbox" checked={showSavings} onChange={e => setShowSavings(e.target.checked)} className="accent-fuchsia-500" /> Savings
                </label>
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