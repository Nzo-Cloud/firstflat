'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import { LoadingSpinner, PageHeader, ProgressBar } from '@/components/ui'
import api from '@/lib/api'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'

interface CategoryStat { id: string; name: string; color: string; type: string; monthly_limit: number | null; spent: number }
interface Profile { currency: string; monthlyIncome: number }

export default function BudgetPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<CategoryStat[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(getCurrentMonthRange().month)
  const [year, setYear] = useState(getCurrentMonthRange().year)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profileRes, catRes, txRes] = await Promise.all([
        api.get('/api/profiles/me'),
        api.get('/api/categories'),
        api.get('/api/transactions', { params: { month, year } }),
      ])
      setProfile(profileRes.data)
      const txs: Array<{ type: string; amount: number; categoryId: string | null }> = txRes.data
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      setTotalIncome(profileRes.data.monthlyIncome + income)
      setTotalExpenses(expenses)

      const cats = catRes.data.map((c: CategoryStat) => ({
        ...c,
        spent: txs.filter(t => t.type === 'expense' && t.categoryId === c.id).reduce((s: number, t: { amount: number }) => s + t.amount, 0)
      }))
      setCategories(cats)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  function exportCSV() {
    const rows = [['Category', 'Type', 'Spent', 'Limit']]
    categories.forEach(c => rows.push([c.name, c.type, c.spent.toString(), c.monthly_limit?.toString() ?? '']))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `firstflat-budget-${year}-${month}.csv`; a.click()
  }

  const currency = profile?.currency ?? 'USD'
  const fmt = (n: number) => formatCurrency(n, currency)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const essential = categories.filter(c => c.type === 'essential')
  const nonEssential = categories.filter(c => c.type === 'non-essential')
  const essentialSpent = essential.reduce((s, c) => s + c.spent, 0)
  const nonEssentialSpent = nonEssential.reduce((s, c) => s + c.spent, 0)
  const remaining = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(1) : '0'

  return (
    <AppLayout>
      <div className="p-4 md:p-6 pb-24 lg:pb-6 space-y-4">
        <PageHeader title="Budget Overview" subtitle="How you're tracking this month"
          action={
            <button onClick={exportCSV} className="btn-secondary text-sm py-2 px-3">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          }
        />

        {/* Month selector */}
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(+e.target.value)} className="input text-sm py-2">
            {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(+e.target.value)} className="input text-sm py-2">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Income</p>
                <p className="text-base font-bold text-emerald-600 truncate">{fmt(totalIncome)}</p>
              </div>
              <div className="card text-center">
                <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Expenses</p>
                <p className="text-base font-bold text-red-500 truncate">{fmt(totalExpenses)}</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500">Savings %</p>
                <p className="text-2xl font-bold text-gray-800">{savingsRate}%</p>
              </div>
            </div>

            {/* Income vs Expenses bar */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Income vs Expenses</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expenses</span>
                    <span className="font-semibold text-red-500">{fmt(totalExpenses)}</span>
                  </div>
                  <ProgressBar value={totalExpenses} max={totalIncome} color="#ef4444" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Essential</span>
                    <span className="font-semibold text-emerald-600">{fmt(essentialSpent)}</span>
                  </div>
                  <ProgressBar value={essentialSpent} max={totalIncome} color="#10b981" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Non-essential</span>
                    <span className="font-semibold text-amber-500">{fmt(nonEssentialSpent)}</span>
                  </div>
                  <ProgressBar value={nonEssentialSpent} max={totalIncome} color="#f59e0b" />
                </div>
              </div>
            </div>

            {/* Per-category */}
            {[{ title: 'Essential', cats: essential }, { title: 'Non-Essential', cats: nonEssential }].map(({ title, cats }) => (
              cats.length > 0 && (
                <div key={title}>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</h2>
                  <div className="card divide-y divide-gray-50">
                    {cats.map(cat => (
                      <div key={cat.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-800">{fmt(cat.spent)}</span>
                            {cat.monthly_limit && (
                              <span className="text-xs text-gray-400"> / {fmt(cat.monthly_limit)}</span>
                            )}
                            {cat.monthly_limit && cat.spent >= cat.monthly_limit * 0.8 && (
                              <span className="ml-1 text-amber-500 text-xs">⚠️</span>
                            )}
                          </div>
                        </div>
                        {cat.monthly_limit && (
                          <ProgressBar value={cat.spent} max={cat.monthly_limit} showLabel={false} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </>
        )}
      </div>
    </AppLayout>
  )
}
