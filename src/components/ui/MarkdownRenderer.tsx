import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = 'prose prose-invert prose-sm max-w-none' }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={className}
      components={{
        code({ className: codeClassName, children, ...props }: any) {
          const match = /language-(\w+)/.exec(codeClassName || '')
          const s = String(children).replace(/\n$/, '')
          if (match) {
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem' }}
              >
                {s}
              </SyntaxHighlighter>
            )
          }
          return (
            <code className="bg-surface px-1.5 py-0.5 rounded text-accent text-xs" {...props}>
              {children}
            </code>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
