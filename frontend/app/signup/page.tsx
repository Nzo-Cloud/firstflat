'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Leaf, Eye, EyeOff, Loader2, Shield, Info } from 'lucide-react'
import { useEffect } from 'react'

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const router = useRouter()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      timer = setTimeout(() => {
        setStatus('Waking up the free-tier server... this usually takes ~40 seconds. ☕')
      }, 4000)
    } else {
      setStatus('')
    }
    return () => clearTimeout(timer)
  }, [loading])

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1">Start managing your finances today</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 flex gap-3">
          <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            <strong>FirstFlat does not collect payment information.</strong> This app is completely free to use.
          </p>
        </div>

        {/* Status notification bar */}
        {status && !error && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700 font-medium">{status}</p>
          </div>
        )}

        <div className="card shadow-xl border-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="label">Username</label>
              <input id="username" type="text" required value={form.username}
                onChange={update('username')} placeholder="e.g. alex_rents" className="input" />
            </div>
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" required value={form.email}
                onChange={update('email')} placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} required value={form.password}
                  onChange={update('password')} placeholder="At least 6 characters" className="input pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create free account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" prefetch={false} className="text-emerald-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
