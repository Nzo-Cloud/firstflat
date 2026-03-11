'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/Layout/AppLayout'
import { LoadingSpinner } from '@/components/ui'
import api from '@/lib/api'
import { formatCurrency, getDaysLeft, getCurrentMonthRange } from '@/lib/utils'
import { 
  TrendingDown, TrendingUp, Calendar, AlertCircle, 
  Plus, ArrowRight, Wallet, Zap
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Profile { username: string; monthlyIncome: number; currency: string }
interface Transaction { id: string; amount: number; type: string; description: string; date: string; category?: { name: string; color: string; type: string } }
interface Bill { id: string; name: string; amount: number; dueDay: number; isPaid: boolean }

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const searchParams = useSearchParams()

  const { month, year } = getCurrentMonthRange()
  const daysLeft = getDaysLeft()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [profileRes, txRes, billRes] = await Promise.all([
        api.get('/api/profiles/me'),
        api.get('/api/transactions', { params: { month, year } }),
        api.get('/api/bills'),
      ])
      setProfile(profileRes.data)
      setTransactions(txRes.data)
      setBills(billRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => {
    if (searchParams.get('welcome') === '1') { setShowWelcome(true); setTimeout(() => setShowWelcome(false), 5000) }
  }, [searchParams])

  if (loading) return <AppLayout><div className="p-6"><LoadingSpinner text="Loading your dashboard..." /></div></AppLayout>

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const base = profile?.monthlyIncome ?? 0
  const totalIncome = base + income
  const remaining = totalIncome - expenses
  const pct = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0

  const heroColor = pct > 50 ? 'text-emerald-600' : pct > 25 ? 'text-amber-500' : 'text-red-500'
  const heroBg = pct > 50 ? 'bg-emerald-50' : pct > 25 ? 'bg-amber-50' : 'bg-red-50'

  const essential = transactions.filter(t => t.type === 'expense' && t.category?.type === 'essential').reduce((s, t) => s + t.amount, 0)
  const nonEssential = transactions.filter(t => t.type === 'expense' && t.category?.type === 'non-essential').reduce((s, t) => s + t.amount, 0)

  const pieData = [
    { name: 'Essential', value: essential, color: '#10b981' },
    { name: 'Non-essential', value: nonEssential, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const daysElapsed = (new Date().getDate()) - 1 || 1
  const dailyAvg = expenses / daysElapsed
  const daysUntilEmpty = dailyAvg > 0 ? Math.floor(remaining / dailyAvg) : 999

  const recentTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  const today = new Date().getDate()
  const upcomingBills = bills.filter(b => !b.isPaid && b.dueDay >= today).sort((a, b) => a.dueDay - b.dueDay).slice(0, 3)

  const currency = profile?.currency ?? 'USD'
  const fmt = (n: number) => formatCurrency(n, currency)

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5 pb-24 lg:pb-6">
        {/* Welcome toast */}
        {showWelcome && (
          <div className="bg-emerald-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-emerald-200 animate-fade-in">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold">Welcome to FirstFlat, {profile?.username}!</p>
              <p className="text-sm text-emerald-100">You&apos;re ready to take control of your finances 💪</p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className={clsx('rounded-2xl p-6 text-center', heroBg)}>
          <p className="text-sm font-medium text-gray-500 mb-2">Remaining this month</p>
          <p className={clsx('text-5xl font-extrabold tracking-tight', heroColor)}>
            {fmt(remaining)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="w-full max-w-xs bg-white/60 rounded-full h-2.5">
              <div 
                className={clsx('h-2.5 rounded-full transition-all', pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-400' : 'bg-red-500')}
                style={{ width: `${Math.max(0, Math.min(pct, 100))}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{pct.toFixed(0)}% of monthly budget remaining</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Days left</p>
            <p className="text-2xl font-bold text-gray-900">{daysLeft}</p>
          </div>
          <div className={clsx('card', daysUntilEmpty <= 7 ? 'border-red-200 bg-red-50' : '')}>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Budget lasts</p>
            <p className={clsx('text-2xl font-bold', daysUntilEmpty <= 7 ? 'text-red-600' : 'text-gray-900')}>
              {daysUntilEmpty >= 999 ? '✓ Month' : `${daysUntilEmpty}d`}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Income</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(totalIncome)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Expenses</p>
            <p className="text-xl font-bold text-red-500">{fmt(expenses)}</p>
          </div>
        </div>

        {/* Spend forecast callout */}
        {daysUntilEmpty < daysLeft && (
          <div className="card border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Heads up!</p>
                <p className="text-sm text-amber-700">At this rate, your budget runs out in <strong>{daysUntilEmpty} days</strong>.</p>
              </div>
              <Link href="/forecast" className="btn-secondary text-xs py-1.5 px-3 text-amber-700 border-amber-200">
                Get tips →
              </Link>
            </div>
          </div>
        )}

        {/* Essential vs Non-Essential */}
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Spending Breakdown</h3>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
            <Link href="/transactions" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">No transactions yet —</p>
              <p className="text-gray-500 text-sm font-medium">add your first expense!</p>
              <Link href="/transactions" className="btn-primary mt-3 text-sm py-2 inline-flex">
                <Plus className="w-4 h-4" /> Add transaction
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: tx.category?.color ? `${tx.category.color}20` : '#f3f4f6' }}>
                    <Wallet className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.description || 'Untitled'}</p>
                    <p className="text-xs text-gray-400">{tx.category?.name ?? 'No category'} · {tx.date}</p>
                  </div>
                  <span className={clsx('text-sm font-semibold flex-shrink-0', tx.type === 'income' ? 'text-emerald-600' : 'text-red-500')}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Upcoming Bills</h3>
              <Link href="/bills" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingBills.map(bill => {
                const daysUntil = bill.dueDay - today
                return (
                  <div key={bill.id} className={clsx('flex items-center justify-between p-3 rounded-xl', daysUntil <= 3 ? 'bg-red-50' : 'bg-gray-50')}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{bill.name}</p>
                      <p className={clsx('text-xs', daysUntil <= 3 ? 'text-red-500 font-semibold' : 'text-gray-400')}>
                        {daysUntil === 0 ? '⚠️ Due today!' : daysUntil < 0 ? '⚠️ Overdue!' : `Due in ${daysUntil} days`}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{fmt(bill.amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* FAB */}
        <Link href="/transactions"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-transform hover:scale-105 z-20">
          <Plus className="w-7 h-7 text-white" />
        </Link>
      </div>
    </AppLayout>
  )
}
