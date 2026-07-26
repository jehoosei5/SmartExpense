import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getDashboard, getMonthly, getCategories2 } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const COLORS = ['#1e3a5f', '#2e75b6', '#4a9fd4', '#7dbfe8', '#b0d8f0', '#d4eaf8']

function StatCard({ label, amount, color = 'blue', sub = '' }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-900',
    green:  'bg-green-50 border-green-200 text-green-900',
    red:    'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">GH₵{Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400 text-lg">Loading dashboard...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Your financial overview</p>
        </div>

        {/* Current Month Stats */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          This Month
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          All Time
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Income"    amount={summary.total_income}    color="green"  sub={`${summary.total_transactions} transactions`} />
          <StatCard label="Total Expenses"  amount={summary.total_expenses}  color="red"    />
          <StatCard label="Total Savings"   amount={summary.total_savings}   color="purple" />
          <StatCard label="Net Balance"     amount={summary.total_balance}   color={summary.total_balance >= 0 ? 'blue' : 'red'} />
        </div>

        {/* Top Category */}
        {summary.top_category && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Top spending category this month</p>
              <p className="font-bold text-blue-900">{summary.top_category} — GH₵{Number(summary.top_category_amount).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Monthly Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-4">Monthly Overview</h3>
            {monthly.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `GH₵${val.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="income"   name="Income"   fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="savings"  name="Savings"  fill="#a855f7" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-4">Expenses by Category</h3>
            {catData.length === 0 ? (
              <p className="text-gray-400 text-sm">No expense data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                    labelLine={false}
                  >
                    {catData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `GH₵${val.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}