'use client';

const SUPPORTED_EXTENSIONS = ['txt', 'md', 'rtf', 'json', 'csv'];

const getExtension = (filename = '') => {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export function isSupportedResumeFile(file) {
  if (!file) return false;
  if (file.type?.startsWith('text/')) return true;
  return SUPPORTED_EXTENSIONS.includes(getExtension(file.name));
}

export async function extractResumeText(file) {
  if (!file) throw new Error('Choose a file to upload.');
  if (!isSupportedResumeFile(file)) {
    throw new Error('Supported files: TXT, MD, RTF, CSV, and other plain-text documents.');
  }

  const text = await file.text();
  const normalized = text.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    throw new Error('The selected file is empty.');
  }

  return normalized;
}
