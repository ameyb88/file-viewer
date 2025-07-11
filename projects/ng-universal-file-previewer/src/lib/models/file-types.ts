// projects/ng-universal-file-previewer/src/lib/models/file-types.ts
export interface FilePreviewConfig {
  maxFileSize?: number;
  supportedTypes?: FileType[];
  theme?: 'light' | 'dark';
  allowMultipleFiles?: boolean;
  showFileInfo?: boolean;
  autoPreview?: boolean;
}

export interface FilePreviewResult {
  content: string;
  type: FileType;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  filename: string;
  size: number;
  type: string;
  lastModified: Date;
  dimensions?: { width: number; height: number };
  displayDimensions?: { width: number; height: number };
  pageCount?: number;
  sheetNames?: string[];
}

export type FileType =
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'
  | 'csv'
  | 'txt'
  | 'json'
  | 'html'
  | 'xml'
  | 'image'
  | 'unknown';

export interface SupportedMimeTypes {
  [mimeType: string]: FileType;
}

export const SUPPORTED_MIME_TYPES: SupportedMimeTypes = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  'text/plain': 'txt',
  'application/json': 'json',
  'text/html': 'html',
  'text/xml': 'xml',
  'application/xml': 'xml',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
};

export const DEFAULT_CONFIG: Required<FilePreviewConfig> = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedTypes: ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'image'],
  theme: 'light',
  allowMultipleFiles: false,
  showFileInfo: true,
  autoPreview: true,
};
