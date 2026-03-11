import Link from 'next/link'
import { Leaf, TrendingDown, Calendar, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">FirstFlat</span>
        </div>
        <Link href="/login"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 mb-8">
          <Leaf className="w-9 h-9 text-white" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight max-w-xl leading-tight">
          Budget smarter.<br />
          <span className="text-emerald-500">Live better.</span>
        </h1>

        <p className="mt-5 text-lg text-gray-500 max-w-md leading-relaxed">
          The budget tracker built for people living alone for the first time.
          Track income, expenses, and know exactly when your money runs out.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/signup"
            className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:scale-105 text-base">
            Get started — it&apos;s free
          </Link>
          <Link href="/login"
            className="px-7 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl border border-gray-200 transition-all text-base">
            Sign In
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { icon: TrendingDown, label: 'Track every expense', desc: 'Log income & spending in seconds' },
            { icon: Calendar, label: 'Bill reminders', desc: 'Never miss a due date again' },
            { icon: Zap, label: 'AI Forecast', desc: 'Know when your budget runs out' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">{label}</p>
              <p className="text-gray-400 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        © {new Date().getFullYear()} FirstFlat · Free forever ·{' '}
        <a href="https://ko-fi.com/kuwago" target="_blank" rel="noopener noreferrer"
          className="text-emerald-500 hover:underline">Support ☕</a>
      </footer>
    </div>
  )
}
