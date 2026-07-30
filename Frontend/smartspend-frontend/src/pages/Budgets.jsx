import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getCategories, getBudgets, setBudgetBulk, getExpenses } from '../api/client'
import toast from 'react-hot-toast'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Budgets() {
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [expandedCat, setExpandedCat] = useState(null)
  
  // State for the currently edited category's 12 months
  const [editValues, setEditValues] = useState({})

  useEffect(() => {
    load()
  }, [year])

  const load = async () => {
    try {
      setLoading(true)
      const [catRes, budRes, expRes] = await Promise.all([
        getCategories(),
        getBudgets(year),
        getExpenses({ year })
      ])
      setCategories(catRes.data)
      setBudgets(budRes.data)
      setExpenses(expRes.data.expenses || expRes.data)
    } catch (error) {
      toast.error('Failed to load data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getBudgetAmount = (category, type, monthIndex) => {
    const b = budgets.find(b => b.category === category && b.type === type && b.month === monthIndex + 1)
    return b ? Number(b.amount) : 0
  }

  const getSpentAmount = (category, type, monthIndex) => {
    return expenses
      .filter(e => e.category === category && e.type === type && Number(e.date.split('-')[1]) === monthIndex + 1)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  const getYearlySpent = (category, type) => {
    return expenses
      .filter(e => e.category === category && e.type === type)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  const handleExpand = (c) => {
    if (expandedCat === c.id) {
      setExpandedCat(null)
      return
    }
    setExpandedCat(c.id)
    const initialVals = {}
    for (let i = 0; i < 12; i++) {
      initialVals[i + 1] = getBudgetAmount(c.name, c.type, i)
    }
    setEditValues(initialVals)
  }

  const handleCopyAll = () => {
    const val = editValues[1] || 0
    const newVals = {}
    for (let i = 1; i <= 12; i++) newVals[i] = val
    setEditValues(newVals)
  }

  const handleSave = async (c) => {
    try {
      await setBudgetBulk(c.name, c.type, year, editValues)
      toast.success('Budget saved!')
      setExpandedCat(null)
      load()
    } catch (error) {
      toast.error('Failed to save budget')
      console.error(error)
    }
  }

  const grouped = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = []
    acc[cat.type].push(cat)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-200 selection:bg-cyan-500/30 transition-colors duration-200">
      <Navbar />
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Monthly Budget Planning</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Set your specific targets for each month of the year.</p>
          </div>
          
          <div className="bg-white dark:bg-white/[0.02] p-2 rounded-xl border border-slate-200 dark:border-white/5 backdrop-blur-md flex items-center shadow-sm dark:shadow-lg">
            <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-xl font-bold text-slate-900 dark:text-white px-6 w-24 text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" /></div>
        ) : (
          <div className="flex flex-col gap-8">
            {['Income', 'Expenses', 'Savings'].map(type => (
              <div key={type} className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-2xl">
                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : type === 'Expenses' ? 'text-rose-600 dark:text-rose-400' : 'text-fuchsia-600 dark:text-fuchsia-400'}`}>
                  <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: 'currentColor' }} />
                  {type} Targets
                </h2>
                
                <div className="flex flex-col gap-4">
                  {(grouped[type] || []).map(c => {
                    const isExpanded = expandedCat === c.id
                    // Calc yearly total
                    let yearlyTotal = 0
                    for (let i = 0; i < 12; i++) yearlyTotal += getBudgetAmount(c.name, c.type, i)
                    
                    const yearlySpent = getYearlySpent(c.name, c.type)
                    const isYearlyOver = yearlyTotal > 0 && yearlySpent > yearlyTotal
                    const yearlyPercent = yearlyTotal > 0 ? Math.min((yearlySpent / yearlyTotal) * 100, 100) : 0
                    const yBarColor = isYearlyOver ? 'bg-rose-500' : yearlyPercent > 80 ? 'bg-yellow-500' : 'bg-emerald-500'

                    return (
                      <div key={c.id} className={`bg-slate-50 dark:bg-slate-900/50 rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-cyan-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}>
                        {/* Header Row */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.02]"
                          onClick={() => handleExpand(c)}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1">
                            <span className="font-medium text-slate-900 dark:text-slate-200 min-w-[120px]">{c.name}</span>
                            {yearlyTotal > 0 && (
                              <div className="flex items-center gap-3 flex-1 max-w-sm w-full">
                                <div className="h-1.5 flex-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div className={`h-full ${yBarColor}`} style={{ width: `${yearlyPercent}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${isYearlyOver ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {Math.round(yearlyPercent)}%
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-right flex flex-col hidden sm:block">
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Spent / Budget</span>
                              <span className={`text-sm font-bold ${isYearlyOver ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                GH₵{yearlySpent.toLocaleString()} <span className="text-slate-400 dark:text-slate-500 font-medium">/ {yearlyTotal.toLocaleString()}</span>
                              </span>
                            </div>
                            <svg className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-cyan-600 dark:text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7-7-7-7" /></svg>
                          </div>
                        </div>

                        {/* Expanded Panel */}
                        {isExpanded && (
                          <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950/50">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-sm text-slate-500 dark:text-slate-400">Set budget per month</p>
                              <button 
                                onClick={handleCopyAll}
                                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                Copy Jan to All
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                              {MONTHS.map((m, i) => {
                                const mSpent = getSpentAmount(c.name, c.type, i)
                                const budgetVal = Number(editValues[i + 1] || 0)
                                const isOver = budgetVal > 0 && mSpent > budgetVal
                                const percent = budgetVal > 0 ? Math.min((mSpent / budgetVal) * 100, 100) : 0
                                const barColor = isOver ? 'bg-rose-500' : percent > 80 ? 'bg-yellow-500' : 'bg-emerald-500'

                                return (
                                  <div key={m} className="flex flex-col">
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">{m}</label>
                                    <div className="relative group">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">GH₵</span>
                                      <input 
                                        type="number" 
                                        value={editValues[i + 1] === 0 ? '' : editValues[i + 1]}
                                        onChange={(e) => setEditValues({...editValues, [i + 1]: Number(e.target.value)})}
                                        className={`w-full bg-white dark:bg-slate-900 border rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-all ${isOver ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                        placeholder="0"
                                      />
                                    </div>
                                    <div className="mt-1.5 h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                      <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] font-bold px-1">
                                      <span className={isOver ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}>
                                        Spent: {mSpent.toLocaleString()}
                                      </span>
                                      <span className="text-slate-400">
                                        {budgetVal > 0 ? `${Math.round(percent)}%` : ''}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => setExpandedCat(null)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleSave(c)}
                                className="px-6 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
                              >
                                Save Budget
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {(grouped[type] || []).length === 0 && (
                    <p className="text-sm text-slate-500 italic px-2">No categories found for {type}.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
