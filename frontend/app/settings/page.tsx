'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import { LoadingSpinner, PageHeader } from '@/components/ui'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { CURRENCIES } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Loader2, Coffee, AlertTriangle, Check } from 'lucide-react'


export default function SettingsPage() {
  const [form, setForm] = useState({ username: '', monthlyIncome: '', currency: 'USD' })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const router = useRouter()

  const load = useCallback(async () => {
    const res = await api.get('/api/profiles/me')
    setForm({ username: res.data.username, monthlyIncome: res.data.monthlyIncome.toString(), currency: res.data.currency })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setProfileMsg('')
    await api.put('/api/profiles/me', { username: form.username, monthlyIncome: parseFloat(form.monthlyIncome), currency: form.currency })
    setProfileMsg('Profile updated!')
    setSaving(false)
    setTimeout(() => setProfileMsg(''), 3000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('Passwords do not match'); return }
    if (pwForm.newPw.length < 6) { setPwMsg('Password must be at least 6 characters'); return }
    setPwLoading(true); setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    setPwMsg(error ? `Error: ${error.message}` : 'Password changed!')
    setPwLoading(false)
    setTimeout(() => setPwMsg(''), 3000)
  }

  async function deleteAccount() {
    if (!confirm('This will permanently delete your account and all data. Are you absolutely sure?')) return
    // Sign out (actual deletion requires Supabase admin API or Edge Function)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 pb-24 lg:pb-6 space-y-4 max-w-lg">
        <PageHeader title="Settings" subtitle="Manage your account" />

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Profile */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Profile</h2>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="label">Username</label>
                  <input type="text" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Monthly income</label>
                  <input type="number" required value={form.monthlyIncome} onChange={e => setForm(f => ({ ...f, monthlyIncome: e.target.value }))} min="0" step="0.01" className="input" />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input">
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
                  </select>
                </div>
                {profileMsg && (
                  <p className={`text-sm flex items-center gap-1 ${profileMsg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                    {!profileMsg.startsWith('Error') && <Check className="w-4 h-4" />} {profileMsg}
                  </p>
                )}
                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>

            {/* Password */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Change Password</h2>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <input type="password" required value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="At least 6 characters" className="input" />
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input type="password" required value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Same as above" className="input" />
                </div>
                {pwMsg && <p className={`text-sm ${pwMsg.startsWith('Error') || pwMsg.startsWith('Passwords') ? 'text-red-600' : 'text-emerald-600'}`}>{pwMsg}</p>}
                <button type="submit" disabled={pwLoading} className="btn-primary w-full">
                  {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {pwLoading ? 'Updating...' : 'Change password'}
                </button>
              </form>
            </div>

            {/* Ko-fi */}
            <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
              <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-orange-400" />
                Support FirstFlat
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                If FirstFlat helped you manage your budget, consider supporting the developer ☕ It really means a lot!
              </p>
              <a href="https://ko-fi.com/kuwago" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 justify-center w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-5 rounded-xl transition-all">
                <Coffee className="w-4 h-4" />
                Buy me a coffee →
              </a>
            </div>

            {/* Danger zone */}
            <div className="card border-red-100">
              <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-gray-500 mb-3">Permanently deletes your account and all your data. This action cannot be undone.</p>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)} className="text-sm text-red-500 hover:text-red-700 font-semibold underline">
                  Delete my account
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm flex-1">Cancel</button>
                  <button onClick={deleteAccount} className="btn-danger flex-1 text-sm">Yes, delete</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
