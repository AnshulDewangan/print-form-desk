import { DEFAULT, PRESETS, type Settings } from './geometry.js';
export type ToolId =
  | 'photo'
  | 'signature'
  | 'compress'
  | 'sheet'
  | 'pdf'
  | 'merge'
  | 'extract';
export const TOOL_INFO = {
  photo: {
    title: 'Photo resizer',
    short: 'Photo',
    description: 'Set photo dimensions for an online form.',
    action: 'Prepare JPG',
    accept: 'Choose photos',
    hint: 'Enter the dimensions shown on your form, then check the crop.',
  },
  signature: {
    title: 'Signature resizer',
    short: 'Signature',
    description: 'Prepare a signature with the right size and shape.',
    action: 'Prepare signature JPG',
    accept: 'Choose signatures',
    hint: 'Start with a clear signature image. Crop away extra blank paper if needed.',
  },
  compress: {
    title: 'Reduce file size',
    short: 'Compress',
    description: 'Make an image fit a KB upload limit.',
    action: 'Prepare smaller JPG',
    accept: 'Choose images',
    hint: 'Set the maximum file size accepted by your form. The result stays below that limit.',
  },
  sheet: {
    title: 'Photo print sheet',
    short: 'Print sheet',
    description: 'Arrange photo copies on A4 or 4 × 6 paper.',
    action: 'Prepare print PDF',
    accept: 'Choose photos',
    hint: 'Set the number of copies for each photo. Choose paper size and check every page.',
  },
  pdf: {
    title: 'Images to PDF',
    short: 'PDF',
    description: 'Put images into one PDF, one image per page.',
    action: 'Prepare PDF',
    accept: 'Choose images',
    hint: 'Add images in the order you want. Use the arrows in the file list to rearrange pages.',
  },
  merge: {
    title: 'Merge PDFs',
    short: 'Merge PDFs',
    description: 'Combine PDF files in the order you choose.',
    action: 'Prepare merged PDF',
    accept: 'Choose PDFs',
    hint: 'Add two or more PDFs. Reorder the files before combining them.',
  },
  extract: {
    title: 'Extract PDF pages',
    short: 'Extract pages',
    description: 'Save selected pages from a PDF as a new file.',
    action: 'Prepare selected pages',
    accept: 'Choose a PDF',
    hint: 'Choose one PDF, then enter the page numbers you want to keep.',
  },
} as const;
export function initialSettings(
  tool: ToolId,
  width: number,
  height: number,
): Settings {
  if (tool === 'signature') return { ...PRESETS[2].settings, fit: 'cover' };
  if (tool === 'compress' || tool === 'pdf') {
    const scale = Math.min(1, 2400 / Math.max(width, height));
    return {
      ...DEFAULT,
      width: Math.max(32, Math.round(width * scale)),
      height: Math.max(32, Math.round(height * scale)),
      fit: 'contain',
      copies: 1,
    };
  }
  return { ...DEFAULT, fit: 'cover' };
}
export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = [...items],
    target = index + direction;
  if (
    index < 0 ||
    index >= items.length ||
    target < 0 ||
    target >= items.length
  )
    return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
export function formatBytes(bytes: number) {
  return bytes < 1000000
    ? `${(bytes / 1000).toFixed(1)} KB`
    : `${(bytes / 1000000).toFixed(1)} MB`;
}
