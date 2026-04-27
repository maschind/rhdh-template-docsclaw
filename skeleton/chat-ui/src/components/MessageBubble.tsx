import Markdown from 'react-markdown';
import type { ChatMessage } from '../types';
import { formatFileSize } from '../fileUtils';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  return (
    <div className={`bubble ${message.role}`}>
      {message.role === 'user' && message.attachments && message.attachments.length > 0 && (
        <div className="attachment-indicators">
          {message.attachments.map((att, i) => (
            <span key={i} className="attachment-indicator">
              {att.category === 'text' ? '\u{1F4C4}' : '\u{1F4CE}'} {att.name} ({formatFileSize(att.size)})
            </span>
          ))}
        </div>
      )}
      {message.role === 'agent' ? (
        <Markdown>{message.content}</Markdown>
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  );
}
