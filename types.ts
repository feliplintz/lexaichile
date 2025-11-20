export interface NormativeDoc {
  id: string;
  name: string;
  content: string; // Base64 encoded content
  mimeType: string;
}

export interface CaseFile {
  id: string;
  name: string;
  uploadDate: string;
  content: string; // Base64 encoded content
  mimeType: string;
}

export interface CaseEvent {
  date: string;
  title: string;
  description: string;
  type: 'resolucion' | 'escrito' | 'otro';
}

export interface Case {
  id: string;
  rol: string; // e.g., C-123-2024
  caratula: string; // DEMANDANTE / DEMANDADO
  court: string;
  files: CaseFile[];
  timeline: CaseEvent[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: string[];
  isThinking?: boolean;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CASE_DETAIL = 'CASE_DETAIL',
  SETTINGS = 'SETTINGS',
}