'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Droplets, FileText, Loader2, MapPin, Plus, Upload, X } from 'lucide-react'

const LiveMap = dynamic(() => import('@/components/live-map').then((module) => module.LiveMap), { ssr: false, loading: () => <div className="flex h-[240px] items-center justify-center rounded-xl bg-[#eef6f7] text-sm text-slate-500">Loading community map…</div> })

type Report = { id: string; title: string; description: string; category: string; severity: string; status: string; address: string | null; latitude: number | null; longitude: number | null; created_at: string }

const getSupabase = () => createClient()

async function loadReports(): Promise<Report[]> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase.from('reports').select('id,title,description,category,severity,status,address,latitude,longitude,created_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export default function AquaCare() {
  const { data: reports, error, isLoading, mutate } = useSWR('my-reports', loadReports)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Report | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submitReport = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage('')
    const form = new FormData(event.currentTarget)
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Please sign in before submitting a report.'); setBusy(false); return }
    let latitude: number | null = null; let longitude: number | null = null
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }))
      latitude = position.coords.latitude; longitude = position.coords.longitude
    } catch { /* Location is optional when permission is denied. */ }
    const { data: report, error: insertError } = await supabase.from('reports').insert({ user_id: user.id, title: String(form.get('title')), description: String(form.get('description')), category: String(form.get('category')), severity: String(form.get('severity')), latitude, longitude, address: String(form.get('address') || '') }).select('id').single()
    if (insertError || !report) { setMessage(insertError?.message ?? 'Unable to save the report.'); setBusy(false); return }
    const image = form.get('image') as File | null
    if (image && image.size > 0) {
      const path = `${user.id}/${report.id}/${crypto.randomUUID()}-${image.name}`
      const { error: uploadError } = await supabase.storage.from('report-images').upload(path, image, { contentType: image.type, upsert: false })
      if (uploadError) { await supabase.from('reports').delete().eq('id', report.id); setMessage(`Image upload failed: ${uploadError.message}`); setBusy(false); return }
      const { error: imageRowError } = await supabase.from('report_images').insert({ report_id: report.id, storage_path: path })
      if (imageRowError) { setMessage(`Report saved, but image metadata failed: ${imageRowError.message}`); setBusy(false); return }
    }
    await mutate(); setOpen(false); setBusy(false); setMessage('Report submitted successfully.')
  }, [mutate])

  return <main className="min-h-screen bg-[#f4f8fc] text-[#10304a]">
    <header className="flex items-center justify-between border-b border-[#dce8f0] bg-white px-5 py-4 lg:px-10"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#22b8cf]"><Droplets className="size-5 text-white" /></div><div><p className="font-bold">AquaCare</p><p className="text-[10px] uppercase tracking-[0.18em] text-[#11998e]">Every drop matters</p></div></div><a href="/auth/login" className="rounded-lg border border-[#dce8f0] px-3 py-2 text-sm font-semibold">Sign in</a></header>
    <section className="mx-auto max-w-5xl px-5 py-10 lg:px-10"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#11998e]">Community dashboard</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Water issues, handled together.</h1><p className="mt-2 text-sm text-slate-500">Submit a clear report and track every status update.</p></div><button onClick={() => { setOpen(true); setMessage('') }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0877c9] px-4 py-3 text-sm font-semibold text-white"><Plus className="size-4" />Report an issue</button></div>
      {message && !open && <p role="status" className="mt-5 rounded-xl bg-[#e5f7ef] px-4 py-3 text-sm font-medium text-[#08734f]">{message}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Your reports" value={reports?.length ?? 0} /><Metric label="In progress" value={reports?.filter((report) => report.status === 'in_progress').length ?? 0} /><Metric label="Resolved" value={reports?.filter((report) => report.status === 'resolved').length ?? 0} /></div>
      <section className="mt-8 rounded-2xl border border-[#dce8f0] bg-white p-5 shadow-sm" aria-labelledby="community-map-heading"><div className="flex items-start justify-between gap-4"><div><h2 id="community-map-heading" className="font-bold">Community map</h2><p className="mt-1 text-xs text-slate-400">Explore reported water issues near you.</p></div><div className="flex items-center gap-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0877c9]" />Reported issue</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#11998e]" />OpenStreetMap</span></div></div><div className="mt-4"><LiveMap /></div></section>
      <div className="mt-8 rounded-2xl border border-[#dce8f0] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold">My reports</h2><p className="mt-1 text-xs text-slate-400">Your submitted issues and current status.</p></div><FileText className="size-5 text-[#0877c9]" /></div>{error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">Could not load reports: {error.message}</p> : isLoading ? <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" />Loading reports…</div> : reports?.length ? <div className="mt-5 flex flex-col gap-3">{reports.map((report) => <button key={report.id} onClick={() => setSelected(report)} className="flex items-center justify-between rounded-xl border border-[#e5edf2] p-4 text-left hover:border-[#0877c9]"><div><p className="font-semibold">{report.title}</p><p className="mt-1 text-xs text-slate-500">{report.category} · {new Date(report.created_at).toLocaleDateString()}</p></div><span className="rounded-full bg-[#e5f7ef] px-3 py-1 text-xs font-semibold capitalize text-[#08734f]">{report.status.replace('_', ' ')}</span></button>)}</div> : <div className="py-10 text-center"><CheckCircle2 className="mx-auto size-8 text-[#16a36a]" /><p className="mt-3 font-semibold">No reports yet</p><p className="mt-1 text-sm text-slate-500">Your first report will appear here.</p></div>}</div>
    </section>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10304a]/40 p-5"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">Report a water issue</h2><p className="mt-1 text-xs text-slate-500">Location is captured only if you grant permission.</p></div><button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div><form onSubmit={submitReport} className="mt-5 flex flex-col gap-4"><Field label="Issue title"><input name="title" required placeholder="e.g. Leaking public tap" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><select name="category" defaultValue="pipe_leakage"><option value="pipe_leakage">Pipe leakage</option><option value="water_wastage">Water wastage</option><option value="contamination">Contamination</option><option value="sanitation">Sanitation</option></select></Field><Field label="Severity"><select name="severity" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field></div><Field label="Description"><textarea name="description" required placeholder="Tell us what you noticed…" /></Field><Field label="Nearby address (optional)"><div className="relative"><MapPin className="absolute left-3 top-3 size-4 text-slate-400" /><input name="address" className="pl-9" placeholder="Street, landmark, or neighborhood" /></div></Field><Field label="Photo (optional)"><div className="flex items-center gap-2 rounded-xl border border-dashed border-[#b7cbd8] px-3 py-3 text-sm text-slate-500"><Upload className="size-4" /><input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></div></Field>{message && <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="mt-0.5 size-4 shrink-0" />{message}</p>}<button disabled={busy} className="rounded-xl bg-[#0877c9] py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Submitting…' : 'Submit report'}</button></form></div></div>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10304a]/40 p-5"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#11998e]">Report details</p><h2 className="mt-1 text-xl font-bold">{selected.title}</h2></div><button onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div><div className="mt-5 grid gap-3 text-sm"><Detail label="Status" value={selected.status.replace('_', ' ')} /><Detail label="Severity" value={selected.severity} /><Detail label="Category" value={selected.category.replace('_', ' ')} /><Detail label="Description" value={selected.description} />{selected.latitude && <Detail label="Coordinates" value={`${selected.latitude.toFixed(5)}, ${selected.longitude?.toFixed(5)}`} />}</div></div></div>}
  </main>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-xs font-semibold">{label}{children}</label> }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-[#dce8f0] bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#f4f8fc] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 capitalize text-slate-700">{value}</p></div> }
