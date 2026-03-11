'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import { LoadingSpinner, EmptyState, PageHeader, Modal } from '@/components/ui'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Plus, Check, Pencil, Trash2, Receipt, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface Category { id: string; name: string; color: string }
interface Bill { id: string; name: string; amount: number; dueDay: number; isPaid: boolean; categoryId: string | null; category?: { name: string; color: string } }
interface Profile { currency: string }

function BillForm({ initial, categories, onSave, onClose }: { initial?: Bill; categories: Category[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: initial?.name ?? '', amount: initial?.amount?.toString() ?? '', dueDay: initial?.dueDay?.toString() ?? '', categoryId: initial?.categoryId ?? '', isPaid: initial?.isPaid ?? false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { setError('Name required'); return }
    setLoading(true); setError('')
    const body = { name: form.name, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay), categoryId: form.categoryId || null, isPaid: form.isPaid }
    try {
      if (initial?.id) await api.put(`/api/bills/${initial.id}`, body)
      else await api.post('/api/bills', body)
      onSave()
    } catch { setError('Failed to save') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Bill name</label>
        <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Rent, Netflix, Electricity..." className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount</label>
          <input type="number" required value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" min="0.01" step="0.01" className="input" />
        </div>
        <div>
          <label className="label">Due day</label>
          <input type="number" required value={form.dueDay} onChange={e => setForm(f => ({...f, dueDay: e.target.value}))} placeholder="1-31" min="1" max="31" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Category (optional)</label>
        <select value={form.categoryId} onChange={e => setForm(f => ({...f, categoryId: e.target.value}))} className="input">
          <option value="">None</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {initial && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPaid} onChange={e => setForm(f => ({...f, isPaid: e.target.checked}))} className="w-4 h-4 accent-emerald-500" />
          <span className="text-sm font-medium text-gray-700">Mark as paid this month</span>
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : (initial ? 'Update' : 'Add Bill')}</button>
      </div>
    </form>
  )
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Bill | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    const [billRes, catRes, profileRes] = await Promise.all([api.get('/api/bills'), api.get('/api/categories'), api.get('/api/profiles/me')])
    setBills(billRes.data)
    setCategories(catRes.data)
    setProfile(profileRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function togglePaid(bill: Bill) {
    await api.put(`/api/bills/${bill.id}`, { ...bill, isPaid: !bill.isPaid, categoryId: bill.categoryId })
    load()
  }

  async function del(id: string) {
    if (!confirm('Delete this bill?')) return
    await api.delete(`/api/bills/${id}`)
    load()
  }

  const currency = profile?.currency ?? 'USD'
  const fmt = (n: number) => formatCurrency(n, currency)
  const today = new Date().getDate()
  const totalUnpaid = bills.filter(b => !b.isPaid).reduce((s, b) => s + b.amount, 0)
  const unpaid = bills.filter(b => !b.isPaid).sort((a, b) => a.dueDay - b.dueDay)
  const paid = bills.filter(b => b.isPaid)

  function BillCard({ bill }: { bill: Bill }) {
    const daysUntil = bill.dueDay - today
    const isOverdue = daysUntil < 0
    const isDueSoon = daysUntil >= 0 && daysUntil <= 3

    return (
      <div className={clsx('flex items-center gap-3 p-3 rounded-xl', bill.isPaid ? 'bg-emerald-50' : isOverdue || isDueSoon ? 'bg-red-50' : 'bg-gray-50')}>
        <button onClick={() => togglePaid(bill)}
          className={clsx('w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
            bill.isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400')}>
          {bill.isPaid && <Check className="w-4 h-4 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-semibold', bill.isPaid ? 'text-gray-400 line-through' : 'text-gray-800')}>{bill.name}</p>
          <p className={clsx('text-xs', bill.isPaid ? 'text-gray-400' : isOverdue ? 'text-red-500 font-semibold' : isDueSoon ? 'text-amber-600 font-semibold' : 'text-gray-400')}>
            {bill.isPaid ? 'Paid ✓' : isOverdue ? `⚠️ Overdue (day ${bill.dueDay})` : isDueSoon ? `⚠️ Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}` : `Due day ${bill.dueDay}`}
          </p>
        </div>
        <span className={clsx('text-sm font-bold flex-shrink-0', bill.isPaid ? 'text-gray-400' : 'text-gray-800')}>{fmt(bill.amount)}</span>
        <div className="flex gap-1">
          <button onClick={() => { setEditing(bill); setModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-white transition">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => del(bill.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 pb-24 lg:pb-6 space-y-4">
        <PageHeader title="Bills" subtitle="Track your recurring payments"
          action={<button onClick={() => { setEditing(undefined); setModalOpen(true) }} className="btn-primary py-2 px-4 text-sm"><Plus className="w-4 h-4" /> Add</button>}
        />

        {/* Summary */}
        {bills.length > 0 && (
          <div className="card bg-amber-50 border-amber-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Upcoming unpaid: <span className="text-amber-900">{fmt(totalUnpaid)}</span></p>
                <p className="text-xs text-amber-600">{unpaid.length} of {bills.length} bills still to pay</p>
              </div>
            </div>
          </div>
        )}

        {loading ? <LoadingSpinner /> : bills.length === 0 ? (
          <EmptyState icon={<Receipt className="w-16 h-16" />} title="No bills yet" description="Add your recurring bills to track them each month." />
        ) : (
          <>
            {unpaid.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Unpaid ({unpaid.length})</h2>
                <div className="space-y-2">{unpaid.map(b => <BillCard key={b.id} bill={b} />)}</div>
              </div>
            )}
            {paid.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Paid this month ({paid.length})</h2>
                <div className="space-y-2">{paid.map(b => <BillCard key={b.id} bill={b} />)}</div>
              </div>
            )}
          </>
        )}

        <button onClick={() => { setEditing(undefined); setModalOpen(true) }}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-transform hover:scale-105 z-20">
          <Plus className="w-7 h-7 text-white" />
        </button>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Bill' : 'Add Bill'}>
          <BillForm initial={editing} categories={categories} onSave={() => { setModalOpen(false); load() }} onClose={() => setModalOpen(false)} />
        </Modal>
      </div>
    </AppLayout>
  )
}
