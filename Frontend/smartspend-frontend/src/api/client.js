import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Create axios instance with base URL
const api = axios.create({
  baseURL: BASE_URL,
})

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (email, password, display_name) =>
  api.post('/auth/register', { email, password, display_name })

export const logout = (refresh_token) =>
  api.post('/auth/logout', { refresh_token })

export const googleLogin = (credential) =>
  api.post('/auth/google', { credential })

// ── Expenses ──────────────────────────────────────────────────────────────
export const getExpenses = (filters = {}) =>
  api.get('/expenses', { params: filters })

export const exportExpenses = (filters = {}) =>
  api.get('/expenses/export', { params: filters, responseType: 'blob' })

export const createExpense = (data) =>
  api.post('/expenses', data)

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data)

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`)

export const getSuggestions = () =>
  api.get('/expenses/suggestions')

export const snoozeSuggestion = (payload) =>
  api.post('/expenses/suggestions/snooze', payload)

// ── Categories ────────────────────────────────────────────────────────────
export const getCategories = (type = null) =>
  api.get('/categories', { params: type ? { type } : {} })

export const createCategory = (name, type) =>
  api.post('/categories', { name, type })

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`)

export const reorderCategories = (categories) =>
  api.put('/categories/reorder', { categories })

// ── Sync ──────────────────────────────────────────────────────────────────
export const uploadCSV = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/sync/upload', formData)
}

export const getSyncLogs = () =>
  api.get('/sync/logs')

// ── AI ────────────────────────────────────────────────────────────────────
export const sendChatMessage = (message, session_id = null) =>
  api.post('/ai/chat', { message, session_id })

export const confirmChatMessage = (parsed, session_id = null) =>
  api.post('/ai/chat/confirm', parsed, { params: { session_id } })

export const getProactiveInsight = (start_date = null, end_date = null) =>
  api.get('/ai/proactive-insight', { params: { start_date, end_date } })

// ── Charts ────────────────────────────────────────────────────────────────
export const getDashboard = (start_date = null, end_date = null) =>
  api.get('/charts/dashboard', { params: { start_date, end_date } })

export const getMonthly = (year = null, start_date = null, end_date = null) =>
  api.get('/charts/monthly', { params: { year, start_date, end_date } })

export const getCategories2 = (type = null, start_date = null, end_date = null) =>
  api.get('/charts/categories', { params: { type, start_date, end_date } })

export const getTrend = (months = 6) =>
  api.get('/charts/trend', { params: { months } })

// ── Profile ───────────────────────────────────────────────────────────────
export const getMe = () =>
  api.get('/auth/me')

// ── Alerts ────────────────────────────────────────────────────────────────
export const getAlerts = () =>
  api.get('/api/alerts')

export const markAlertRead = (id) =>
  api.put(`/api/alerts/${id}/read`)

export const updateMe = (data) =>
  api.put('/auth/me', data)

export const deleteAccount = () => 
    api.delete('/auth/me');

// ── Budgets ───────────────────────────────────────────────────────────────
export const getBudgets = (year = null) =>
  api.get('/budgets', { params: year ? { year } : {} })

export const setBudget = (category, type, year, month, amount) =>
  api.post('/budgets', { category, type, year, month, amount })

export const setBudgetBulk = (category, type, year, months) =>
  api.post('/budgets/bulk', { category, type, year, months })