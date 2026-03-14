'use client'

import ReactMarkdown from 'react-markdown'

interface Props {
  content: string
}

export function MarkdownDescription({ content }: Props) {
  return (
    <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed
      prose-headings:text-brand-text prose-strong:text-brand-text
      prose-a:text-brand-blue prose-a:no-underline hover:prose-a:underline
      prose-ul:list-disc prose-ol:list-decimal
      prose-code:bg-brand-arctic prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
      prose-pre:bg-brand-arctic prose-pre:rounded-xl prose-pre:border prose-pre:border-brand-border
      prose-img:rounded-xl prose-img:border prose-img:border-brand-border
      prose-blockquote:border-brand-blue prose-blockquote:text-brand-muted
      prose-hr:border-brand-border prose-table:text-sm
      prose-th:text-brand-text prose-td:text-brand-muted
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
