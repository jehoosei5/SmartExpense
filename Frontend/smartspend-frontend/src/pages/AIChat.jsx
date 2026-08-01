import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sendChatMessage, confirmChatMessage } from '../api/client'

const WELCOME = {
  role: 'assistant',
  type: 'text',
  content: "Hi! I'm your SmartSpend AI assistant. You can:\n• Tell me about an expense: 'I spent GH₵45 on food today'\n• Ask me questions: 'How much did I spend on food this month?'\n• Or just say hello!"
}

export default function AIChat() {
  const location = useLocation()
  
  // Don't render on the login or landing page
  if (location.pathname === '/login' || location.pathname === '/') return null

  const [isOpen, setIsOpen] = useState(() => {
    return sessionStorage.getItem('chat_open') === 'true'
  })

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('chat_messages')
      return saved ? JSON.parse(saved) : [WELCOME]
    } catch { return [WELCOME] }
  })
  
  const [expandedQueries, setExpandedQueries] = useState({})

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

  useEffect(() => {
    sessionStorage.setItem('chat_open', isOpen)
  }, [isOpen])

  function handleReset() {
    sessionStorage.removeItem('chat_messages')
    sessionStorage.removeItem('chat_session_id')
    setMessages([WELCOME])
    setSessionId(null)
    setPendingParse({})
    setExpandedQueries({})
    setIsOpen(false)
  }

  function toggleExpand(index) {
    setExpandedQueries(prev => ({ ...prev, [index]: !prev[index] }))
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      <div 
        className={`pointer-events-auto transition-all duration-300 origin-bottom-right mb-4 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden ${
          isOpen ? 'scale-100 opacity-100 w-80 sm:w-96 h-[500px]' : 'scale-0 opacity-0 w-0 h-0'
        }`}
      >
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
            <h3 className="font-bold tracking-wide">SmartSpend AI</h3>
          </div>
          <button 
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* User message */}
              {msg.role === 'user' && (
                <div className="bg-emerald-600 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm shadow-sm max-w-[80%] text-sm font-medium leading-relaxed">
                  {msg.content}
                </div>
              )}

              {/* Assistant text message */}
              {msg.role === 'assistant' && msg.type === 'text' && (
                <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl rounded-tl-sm shadow-sm dark:shadow-lg max-w-md text-sm leading-relaxed whitespace-pre-line">
                  {msg.content}
                </div>
              )}

              {/* Parsed expense card */}
              {msg.role === 'assistant' && msg.type === 'parse' && (
                <div className="bg-emerald-50 dark:bg-cyan-500/10 border border-emerald-200 dark:border-cyan-500/30 rounded-2xl rounded-tl-sm p-4 max-w-[95%] w-full shadow-sm">
                  <p className="text-sm text-emerald-700 dark:text-cyan-300 font-semibold mb-3">{msg.content}</p>
                  
                  {msg.parsed_list?.map((parsedItem, idx) => (
                    <div key={idx} className="mb-6 last:mb-0">
                      <div className="bg-white dark:bg-black/30 rounded-xl border border-emerald-100 dark:border-white/10 p-4 space-y-2 text-sm text-slate-700 dark:text-slate-300 mb-4 shadow-sm dark:shadow-none">
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Date</span><span>{parsedItem.date}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Type</span><span>{parsedItem.type}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Category</span><span>{parsedItem.category}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Amount</span><span className="font-bold text-emerald-600 dark:text-cyan-400 drop-shadow-none dark:drop-shadow-md">GH₵{parsedItem.amount}</span></div>
                        {parsedItem.details && (
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Details</span><span>{parsedItem.details}</span></div>
                        )}
                        {parsedItem.payment_method && (
                          <div className="flex justify-between"><span className="text-slate-500 font-medium">Payment</span><span>{parsedItem.payment_method}</span></div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/10 mt-2">
                          <span className="text-slate-500 font-medium">Confidence</span>
                          <span className={`font-bold tracking-wide uppercase text-xs mt-0.5 ${
                            parsedItem.confidence === 'high' ? 'text-emerald-500 dark:text-emerald-400' :
                            parsedItem.confidence === 'medium' ? 'text-yellow-500 dark:text-yellow-400' : 'text-rose-500 dark:text-rose-400'
                          }`}>
                            {parsedItem.confidence}
                          </span>
                        </div>
                      </div>
                      
                      {pendingParse?.[msg.originalMessage]?.[idx] && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => handleConfirm(parsedItem, msg.originalMessage, idx)}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 text-white py-2 rounded-lg text-sm font-bold shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50"
                          >
                            Save Expense
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDiscard(msg.originalMessage, idx)}
                            className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
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
                <div className="bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-200 dark:border-fuchsia-500/30 rounded-2xl rounded-tl-sm p-4 max-w-[95%] w-full shadow-sm">
                  <p className="text-sm text-fuchsia-700 dark:text-fuchsia-300 font-semibold mb-3 leading-relaxed">{msg.content}</p>
                  {msg.data && msg.data.length > 0 && (
                    <div className="bg-white dark:bg-black/30 rounded-xl border border-fuchsia-100 dark:border-white/10 overflow-x-auto shadow-sm">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                          <tr>
                            <th className="text-left px-2 py-2 text-fuchsia-600 dark:text-fuchsia-400 font-bold uppercase tracking-wider">Date</th>
                            <th className="text-left px-2 py-2 text-fuchsia-600 dark:text-fuchsia-400 font-bold uppercase tracking-wider">Category</th>
                            <th className="text-right px-2 py-2 text-fuchsia-600 dark:text-fuchsia-400 font-bold uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                          {msg.data.slice(0, expandedQueries[i] ? msg.data.length : 5).map((row, j) => (
                            <tr key={j} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-2 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.date.substring(5)}</td>
                              <td className="px-2 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[80px]" title={row.category}>{row.category}</td>
                              <td className="px-2 py-2 text-right font-bold text-emerald-600 dark:text-cyan-400 whitespace-nowrap">
                                GH₵{Number(row.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {msg.data.length > 5 && (
                            <tr 
                              onClick={() => toggleExpand(i)}
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                              <td colSpan={3} className="px-2 py-2 text-center text-slate-500 font-medium text-xs tracking-widest uppercase bg-slate-50 dark:bg-white/[0.02]">
                                {expandedQueries[i] ? "Collapse records" : `+${msg.data.length - 5} more records (Click to expand)`}
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
              <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl rounded-tl-sm text-sm text-emerald-600 dark:text-cyan-400 font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-600 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-600 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-white/10 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-slate-100 dark:bg-slate-700/50 border-none rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-emerald-600 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </button>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-emerald-600 dark:bg-cyan-500 hover:bg-emerald-700 dark:hover:bg-cyan-400 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center relative group"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        )}
      </button>

    </div>
  )
}