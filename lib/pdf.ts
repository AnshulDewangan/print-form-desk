import { PDFDocument, rgb } from 'pdf-lib';
import type { Placement } from './geometry.js';
const pt = (mm: number) => (mm * 72) / 25.4;
export async function printPDF(
  images: Map<string, Uint8Array>,
  positions: Placement[],
  sheet: { width: number; height: number },
) {
  if (!positions.length) throw new Error('Add an image first.');
  const pdf = await PDFDocument.create();
  const embedded = new Map();
  for (const [id, bytes] of images) embedded.set(id, await pdf.embedJpg(bytes));
  for (let pageIndex = 0; pageIndex <= positions.at(-1)!.page; pageIndex++) {
    const page = pdf.addPage([pt(sheet.width), pt(sheet.height)]);
    for (const p of positions.filter((p) => p.page === pageIndex)) {
      const x = pt(p.x),
        y = pt(sheet.height - p.y - p.height),
        w = pt(p.width),
        h = pt(p.height);
      if (!embedded.has(p.id)) throw new Error('A print image is missing.');
      page.drawImage(embedded.get(p.id), { x, y, width: w, height: h });
      // Marks stay outside the image and inside its 2 mm gutter.
      for (const [cx, cy, sx, sy] of [
        [x, y, -1, -1],
        [x + w, y, 1, -1],
        [x, y + h, -1, 1],
        [x + w, y + h, 1, 1],
      ]) {
        page.drawLine({
          start: { x: cx + sx * pt(0.25), y: cy },
          end: { x: cx + sx * pt(0.8), y: cy },
          thickness: 0.25,
          color: rgb(0.55, 0.55, 0.55),
        });
        page.drawLine({
          start: { x: cx, y: cy + sy * pt(0.25) },
          end: { x: cx, y: cy + sy * pt(0.8) },
          thickness: 0.25,
          color: rgb(0.55, 0.55, 0.55),
        });
      }
    }
  }
  pdf.setTitle('Sahajly — photo sheet');
  return pdf.save();
}
export async function imagePDF(images: Uint8Array[]) {
  if (!images.length) throw new Error('Add an image first.');
  const pdf = await PDFDocument.create();
  for (const bytes of images) {
    const image = await pdf.embedJpg(bytes);
    const page = pdf.addPage([pt(210), pt(297)]);
    const scale = Math.min(pt(190) / image.width, pt(277) / image.height);
    const w = image.width * scale,
      h = image.height * scale;
    page.drawImage(image, {
      x: (pt(210) - w) / 2,
      y: (pt(297) - h) / 2,
      width: w,
      height: h,
    });
  }
  pdf.setTitle('Sahajly — images');
  return pdf.save();
}
