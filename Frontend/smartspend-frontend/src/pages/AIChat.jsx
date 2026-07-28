import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { sendChatMessage, confirmChatMessage } from '../api/client'

const WELCOME = {
  role: 'assistant',
  type: 'text',
  content: "Hi! I'm your SmartSpend AI assistant. You can:\n• Tell me about an expense: 'I spent GH₵45 on food today'\n• Ask me questions: 'How much did I spend on food this month?'\n• Or just say hello!"
}

export default function AIChat() {
  const navigate = useNavigate()

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('chat_messages')
      return saved ? JSON.parse(saved) : [WELCOME]
    } catch { return [WELCOME] }
  })
  const [input, setInput]               = useState('')
  const [sessionId, setSessionId]       = useState(() => sessionStorage.getItem('chat_session_id'))
  const [loading, setLoading]           = useState(false)
  const [pendingParse, setPendingParse] = useState({})

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
    setPendingParse({})
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    addMessage('user', 'text', userMessage)
    setLoading(true)

    try {
      const res = await sendChatMessage(userMessage, sessionId)
      
      if (res.data.session_id) {
        setSessionId(res.data.session_id)
        sessionStorage.setItem('chat_session_id', res.data.session_id)
      }

      const { type, content, parsed_list, data, total, chart_hint } = res.data

      if (type === 'parse') {
        addMessage('assistant', 'parse', content, { parsed_list, originalMessage: userMessage })
        setPendingParse(prev => ({ ...prev, [userMessage]: parsed_list.map(() => true) }))
      } else if (type === 'query') {
        addMessage('assistant', 'query', content, { data, total, chart_hint })
      } else {
        // general text response
        addMessage('assistant', 'text', content)
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

  async function handleConfirm(parsedData, originalMessage, idx) {
    setLoading(true)
    try {
      const res = await confirmChatMessage(parsedData, sessionId)
      addMessage('assistant', 'text', '✅ ' + res.data.message)
      setPendingParse(prev => {
        const arr = [...(prev[originalMessage] || [])]
        arr[idx] = false
        return { ...prev, [originalMessage]: arr }
      })
    } catch (err) {
      addMessage('assistant', 'text', err.response?.data?.detail || 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  function handleDiscard(originalMessage, idx) {
    setPendingParse(prev => {
      const arr = [...(prev[originalMessage] || [])]
      arr[idx] = false
      return { ...prev, [originalMessage]: arr }
    })
    addMessage('assistant', 'text', 'Discarded.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1c] to-indigo-950 flex flex-col relative font-sans selection:bg-cyan-500/30">
      <Navbar />

      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full px-6 py-8 flex flex-col flex-1 relative z-10">

        {/* Header + Reset */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow-md">AI Chat</h1>
            <p className="text-cyan-400 font-semibold tracking-wide text-sm mt-1">Talk to your finances</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm font-semibold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
          >
            Reset Chat
          </button>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 overflow-y-auto mb-6 space-y-6 shadow-2xl min-h-96 max-h-[65vh]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* User message */}
              {msg.role === 'user' && (
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-2xl rounded-tr-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] max-w-md text-sm font-medium leading-relaxed">
                  {msg.content}
                </div>
              )}

              {/* Assistant text message */}
              {msg.role === 'assistant' && msg.type === 'text' && (
                <div className="bg-white/5 border border-white/10 text-slate-300 px-6 py-3 rounded-2xl rounded-tl-sm shadow-lg max-w-md text-sm leading-relaxed whitespace-pre-line">
                  {msg.content}
                </div>
              )}

              {/* Parsed expense card */}
              {msg.role === 'assistant' && msg.type === 'parse' && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl rounded-tl-sm p-5 max-w-md w-full shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                  <p className="text-sm text-cyan-300 font-semibold mb-4">{msg.content}</p>
                  
                  {msg.parsed_list?.map((parsedItem, idx) => (
                    <div key={idx} className="mb-6 last:mb-0">
                      <div className="bg-black/30 rounded-xl border border-white/10 p-4 space-y-2 text-sm text-slate-300 mb-4">
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Date</span><span>{parsedItem.date}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Type</span><span>{parsedItem.type}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Category</span><span>{parsedItem.category}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Amount</span><span className="font-bold text-cyan-400 drop-shadow-md">GH₵{parsedItem.amount}</span></div>
                        {parsedItem.details && (
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Details</span><span>{parsedItem.details}</span></div>
                        )}
                        {parsedItem.payment_method && (
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Payment</span><span>{parsedItem.payment_method}</span></div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                          <span className="text-slate-500 font-medium">Confidence</span>
                          <span className={`font-bold tracking-wide uppercase text-xs mt-0.5 ${
                            parsedItem.confidence === 'high' ? 'text-emerald-400' :
                            parsedItem.confidence === 'medium' ? 'text-yellow-400' : 'text-rose-400'
                          }`}>
                            {parsedItem.confidence}
                          </span>
                        </div>
                      </div>
                      
                      {pendingParse?.[msg.originalMessage]?.[idx] && (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleConfirm(parsedItem, msg.originalMessage, idx)}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50"
                          >
                            Save Expense
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDiscard(msg.originalMessage, idx)}
                            className="flex-1 bg-white/5 border border-white/10 text-slate-300 py-2 rounded-lg text-sm font-bold hover:bg-white/10 transition-all"
                          >
                            Discard
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Query result card */}
              {msg.role === 'assistant' && msg.type === 'query' && (
                <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-2xl rounded-tl-sm p-5 max-w-lg w-full shadow-[0_0_20px_rgba(217,70,239,0.1)]">
                  <p className="text-sm text-fuchsia-300 font-semibold mb-4 leading-relaxed">{msg.content}</p>
                  {msg.data && msg.data.length > 0 && (
                    <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="text-left px-4 py-3 text-fuchsia-400 font-bold uppercase tracking-widest text-xs">Date</th>
                            <th className="text-left px-4 py-3 text-fuchsia-400 font-bold uppercase tracking-widest text-xs">Category</th>
                            <th className="text-right px-4 py-3 text-fuchsia-400 font-bold uppercase tracking-widest text-xs">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {msg.data.slice(0, 5).map((row, j) => (
                            <tr key={j} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-slate-400">{row.date}</td>
                              <td className="px-4 py-3 text-slate-300">{row.category}</td>
                              <td className="px-4 py-3 text-right font-bold text-cyan-400">
                                GH₵{Number(row.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {msg.data.length > 5 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-center text-slate-500 font-medium text-xs tracking-widest uppercase bg-white/[0.02]">
                                +{msg.data.length - 5} more records
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
            <div className="flex justify-start animate-pulse">
              <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl rounded-tl-sm text-sm text-cyan-400 font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type anything... e.g. I spent GH₵45 on food, or How much did I spend this month?"
            className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all shadow-inner"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  )
}