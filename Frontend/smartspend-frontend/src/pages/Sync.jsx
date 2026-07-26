import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { uploadCSV, getSyncLogs } from '../api/client'

export default function Sync() {
  const navigate = useNavigate()
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
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
      setError('Please upload a CSV file only')
      return
    }
    setError('')
    setResult(null)
    setUploading(true)
    try {
      const res = await uploadCSV(file)
      setResult(res.data)
      loadLogs()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
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
    success: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    failed:  'bg-red-100 text-red-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Excel Sync</h1>
          <p className="text-gray-500 text-sm mt-1">
            Export your Budget Tracking sheet as CSV and upload it here
          </p>
        </div>

        {/* How to export instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How to export from Excel</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Open your SmartSpend Excel template</li>
            <li>2. Click on the <strong>Budget Tracking</strong> sheet tab</li>
            <li>3. Go to File → Save As → choose <strong>CSV (Comma delimited)</strong></li>
            <li>4. Upload the saved CSV file below</li>
          </ol>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center mb-6 transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-400'
          }`}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-600 font-medium mb-1">
            Drag and drop your CSV file here
          </p>
          <p className="text-gray-400 text-sm mb-4">or</p>
          <label className="cursor-pointer bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-all">
            Browse File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="text-gray-400 text-xs mt-3">.csv files only</p>
        </div>

        {/* Uploading indicator */}
        {uploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-blue-900 text-sm font-medium">Processing your CSV...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Upload Result */}
        {result && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusColors[result.status]}`}>
                {result.status}
              </span>
              <h3 className="font-semibold text-gray-800">Sync Complete</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{result.total_rows}</p>
                <p className="text-xs text-gray-500 mt-1">Total Rows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{result.inserted_rows}</p>
                <p className="text-xs text-gray-500 mt-1">Inserted</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{result.skipped_rows}</p>
                <p className="text-xs text-gray-500 mt-1">Skipped (duplicates)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{result.failed_rows}</p>
                <p className="text-xs text-gray-500 mt-1">Failed</p>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 bg-red-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sync History */}
        <div>
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Sync History</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : logs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
              No syncs yet — upload your first CSV above
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 border-b border-gray-200">
                  <tr>
                    {['Date', 'Status', 'Total', 'Inserted', 'Skipped', 'Failed'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-blue-900 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(log.synced_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status]}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.total_rows}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{log.inserted_rows}</td>
                      <td className="px-4 py-3 text-yellow-600">{log.skipped_rows}</td>
                      <td className="px-4 py-3 text-red-500">{log.failed_rows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}