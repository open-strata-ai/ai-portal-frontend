import React, { useState } from 'react';
import { ChatThread, type ChatMessage } from '@openstrata/ai-ui-kit';

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const onSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Echo: ${text}`,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
  };

  return <ChatThread messages={messages} onSend={onSend} />;
}
