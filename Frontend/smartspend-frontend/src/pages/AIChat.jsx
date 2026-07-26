import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { parseExpense, confirmExpense, queryExpenses } from '../api/client'

const WELCOME = {
  role: 'assistant',
  type: 'text',
  content: "Hi! I'm your SmartSpend AI assistant. You can:\n• Tell me about an expense: 'I spent GH₵45 on food today'\n• Ask me questions: 'How much did I spend on food this month?'"
}

export default function AIChat() {
  const navigate = useNavigate()

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('chat_messages')
      return saved ? JSON.parse(saved) : [WELCOME]
    } catch { return [WELCOME] }
  })
  const [input, setInput]             = useState('')
  const [sessionId, setSessionId]     = useState(() => sessionStorage.getItem('chat_session_id'))
  const [mode, setMode]               = useState('parse')
  const [loading, setLoading]         = useState(false)
  const [pendingParse, setPendingParse] = useState(null)

  function addMessage(role, type, content, extra = {}) {
    setMessages(prev => {
      const updated = [...prev, { role, type, content, ...extra }]
      sessionStorage.setItem('chat_messages', JSON.stringify(updated))
      return updated
    })
  }

  function handleReset() {
    sessionStorage.removeItem('chat_messages')
    sessionStorage.removeItem('chat_session_id')
    setMessages([WELCOME])
    setSessionId(null)
    setPendingParse(null)
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    addMessage('user', 'text', userMessage)
    setLoading(true)

    try {
      if (mode === 'parse') {
        const res = await parseExpense(userMessage, sessionId)
        const { parsed, message } = res.data
        if (res.data.session_id) {
          setSessionId(res.data.session_id)
          sessionStorage.setItem('chat_session_id', res.data.session_id)
        }
        addMessage('assistant', 'parse', message, { parsed, originalMessage: userMessage })
        setPendingParse({ message: userMessage, parsed })

      } else {
        const res = await queryExpenses(userMessage, sessionId)
        const { answer, data, total, chart_hint } = res.data
        if (res.data.session_id) {
          setSessionId(res.data.session_id)
          sessionStorage.setItem('chat_session_id', res.data.session_id)
        }
        addMessage('assistant', 'query', answer, { data, total, chart_hint })
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear()
        navigate('/login')
      } else {
        addMessage('assistant', 'text', err.response?.data?.detail || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(originalMessage) {
    setLoading(true)
    try {
      const res = await confirmExpense(originalMessage, sessionId)
      addMessage('assistant', 'text', '✅ ' + res.data.message)
      setPendingParse(null)
    } catch (err) {
      addMessage('assistant', 'text', err.response?.data?.detail || 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  function handleDiscard() {
    setPendingParse(null)
    addMessage('assistant', 'text', 'No problem — the expense was not saved. Feel free to try again.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col flex-1">

        {/* Header + Mode Toggle + Reset */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">AI Chat</h1>
            <p className="text-gray-500 text-sm">Talk to your finances</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMode('parse')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'parse' ? 'bg-white shadow text-blue-900' : 'text-gray-500'
                }`}
              >
                Add Expense
              </button>
              <button
                type="button"
                onClick={() => setMode('query')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'query' ? 'bg-white shadow text-blue-900' : 'text-gray-500'
                }`}
              >
                Ask a Question
              </button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-red-500 transition-all"
            >
              Reset Chat
            </button>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 overflow-y-auto mb-4 space-y-4 min-h-96 max-h-[60vh]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* User message */}
              {msg.role === 'user' && (
                <div className="bg-blue-900 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-sm text-sm">
                  {msg.content}
                </div>
              )}

              {/* Assistant text message */}
              {msg.role === 'assistant' && msg.type === 'text' && (
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-tl-sm max-w-sm text-sm whitespace-pre-line">
                  {msg.content}
                </div>
              )}

              {/* Parsed expense card */}
              {msg.role === 'assistant' && msg.type === 'parse' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-sm p-4 max-w-sm w-full">
                  <p className="text-sm text-blue-900 font-medium mb-3">{msg.content}</p>
                  <div className="bg-white rounded-lg border border-blue-100 p-3 space-y-1 text-xs text-gray-700 mb-3">
                    <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{msg.parsed?.date}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Type</span><span>{msg.parsed?.type}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Category</span><span>{msg.parsed?.category}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-blue-900">GH₵{msg.parsed?.amount}</span></div>
                    {msg.parsed?.details && (
                      <div className="flex justify-between"><span className="text-gray-500">Details</span><span>{msg.parsed.details}</span></div>
                    )}
                    {msg.parsed?.payment_method && (
                      <div className="flex justify-between"><span className="text-gray-500">Payment</span><span>{msg.parsed.payment_method}</span></div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Confidence</span>
                      <span className={`font-medium ${
                        msg.parsed?.confidence === 'high' ? 'text-green-600' :
                        msg.parsed?.confidence === 'medium' ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {msg.parsed?.confidence}
                      </span>
                    </div>
                  </div>
                  {pendingParse?.message === msg.originalMessage && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirm(msg.originalMessage)}
                        disabled={loading}
                        className="flex-1 bg-blue-900 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-800 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleDiscard}
                        className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
                      >
                        Discard
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Query result card */}
              {msg.role === 'assistant' && msg.type === 'query' && (
                <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tl-sm p-4 max-w-md w-full">
                  <p className="text-sm text-green-900 font-medium mb-3">{msg.content}</p>
                  {msg.data && msg.data.length > 0 && (
                    <div className="bg-white rounded-lg border border-green-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-green-800">Date</th>
                            <th className="text-left px-3 py-2 text-green-800">Category</th>
                            <th className="text-right px-3 py-2 text-green-800">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {msg.data.slice(0, 5).map((row, j) => (
                            <tr key={j}>
                              <td className="px-3 py-1.5 text-gray-600">{row.date}</td>
                              <td className="px-3 py-1.5 text-gray-700">{row.category}</td>
                              <td className="px-3 py-1.5 text-right font-medium text-blue-900">
                                GH₵{Number(row.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {msg.data.length > 5 && (
                            <tr>
                              <td colSpan={3} className="px-3 py-1.5 text-center text-gray-400">
                                +{msg.data.length - 5} more transactions
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm text-sm text-gray-500">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'parse'
              ? "e.g. I spent GH₵45 on food today"
              : "e.g. How much did I spend this month?"
            }
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  )
}