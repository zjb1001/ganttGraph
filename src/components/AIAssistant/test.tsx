import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: string[];
  timestamp: Date;
}

export function Test() {
  const [messages, setMessages] = useState<Message[]>([]);

  setMessages(prev => [...prev, {
    role: 'assistant',
    content: 'test',
    actions: [],
    timestamp: new Date()
  }]);

  return null;
}
