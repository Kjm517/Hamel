import ReactMarkdown from 'react-markdown';

/** Renders chat markdown: **bold**, *italic*, lists — no raw asterisks. */
export function ChatMarkdown({ text, tone }: { text: string; tone: 'ai' | 'user' }) {
  const isUser = tone === 'user';
  return (
    <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
          strong: ({ children }) => (
            <strong className={`font-bold ${isUser ? 'text-white' : 'text-gray-900'}`}>{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1.5 pl-4 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1.5 pl-4 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${isUser ? 'text-white' : 'text-[#0EA5E9]'}`}
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <p className="mb-1 font-bold">{children}</p>,
          h2: ({ children }) => <p className="mb-1 font-bold">{children}</p>,
          h3: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
          code: ({ children }) => (
            <code
              className={`rounded px-1 py-0.5 text-[12px] ${
                isUser ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {children}
            </code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
