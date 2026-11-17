'use client'

import 'leaflet/dist/leaflet.css'
import useSWR from 'swr'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

type Report = { id: string; title: string; category: string; status: string; latitude: number | null; longitude: number | null; address: string | null }

const markerIcon = L.divIcon({ className: 'aquacare-marker', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] })
const fetchReports = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.from('reports').select('id,title,category,status,latitude,longitude,address').not('latitude', 'is', null).not('longitude', 'is', null).order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  return (data ?? []) as Report[]
}

function LocateButton() {
  const map = useMap()
  const [locating, setLocating] = useState(false)
  const locate = () => {
    setLocating(true)
    map.locate({ setView: true, maxZoom: 15 })
    map.once('locationfound', () => setLocating(false))
    map.once('locationerror', () => setLocating(false))
  }
  return <button type="button" onClick={locate} aria-label="Use my location" className="absolute right-3 top-3 z-[1000] rounded-lg bg-white p-2 text-slate-700 shadow-md hover:bg-slate-50"><LocateFixed className={locating ? 'size-4 animate-pulse' : 'size-4'} /></button>
}

export function LiveMap() {
  const { data, error, isLoading, mutate } = useSWR('community-reports-map', fetchReports)
  const [center] = useState<[number, number]>([40.7128, -74.006])
  return <div className="relative overflow-hidden rounded-xl border border-[#dce8f0] bg-[#eef6f7]">
    {error ? <div className="flex h-[240px] flex-col items-center justify-center gap-3 p-6 text-center"><MapPin className="size-8 text-slate-300" /><p className="text-sm font-semibold text-[#10304a]">Map data unavailable</p><p className="max-w-xs text-xs text-slate-500">We could not load community reports. Try again when you are online.</p><button type="button" onClick={() => mutate()} className="inline-flex items-center gap-2 rounded-lg bg-[#0877c9] px-3 py-2 text-xs font-semibold text-white"><RefreshCw className="size-3.5" />Try again</button></div> : <MapContainer center={center} zoom={12} scrollWheelZoom className="h-[240px] w-full" aria-label="Community water issue map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><LocateButton />{!isLoading && data?.map((report) => <Marker key={report.id} position={[report.latitude!, report.longitude!]} icon={markerIcon}><Popup><strong>{report.title}</strong><br />{report.category} · {report.status}<br />{report.address ?? 'Community report'}</Popup></Marker>)}</MapContainer>}
    {!isLoading && !error && data?.length === 0 && <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-600 shadow">No mapped reports yet. Be the first to report an issue.</div>}
  </div>
}
