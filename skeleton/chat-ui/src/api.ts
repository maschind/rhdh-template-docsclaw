import type { AgentCard, A2ATask } from './types';

let messageCounter = 0;

export async function getAgentCard(): Promise<AgentCard> {
  const res = await fetch('/api/.well-known/agent.json');
  if (!res.ok) throw new Error(`Failed to fetch agent card: ${res.status}`);
  return res.json();
}

export async function sendMessage(text: string): Promise<A2ATask> {
  messageCounter++;
  const res = await fetch('/api/a2a', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: messageCounter,
      method: 'SendMessage',
      params: {
        message: {
          messageId: `msg-${Date.now()}-${messageCounter}`,
          role: 'user',
          parts: [{ kind: 'text', text }],
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || 'Agent returned an error');
  }

  return data.result?.task ?? data.result;
}
