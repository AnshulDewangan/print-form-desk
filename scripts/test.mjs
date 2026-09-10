import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { PDFDocument } from 'pdf-lib';
import { zipSync, unzipSync } from 'fflate';

await mkdir(new URL('../work/test-build/', import.meta.url), {
  recursive: true,
});
for (const name of [
  'geometry',
  'compression',
  'images',
  'pdf',
  'pdf-tools',
  'workflow',
]) {
  const source = await readFile(
    new URL(`../lib/${name}.ts`, import.meta.url),
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  await writeFile(
    new URL(`../work/test-build/${name}.js`, import.meta.url),
    compiled,
  );
}
const { DEFAULT, arrange, cropRect, validateSettings, SHEETS } =
  await import('../work/test-build/geometry.js');
const { printPDF, imagePDF } = await import('../work/test-build/pdf.js');
const { filename } = await import('../work/test-build/images.js');
const { compressToLimit } = await import('../work/test-build/compression.js');
const { parsePages, inspectPDF, combinePDFs } =
  await import('../work/test-build/pdf-tools.js');
const { initialSettings, moveItem } =
  await import('../work/test-build/workflow.js');
let checks = 0;
function check(name, fn) {
  fn();
  checks++;
  console.log(`PASS ${name}`);
}
check(
  'mixed sizes and multi-page sheets never overlap or cross margins',
  () => {
    for (const sheet of Object.values(SHEETS)) {
      const items = [
        { id: 'photo', settings: { ...DEFAULT, copies: 40 } },
        {
          id: 'signature',
          settings: {
            ...DEFAULT,
            width: 600,
            height: 200,
            printWidth: 60,
            copies: 18,
          },
        },
      ];
      const layout = arrange(items, sheet);
      assert.equal(layout.length, 58);
      assert.ok(layout.at(-1).page > 0);
      for (const p of layout) {
        assert.ok(p.x >= 5 && p.y >= 5);
        assert.ok(p.x + p.width <= sheet.width - 5 + 1e-8);
        assert.ok(p.y + p.height <= sheet.height - 5 + 1e-8);
      }
      for (let i = 0; i < layout.length; i++)
        for (let j = i + 1; j < layout.length; j++) {
          const a = layout[i],
            b = layout[j];
          if (a.page === b.page)
            assert.ok(
              a.x + a.width <= b.x + 1e-8 ||
                b.x + b.width <= a.x + 1e-8 ||
                a.y + a.height <= b.y + 1e-8 ||
                b.y + b.height <= a.y + 1e-8,
            );
        }
    }
  },
);
check('oversize prints and invalid inputs fail before export', () => {
  assert.throws(
    () =>
      arrange(
        [{ id: 'x', settings: { ...DEFAULT, printWidth: 150 } }],
        SHEETS.small,
      ),
    /too large/,
  );
  for (const patch of [
    { width: 0 },
    { height: NaN },
    { zoom: 0 },
    { copies: 1.5 },
    { rotation: 45 },
    { x: 101 },
    { maxKB: Infinity },
  ])
    assert.throws(() => validateSettings({ ...DEFAULT, ...patch }));
  assert.deepEqual(arrange([], SHEETS.a4), []);
});
check(
  'cropping remains within landscape and portrait sources at every edge',
  () => {
    for (const [width, height] of [
      [4000, 3000],
      [300, 900],
      [413, 531],
    ])
      for (const zoom of [1, 1.4, 4])
        for (const x of [0, 50, 100])
          for (const y of [0, 50, 100]) {
            const c = cropRect(width, height, { ...DEFAULT, zoom, x, y });
            assert.ok(c.x >= 0 && c.y >= 0);
            assert.ok(
              c.x + c.width <= width + 1e-8 && c.y + c.height <= height + 1e-8,
            );
            assert.ok(
              Math.abs(c.width / c.height - DEFAULT.width / DEFAULT.height) <
                1e-8,
            );
          }
  },
);
check('filenames are distinct and cannot create ZIP paths', () => {
  assert.equal(
    filename('../../customer image.png', 0),
    '01-______customer_image.jpg',
  );
  assert.notEqual(filename('photo.png', 0), filename('photo.jpg', 1));
});
const jpg = Uint8Array.from(
  Buffer.from(
    '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyACgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAMG/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AngC7HAAAAAAAAAAAAAAAAAAAAAAP/9k=',
    'base64',
  ),
);
const positions = arrange(
  [{ id: 'one', settings: { ...DEFAULT, copies: 40 } }],
  SHEETS.a4,
);
const bytes = await printPDF(new Map([['one', jpg]]), positions, SHEETS.a4);
const pdf = await PDFDocument.load(bytes);
check(
  'print export is a readable PDF with the expected page count and physical paper size',
  () => {
    assert.equal(pdf.getPageCount(), positions.at(-1).page + 1);
    assert.ok(Math.abs(pdf.getPage(0).getWidth() - (210 * 72) / 25.4) < 1e-6);
    assert.ok(Math.abs(pdf.getPage(0).getHeight() - (297 * 72) / 25.4) < 1e-6);
  },
);
const individual = await PDFDocument.load(await imagePDF([jpg, jpg]));
check('image-to-PDF emits one page per image', () =>
  assert.equal(individual.getPageCount(), 2),
);
await assert.rejects(
  () => printPDF(new Map(), positions, SHEETS.a4),
  /missing/,
);
await assert.rejects(() => imagePDF([]), /Add an image/);
check('ZIP preserves every JPEG byte', () => {
  const unpacked = unzipSync(
    zipSync({ '01-photo.jpg': jpg, '02-photo.jpg': jpg }, { level: 0 }),
  );
  assert.equal(Object.keys(unpacked).length, 2);
  assert.deepEqual(unpacked['01-photo.jpg'], jpg);
});
const encoder = async (quality) => ({
  quality,
  size: Math.ceil(2000 + quality * 100000),
});
const compressed = await compressToLimit(encoder, 30000);
check(
  'JPEG quality search stays below the byte ceiling without over-compressing',
  () => {
    assert.ok(compressed.size <= 30000);
    assert.ok(compressed.quality > 0.278);
  },
);
const full = await compressToLimit(encoder, 100000);
check('small images retain maximum output quality', () =>
  assert.equal(full.quality, 0.95),
);
await assert.rejects(() => compressToLimit(encoder, 5000), /Cannot meet/);
check(
  'PDF page selections validate ranges and preserve requested order',
  () => {
    assert.deepEqual(parsePages('3, 1, 5-7, 3', 10), [2, 0, 4, 5, 6]);
    assert.deepEqual(parsePages('', 3), [0, 1, 2]);
    for (const invalid of ['0', '4', '2-1', '1,,2', '1.5', 'abc', '1-900000'])
      assert.throws(() => parsePages(invalid, 3));
  },
);
check(
  'compression starts with the whole image and safe output dimensions',
  () => {
    const s = initialSettings('compress', 6000, 4000);
    assert.equal(s.fit, 'contain');
    assert.equal(s.width, 2400);
    assert.equal(s.height, 1600);
    assert.equal(initialSettings('signature', 1200, 800).width, 600);
    assert.throws(() => validateSettings({ ...DEFAULT, fit: 'stretch' }));
  },
);
check('file reordering preserves every file and guards list boundaries', () => {
  assert.deepEqual(moveItem(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c']);
  assert.deepEqual(moveItem(['a', 'b', 'c'], 1, 1), ['a', 'c', 'b']);
  assert.deepEqual(moveItem(['a'], 0, -1), ['a']);
});
const one = await PDFDocument.create();
one.addPage([200, 300]);
one.addPage([400, 500]);
const two = await PDFDocument.create();
two.addPage([600, 700]);
const firstBytes = await one.save(),
  secondBytes = await two.save();
assert.equal(await inspectPDF(firstBytes), 2);
const merged = await PDFDocument.load(
  await combinePDFs([
    { bytes: firstBytes, pages: 2 },
    { bytes: secondBytes, pages: 1 },
  ]),
);
check('PDF merging preserves file order and each page size', () =>
  assert.deepEqual(
    merged.getPages().map((p) => p.getWidth()),
    [200, 400, 600],
  ),
);
const extracted = await PDFDocument.load(
  await combinePDFs([{ bytes: firstBytes, pages: 2 }], parsePages('2,1', 2)),
);
check(
  'extraction creates a new PDF with only the requested pages in order',
  () =>
    assert.deepEqual(
      extracted.getPages().map((p) => p.getWidth()),
      [400, 200],
    ),
);
await assert.rejects(
  () => inspectPDF(new Uint8Array([0, 1, 2, 3])),
  /cannot be opened/,
);
const interactive = await PDFDocument.create();
const interactivePage = interactive.addPage();
interactive.getForm().createTextField('name').addToPage(interactivePage);
await assert.rejects(
  async () => inspectPDF(await interactive.save()),
  /Interactive/,
);
console.log(
  `${checks} checks passed, plus intentional impossible-limit, malformed PDF and interactive-form rejection.`,
);
