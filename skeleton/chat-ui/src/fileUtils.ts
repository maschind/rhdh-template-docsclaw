import type { FileAttachment } from './types';

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.csv', '.json', '.yaml', '.yml', '.xml', '.html', '.css',
  '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.java', '.rs', '.c', '.cpp',
  '.h', '.hpp', '.sh', '.bash', '.zsh', '.sql', '.toml', '.ini', '.cfg',
  '.env', '.log', '.rb', '.php', '.swift', '.kt', '.scala', '.r', '.m',
  '.pl', '.lua', '.dockerfile', '.makefile', '.tf', '.hcl', '.proto',
]);

const TEXT_MIME_PREFIXES = ['text/', 'application/json', 'application/xml',
  'application/yaml', 'application/x-yaml', 'application/javascript',
  'application/typescript'];

export function isTextFile(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (file.name.toLowerCase() === 'makefile' || file.name.toLowerCase() === 'dockerfile') return true;
  return TEXT_MIME_PREFIXES.some(p => file.type.startsWith(p));
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function loadFileContent(file: File): Promise<FileAttachment> {
  const base: FileAttachment = {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    category: isTextFile(file) ? 'text' : 'binary',
    status: 'pending',
  };

  if (file.size > MAX_FILE_SIZE) {
    return { ...base, status: 'error', error: `File exceeds ${formatFileSize(MAX_FILE_SIZE)} limit` };
  }

  try {
    const content = base.category === 'text'
      ? await readFileAsText(file)
      : await readFileAsBase64(file);
    return { ...base, content, status: 'loaded' };
  } catch {
    return { ...base, status: 'error', error: 'Failed to read file' };
  }
}

export function formatMessageWithAttachments(text: string, attachments: FileAttachment[]): string {
  const parts: string[] = [];

  for (const att of attachments) {
    if (att.status !== 'loaded' || !att.content) continue;

    if (att.category === 'text') {
      parts.push(
        `[Attached file: ${att.name} (${formatFileSize(att.size)})]\n` +
        `--- BEGIN FILE: ${att.name} ---\n${att.content}\n--- END FILE: ${att.name} ---`
      );
    } else {
      parts.push(
        `[Attached file: ${att.name} (${formatFileSize(att.size)}, binary)]\n` +
        `The following is a base64-encoded file. To process it:\n` +
        `1. Use write_file to save the decoded content to your workspace as "${att.name}"\n` +
        `2. Then use appropriate tools to analyze it\n` +
        `--- BEGIN BASE64: ${att.name} ---\n${att.content}\n--- END BASE64: ${att.name} ---`
      );
    }
  }

  const userText = text.trim() || 'Please analyze the attached file(s).';
  parts.push(userText);
  return parts.join('\n\n');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
