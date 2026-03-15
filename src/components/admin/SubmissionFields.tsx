'use client'

import { useState } from 'react'
import { CopyIcon, CheckIcon, DownloadIcon } from '@radix-ui/react-icons'

interface Field {
  type: string
  label: string
}

interface Props {
  fields: Field[]
  submission: Record<string, string>
}

export function SubmissionFields({ fields, submission }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (label: string, val: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="mt-3 ml-18 pl-4 border-l-2 border-brand-blue/20 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">Customer Submission</p>
      {fields.map((f) => {
        const val = submission[f.label]
        if (!val) return null
        return (
          <div key={f.label}>
            <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider mb-1">{f.label}</p>
            {f.type === 'image' ? (
              <div className="space-y-1.5">
                <div className="rounded-sm overflow-hidden border border-brand-border bg-brand-arctic">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={val} alt={f.label} className="w-full h-auto object-contain" />
                </div>
                <a
                  href={val}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-brand-arctic border border-brand-border rounded-sm text-brand-text hover:bg-brand-surface hover:border-brand-slate transition-colors"
                >
                  <DownloadIcon className="w-3 h-3" />
                  Download
                </a>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-sm text-brand-text flex-1">{val}</p>
                <button
                  type="button"
                  onClick={() => copy(f.label, val)}
                  title="Copy to clipboard"
                  className="flex-shrink-0 p-1 rounded text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
                >
                  {copied === f.label ? (
                    <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
