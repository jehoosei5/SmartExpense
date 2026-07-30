import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories, createCategory, deleteCategory, reorderCategories } from '../api/client'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'

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
  const [filterMonth, setFilterMonth]       = useState('')
  const [filterYear, setFilterYear]         = useState('')
  const [filterSearch, setFilterSearch]     = useState('')

  // Form
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving]       = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null)

  // Manage Categories Modal
  const [showCatModal, setShowCatModal]       = useState(false)
  const [newCatName, setNewCatName]           = useState('')
  const [newCatType, setNewCatType]           = useState('Expenses')
  const [catError, setCatError]               = useState('')
  const [catSaving, setCatSaving]             = useState(false)

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

  async function loadCategories() {
    try {
      const res = await getCategories()
      setCategories(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadExpenses() {
    const filters = {}
    if (filterType)     filters.type     = filterType
    if (filterCategory) filters.category = filterCategory
    if (filterMonth)    filters.month    = filterMonth
    if (filterYear)     filters.year     = filterYear
    if (filterSearch)   filters.search   = filterSearch
    const res = await getExpenses(filters)
    setExpenses(res.data.expenses || res.data)
  }

  async function handleSave() {
    if (!form.date || !form.type || !form.category || !form.amount) {
      toast.error('Date, type, category and amount are required')
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
        toast.success('Transaction updated!')
      } else {
        await createExpense(payload)
        toast.success('Transaction added!')
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      loadExpenses()
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 
                       (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 'Failed to save');
      toast.error(errorMsg);
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteExpense(id)
      setDeletingId(null)
      toast.success('Transaction deleted!')
      loadExpenses()
    } catch (err) {
      toast.error('Failed to delete transaction')
      console.error(err)
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) {
      toast.error('Category name is required')
      return
    }
    setCatSaving(true)
    try {
      await createCategory(newCatName, newCatType)
      setNewCatName('')
      toast.success('Category added!')
      loadCategories()
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 
                       (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 'Failed to add category');
      toast.error(errorMsg);
    } finally {
      setCatSaving(false)
    }
  }

  async function handleDeleteCategory(id) {
    try {
      await deleteCategory(id)
      toast.success('Category deleted!')
      loadCategories()
    } catch (err) {
      toast.error('Failed to delete category')
      console.error(err)
    }
  }

  function handleDragEnd(result) {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    const type = result.source.droppableId

    if (sourceIndex === destinationIndex && result.source.droppableId === result.destination.droppableId) return
    if (result.source.droppableId !== result.destination.droppableId) return // Disable dragging across different types for now

    // Reorder local state
    const typeCats = categories.filter(c => c.type === type).sort((a,b) => a.position - b.position)
    const otherCats = categories.filter(c => c.type !== type)
    
    const [reorderedItem] = typeCats.splice(sourceIndex, 1)
    typeCats.splice(destinationIndex, 0, reorderedItem)

    // Update positions
    const updatedTypeCats = typeCats.map((c, index) => ({ ...c, position: index }))
    
    setCategories([...otherCats, ...updatedTypeCats])

    // Save to backend
    const payload = updatedTypeCats.map(c => ({ id: c.id, position: c.position }))
    reorderCategories(payload)
      .then(() => toast.success('Category order saved'))
      .catch(err => {
        toast.error('Failed to save category order')
        console.error(err)
      })
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
    Expenses: 'bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
    Income:   'bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
    Savings:  'bg-fuchsia-100 text-fuchsia-600 border border-fuchsia-200 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 dark:border-fuchsia-500/30'
  }

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' },   { value: '4', label: 'April' },
    { value: '5', label: 'May' },     { value: '6', label: 'June' },
    { value: '7', label: 'July' },    { value: '8', label: 'August' },
    { value: '9', label: 'September'},{ value: '10', label: 'October' },
    { value: '11', label: 'November'},{ value: '12', label: 'December' }
  ]

  const inputClasses = "w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all shadow-sm dark:shadow-none"
  const labelClasses = "block text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 uppercase"

  // Summary Stats Calculations
  const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const sortedExpenses = [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date))
  const lastRecordDate = sortedExpenses.length > 0 ? new Date(sortedExpenses[0].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
  
  let totalTrackingBalance = 0
  expenses.forEach(e => {
    if (e.type === 'Income') totalTrackingBalance += Number(e.amount)
    else totalTrackingBalance -= Number(e.amount)
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30 relative overflow-x-hidden transition-colors duration-200">
      <Navbar />

      <div className="absolute top-20 left-10 w-64 h-64 md:w-96 md:h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[80px] md:blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-10 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg">Transactions</h1>
            <p className="text-emerald-600 dark:text-cyan-400 text-sm mt-1 md:mt-2 font-semibold tracking-wide drop-shadow-sm dark:drop-shadow-md">
              {expenses.length} records found
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowCatModal(true)}
              className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm dark:shadow-md hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
            >
              ⚙️ Manage Categories
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
              className="bg-emerald-600 dark:bg-cyan-500/20 border border-emerald-600 dark:border-cyan-500/30 text-white dark:text-cyan-400 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-emerald-700 dark:hover:bg-cyan-500/30 transition-all"
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Date of Today</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{todayFormatted}</p>
          </div>
          <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Date of Last Record</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{lastRecordDate}</p>
          </div>
          <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">No. of Records</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-cyan-400">{expenses.length}</p>
          </div>
          <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Tracking Balance</p>
            <p className={`text-xl md:text-2xl font-bold ${totalTrackingBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              GH₵{totalTrackingBalance.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 md:p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 shadow-md dark:shadow-xl">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={inputClasses}>
            <option value="" className="bg-white dark:bg-slate-900">All Types</option>
            {TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
          </select>

          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)} 
            className={inputClasses}
            disabled={filterBarCategories.length === 0}
          >
            <option value="" className="bg-white dark:bg-slate-900">All Categories</option>
            {filterType ? (
              // If a type is selected, just show the categories normally
              filterBarCategories.map(c => (
                <option key={c.id} value={c.name} className="bg-white dark:bg-slate-900">{c.name}</option>
              ))
            ) : (
              // If no type is selected, group them by type
              TYPES.map(type => {
                const typeCategories = filterBarCategories.filter(c => c.type === type);
                if (typeCategories.length === 0) return null;
                return (
                  <optgroup key={type} label={type} className="bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-cyan-400 font-bold uppercase tracking-wider text-xs">
                    {typeCategories.map(c => (
                      <option key={c.id} value={c.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal normal-case tracking-normal text-sm">{c.name}</option>
                    ))}
                  </optgroup>
                );
              })
            )}
          </select>

          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={inputClasses}>
            <option value="" className="bg-white dark:bg-slate-900">All Months</option>
            {months.map(m => <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900">{m.label}</option>)}
          </select>

          <input
            type="number"
            placeholder="Year e.g. 2026"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadExpenses()}
            className={inputClasses}
          />

          <input
            type="text"
            placeholder="Search keywords..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadExpenses()}
            className={inputClasses}
          />

          <button
            type="button"
            onClick={loadExpenses}
            className="bg-slate-900 dark:bg-fuchsia-500/20 border border-slate-900 dark:border-fuchsia-500/30 text-white dark:text-fuchsia-400 rounded-xl px-4 py-2 text-sm font-bold shadow-md dark:shadow-[0_0_15px_rgba(217,70,239,0.2)] hover:bg-slate-800 dark:hover:bg-fuchsia-500/30 transition-all"
          >
            Apply Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-md dark:shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex justify-center">
              <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium tracking-wide">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    {['Date','Type','Category','Amount','Details','Payment','Source',''].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors duration-200">
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">{exp.date}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${typeColors[exp.type]}`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{exp.category}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-cyan-400 tracking-tight drop-shadow-sm dark:drop-shadow-md">
                        GH₵{Number(exp.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-slate-500">{exp.details || '—'}</td>
                      <td className="px-5 py-4 text-slate-500">{exp.payment_method || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                          {exp.source}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => handleEdit(exp)}
                            className="text-emerald-600 dark:text-cyan-400 hover:text-emerald-700 dark:hover:text-cyan-300 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(exp.id)}
                            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors"
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
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] p-5 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              {editingId ? 'Edit Transaction' : 'Add Transaction'}
            </h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className={inputClasses}
                  >
                    <option value="" className="bg-white dark:bg-slate-900">Select category</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.name} className="bg-white dark:bg-slate-900">{c.name}</option>
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
                  <option value="" className="bg-white dark:bg-slate-900">Select method</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-900">{m}</option>)}
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
                  className="flex-1 bg-emerald-600 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 text-white py-3 rounded-xl text-sm font-bold shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:bg-emerald-700 dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50"
                >
                  {saving ? 'Processing...' : editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
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
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-3xl shadow-xl dark:shadow-[0_0_40px_rgba(244,63,94,0.3)] p-6 md:p-8 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Transaction?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">This action cannot be undone.</p>
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
                className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] p-4 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Manage Categories</h2>
              <button onClick={() => setShowCatModal(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Add Category Form */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 mb-6 shrink-0">
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-500 dark:text-slate-300 mb-3">Add Custom Category</h3>
              <div className="flex flex-col md:flex-row gap-4 md:items-end">
                <div className="flex-1">
                  <label className={labelClasses}>Type</label>
                  <select value={newCatType} onChange={e => setNewCatType(e.target.value)} className={inputClasses}>
                    {TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className={labelClasses}>Category Name</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="e.g. Netflix Subscription"
                    className={inputClasses}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={catSaving}
                  className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 h-11 px-6 rounded-xl text-sm font-bold hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                  {catSaving ? '...' : '+ Add'}
                </button>
              </div>
              {catError && <p className="text-rose-400 text-xs font-semibold mt-2">{catError}</p>}
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <DragDropContext onDragEnd={handleDragEnd}>
                {TYPES.map(type => {
                  const cats = categories.filter(c => c.type === type).sort((a, b) => a.position - b.position)
                  if (cats.length === 0) return null
                  return (
                    <div key={type}>
                      <h3 className={`text-sm font-bold tracking-wider uppercase mb-3 ${typeColors[type].split(' ')[1]}`}>{type}</h3>
                      <Droppable droppableId={type}>
                        {(provided) => (
                          <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className="flex flex-col gap-2"
                          >
                            {cats.map((c, index) => (
                              <Draggable key={c.id.toString()} draggableId={c.id.toString()} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 flex justify-between items-center group shadow-sm dark:shadow-none"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white cursor-grab active:cursor-grabbing">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                                      </div>
                                      <div>
                                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{c.name}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(c.id)}
                                      className="text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete category"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )
                })}
              </DragDropContext>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}