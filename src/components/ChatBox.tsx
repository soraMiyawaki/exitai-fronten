import { useMemo, useRef, useState } from 'react'
import { sendChat, type ChatMessage } from '../lib/chatApi'

export default function ChatBox() {
  const [systemPrompt, setSystemPrompt] = useState('あなたは日本語で丁寧に回答するアシスタントです。')
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const canSend = useMemo(() => !loading && input.trim().length > 0, [loading, input])

  const handleSend = async () => {
    if (!canSend) return
    setLoading(true)
    const user: ChatMessage = { role: 'user', content: input.trim() }
    const all: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...msgs, user]
    setMsgs(prev => [...prev, user])
    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const data = await sendChat(all, { signal: abortRef.current.signal })
      setMsgs(prev => [...prev, { role: 'assistant', content: data.content }])
      setInput('')
    } catch (e) {
      alert(`エラー: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <label className="block text-sm mb-1">システムプロンプト</label>
      <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="w-full p-2 border rounded mb-3" rows={2}/>
      <div className="space-y-3 mb-4">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <div className="text-xs opacity-70 mb-1">{m.role}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.ctrlKey || e.metaKey) ? handleSend() : undefined} className="flex-1 p-2 border rounded" placeholder="メッセージを入力（Ctrl/⌘+Enterで送信）"/>
        <button disabled={!canSend} onClick={handleSend} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">{loading ? '送信中…' : '送信'}</button>
      </div>
      <p className="text-xs text-gray-500 mt-2">※ APIキー未設定時は echo 応答になります。</p>
    </div>
  )
}
