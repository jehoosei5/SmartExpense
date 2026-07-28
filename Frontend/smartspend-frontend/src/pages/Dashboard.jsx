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

  useEffect(() => {
    async function load() {
      try {
        const [s, m, c] = await Promise.all([
          getDashboard(),
          getMonthly(),
          getCategories2('Expenses')
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
  }, [])

  if (loading) return (
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

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">AI-Powered Financial Overview</p>
        </div>

        {/* Current Month Stats */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent flex-1 opacity-30" />
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-[0.2em] drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
            This Month
          </h2>
          <div className="h-px bg-gradient-to-l from-cyan-500 to-transparent flex-1 opacity-30" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <StatCard label="Income"   amount={summary.current_month_income}   color="green" />
          <StatCard label="Expenses" amount={summary.current_month_expenses} color="red"   />
          <StatCard label="Savings"  amount={summary.current_month_savings}  color="purple"/>
          <StatCard
            label="Balance"
            amount={summary.current_month_balance}
            color={summary.current_month_balance >= 0 ? 'green' : 'red'}
            sub={summary.current_month_balance < 0 ? 'Overspent this month' : 'On track'}
          />
        </div>

        {/* All Time Stats */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-gradient-to-r from-indigo-500 to-transparent flex-1 opacity-30" />
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">
            All Time
          </h2>
          <div className="h-px bg-gradient-to-l from-indigo-500 to-transparent flex-1 opacity-30" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <StatCard label="Total Income"    amount={summary.total_income}    color="green"  sub={`${summary.total_transactions} transactions`} />
          <StatCard label="Total Expenses"  amount={summary.total_expenses}  color="red"    />
          <StatCard label="Total Savings"   amount={summary.total_savings}   color="purple" />
          <StatCard label="Net Balance"     amount={summary.total_balance}   color={summary.total_balance >= 0 ? 'blue' : 'red'} />
        </div>

        {/* Top Category */}
        {summary.top_category && (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-10 flex items-center gap-5 shadow-xl transition-all duration-300 hover:bg-white/[0.04]">
            <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-3 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top spending category this month</p>
              <p className="font-bold text-xl text-white mt-1 drop-shadow-md">
                {summary.top_category} — <span className="text-rose-400">GH₵{Number(summary.top_category_amount).toLocaleString()}</span>
              </p>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Monthly Bar Chart */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
            <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Monthly Overview
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
              Expenses by Category
            </h3>
            {catData.length === 0 ? (
              <p className="text-slate-500 text-sm">No expense data yet</p>
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