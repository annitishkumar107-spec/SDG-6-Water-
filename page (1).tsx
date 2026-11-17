'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Droplets } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    const form = new FormData(event.currentTarget); const email = String(form.get('email')); const password = String(form.get('password')); const fullName = String(form.get('fullName'))
    const { error } = await createClient().auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } })
    if (error) setError(error.message.toLowerCase().includes('password') ? 'Choose a stronger password.' : 'We could not create that account.')
    else setMessage('Check your email to confirm your account, then sign in.')
    setLoading(false)
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f8fc] p-5"><div className="w-full max-w-md rounded-3xl border border-[#dce8f0] bg-white p-8 shadow-xl"><div className="mb-8 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#22b8cf]"><Droplets className="size-5 text-white" /></div><p className="font-bold text-[#10304a]">AquaCare</p></div><h1 className="text-2xl font-bold text-[#10304a]">Create your account</h1><p className="mt-1 text-sm text-slate-500">Join your community in protecting every drop.</p><form onSubmit={submit} className="mt-6 flex flex-col gap-4"><label className="text-sm font-semibold text-[#10304a]">Full name<input required name="fullName" className="mt-1.5 w-full rounded-xl border border-[#dce8f0] px-3 py-2.5 font-normal outline-none focus:border-[#0877c9]" /></label><label className="text-sm font-semibold text-[#10304a]">Email<input required name="email" type="email" autoComplete="email" className="mt-1.5 w-full rounded-xl border border-[#dce8f0] px-3 py-2.5 font-normal outline-none focus:border-[#0877c9]" /></label><label className="text-sm font-semibold text-[#10304a]">Password<input required minLength={8} name="password" type="password" autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-[#dce8f0] px-3 py-2.5 font-normal outline-none focus:border-[#0877c9]" /></label>{error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}<button disabled={loading} className="rounded-xl bg-[#0877c9] py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Creating account…' : 'Create account'}</button></form><p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-[#0877c9]" href="/auth/login">Sign in</Link></p></div></main>
}
