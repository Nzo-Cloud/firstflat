'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import { LoadingSpinner, EmptyState, PageHeader, Modal } from '@/components/ui'
import api from '@/lib/api'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react'
import clsx from 'clsx'

interface Category { id: string; name: string; color: string; icon: string }
interface Transaction {
  id: string; amount: number; type: string; description: string; date: string
  categoryId: string | null; category?: { name: string; color: string; type: string }
}
interface Profile { currency: string }

function TransactionForm({ 
  categories, currency, initial, onSave, onClose
}: { 
  categories: Category[]; currency: string; 
  initial?: Partial<Transaction>; 
  onSave: () => void; onClose: () => void 
}) {
  const [form, setForm] = useState({
    type: initial?.type ?? 'expense',
    amount: initial?.amount?.toString() ?? '',
    description: initial?.description ?? '',
    categoryId: initial?.categoryId ?? '',
    date: initial?.date ?? new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount'); return }
    setLoading(true); setError('')
    const body = { 
      type: form.type, amount: parseFloat(form.amount), description: form.description,
      categoryId: form.categoryId || null, date: form.date
    }
    try {
      if (initial?.id) await api.put(`/api/transactions/${initial.id}`, body)
      else await api.post('/api/transactions', body)
      onSave()
    } catch { setError('Failed to save transaction') }
    finally { setLoading(false) }
  }

  const sym = currency

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        {(['expense', 'income'] as const).map(t => (
          <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
            className={clsx('flex-1 py-2.5 text-sm font-semibold transition-all', 
              form.type === t ? (t === 'income' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'text-gray-500 hover:bg-gray-50')}>
            {t === 'income' ? '+ Income' : '- Expense'}
          </button>
        ))}
      </div>

      <div>
        <label className="label">Amount ({sym})</label>
        <input type="number" required value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
          placeholder="0.00" min="0.01" step="0.01" className="input text-lg font-bold" />
      </div>

      <div>
        <label className="label">Description</label>
        <input type="text" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
          placeholder="What was this for?" className="input" />
      </div>

      <div>
        <label className="label">Category</label>
        <select value={form.categoryId} onChange={e => setForm(f => ({...f, categoryId: e.target.value}))} className="input">
          <option value="">No category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Date</label>
        <input type="date" required value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="input" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : (initial?.id ? 'Update' : 'Add')}
        </button>
      </div>
    </form>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState(getCurrentMonthRange().month)
  const [filterYear, setFilterYear] = useState(getCurrentMonthRange().year)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [txRes, catRes, profileRes] = await Promise.all([
        api.get('/api/transactions', { params: { month: filterMonth, year: filterYear, type: filterType || undefined, categoryId: filterCat || undefined, search: search || undefined } }),
        api.get('/api/categories'),
        api.get('/api/profiles/me'),
      ])
      setTransactions(txRes.data)
      setCategories(catRes.data)
      setProfile(profileRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterMonth, filterYear, filterType, filterCat, search])

  useEffect(() => { loadData() }, [loadData])

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/api/transactions/${id}`)
    loadData()
  }

  function openAdd() { setEditing(undefined); setModalOpen(true) }
  function openEdit(tx: Transaction) { setEditing(tx); setModalOpen(true) }

  const currency = profile?.currency ?? 'USD'
  const fmt = (n: number) => formatCurrency(n, currency)

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <AppLayout>
      <div className="p-4 md:p-6 pb-24 lg:pb-6 space-y-4">
        <PageHeader 
          title="Transactions"
          subtitle="Track every peso, dollar, and euro"
          action={
            <button onClick={openAdd} className="btn-primary py-2 px-4 text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
          }
        />

        {/* Filters */}
        <div className="card space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..." className="input pl-9" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} className="input text-sm py-2">
              {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(+e.target.value)} className="input text-sm py-2">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input text-sm py-2">
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input text-sm py-2">
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <LoadingSpinner />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Filter className="w-16 h-16" />}
            title="No transactions found"
            description="Try adjusting filters, or add your first transaction!"
            action={<button onClick={openAdd} className="btn-primary text-sm py-2"><Plus className="w-4 h-4" />Add transaction</button>}
          />
        ) : (
          <div className="card divide-y divide-gray-50">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tx.category?.color ? `${tx.category.color}20` : '#f3f4f6' }}>
                  {tx.type === 'income' 
                    ? <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                    : <ArrowDownCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.description || 'Untitled'}</p>
                  <p className="text-xs text-gray-400">{tx.category?.name ?? 'No category'} · {tx.date}</p>
                </div>
                <span className={clsx('text-sm font-bold flex-shrink-0 mr-2', tx.type === 'income' ? 'text-emerald-600' : 'text-red-500')}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(tx)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteTransaction(tx.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAB */}
        <button onClick={openAdd}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-transform hover:scale-105 z-20">
          <Plus className="w-7 h-7 text-white" />
        </button>

        {/* Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Transaction' : 'Add Transaction'}>
          <TransactionForm categories={categories} currency={currency} initial={editing}
            onSave={() => { setModalOpen(false); loadData() }} onClose={() => setModalOpen(false)} />
        </Modal>
      </div>
    </AppLayout>
  )
}
