'use client'

import { useState, useEffect, useCallback } from 'react'

interface AuditEntry {
  id: string
  adminId: string | null
  adminName: string | null
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityType, setEntityType] = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (entityType) params.set('entityType', entityType)
      const res = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [search, entityType])

  useEffect(() => { fetch_() }, [fetch_])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-display text-brand-text">Audit Log</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Search action, entity…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-brand-border rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 w-64"
        />
        <input
          type="search"
          placeholder="Filter entity type…"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-3 py-2 text-sm border border-brand-border rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 w-48"
        />
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Time</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Action</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Entity</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Entity ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Admin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-brand-muted">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-brand-muted">No audit entries found</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3 text-xs text-brand-muted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-brand-text">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-muted">{log.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-muted">{log.entityId?.slice(0, 8) || '—'}</td>
                  <td className="px-4 py-3 text-xs text-brand-muted">{log.adminName ?? log.adminId?.slice(0, 8) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
