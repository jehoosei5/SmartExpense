import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getDashboard, getMonthly, getCategories2, getExpenses } from '../api/client'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

// Vibrant cyberpunk/neon color palette for Donut Charts
const COLORS_INC = ['#34d399', '#10b981', '#059669', '#047857', '#6ee7b7']
const COLORS_EXP = ['#fb7185', '#f43f5e', '#e11d48', '#be123c', '#fda4af']
const COLORS_SAV = ['#e879f9', '#d946ef', '#c026d3', '#a21caf', '#f0abfc']

function DonutChartCard({ title, data, colors, type }) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col">
      <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ backgroundColor: colors[0] }} />
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-slate-500 text-sm flex-1 flex items-center justify-center">No {type} data</p>
      ) : (
        <div className="h-[220px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="category"
                cx="35%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} className="drop-shadow-md outline-none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
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
      {/* Subtle top glare effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold mt-2 tracking-tight drop-shadow-md">
        GH₵{Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
      </p>
      {sub && <p className="text-xs mt-3 text-slate-500 font-medium">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
            {entry.name}: GH₵{Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary]   = useState(null)
  const [monthly, setMonthly]   = useState([])
  const [catData, setCatData]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [filterType, setFilterType] = useState('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('')
  const [modalTransactions, setModalTransactions] = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  // Helper to compute date bounds based on filter
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

        const [s, m, c] = await Promise.all([
          getDashboard(startDate, endDate),
          getMonthly(), // Historical context
          getCategories2(null, startDate, endDate)
        ])
        setSummary(s.data)
        setMonthly(m.data)
        setCatData(c.data)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1c] to-indigo-950 text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-10 relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-20 left-10 w-64 h-64 md:w-96 md:h-96 bg-cyan-500/10 rounded-full blur-[80px] md:blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-fuchsia-500/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />

        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">AI-Powered Financial Overview</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/[0.02] p-3 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Time Range</label>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none min-w-[160px]"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="all_time">All Time</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            {filterType === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                   <label className="text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Start</label>
                   <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                </div>
                <div className="flex flex-col">
                   <label className="text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase tracking-wider">End</label>
                   <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12 relative">
           {loading && <div className="absolute inset-0 z-10 bg-slate-950/50 backdrop-blur-sm rounded-2xl flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" /></div>}
          <StatCard label="Income"   amount={summary?.income}   color="green" onClick={() => handleCardClick('Income')} />
          <StatCard label="Expenses" amount={summary?.expenses} color="red"   sub={`${summary?.transactions || 0} transactions`} onClick={() => handleCardClick('Expenses')} />
          <StatCard label="Savings"  amount={summary?.savings}  color="purple" onClick={() => handleCardClick('Savings')} />
          <StatCard
            label="Net Balance"
            amount={summary?.balance}
            color={summary?.balance >= 0 ? 'blue' : 'red'}
            sub={summary?.balance < 0 ? 'Negative balance' : 'Positive balance'}
            onClick={() => handleCardClick('Net Balance')}
          />
        </div>

        {/* 3 Donut Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DonutChartCard 
            title="Income Categories" 
            type="income" 
            data={catData.filter(d => d.type === 'Income')} 
            colors={COLORS_INC} 
          />
          <DonutChartCard 
            title="Expenses Categories" 
            type="expenses" 
            data={catData.filter(d => d.type === 'Expenses')} 
            colors={COLORS_EXP} 
          />
          <DonutChartCard 
            title="Savings Categories" 
            type="savings" 
            data={catData.filter(d => d.type === 'Savings')} 
            colors={COLORS_SAV} 
          />
        </div>

        {/* Monthly Trend Chart Row */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
          <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            Tracked (Income vs Expenses vs Savings)
          </h3>
          {monthly.length === 0 ? (
            <p className="text-slate-500 text-sm">No data yet</p>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="month_name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} iconType="circle" />
                  <Bar dataKey="income"   name="Income"   fill="#10b981" radius={[4,4,0,0]} barSize={12} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} barSize={12} />
                  <Bar dataKey="savings"  name="Savings"  fill="#d946ef" radius={[4,4,0,0]} barSize={12} />
                  <Line type="monotone" dataKey="income_budget" name="Income Budget" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="expenses_budget" name="Expenses Budget" stroke="#fb7185" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="savings_budget" name="Savings Budget" stroke="#e879f9" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />
          <h3 className="font-bold text-lg text-white mb-6">Detailed Category Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm">
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold text-right">Tracked (GH₵)</th>
                  <th className="pb-3 font-semibold text-right">Budgeted (GH₵)</th>
                  <th className="pb-3 font-semibold text-right">% Compl.</th>
                  <th className="pb-3 font-semibold text-right">Remaining (GH₵)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {catData.map((c, i) => {
                  const percent = c.budgeted > 0 ? ((c.total / c.budgeted) * 100).toFixed(1) : 0
                  const isIncome = c.type === 'Income'
                  // For income, positive remaining means we beat the target. For expenses/savings, positive remaining means we have budget left.
                  const remaining = isIncome ? (c.total - c.budgeted) : (c.budgeted - c.total)
                  
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                      <td className="py-3 text-white font-medium">{c.category}</td>
                      <td className={`py-3 font-medium ${c.type === 'Income' ? 'text-emerald-400' : c.type === 'Expenses' ? 'text-rose-400' : 'text-fuchsia-400'}`}>{c.type}</td>
                      <td className="py-3 text-right text-white font-semibold">{Number(c.total).toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-300">{Number(c.budgeted).toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-300">
                        {c.budgeted > 0 ? (
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${percent > 100 ? (isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400') : 'bg-white/10'}`}>
                            {percent}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className={`py-3 text-right font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.budgeted > 0 ? remaining.toLocaleString() : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transactions Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${modalType === 'Income' ? 'bg-emerald-400' : modalType === 'Expenses' ? 'bg-rose-400' : modalType === 'Savings' ? 'bg-fuchsia-400' : 'bg-blue-400'}`} />
                {modalType} Transactions
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
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
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                      <div>
                        <p className="font-semibold text-white">{tx.category || tx.type}</p>
                        <p className="text-xs text-slate-400 mt-1">{tx.date} {tx.details && `• ${tx.details}`}</p>
                      </div>
                      <p className={`font-bold ${tx.type === 'Income' ? 'text-emerald-400' : tx.type === 'Expenses' ? 'text-rose-400' : 'text-fuchsia-400'}`}>
                        {tx.type === 'Expenses' ? '-' : '+'}GH₵{Number(tx.amount).toLocaleString()}
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