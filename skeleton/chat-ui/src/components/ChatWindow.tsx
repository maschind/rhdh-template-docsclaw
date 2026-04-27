import { useRef, useEffect } from 'react';
import type { ChatMessage, FileAttachment } from '../types';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (text: string, attachments: FileAttachment[]) => void;
}

export default function ChatWindow({ messages, isLoading, error, onSend }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.length === 0 && !isLoading && (
          <div className="empty-state">Send a message to start chatting.</div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="bubble agent">
            <div className="thinking">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}
        <div ref={bottomRef} />
      </div>
      <InputBar onSend={onSend} disabled={isLoading} />
    </div>
  );
}
