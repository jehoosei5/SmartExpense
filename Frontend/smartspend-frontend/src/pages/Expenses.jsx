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
    try {
      if (editingId) {
        await updateExpense(editingId, form)
      } else {
        await createExpense(form)
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

  // Filter categories by selected type
  const filteredCategories = categories.filter(c =>
    !form.type || c.type === form.type
  )

  const typeColors = {
    Expenses: 'bg-red-100 text-red-700',
    Income:   'bg-green-100 text-green-700',
    Savings:  'bg-purple-100 text-purple-700'
  }

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' },   { value: '4', label: 'April' },
    { value: '5', label: 'May' },     { value: '6', label: 'June' },
    { value: '7', label: 'July' },    { value: '8', label: 'August' },
    { value: '9', label: 'September'},{ value: '10', label: 'October' },
    { value: '11', label: 'November'},{ value: '12', label: 'December' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Expenses</h1>
            <p className="text-gray-500 text-sm mt-1">{expenses.length} transactions</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-all"
          >
            + Add Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Months</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          <input
            type="number"
            placeholder="Year e.g. 2026"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            onClick={loadExpenses}
            className="bg-blue-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-800 transition-all"
          >
            Apply Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No transactions found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-gray-200">
                <tr>
                  {['Date','Type','Category','Amount','Details','Payment','Source',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-blue-900 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-4 py-3 text-gray-600">{exp.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[exp.type]}`}>
                        {exp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{exp.category}</td>
                    <td className="px-4 py-3 font-semibold text-blue-900">
                      GH₵{Number(exp.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{exp.details || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{exp.payment_method || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        {exp.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(exp)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(exp.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold text-blue-900 mb-4">
              {editingId ? 'Edit Transaction' : 'Add Transaction'}
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value, category: ''})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (GHS)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Details</label>
                <input
                  type="text"
                  value={form.details}
                  onChange={e => setForm({...form, details: e.target.value})}
                  placeholder="e.g. Lunch at KFC"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm({...form, payment_method: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formError && <p className="text-red-500 text-xs">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError('') }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Transaction?</h2>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
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