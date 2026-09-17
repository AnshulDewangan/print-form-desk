import { degrees, PDFDocument } from 'pdf-lib';
export type PDFAsset = {
  id: string;
  name: string;
  url: string;
  bytes: Uint8Array;
  pages: number;
};
export function parsePages(text: string, count: number): number[] {
  if (!Number.isInteger(count) || count < 1)
    throw new Error('This PDF has no usable pages.');
  if (!text.trim()) return Array.from({ length: count }, (_, i) => i);
  const result: number[] = [];
  for (const part of text.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('Enter page numbers like 1, 3, 5-8.');
    const start = Number(match[1]),
      end = Number(match[2] ?? match[1]);
    if (start < 1 || end > count || end < start)
      throw new Error(
        `Use page numbers between 1 and ${count}, with ranges in ascending order.`,
      );
    for (let n = start; n <= end; n++)
      if (!result.includes(n - 1)) result.push(n - 1);
  }
  return result;
}
export async function inspectPDF(bytes: Uint8Array) {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes);
  } catch {
    throw new Error(
      'This PDF cannot be opened. Use an undamaged PDF without password protection.',
    );
  }
  const pages = doc.getPageCount();
  if (!pages || pages > 300) throw new Error('Use a PDF with 1–300 pages.');
  if (doc.getForm().getFields().length)
    throw new Error(
      'Interactive or signed PDF forms are not supported. Save a flattened copy using Print to PDF, then add that copy.',
    );
  return pages;
}
export async function combinePDFs(
  files: Pick<PDFAsset, 'bytes' | 'pages'>[],
  selection?: number[],
) {
  if (!files.length) throw new Error('Choose a PDF first.');
  if (files.reduce((n, f) => n + f.pages, 0) > 300)
    throw new Error('A PDF job can contain up to 300 pages.');
  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(file.bytes);
    const indices = selection ?? source.getPageIndices();
    if (
      !indices.length ||
      indices.some(
        (i) => !Number.isInteger(i) || i < 0 || i >= source.getPageCount(),
      )
    )
      throw new Error('Choose valid pages to include.');
    for (const page of await output.copyPages(source, indices))
      output.addPage(page);
  }
  output.setTitle('Sahajly');
  return output.save();
}

export async function rotatePDF(
  bytes: Uint8Array,
  indices: number[],
  angle: 90 | 180 | 270,
) {
  const document = await PDFDocument.load(bytes);
  for (const index of indices) {
    const page = document.getPage(index);
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }
  return document.save();
}

export async function removePDFPages(bytes: Uint8Array, indices: number[]) {
  const source = await PDFDocument.load(bytes);
  const removed = new Set(indices);
  const keep = source.getPageIndices().filter((index) => !removed.has(index));
  if (!keep.length)
    throw new Error('You must keep at least one page in the PDF.');
  const output = await PDFDocument.create();
  for (const page of await output.copyPages(source, keep)) output.addPage(page);
  output.setTitle('Sahajly');
  return output.save();
}
