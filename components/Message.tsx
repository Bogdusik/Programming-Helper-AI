import { memo, type ReactNode } from 'react'

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// A small Markdown subset for model answers: fenced code, headings, lists, **bold** and `code`.
// Everything is built as React elements, so text from the model is never parsed as HTML.

function renderInline(text: string, isUser: boolean): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const token = match[0]
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={match.index}
          className={`px-1.5 py-0.5 rounded font-mono text-[0.85em] ${isUser ? 'bg-black/25' : 'bg-black/30 text-blue-200'}`}
        >
          {token.slice(1, -1)}
        </code>
      )
    } else {
      nodes.push(<strong key={match.index} className="font-semibold">{token.slice(2, -2)}</strong>)
    }
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function renderText(text: string, isUser: boolean, keyPrefix: string): ReactNode[] {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let paragraph: string[] = []
  let list: { ordered: boolean; start: number; nested: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const lineNodes = paragraph.flatMap((line, i) => (i === 0 ? renderInline(line, isUser) : ['\n', ...renderInline(line, isUser)]))
    blocks.push(
      <p key={`${keyPrefix}-p${blocks.length}`} className="text-sm leading-relaxed whitespace-pre-wrap">
        {lineNodes}
      </p>
    )
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    const items = list.items.map((item, i) => <li key={i}>{renderInline(item, isUser)}</li>)
    const className = `text-sm leading-relaxed space-y-1 ${list.nested ? 'pl-10' : 'pl-5'} ${list.ordered ? 'list-decimal' : 'list-disc'}`
    blocks.push(
      list.ordered
        ? <ol key={`${keyPrefix}-l${blocks.length}`} start={list.start} className={className}>{items}</ol>
        : <ul key={`${keyPrefix}-l${blocks.length}`} className={className}>{items}</ul>
    )
    list = null
  }

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    const ordered = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line)
    const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line)

    if (heading) {
      flushParagraph()
      flushList()
      blocks.push(
        <h4 key={`${keyPrefix}-h${blocks.length}`} className="text-sm font-semibold text-white mt-1">
          {renderInline(heading[2], isUser)}
        </h4>
      )
    } else if (ordered || bullet) {
      flushParagraph()
      const isOrdered = Boolean(ordered)
      // Indented items are sub-points of the item above; models nest bullets under numbered steps.
      const nested = (ordered ?? bullet)![1].length >= 2
      if (list && (list.ordered !== isOrdered || list.nested !== nested)) flushList()
      if (!list) list = { ordered: isOrdered, start: ordered ? Number(ordered[2]) : 1, nested, items: [] }
      list.items.push(ordered ? ordered[3] : bullet![2])
    } else if (line.trim() === '') {
      flushParagraph()
      flushList()
    } else if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

function renderMessageContent(content: string, isUser: boolean) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(...renderText(content.slice(lastIndex, match.index), isUser, `t${parts.length}`))
    parts.push(
      <div key={`c${match.index}`} className={`rounded-lg overflow-hidden ${isUser ? 'bg-black/30' : 'bg-black/20'}`}>
        {match[1] && (
          <div className={`px-3 py-1 text-xs font-mono ${isUser ? 'text-blue-200' : 'text-white/70'} border-b border-white/10`}>
            {match[1]}
          </div>
        )}
        <pre className={`p-3 overflow-x-auto text-xs font-mono ${isUser ? 'text-white' : 'text-white/90'}`}>
          <code>{match[2]}</code>
        </pre>
      </div>
    )
    lastIndex = codeBlockRegex.lastIndex
  }
  if (lastIndex < content.length) parts.push(...renderText(content.slice(lastIndex), isUser, `t${parts.length}`))

  return <div className="space-y-2">{parts}</div>
}

// OPTIMIZATION: Memoize Message component to prevent unnecessary re-renders
const Message = memo(function Message({ role, content, timestamp }: MessageProps) {
  const isUser = role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
      <div className={`max-w-2xl px-6 py-4 rounded-2xl ${
        isUser 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
          : 'bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/10 rounded-bl-md'
      }`}>
        <div className="flex items-start space-x-3">
          {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            {renderMessageContent(content, isUser)}
            <p className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : 'text-white/50'
            }`}>
              {timestamp.toLocaleTimeString()}
            </p>
          </div>
          {isUser && (
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default Message