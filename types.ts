
export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export enum VoiceState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface AuditData {
  maturityScore: number;
  identifiedPains: string[];
  recommendedPacks: string[];
  potentialROI: string;
  transformationPlan: string[];
}

export type AppView = 'chat' | 'audit';
