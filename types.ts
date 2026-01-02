
export enum ModuleType {
  SUB_GHZ = 'Sub-GHz',
  NFC = 'NFC',
  RFID = 'RFID',
  INFRARED = 'Infrared',
  BLUETOOTH = 'Bluetooth',
  WIFI = 'Wi-Fi 7',
  GPIO = 'GPIO',
  NEURAL_LAB = 'Neural Lab'
}

export interface SignalData {
  timestamp: number;
  value: number;
}

export interface HistoryItem {
  id: string;
  type: ModuleType;
  action: string;
  timestamp: string;
  data: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: string[];
  type?: 'text' | 'image' | 'video' | 'audio';
  sources?: Array<{ title: string; uri: string }>;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
