import { useState, useEffect } from 'react';
import type { AgentCard, ChatMessage } from './types';
import { getAgentCard, sendMessage } from './api';
import AgentInfo from './components/AgentInfo';
import ChatWindow from './components/ChatWindow';
import './App.css';

function extractAgentText(task: { artifacts?: { parts: { text: string }[] }[]; status: { message?: { parts: { text: string }[] }; state: string } }): string {
  if (task.artifacts?.length) {
    return task.artifacts.map(a => a.parts.map(p => p.text).join('')).join('\n\n');
  }
  if (task.status.message?.parts?.length) {
    return task.status.message.parts.map(p => p.text).join('');
  }
  if (task.status.state === 'TASK_STATE_FAILED') {
    return 'The agent failed to process this request.';
  }
  return 'No response from agent.';
}

export default function App() {
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAgentCard()
      .then(setAgentCard)
      .catch(() => setError('Could not connect to agent'));
  }, []);

  async function handleSend(text: string) {
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const task = await sendMessage(text);
      const agentMsg: ChatMessage = {
        role: 'agent',
        content: extractAgentText(task),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <AgentInfo card={agentCard} />
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSend={handleSend}
      />
    </div>
  );
}
