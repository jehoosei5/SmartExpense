import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getDashboard, getMonthly, getCategories2 } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

// Vibrant cyberpunk/neon color palette for Pie Chart
const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#2dd4bf', '#fb7185']

function StatCard({ label, amount, color = 'blue', sub = '' }) {
  const styles = {
    blue:   'border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]',
    green:  'border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    red:    'border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
    purple: 'border-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.1)]',
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 bg-white/[0.03] backdrop-blur-xl border ${styles[color]} transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.06] hover:shadow-2xl group`}>
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

  // Date Filter State
  const [filterType, setFilterType] = useState('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [catType, setCatType] = useState('Expenses')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
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

        const [s, m, c] = await Promise.all([
          getDashboard(startDate, endDate),
          getMonthly(), // Historical context
          getCategories2(catType, startDate, endDate)
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
  }, [filterType, customStart, customEnd, catType, navigate])

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
          <StatCard label="Income"   amount={summary?.income}   color="green" />
          <StatCard label="Expenses" amount={summary?.expenses} color="red"   sub={`${summary?.transactions || 0} transactions`} />
          <StatCard label="Savings"  amount={summary?.savings}  color="purple"/>
          <StatCard
            label="Net Balance"
            amount={summary?.balance}
            color={summary?.balance >= 0 ? 'blue' : 'red'}
            sub={summary?.balance < 0 ? 'Negative balance' : 'Positive balance'}
          />
        </div>

        {/* Top Category */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl transition-all duration-300 hover:bg-white/[0.04]">
          <div className="flex items-center gap-5">
            <div className={`border rounded-xl p-3 shadow-lg ${catType === 'Income' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : catType === 'Expenses' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top {catType} category</p>
              {catData?.length > 0 ? (
                <p className="font-bold text-xl text-white mt-1 drop-shadow-md">
                  {catData[0].category} — <span className={catType === 'Income' ? 'text-emerald-400' : catType === 'Expenses' ? 'text-rose-400' : 'text-fuchsia-400'}>GH₵{Number(catData[0].total).toLocaleString()}</span>
                </p>
              ) : (
                <p className="font-bold text-lg text-slate-500 mt-1">No data</p>
              )}
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 w-full md:w-auto">
            {['Expenses', 'Income', 'Savings'].map(type => (
              <button
                key={type}
                onClick={() => setCatType(type)}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  catType === type 
                    ? 'bg-white/10 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Monthly Bar Chart */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
            <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Historical Monthly Overview
            </h3>
            {monthly.length === 0 ? (
              <p className="text-slate-500 text-sm">No data yet</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="month_name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} iconType="circle" />
                    <Bar dataKey="income"   name="Income"   fill="#10b981" radius={[4,4,0,0]} barSize={12} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} barSize={12} />
                    <Bar dataKey="savings"  name="Savings"  fill="#d946ef" radius={[4,4,0,0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Pie Chart */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent opacity-50" />
            <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
              {catType} by Category
            </h3>
            {catData.length === 0 ? (
              <p className="text-slate-500 text-sm">No {catType.toLowerCase()} data yet</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      stroke="none"
                      label={({ category, percentage }) => `${category} (${percentage}%)`}
                      labelLine={false}
                    >
                      {catData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} className="drop-shadow-md outline-none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}