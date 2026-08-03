import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

export default function Landing() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans relative transition-colors duration-300">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-[#0a0f1c] dark:to-indigo-950 -z-20 transition-colors duration-300" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-cyan-500/10 dark:from-cyan-900/20 to-transparent -z-10" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SmartSpend <span className="text-cyan-600 dark:text-cyan-400">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-300 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <Link 
            to="/login" 
            className="text-sm font-bold bg-slate-200/50 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white px-6 py-2.5 rounded-full backdrop-blur-sm transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm text-sm font-semibold text-cyan-700 dark:text-cyan-400">
              ✨ The Future of Personal Finance
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Manage Your Money with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">Artificial Intelligence</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Stop typing into boring spreadsheets. Chat with SmartSpend AI to instantly log expenses, get deep financial insights, and set proactive budgets before you overspend.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/login?mode=register"
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:-translate-y-1 transition-all"
              >
                Get Started for Free
              </Link>
              <a 
                href="#features"
                className="w-full sm:w-auto bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 px-8 py-4 rounded-full text-lg font-bold transition-all backdrop-blur-sm"
              >
                See how it works
              </a>
            </div>
          </motion.div>

          {/* Hero Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden p-2">
              <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-slate-900/50">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="p-8 grid md:grid-cols-2 gap-8 text-left bg-gradient-to-b from-transparent to-cyan-500/5 dark:to-cyan-900/5">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                      Hi! I'm SmartSpend AI. What would you like to do today?
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 rounded-2xl rounded-tr-sm text-sm font-medium shadow-sm">
                        I just spent GH₵45 on lunch at KFC via MoMo.
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Expense Saved!</span><br/>
                      Category: Food<br/>
                      Amount: GH₵45.00
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col justify-center space-y-6">
                    <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] -z-10" />
                      <h4 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Budget Alert</h4>
                      <p className="text-rose-600 dark:text-rose-400 font-bold text-2xl">90% Reached</p>
                      <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">You are close to your Food budget limit for this month.</p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -z-10" />
                      <h4 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Monthly Balance</h4>
                      <p className="text-slate-900 dark:text-white font-bold text-2xl">GH₵ 1,250.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-100/50 dark:bg-slate-900/30 relative border-t border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to master your finances</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">SmartSpend combines traditional budgeting tools with state-of-the-art AI to give you unparalleled control over your money.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 p-8 rounded-3xl hover:-translate-y-2 hover:bg-white dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-6 border border-cyan-500/20">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Logging</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">No more manual forms. Just type what you spent exactly how you would say it, and our AI categorizes, parses, and saves it instantly.</p>
            </div>
            
            <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 p-8 rounded-3xl hover:-translate-y-2 hover:bg-white dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm">
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 border border-rose-500/20">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Proactive Budget Alerts</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Set monthly limits for categories like Food or Entertainment. We'll automatically warn you when you hit 90% capacity so you never overspend.</p>
            </div>

            <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 p-8 rounded-3xl hover:-translate-y-2 hover:bg-white dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 border border-emerald-500/20">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Excel Synchronization</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Your data is yours. Seamlessly pull in historical data from Excel, or export your SmartSpend logs to a spreadsheet at any time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent dark:via-cyan-900/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bank-Grade Privacy & Security</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Your financial data is your business alone. We built SmartSpend with strict privacy-first principles.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
              <div className="mt-1 text-cyan-600 dark:text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">100% Private (No Ads)</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Your expense data is strictly yours. We don't analyze your spending habits to sell targeted ads or share your data with third parties.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
              <div className="mt-1 text-cyan-600 dark:text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Cloud Secured & Encrypted</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Your data is safely backed up in the cloud with industry-standard encryption. Only you can access your account.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
              <div className="mt-1 text-cyan-600 dark:text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Total Data Ownership</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Don't get locked in. Export your entire transaction history to Excel at any time, or permanently delete your account with one click.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
              <div className="mt-1 text-cyan-600 dark:text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Zero Bank Credentials</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">We never ask for your banking passwords. SmartSpend works entirely independently of your bank, keeping your real accounts 100% isolated.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Footer */}
      <footer className="py-20 text-center relative border-t border-slate-200 dark:border-white/5">
        <div className="max-w-3xl mx-auto px-6 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to take control?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">Join SmartSpend today and experience the easiest way to track your finances in Ghana.</p>
          <Link 
            to="/login?mode=register"
            className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:-translate-y-1 transition-all"
          >
            Create Your Account
          </Link>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} SmartSpend AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
