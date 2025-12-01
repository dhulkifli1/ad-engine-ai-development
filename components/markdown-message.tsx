"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownMessageProps {
  content: string
  className?: string
}

export function MarkdownMessage({ content, className = "" }: MarkdownMessageProps) {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for markdown elements
          p: ({ children }) => (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere mb-2 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
          code: ({ children }) => (
            <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-white">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-white/10 p-3 rounded-lg overflow-x-auto text-xs font-mono text-white my-2">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc pl-6 space-y-1 my-2 [&_ul]:mt-1 [&_ul]:mb-0">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-1 my-2 [&_ol]:mt-1 [&_ol]:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm text-white/90 leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-semibold text-white mb-2 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1 mt-2 first:mt-0">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/20 pl-3 text-white/80 my-2">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="border-collapse border border-white/20 text-sm w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/10">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-white/20">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-white/20 px-3 py-2 text-left font-semibold text-white">{children}</th>
          ),
          td: ({ children }) => <td className="border border-white/20 px-3 py-2 text-white/90">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
