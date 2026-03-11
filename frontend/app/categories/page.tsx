'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import { LoadingSpinner, EmptyState, PageHeader, Modal } from '@/components/ui'
import api from '@/lib/api'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'

interface Category {
  id: string; name: string; type: string; color: string; icon: string; monthly_limit: number | null
}

const COLOR_OPTIONS = ['#ef4444','#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#6366f1','#6b7280']

function CategoryForm({ initial, onSave, onClose }: { initial?: Category; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'essential',
    color: initial?.color ?? '#10b981',
    icon: initial?.icon ?? 'tag',
    monthlyLimit: initial?.monthly_limit?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true); setError('')
    const body = { name: form.name, type: form.type, color: form.color, icon: form.icon, monthlyLimit: form.monthlyLimit ? parseFloat(form.monthlyLimit) : null }
    try {
      if (initial?.id) await api.put(`/api/categories/${initial.id}`, body)
      else await api.post('/api/categories', body)
      onSave()
    } catch { setError('Failed to save') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Food, Rent..." className="input" />
      </div>

      <div>
        <label className="label">Type</label>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['essential', 'non-essential'] as const).map(t => (
            <button type="button" key={t} onClick={() => setForm(f => ({...f, type: t}))}
              className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all ${form.type === t ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Monthly Limit (optional)</label>
        <input type="number" value={form.monthlyLimit} onChange={e => setForm(f => ({...f, monthlyLimit: e.target.value}))}
          placeholder="Leave empty for no limit" min="0" step="0.01" className="input" />
      </div>

      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({...f, color: c}))}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : (initial ? 'Update' : 'Add')}</button>
      </div>
    </form>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.get('/api/categories')
    setCategories(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function del(id: string) {
    if (!confirm('Delete this category? Transactions using it won\'t be deleted.')) return
    await api.delete(`/api/categories/${id}`)
    load()
  }

  const essential = categories.filter(c => c.type === 'essential')
  const nonEssential = categories.filter(c => c.type === 'non-essential')

  function renderGroup(title: string, cats: Category[]) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</h2>
        <div className="card divide-y divide-gray-50">
          {cats.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cat.color}20` }}>
                <Tag className="w-4 h-4" style={{ color: cat.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                <p className="text-xs text-gray-400">
                  {cat.monthly_limit ? `Limit: ${cat.monthly_limit.toLocaleString()}` : 'No limit set'}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(cat); setModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => del(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 pb-24 lg:pb-6 space-y-4">
        <PageHeader title="Categories" subtitle="Organize your spending"
          action={
            <button onClick={() => { setEditing(undefined); setModalOpen(true) }} className="btn-primary py-2 px-4 text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
          }
        />

        {loading ? <LoadingSpinner /> : categories.length === 0 ? (
          <EmptyState icon={<Tag className="w-16 h-16" />} title="No categories yet" description="Create your first category to start organizing expenses." />
        ) : (
          <div className="space-y-4">
            {essential.length > 0 && renderGroup('Essential', essential)}
            {nonEssential.length > 0 && renderGroup('Non-Essential', nonEssential)}
          </div>
        )}

        <button onClick={() => { setEditing(undefined); setModalOpen(true) }}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-transform hover:scale-105 z-20">
          <Plus className="w-7 h-7 text-white" />
        </button>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
          <CategoryForm initial={editing} onSave={() => { setModalOpen(false); load() }} onClose={() => setModalOpen(false)} />
        </Modal>
      </div>
    </AppLayout>
  )
}
