'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CURRENCIES } from '@/lib/utils'
import api from '@/lib/api'
import { 
  DollarSign, Globe, Settings, Receipt, PartyPopper, 
  ChevronRight, ChevronLeft, Loader2, Plus, Trash2 
} from 'lucide-react'

type StepCategory = { name: string; monthly_limit: string }
type StepBill = { name: string; amount: string; due_day: string }

const STEPS = [
  { id: 1, icon: DollarSign, title: "What's your monthly income?", subtitle: "We'll use this to calculate your budget" },
  { id: 2, icon: Globe, title: "What currency do you use?", subtitle: "You can change this later in Settings" },
  { id: 3, icon: Settings, title: "Set your monthly category limits", subtitle: "These help you track overspending (optional)" },
  { id: 4, icon: Receipt, title: "Add your recurring bills", subtitle: "Like rent, subscriptions, utilities (optional)" },
  { id: 5, icon: PartyPopper, title: "You're all set! 🎉", subtitle: "Ready to take control of your finances" },
]

const DEFAULT_CATS: StepCategory[] = [
  { name: 'Rent', monthly_limit: '' },
  { name: 'Food', monthly_limit: '' },
  { name: 'Transport', monthly_limit: '' },
  { name: 'Utilities', monthly_limit: '' },
  { name: 'Internet', monthly_limit: '' },
  { name: 'Entertainment', monthly_limit: '' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [income, setIncome] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [categories, setCategories] = useState<StepCategory[]>(DEFAULT_CATS)
  const [bills, setBills] = useState<StepBill[]>([{ name: '', amount: '', due_day: '' }])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    api.get('/api/profiles/me').then(r => setUsername(r.data.username)).catch(() => {})
  }, [])

  function addBill() { setBills(b => [...b, { name: '', amount: '', due_day: '' }]) }
  function removeBill(i: number) { setBills(b => b.filter((_, idx) => idx !== i)) }
  function updateBill(i: number, key: keyof StepBill, val: string) {
    setBills(b => b.map((bill, idx) => idx === i ? { ...bill, [key]: val } : bill))
  }
  function updateCatLimit(i: number, val: string) {
    setCategories(cs => cs.map((c, idx) => idx === i ? { ...c, monthly_limit: val } : c))
  }

  async function finish() {
    setLoading(true); setError('')
    try {
      // Update profile
      await api.put('/api/profiles/me/onboarding', {
        username, monthlyIncome: parseFloat(income) || 0, currency
      })
      // Update category limits
      const catRes = await api.get('/api/categories')
      const userCats: Array<{ id: string; name: string }> = catRes.data
      for (const cat of categories) {
        if (!cat.monthly_limit) continue
        const found = userCats.find(c => c.name === cat.name)
        if (found) {
          await api.put(`/api/categories/${found.id}`, {
            name: found.name, type: 'essential', color: '#10b981', icon: 'tag',
            monthlyLimit: parseFloat(cat.monthly_limit)
          })
        }
      }
      // Create bills
      const validBills = bills.filter(b => b.name && b.amount && b.due_day)
      for (const bill of validBills) {
        await api.post('/api/bills', { name: bill.name, amount: parseFloat(bill.amount), dueDay: parseInt(bill.due_day) })
      }
      router.push('/dashboard?welcome=1')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const stepMeta = STEPS[step - 1]
  const Icon = stepMeta.icon
  const progress = (step / 5) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {step} of 5</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card shadow-xl border-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg leading-tight">{stepMeta.title}</h2>
              <p className="text-sm text-gray-500">{stepMeta.subtitle}</p>
            </div>
          </div>

          {/* Step 1: Income */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Your name</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="How should we call you?" className="input" />
              </div>
              <div>
                <label className="label">Monthly income</label>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                  placeholder="0.00" min="0" step="0.01" className="input" />
                <p className="text-xs text-gray-400 mt-1">This is your take-home pay after taxes</p>
              </div>
            </div>
          )}

          {/* Step 2: Currency */}
          {step === 2 && (
            <div>
              <label className="label">Select your currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="input">
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Category limits */}
          {step === 3 && (
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">{cat.name}</span>
                  <div className="relative flex-1">
                    <input type="number" value={cat.monthly_limit}
                      onChange={e => updateCatLimit(i, e.target.value)}
                      placeholder="No limit" min="0" step="0.01" className="input pl-8" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {CURRENCIES.find(c => c.code === currency)?.symbol ?? currency}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400">Leave empty to skip a limit for that category</p>
            </div>
          )}

          {/* Step 4: Bills */}
          {step === 4 && (
            <div className="space-y-3">
              {bills.map((bill, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input value={bill.name} onChange={e => updateBill(i, 'name', e.target.value)}
                      placeholder="Name (Rent, Netflix...)" className="input col-span-3" />
                    <input type="number" value={bill.amount} onChange={e => updateBill(i, 'amount', e.target.value)}
                      placeholder="Amount" min="0" step="0.01" className="input col-span-2" />
                    <input type="number" value={bill.due_day} onChange={e => updateBill(i, 'due_day', e.target.value)}
                      placeholder="Due day" min="1" max="31" className="input" />
                  </div>
                  {bills.length > 1 && (
                    <button onClick={() => removeBill(i)} className="mt-1 p-2 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addBill} className="btn-secondary text-sm py-2">
                <Plus className="w-4 h-4" /> Add another bill
              </button>
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">💪</div>
              <p className="text-gray-600 text-base">
                Welcome to FirstFlat, <strong>{username || 'there'}</strong>!<br />
                You&apos;re ready to take control of your finances.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 5 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                {step === 4 ? 'Almost done' : 'Continue'} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={loading} className="btn-primary">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Setting up...' : "Let's go! 🚀"}
              </button>
            )}
          </div>
        </div>

        {/* Skip hint on step 4 */}
        {step === 4 && (
          <p className="text-center text-sm text-gray-400 mt-4">
            You can skip this — add bills later from the Bills page
          </p>
        )}
      </div>
    </div>
  )
}
