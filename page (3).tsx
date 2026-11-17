import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <main className="min-h-screen bg-[#f4f8fc] p-8 text-[#10304a]"><div className="mx-auto max-w-3xl rounded-2xl border border-[#dce8f0] bg-white p-8 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#11998e]">Protected area</p><h1 className="mt-2 text-3xl font-bold">Welcome to AquaCare</h1><p className="mt-2 text-slate-500">You are signed in as {user.email}.</p><a href="/" className="mt-6 inline-block rounded-xl bg-[#0877c9] px-4 py-3 text-sm font-semibold text-white">Open dashboard</a></div></main>
}
