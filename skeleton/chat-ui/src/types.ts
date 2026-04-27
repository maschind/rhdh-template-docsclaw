export interface AgentCard {
  name: string;
  description: string;
  version: string;
  protocolVersion: string;
  url: string;
  skills: Skill[];
  capabilities: Record<string, unknown>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
}

export interface TextPart {
  text: string;
}

export interface A2AMessage {
  messageId: string;
  role: string;
  parts: TextPart[];
}

export interface TaskStatus {
  state: string;
  message?: A2AMessage;
  timestamp: string;
}

export interface Artifact {
  artifactId: string;
  parts: TextPart[];
}

export interface A2ATask {
  id: string;
  contextId: string;
  history: A2AMessage[];
  artifacts?: Artifact[];
  status: TaskStatus;
}

export interface FileAttachment {
  file: File;
  name: string;
  size: number;
  type: string;
  category: 'text' | 'binary';
  content?: string;
  status: 'pending' | 'loaded' | 'error';
  error?: string;
}

export interface FileAttachmentMeta {
  name: string;
  size: number;
  category: 'text' | 'binary';
}

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  attachments?: FileAttachmentMeta[];
}
