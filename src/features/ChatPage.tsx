import React, { useEffect, useRef, useState } from 'react';
import { ChatThread, type ChatMessage } from '@openstrata/ai-ui-kit';
import { apiClient } from '../infrastructure/apiClient';

// Single portal chat session, persisted in localStorage so it survives a page
// reload. The gateway keeps the server-side transcript (EU-04); on reload we
// re-open the same session id and pull its history.
const AGENT_ID = 'portal-chat';
const SESSION_KEY = 'openstrata.chat.sessionId';

// Models offered in the composer. cloud-qwen-max is the real, working upstream
// (DashScope); the others fall back to it when their upstream is unreachable.
const MODELS = ['cloud-qwen-max', 'cloud-gpt-4o', 'local-qwen-72b'] as const;

interface HistoryMsg {
  role: string;
  content: string;
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<(typeof MODELS)[number]>('cloud-qwen-max');
  const sessionRef = useRef<string | null>(null);
  sessionRef.current = sessionId;

  // Open (or resume) a chat session and load its history.
  useEffect(() => {
    let aborted = false;
    (async () => {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          const hist = await apiClient.get<{ messages: HistoryMsg[] }>(
            `/v1/chat/sessions/history?session_id=${encodeURIComponent(saved)}`,
          );
          if (!aborted && hist?.messages?.length) {
            setMessages(
              hist.messages.map((m, i) => ({
                id: `${saved}-${i}`,
                role: m.role as ChatMessage['role'],
                content: m.content,
                createdAt: Date.now(),
              })),
            );
            setSessionId(saved);
            return;
          }
        } catch {
          // session gone (gateway restarted) — fall through to a fresh one.
        }
      }
      const sess = await apiClient.post<{ id: string }>('/v1/chat/sessions', {
        agent_id: AGENT_ID,
      });
      if (aborted) return;
      localStorage.setItem(SESSION_KEY, sess.id);
      setSessionId(sess.id);
    })().catch((e) => setError(String(e instanceof Error ? e.message : e)));
    return () => {
      aborted = true;
    };
  }, []);

  const onSend = async (text: string) => {
    const sid = sessionRef.current;
    if (!sid) {
      setError('Chat session is still starting — try again in a moment.');
      return;
    }
    setError(null);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', streaming: true, createdAt: Date.now() },
    ]);
    setLoading(true);
    try {
      const resp = await apiClient.post<{
        content: string;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      }>('/v1/chat/sessions/messages', {
        session_id: sid,
        message: { role: 'user', content: text },
        model,
      });
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, content: resp.content, streaming: false } : msg,
        ),
      );
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `Request failed: ${detail}`, streaming: false }
            : msg,
        ),
      );
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor="chat-model">Model:</label>
        <select
          id="chat-model"
          value={model}
          onChange={(e) => setModel(e.target.value as (typeof MODELS)[number])}
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {!sessionId && <span style={{ color: '#888' }}>starting session…</span>}
        {error && (
          <span
            style={{
              color: '#c00',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {error}
          </span>
        )}
      </div>
      <ChatThread messages={messages} onSend={onSend} loading={loading} />
    </div>
  );
}
