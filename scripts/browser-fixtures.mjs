// Synthetic, non-customer inputs for repeatable browser workflow checks.
import sharp from 'sharp';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../work/qa/', import.meta.url);
await mkdir(directory, { recursive: true });
const width = 800,
  height = 1000,
  pixels = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++)
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3,
      v = (x * 17 + y * 31) % 47;
    pixels[i] = (x < 400 ? 160 : 30) + v;
    pixels[i + 1] = (y < 500 ? 50 : 160) + v;
    pixels[i + 2] = (x < 400 ? 30 : 150) + v;
  }
await sharp(pixels, { raw: { width, height, channels: 3 } })
  .jpeg({ quality: 95 })
  .toFile(
    new URL('test-photo.jpg', directory).pathname.replace(
      /^\/([A-Za-z]:)/,
      '$1',
    ),
  );
await sharp({
  create: {
    width: 600,
    height: 200,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  },
})
  .composite([
    {
      input: Buffer.from(
        '<svg width="600" height="200"><text x="40" y="120" font-size="48" fill="#111">TEST SIGNATURE</text></svg>',
      ),
    },
  ])
  .png()
  .toFile(
    new URL('test-signature.png', directory).pathname.replace(
      /^\/([A-Za-z]:)/,
      '$1',
    ),
  );
for (const [filename, count] of [
  ['file-a.pdf', 2],
  ['file-b.pdf', 1],
]) {
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= count; i++) {
    const page = pdf.addPage([595, 842]);
    page.drawText(`${filename} - Page ${i}`, {
      x: 50,
      y: 750,
      font,
      size: 24,
      color: rgb(0.1, 0.3, 0.2),
    });
  }
  await writeFile(new URL(filename, directory), await pdf.save());
}
console.log('Browser fixtures prepared in work/qa.');
