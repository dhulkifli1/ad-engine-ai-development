// app/api/chat/services/file-processor.ts
'use server';

import openai from '@/lib/openai-server';
import { extractFileMetadata, isImage } from '@/app/api/chat/utils/file-validator';

export async function processAttachments(attachments: string[]) {
  console.log('[FileProcessor] Processing attachments...');
  
  const imageUrls: string[] = [];
  const fileIds: string[] = [];
  const fileDetails: Array<{ id: string; name: string; type: string }> = [];

  for (const url of attachments) {
    const meta = extractFileMetadata(url);
    
    if (isImage(url)) {
      console.log('[FileProcessor] Found image:', meta.fileName);
      imageUrls.push(url);
    } else {
      console.log('[FileProcessor] Uploading file:', meta.fileName);
      const uploaded = await uploadToOpenAI(url, meta);
      if (uploaded) {
        fileIds.push(uploaded.id);
        fileDetails.push({
          id: uploaded.id,
          name: uploaded.filename,
          type: uploaded.filename.split('.').pop()!.toUpperCase(),
        });
      }
    }
  }

  console.log('[FileProcessor] ✓ Processed:', { images: imageUrls.length, files: fileIds.length });
  return { imageUrls, fileIds, fileDetails };
}

async function uploadToOpenAI(url: string, meta: any) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    
    const blob = await res.blob();
    const file = new File([blob], meta.fileName, { type: blob.type });

    const uploaded = await openai.files.create({
      file,
      purpose: 'assistants',
    });

    console.log('[FileProcessor] ✓ Uploaded:', uploaded.id);
    return uploaded;
  } catch (err) {
    console.error('[FileProcessor] ✗ Upload failed:', err);
    return null;
  }
}

export async function analyzeImage(imageUrl: string): Promise<string> {
  console.log('[FileProcessor] Analyzing image...');
  
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all text from this image' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
  });
  
  const text = res.choices[0]?.message.content || '';
  console.log('[FileProcessor] ✓ Image analyzed');
  return text;
}

export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  console.log('[FileProcessor] Extracting PDF text...');
  console.log('[FileProcessor] ⚠ PDF extraction not yet implemented');
  return '';
}
