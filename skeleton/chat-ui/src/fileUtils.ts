import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import type { FileAttachment } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TOKEN_ESTIMATE = 200000;

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

const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.docx']);

function getExtension(name: string): string {
  return '.' + name.split('.').pop()?.toLowerCase();
}

export function classifyFile(file: File): 'text' | 'document' | 'binary' {
  const ext = getExtension(file.name);
  if (DOCUMENT_EXTENSIONS.has(ext)) return 'document';
  if (TEXT_EXTENSIONS.has(ext)) return 'text';
  if (file.name.toLowerCase() === 'makefile' || file.name.toLowerCase() === 'dockerfile') return 'text';
  if (TEXT_MIME_PREFIXES.some(p => file.type.startsWith(p))) return 'text';
  return 'binary';
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    if (text.trim()) {
      pages.push(`--- Page ${i} ---\n${text}`);
    }
  }

  return pages.join('\n\n');
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function loadFileContent(file: File): Promise<FileAttachment> {
  const category = classifyFile(file);
  const base: FileAttachment = {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    category,
    status: 'pending',
  };

  if (file.size > MAX_FILE_SIZE) {
    return { ...base, status: 'error', error: `File exceeds ${formatFileSize(MAX_FILE_SIZE)} limit` };
  }

  try {
    let content: string;

    if (category === 'document') {
      const ext = getExtension(file.name);
      if (ext === '.pdf') {
        content = await extractPdfText(file);
      } else if (ext === '.docx') {
        content = await extractDocxText(file);
      } else {
        content = await readFileAsBase64(file);
        return { ...base, category: 'binary', content, status: 'loaded' };
      }

      if (!content.trim()) {
        return { ...base, status: 'error', error: 'No text could be extracted from this document' };
      }
    } else if (category === 'text') {
      content = await readFileAsText(file);
    } else {
      content = await readFileAsBase64(file);
    }

    const tokens = estimateTokens(content);
    const status = tokens > MAX_TOKEN_ESTIMATE ? 'large' as const : 'loaded' as const;
    return { ...base, content, status };
  } catch {
    return { ...base, status: 'error', error: 'Failed to read file' };
  }
}

export function formatMessageWithAttachments(text: string, attachments: FileAttachment[]): string {
  const parts: string[] = [];

  for (const att of attachments) {
    if ((att.status !== 'loaded' && att.status !== 'large') || !att.content) continue;

    if (att.category === 'text' || att.category === 'document') {
      parts.push(
        `[Attached file: ${att.name} (${formatFileSize(att.size)})]\n` +
        `--- BEGIN FILE: ${att.name} ---\n${att.content}\n--- END FILE: ${att.name} ---`
      );
    } else {
      parts.push(
        `[Attached file: ${att.name} (${formatFileSize(att.size)}, binary)]\n` +
        `The following is a base64-encoded file. To process it:\n` +
        `1. Use write_file with path "/tmp/agent-workspace/${att.name}" to save the decoded content\n` +
        `2. Then use appropriate tools to analyze the saved file\n` +
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
