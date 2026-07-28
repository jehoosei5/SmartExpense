import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories } from '../api/client'

const TYPES = ['Expenses', 'Income', 'Savings']
const PAYMENT_METHODS = ['Cash', 'MoMo', 'Card', 'Bank Transfer']

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  type: 'Expenses',
  category: '',
  amount: '',
  currency: 'GHS',
  details: '',
  payment_method: '',
  notes: '',
  source: 'form'
}

export default function Expenses() {
  const navigate = useNavigate()

  // Data
  const [expenses, setExpenses]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)

  // Filters
  const [filterType, setFilterType]       = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMonth, setFilterMonth]     = useState('')
  const [filterYear, setFilterYear]       = useState('')

  // Form
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving]       = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [exp, cat] = await Promise.all([
        getExpenses(),
        getCategories()
      ])
      setExpenses(exp.data.expenses || exp.data)
      setCategories(cat.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear()
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadExpenses() {
    const filters = {}
    if (filterType)     filters.type     = filterType
    if (filterCategory) filters.category = filterCategory
    if (filterMonth)    filters.month    = filterMonth
    if (filterYear)     filters.year     = filterYear
    const res = await getExpenses(filters)
    setExpenses(res.data.expenses || res.data)
  }

  async function handleSave() {
    setFormError('')
    if (!form.date || !form.type || !form.category || !form.amount) {
      setFormError('Date, type, category and amount are required')
      return
    }
    setSaving(true)
    
    // Clean up empty strings to null for optional enum fields
    const payload = {
      ...form,
      payment_method: form.payment_method || null,
      details: form.details || null,
      notes: form.notes || null
    }

    try {
      if (editingId) {
        await updateExpense(editingId, payload)
      } else {
        await createExpense(payload)
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      loadExpenses()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteExpense(id)
      setDeletingId(null)
      loadExpenses()
    } catch (err) {
      console.error(err)
    }
  }

  function handleEdit(expense) {
    setForm({
      date:           expense.date,
      type:           expense.type,
      category:       expense.category,
      amount:         expense.amount,
      currency:       expense.currency || 'GHS',
      details:        expense.details || '',
      payment_method: expense.payment_method || '',
      notes:          expense.notes || '',
      source:         expense.source || 'form'
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const filteredCategories = categories.filter(c => !form.type || c.type === form.type)
  const filterBarCategories = categories.filter(c => !filterType || c.type === filterType)

  const typeColors = {
    Expenses: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    Income:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    Savings:  'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
  }

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' },   { value: '4', label: 'April' },
    { value: '5', label: 'May' },     { value: '6', label: 'June' },
    { value: '7', label: 'July' },    { value: '8', label: 'August' },
    { value: '9', label: 'September'},{ value: '10', label: 'October' },
    { value: '11', label: 'November'},{ value: '12', label: 'December' }
  ]

  const inputClasses = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all"
  const labelClasses = "block text-xs font-semibold tracking-wider text-slate-400 mb-1.5 uppercase"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1c] to-indigo-950 text-slate-100 font-sans selection:bg-cyan-500/30 relative">
      <Navbar />

      <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">Transactions</h1>
            <p className="text-cyan-400 text-sm mt-2 font-semibold tracking-wide drop-shadow-md">
              {expenses.length} records found
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
            className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
          >
            + Add Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-8 grid grid-cols-2 md:grid-cols-5 gap-4 shadow-xl">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={inputClasses}>
            <option value="" className="bg-slate-900">All Types</option>
            {TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
          </select>

          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)} 
            className={inputClasses}
            disabled={filterBarCategories.length === 0}
          >
            <option value="" className="bg-slate-900">All Categories</option>
            {filterType ? (
              // If a type is selected, just show the categories normally
              filterBarCategories.map(c => (
                <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>
              ))
            ) : (
              // If no type is selected, group them by type
              TYPES.map(type => {
                const typeCategories = filterBarCategories.filter(c => c.type === type);
                if (typeCategories.length === 0) return null;
                return (
                  <optgroup key={type} label={type} className="bg-slate-800 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                    {typeCategories.map(c => (
                      <option key={c.id} value={c.name} className="bg-slate-900 text-white font-normal normal-case tracking-normal text-sm">{c.name}</option>
                    ))}
                  </optgroup>
                );
              })
            )}
          </select>

          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={inputClasses}>
            <option value="" className="bg-slate-900">All Months</option>
            {months.map(m => <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>)}
          </select>

          <input
            type="number"
            placeholder="Year e.g. 2026"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className={inputClasses}
          />

          <button
            type="button"
            onClick={loadExpenses}
            className="bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 rounded-xl px-4 py-2 text-sm font-bold shadow-[0_0_15px_rgba(217,70,239,0.2)] hover:bg-fuchsia-500/30 transition-all"
          >
            Apply Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex justify-center">
              <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium tracking-wide">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {['Date','Type','Category','Amount','Details','Payment','Source',''].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-300 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-white/[0.04] transition-colors duration-200">
                      <td className="px-5 py-4 text-slate-400 font-medium">{exp.date}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${typeColors[exp.type]}`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{exp.category}</td>
                      <td className="px-5 py-4 font-bold text-cyan-400 tracking-tight drop-shadow-md">
                        GH₵{Number(exp.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-slate-500">{exp.details || '—'}</td>
                      <td className="px-5 py-4 text-slate-500">{exp.payment_method || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-400">
                          {exp.source}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => handleEdit(exp)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(exp.id)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
              {editingId ? 'Edit Transaction' : 'Add Transaction'}
            </h2>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value, category: ''})}
                    className={inputClasses}
                  >
                    {TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className={inputClasses}
                  >
                    <option value="" className="bg-slate-900">Select category</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Amount (GHS)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="0.00"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Details</label>
                <input
                  type="text"
                  value={form.details}
                  onChange={e => setForm({...form, details: e.target.value})}
                  placeholder="e.g. Lunch at KFC"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm({...form, payment_method: e.target.value})}
                  className={inputClasses}
                >
                  <option value="" className="bg-slate-900">Select method</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClasses}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows={2}
                  className={inputClasses}
                />
              </div>

              {formError && <p className="text-rose-400 text-xs font-semibold">{formError}</p>}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-3 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50"
                >
                  {saving ? 'Processing...' : editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError('') }}
                  className="flex-1 bg-white/5 border border-white/10 text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl shadow-[0_0_40px_rgba(244,63,94,0.3)] p-8 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-white mb-2">Delete Transaction?</h2>
            <p className="text-slate-400 text-sm mb-8">This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 bg-rose-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-white/5 border border-white/10 text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}