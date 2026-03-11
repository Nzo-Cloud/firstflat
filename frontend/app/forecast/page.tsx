'use client'

import { useState, useCallback, useEffect } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import { PageHeader, LoadingSpinner } from '@/components/ui'
import api from '@/lib/api'
import { formatCurrency, getCurrentMonthRange, getDaysLeft } from '@/lib/utils'
import { TrendingUp, Lightbulb, Loader2, Sparkles, Bot, BarChart3 } from 'lucide-react'

interface ForecastResult {
  daysUntilEmpty: number
  topCategoriesToCut: string[]
  weeklySavingSuggestion: string
  encouragement: string
}

interface Profile { currency: string; monthlyIncome: number }
interface StatsData {
  balance: number
  daysLeft: number
  topCategory: string
  totalExpenses: number
  profile: Profile
  categoryBreakdown: Array<{ category: string; amount: number; type: string }>
  upcomingBills: number
  dailyAvg: number
}

export default function ForecastPage() {
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiUnavailable, setAiUnavailable] = useState(false)

  // Always load real stats on mount
  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const { month, year } = getCurrentMonthRange()
      const [profileRes, txRes, billRes] = await Promise.all([
        api.get('/api/profiles/me'),
        api.get('/api/transactions', { params: { month, year } }),
        api.get('/api/bills'),
      ])
      const p: Profile = profileRes.data
      const txs: Array<{ type: string; amount: number; date: string; category?: { name: string; type: string } }> = txRes.data
      const bills: Array<{ amount: number; isPaid: boolean }> = billRes.data

      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const balance = p.monthlyIncome + income - expenses

      const daysElapsed = new Date().getDate()
      const dailyAvg = expenses / (daysElapsed || 1)
      const upcomingBills = bills.filter(b => !b.isPaid).reduce((s, b) => s + b.amount, 0)

      const catMap = new Map<string, { amount: number; type: string }>()
      txs.filter(t => t.type === 'expense').forEach(t => {
        const key = t.category?.name ?? 'Uncategorized'
        const cur = catMap.get(key) ?? { amount: 0, type: t.category?.type ?? 'non-essential' }
        catMap.set(key, { amount: cur.amount + t.amount, type: cur.type })
      })
      const categoryBreakdown = Array.from(catMap.entries())
        .map(([category, v]) => ({ category, amount: v.amount, type: v.type }))
        .sort((a, b) => b.amount - a.amount)

      const topCategory = categoryBreakdown[0]?.category ?? 'None yet'

      setStats({ balance, daysLeft: getDaysLeft(), topCategory, totalExpenses: expenses, profile: p, categoryBreakdown, upcomingBills, dailyAvg })
    } catch (e) { console.error(e) }
    finally { setLoadingStats(false) }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const runAI = useCallback(async () => {
    if (!stats) return
    setLoadingAI(true)
    setAiUnavailable(false)
    try {
      const res = await api.post('/api/forecast', {
        balanceRemaining: stats.balance,
        dailyAverageSpend: stats.dailyAvg,
        totalUpcomingBills: stats.upcomingBills,
        daysLeftInMonth: stats.daysLeft,
        categoryBreakdown: stats.categoryBreakdown,
      })
      setResult(res.data)
    } catch {
      setAiUnavailable(true)
    } finally { setLoadingAI(false) }
  }, [stats])

  const fmt = (n: number) => formatCurrency(n, stats?.profile?.currency ?? 'USD')

  return (
    <AppLayout>
      <div className="p-4 md:p-6 pb-24 lg:pb-6 space-y-4 max-w-2xl">
        <PageHeader title="Spend Forecast" subtitle="Understand your money this month" />

        {loadingStats ? <LoadingSpinner /> : stats && (
          <>
            {/* Real stats — always shown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <p className="text-xs text-gray-500 mb-1">Balance left</p>
                <p className={`text-base font-bold truncate ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmt(stats.balance)}
                </p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 mb-1">Days left</p>
                <p className="text-base font-bold text-gray-800">{stats.daysLeft}d</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 mb-1">Top spend</p>
                <p className="text-xs font-bold text-gray-800 truncate">{stats.topCategory}</p>
              </div>
            </div>

            {/* Spending breakdown */}
            {stats.categoryBreakdown.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-400" /> Spending this month
                </h3>
                <div className="space-y-2">
                  {stats.categoryBreakdown.slice(0, 5).map(cat => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{cat.category}</span>
                      <span className="font-semibold text-gray-800">{fmt(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI section */}
            {!result && !aiUnavailable && (
              <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800 mb-1">AI-powered advice</h2>
                    <p className="text-sm text-gray-600">
                      Get personalized tips on where to cut back and how long your budget will last.
                    </p>
                  </div>
                </div>
                <button onClick={runAI} disabled={loadingAI}
                  className="btn-primary w-full mt-4 bg-indigo-500 hover:bg-indigo-600">
                  {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loadingAI ? 'Analyzing your spending...' : 'Run AI Forecast'}
                </button>
              </div>
            )}

            {/* AI unavailable fallback */}
            {aiUnavailable && (
              <div className="card border-gray-200 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">🤖 AI Forecast Coming Soon</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      This feature requires AI credits to run. In the meantime, here are your key stats:
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                    <span className="text-gray-500">Balance remaining</span>
                    <span className={`font-semibold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(stats.balance)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                    <span className="text-gray-500">Days left in month</span>
                    <span className="font-semibold text-gray-800">{stats.daysLeft} days</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                    <span className="text-gray-500">Top spending category</span>
                    <span className="font-semibold text-gray-800">{stats.topCategory}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                    <span className="text-gray-500">Upcoming bills</span>
                    <span className="font-semibold text-amber-600">{fmt(stats.upcomingBills)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI results */}
            {result && (
              <div className="space-y-4 animate-fade-in">
                <div className={`card border-2 ${result.daysUntilEmpty < 0 || result.daysUntilEmpty >= stats.daysLeft ? 'border-emerald-200 bg-emerald-50' : result.daysUntilEmpty <= 7 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center gap-4">
                    <TrendingUp className={`w-8 h-8 flex-shrink-0 ${result.daysUntilEmpty < 0 || result.daysUntilEmpty >= stats.daysLeft ? 'text-emerald-500' : result.daysUntilEmpty <= 7 ? 'text-red-500' : 'text-amber-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Forecast</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.daysUntilEmpty < 0 || result.daysUntilEmpty >= stats.daysLeft
                          ? "✅ You'll make it through the month!"
                          : `Budget runs out in ~${result.daysUntilEmpty} days`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" /> Top 3 areas to cut back
                  </h3>
                  <div className="space-y-2">
                    {result.topCategoriesToCut.map((cat, i) => (
                      <div key={i} className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3">
                        <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800">{i + 1}</span>
                        <span className="text-sm font-medium text-amber-800">{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card bg-emerald-50 border-emerald-100">
                  <h3 className="font-semibold text-gray-800 mb-1">💡 Weekly saving goal</h3>
                  <p className="text-3xl font-extrabold text-emerald-600">{result.weeklySavingSuggestion}</p>
                  <p className="text-sm text-gray-500 mt-1">Try to save this much each week to stay on track.</p>
                </div>

                <div className="card border-purple-100 bg-purple-50">
                  <p className="text-base text-purple-800 leading-relaxed">💜 {result.encouragement}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
