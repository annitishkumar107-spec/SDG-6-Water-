'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Droplets } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const form = new FormData(event.currentTarget)
    const { error } = await createClient().auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) })
    if (error) setError(error.message.toLowerCase().includes('confirm') ? 'Please confirm your email before signing in.' : 'Invalid email or password.')
    else window.location.assign('/protected')
    setLoading(false)
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f8fc] p-5"><div className="w-full max-w-md rounded-3xl border border-[#dce8f0] bg-white p-8 shadow-xl"><div className="mb-8 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#22b8cf]"><Droplets className="size-5 text-white" /></div><div><p className="font-bold text-[#10304a]">AquaCare</p><p className="text-[10px] uppercase tracking-[0.18em] text-[#11998e]">Every drop matters</p></div></div><h1 className="text-2xl font-bold text-[#10304a]">Welcome back</h1><p className="mt-1 text-sm text-slate-500">Sign in to manage your community reports.</p><form onSubmit={submit} className="mt-6 flex flex-col gap-4"><label className="text-sm font-semibold text-[#10304a]">Email<input required name="email" type="email" autoComplete="email" className="mt-1.5 w-full rounded-xl border border-[#dce8f0] px-3 py-2.5 font-normal outline-none focus:border-[#0877c9]" /></label><label className="text-sm font-semibold text-[#10304a]">Password<input required name="password" type="password" autoComplete="current-password" className="mt-1.5 w-full rounded-xl border border-[#dce8f0] px-3 py-2.5 font-normal outline-none focus:border-[#0877c9]" /></label>{error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={loading} className="rounded-xl bg-[#0877c9] py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}</button></form><p className="mt-6 text-center text-sm text-slate-500">New to AquaCare? <Link className="font-semibold text-[#0877c9]" href="/auth/sign-up">Create an account</Link></p></div></main>
}
