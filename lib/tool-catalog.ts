import type { ToolId } from './workflow';
export const TOOL_CATALOG: Record<
  ToolId,
  { category: 'Images' | 'PDFs'; keywords: string; detail: string }
> = {
  photo: {
    category: 'Images',
    keywords: 'resize passport dimensions pixels crop jpg photo image',
    detail: 'Resize or crop a photo to the exact dimensions you need.',
  },
  signature: {
    category: 'Images',
    keywords: 'signature sign resize scan image',
    detail: 'Resize your signature image and adjust its crop for a form.',
  },
  compress: {
    category: 'Images',
    keywords:
      'compress smaller reduce image jpg png webp 20 kb 50 kb 100 kb size',
    detail: 'Reduce an image to fit a maximum file size in KB.',
  },
  sheet: {
    category: 'Images',
    keywords: 'passport print sheet a4 copies photo',
    detail: 'Arrange photo copies on A4 or 4 × 6 paper, ready to print.',
  },
  pdf: {
    category: 'PDFs',
    keywords: 'jpg png webp images photos to pdf convert',
    detail: 'Combine images into a PDF, with one image on each page.',
  },
  merge: {
    category: 'PDFs',
    keywords: 'combine join merge pdf documents',
    detail: 'Join multiple PDFs in the order you choose.',
  },
  extract: {
    category: 'PDFs',
    keywords: 'extract split select keep pages pdf',
    detail: 'Save selected pages, in your chosen order, as a new PDF.',
  },
  rotatePdf: {
    category: 'PDFs',
    keywords: 'rotate sideways upside down pdf pages',
    detail: 'Turn selected pages or the entire PDF the right way up.',
  },
  removePages: {
    category: 'PDFs',
    keywords: 'remove delete unwanted blank pages pdf',
    detail: 'Remove pages you select and keep the rest of the PDF.',
  },
};
export function matchesTool(id: ToolId, query: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const content =
    `${TOOL_CATALOG[id].keywords} ${TOOL_CATALOG[id].detail}`.toLowerCase();
  return words.every((word) => content.includes(word));
}
