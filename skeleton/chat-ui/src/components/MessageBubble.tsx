import Markdown from 'react-markdown';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  return (
    <div className={`bubble ${message.role}`}>
      {message.role === 'agent' ? (
        <Markdown>{message.content}</Markdown>
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  );
}
