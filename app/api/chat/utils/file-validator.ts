// app/api/chat/utils/file-validator.ts
import type { FileMetadata } from '@/app/api/chat/types';

export function extractFileMetadata(url: string): FileMetadata {
  const fileName = url.split('/').pop() || 'unknown';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  let fileType: FileMetadata['fileType'] = 'document';
  let fileCategory = 'Document';

  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension)) {
    fileType = 'image';
    fileCategory = 'Image';
  } else if (fileExtension === 'pdf') {
    fileType = 'pdf';
    fileCategory = 'PDF Document';
  } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
    fileType = 'spreadsheet';
    fileCategory = 'Spreadsheet';
  } else if (['doc', 'docx', 'txt', 'md'].includes(fileExtension)) {
    fileType = 'document';
    fileCategory = 'Text Document';
  }

  return {
    url,
    fileName,
    fileExtension,
    fileType,
    fileCategory,
  };
}

export function isImage(url: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
}

export function getFileTools(fileName: string): Array<{ type: string }> {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const tools: Array<{ type: string }> = [];

  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    tools.push({ type: 'code_interpreter' });
  } else if (['pdf', 'txt', 'doc', 'docx', 'md'].includes(ext)) {
    tools.push({ type: 'file_search' });
    tools.push({ type: 'code_interpreter' });
  } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    tools.push({ type: 'code_interpreter' });
  } else {
    tools.push({ type: 'code_interpreter' });
  }

  return tools;
}
