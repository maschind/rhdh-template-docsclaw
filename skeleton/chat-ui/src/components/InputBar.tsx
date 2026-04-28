import { useState, useRef } from 'react';
import type { FileAttachment } from '../types';
import { loadFileContent, formatFileSize } from '../fileUtils';

interface Props {
  onSend: (text: string, attachments: FileAttachment[]) => void;
  disabled: boolean;
}

export default function InputBar({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSendableFiles = attachments.some(a => a.status === 'loaded' || a.status === 'large');
  const canSend = !disabled && (text.trim() || hasSendableFiles);

  function handleSubmit() {
    if (!canSend) return;
    const sendable = attachments.filter(a => a.status === 'loaded' || a.status === 'large');
    onSend(text.trim(), sendable);
    setText('');
    setAttachments([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function addFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (attachments.some(a => a.name === file.name)) continue;
      const att = await loadFileContent(file);
      setAttachments(prev => [...prev, att]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }

  function handleRemove(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  return (
    <div
      className={`input-bar${dragOver ? ' drop-zone-active' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {attachments.length > 0 && (
        <div className="attachment-chips">
          {attachments.map((att, i) => (
            <span key={att.name} className={`attachment-chip${att.status === 'error' ? ' file-error' : ''}${att.status === 'large' ? ' file-large' : ''}`}>
              <span className="chip-icon">{att.category === 'binary' ? '\u{1F4CE}' : '\u{1F4C4}'}</span>
              <span className="chip-name">{att.name}</span>
              <span className="chip-size">({formatFileSize(att.size)})</span>
              {att.error && <span className="chip-error">{att.error}</span>}
              {att.status === 'large' && <span className="chip-warning">Large file - may exceed model context</span>}
              <button className="remove-btn" onClick={() => handleRemove(i)} aria-label="Remove">&times;</button>
            </span>
          ))}
        </div>
      )}
      <div className="input-row">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />
        <button
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
          title="Attach file"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachments.length > 0 ? 'Add a message or press Send...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
        />
        <button onClick={handleSubmit} disabled={!canSend}>
          Send
        </button>
      </div>
    </div>
  );
}
