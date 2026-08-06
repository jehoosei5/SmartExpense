import { useState, useRef } from 'react'
import { exportExpenses, getDashboard, getMonthly, getCategories2, getExpenses } from '../api/client'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const COLORS_INC = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
const COLORS_EXP = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3']

export default function ExportModal({ onClose, userProfile }) {
  const [format, setFormat] = useState('csv')
  const [period, setPeriod] = useState('this_month')
  const [loading, setLoading] = useState(false)
  const reportRef = useRef(null)

  const [reportData, setReportData] = useState(null)

  const handleExport = async () => {
    setLoading(true)
    try {
      const filters = {}
      const now = new Date()
      if (period === 'this_month') {
        filters.month = now.getMonth() + 1
        filters.year = now.getFullYear()
      } else if (period === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        filters.month = lastMonth.getMonth() + 1
        filters.year = lastMonth.getFullYear()
      } else if (period === 'this_year') {
        filters.year = now.getFullYear()
      }

      if (format === 'csv') {
        const res = await exportExpenses(filters)
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `smartspend_export_${period}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        toast.success("CSV Downloaded successfully!")
        onClose()
      } else {
        // PDF Export with Charts
        toast.loading("Generating PDF Report...", { id: 'pdf-toast' })
        
        // Fetch data for the charts
        const [dashRes, monthRes, catRes, expRes] = await Promise.all([
          getDashboard(filters.start_date, filters.end_date),
          getMonthly(filters.year),
          getCategories2(null, filters.start_date, filters.end_date),
          getExpenses(filters)
        ])

        const allExpenses = expRes.data.expenses || expRes.data || []
        const incomes = allExpenses.filter(e => e.type === 'Income')
        const expensesList = allExpenses.filter(e => e.type === 'Expenses')

        setReportData({
          summary: dashRes.data,
          monthly: monthRes.data,
          categories: catRes.data,
          periodTitle: period.replace('_', ' ').toUpperCase(),
          incomes,
          expensesList,
          totalTransactions: allExpenses.length
        })

        // Wait for React to render the hidden report
        setTimeout(async () => {
          if (reportRef.current) {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`smartspend_report_${period}.pdf`)
            toast.success("PDF Downloaded successfully!", { id: 'pdf-toast' })
            onClose()
          }
        }, 1000) // Give recharts time to animate/render
      }
    } catch (err) {
      console.error(err)
      toast.error("Export failed", { id: 'pdf-toast' })
    } finally {
      if (format === 'csv') setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />
        
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </div>
            Export Data
          </h2>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setFormat('csv')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${format === 'csv' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-400/50'}`}
              >
                <svg className={`w-8 h-8 mb-2 ${format === 'csv' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className={`font-bold ${format === 'csv' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500'}`}>CSV Spreadsheet</span>
              </button>
              <button 
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${format === 'pdf' ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'border-slate-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-400/50'}`}
              >
                <svg className={`w-8 h-8 mb-2 ${format === 'pdf' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <span className={`font-bold ${format === 'pdf' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500'}`}>PDF with Charts</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3">Time Period</label>
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
          <button 
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg dark:shadow-white/10"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            )}
            {loading ? 'Exporting...' : 'Export Now'}
          </button>
        </div>
      </div>

      {/* Hidden Report Template for PDF Generation */}
      {reportData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={reportRef} className="bg-white text-slate-900 w-[1000px] p-12 font-serif">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-slate-200">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg border-2 border-slate-300 bg-white"></span>
                SmartSpend AI
              </h1>
              <div className="text-right font-bold text-sm text-slate-800">
                Print: {new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Summary Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-amber-500 mb-4">Summary</h2>
              <div className="text-sm font-bold text-slate-900 mb-6 flex gap-6">
                <span>From: {reportData.periodTitle === 'THIS MONTH' ? 'Start of Month' : 'All Time'}</span>
                <span>To: {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
              </div>

              <div className="space-y-2 text-base font-bold">
                <div className="flex gap-4">
                  <span className="w-48 text-slate-800">Total Transactions:</span>
                  <span className="text-slate-900">{reportData.totalTransactions}</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-48 text-slate-800">Total Income:</span>
                  <span className="text-emerald-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.default_currency || 'GHS' }).format(reportData.summary.income)}</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-48 text-slate-800">Total Expenses:</span>
                  <span className="text-rose-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.default_currency || 'GHS' }).format(reportData.summary.expenses)}</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-48 text-slate-800">Net Amount:</span>
                  <span className="text-emerald-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.default_currency || 'GHS' }).format(reportData.summary.balance)}</span>
                </div>
              </div>
            </div>

            {/* Income Transactions */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Income Transactions</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-3 py-2 font-bold">Date</th>
                    <th className="px-3 py-2 font-bold">Category</th>
                    <th className="px-3 py-2 font-bold">Description</th>
                    <th className="px-3 py-2 font-bold">Vendor</th>
                    <th className="px-3 py-2 font-bold">Original Amount</th>
                    <th className="px-3 py-2 font-bold">Converted Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.incomes.map((tx, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="px-3 py-2 text-slate-600">{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.category || ''}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.details || ''}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.source || 'Manual'}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.currency} {tx.amount}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.currency} {tx.amount}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="4"></td>
                    <td className="px-3 py-2 font-bold text-slate-900 text-right">Total Income:</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.default_currency || 'GHS' }).format(reportData.summary.income)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expense Transactions */}
            <div className="mb-12">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Expense Transactions</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-3 py-2 font-bold">Date</th>
                    <th className="px-3 py-2 font-bold">Category</th>
                    <th className="px-3 py-2 font-bold">Description</th>
                    <th className="px-3 py-2 font-bold">Vendor</th>
                    <th className="px-3 py-2 font-bold">Original Amount</th>
                    <th className="px-3 py-2 font-bold">Converted Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.expensesList.map((tx, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="px-3 py-2 text-slate-600">{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.category || ''}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.details || ''}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.source || 'Manual'}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.currency} {tx.amount}</td>
                      <td className="px-3 py-2 text-slate-600">{tx.currency} {tx.amount}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="4"></td>
                    <td className="px-3 py-2 font-bold text-slate-900 text-right">Total Expenses:</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.default_currency || 'GHS' }).format(reportData.summary.expenses)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Category Breakdown */}
            <div className="mb-16">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Category Breakdown:</h3>
              <div className="space-y-3">
                {reportData.categories.map((cat, idx) => (
                  <div key={idx} className="flex gap-4 text-base font-bold">
                    <span className="w-48 text-slate-800">{cat.category}:</span>
                    <span className={cat.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.default_currency || 'GHS' }).format(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center text-slate-400 text-sm font-medium">
              Report generated by SmartSpend AI
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
