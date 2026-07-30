import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { uploadCSV, getSyncLogs } from '../api/client'
import toast from 'react-hot-toast'

export default function Sync() {
  const navigate = useNavigate()
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result, setResult]     = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    try {
      const res = await getSyncLogs()
      setLogs(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear()
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file only')
      return
    }
    setResult(null)
    setUploading(true)
    try {
      const res = await uploadCSV(file)
      setResult(res.data)
      toast.success('Sync complete!')
      loadLogs()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFileInput(e) {
    handleUpload(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files[0])
  }

  const statusColors = {
    success: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
    partial: 'bg-yellow-50 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30',
    failed:  'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30 relative overflow-x-hidden transition-colors duration-200">
      <Navbar />

      <div className="absolute top-20 right-20 w-64 h-64 md:w-96 md:h-96 bg-cyan-500/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-64 h-64 md:w-96 md:h-96 bg-fuchsia-500/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10 relative z-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg">Excel Sync</h1>
          <p className="text-emerald-600 dark:text-cyan-400 text-sm mt-2 font-semibold tracking-wide drop-shadow-none dark:drop-shadow-md">
            Export your Budget Tracking sheet as CSV and upload it here
          </p>
        </div>

        {/* How to export instructions */}
        <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-xl">
          <h3 className="text-sm font-bold text-emerald-600 dark:text-cyan-400 mb-3 uppercase tracking-widest">How to export from Excel</h3>
          <ol className="text-sm text-slate-700 dark:text-slate-300 space-y-2 font-medium">
            <li className="flex items-center gap-2"><span className="text-emerald-500 dark:text-cyan-500">1.</span> Open your SmartSpend Excel template</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500 dark:text-cyan-500">2.</span> Click on the <strong className="text-slate-900 dark:text-white">Budget Tracking</strong> sheet tab</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500 dark:text-cyan-500">3.</span> Go to File → Save As → choose <strong className="text-slate-900 dark:text-white">CSV (Comma delimited)</strong></li>
            <li className="flex items-center gap-2"><span className="text-emerald-500 dark:text-cyan-500">4.</span> Upload the saved CSV file below</li>
          </ol>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-6 md:p-12 text-center mb-8 transition-all duration-300 backdrop-blur-sm ${
            dragOver
              ? 'border-emerald-400 dark:border-cyan-400 bg-emerald-50 dark:bg-cyan-500/10 shadow-sm dark:shadow-[0_0_30px_rgba(34,211,238,0.2)]'
              : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/[0.02] hover:border-emerald-400/50 dark:hover:border-cyan-400/50 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
          }`}
        >
          <div className="text-6xl mb-6 drop-shadow-none dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">📂</div>
          <p className="text-slate-900 dark:text-slate-200 font-bold text-lg mb-2 tracking-wide">
            Drag and drop your CSV file here
          </p>
          <p className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-widest">or</p>
          <label className="cursor-pointer inline-block bg-emerald-50 dark:bg-cyan-500/20 border border-emerald-200 dark:border-cyan-500/30 text-emerald-600 dark:text-cyan-400 px-8 py-3 rounded-xl text-sm font-bold shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-emerald-100 dark:hover:bg-cyan-500/30 hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all uppercase tracking-widest">
            Browse File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="text-slate-500 text-xs mt-4 font-semibold tracking-widest uppercase">.csv files only</p>
        </div>

        {/* Uploading indicator */}
        {uploading && (
          <div className="bg-emerald-50 dark:bg-cyan-500/10 border border-emerald-200 dark:border-cyan-500/30 rounded-2xl p-6 mb-8 text-center animate-pulse shadow-sm dark:shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <p className="text-emerald-600 dark:text-cyan-400 text-sm font-bold tracking-widest uppercase">Processing your CSV...</p>
          </div>
        )}

        {/* Upload Result */}
        {result && (
          <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 mb-8 shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-100 dark:border-white/10 pb-6">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${statusColors[result.status]}`}>
                {result.status}
              </span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">Sync Complete</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white drop-shadow-none dark:drop-shadow-md">{result.total_rows}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold uppercase tracking-widest">Total Rows</p>
              </div>
              <div className="text-center bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20">
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 drop-shadow-none dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{result.inserted_rows}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold uppercase tracking-widest">Inserted</p>
              </div>
              <div className="text-center bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-500/20">
                <p className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 drop-shadow-none dark:drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">{result.skipped_rows}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold uppercase tracking-widest">Skipped (dupes)</p>
              </div>
              <div className="text-center bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-rose-200 dark:border-rose-500/20">
                <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 drop-shadow-none dark:drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">{result.failed_rows}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold uppercase tracking-widest">Failed</p>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-8 bg-slate-50 dark:bg-black/30 border border-rose-200 dark:border-rose-500/20 rounded-xl p-5">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-3 uppercase tracking-widest">Errors Log:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent px-3 py-1.5 rounded">{e}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sync History */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight drop-shadow-none dark:drop-shadow-md">Sync History</h2>
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="w-8 h-8 border-4 border-slate-200 dark:border-cyan-500/30 border-t-emerald-600 dark:border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center text-slate-500 font-medium tracking-wide">
              No syncs yet — upload your first CSV above
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      {['Date', 'Status', 'Total', 'Inserted', 'Skipped', 'Failed'].map(h => (
                        <th key={h} className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors duration-200">
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-400 font-medium">
                          {new Date(log.synced_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${statusColors[log.status]}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-300 font-bold">{log.total_rows}</td>
                        <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{log.inserted_rows}</td>
                        <td className="px-6 py-4 text-yellow-600 dark:text-yellow-400 font-bold">{log.skipped_rows}</td>
                        <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-bold">{log.failed_rows}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}