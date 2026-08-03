import { useTheme } from '../contexts/ThemeContext'
import { Link } from 'react-router-dom'

export default function Privacy() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-300 font-sans transition-colors duration-300 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 p-6">
          <Link to="/" className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline">← Back to Home</Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Privacy Policy</h1>
        
        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, log your expenses or income, or set budgets. This includes your email address, display name, and all financial transactions you choose to input. We do NOT connect to your bank accounts or collect banking credentials.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">2. How We Use Your Data</h2>
            <p>Your data is used solely to provide the core functionality of the App: tracking your finances, generating visual analytics, and powering the AI chat assistant to give you personal insights. We do not use your financial data for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">3. Data Sharing & Third Parties</h2>
            <p><strong>We never sell your personal or financial data to third parties.</strong> Data may be processed by secure third-party services exclusively to provide the App's functionality (e.g., cloud hosting providers and secure AI models for processing your chat inputs). These providers are strictly prohibited from using your data for their own purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">4. Security</h2>
            <p>Your data is encrypted both in transit and at rest using industry-standard protocols. While we take strong measures to protect your information, no digital transmission is 100% secure, so we encourage you to use a strong password and keep it confidential.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">5. Your Data Rights</h2>
            <p>You have full ownership of your data. You can access it anytime via the dashboard, export it to CSV/Excel formats, and permanently delete your account and all associated data directly from your Profile settings page.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 text-center text-sm text-slate-500">
          Last updated: August 2026
        </div>
      </div>
    </div>
  )
}
