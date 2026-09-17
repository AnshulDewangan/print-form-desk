import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import ts from 'typescript';
const out = new URL('../work/experience-tests/', import.meta.url);
await mkdir(out, { recursive: true });
for (const name of ['assistance', 'tool-catalog']) {
  const source = await readFile(
    new URL(`../lib/${name}.ts`, import.meta.url),
    'utf8',
  );
  await writeFile(
    new URL(`${name}.mjs`, out),
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  );
}
const { suggestTask } = await import(new URL('assistance.mjs', out));
const { matchesTool, TOOL_CATALOG } = await import(
  new URL('tool-catalog.mjs', out)
);
let checks = 0;
function check(name, run) {
  run();
  checks++;
  console.log(`PASS ${name}`);
}
check('guide transfers dimensions and maximum KB together', () => {
  const result = suggestTask('photo 200 x 230 px under 50 KB');
  const url = new URL(result.href, 'https://example.test');
  assert.equal(result.tool, 'photo');
  assert.equal(url.searchParams.get('width'), '200');
  assert.equal(url.searchParams.get('height'), '230');
  assert.equal(url.searchParams.get('maxKB'), '50');
});
check('all nine tools are reachable from supported requests', () => {
  for (const [text, id] of [
    ['resize photo', 'photo'],
    ['resize signature', 'signature'],
    ['image under 50 KB', 'compress'],
    ['print photo sheet', 'sheet'],
    ['images to PDF', 'pdf'],
    ['merge PDFs', 'merge'],
    ['extract PDF pages', 'extract'],
    ['rotate PDF', 'rotatePdf'],
    ['remove PDF pages', 'removePages'],
  ])
    assert.equal(suggestTask(text).tool, id, text);
});
check('guide refuses unavailable and reversed conversions', () => {
  for (const text of [
    'PDF to JPG',
    'PDF to image',
    'compress PDF',
    'reduce PDF size',
    'sign PDF',
    'OCR PDF',
    'PDF to Word',
    'remove background',
  ])
    assert.ok(suggestTask(text).error, text);
});
check(
  'physical sizes, missing units, invalid sizes do not become pixels',
  () => {
    for (const text of [
      'photo 35 x 45 mm',
      'photo 200 x 230',
      'photo -200 x 230 px',
      'photo 200.5 x 230 px',
      'photo 4000 x 230 px',
      'photo under -50 KB',
      'photo under 0 KB',
    ])
      assert.ok(suggestTask(text).error, text);
  },
);
check('ambiguous multiple requests do not silently drop requirements', () => {
  for (const text of [
    'photo 50 KB signature 20 KB',
    'photo under 20 KB or 50 KB',
    'merge PDF then rotate',
  ])
    assert.ok(suggestTask(text).error, text);
});
check('megabyte values convert to decimal KB', () =>
  assert.ok(suggestTask('image under 1 MB').href.includes('maxKB=1000')),
);
check('extraction explains one-output limitation', () =>
  assert.ok(suggestTask('split PDF').notes.some((n) => n.includes('one PDF'))),
);
check('irrelevant and empty requests get clarification', () => {
  assert.ok(suggestTask('').error);
  assert.ok(suggestTask('hello').error);
});
check(
  'catalog finds common requests without false PDF-compression claims',
  () => {
    assert.equal(matchesTool('merge', 'combine PDF'), true);
    assert.equal(matchesTool('compress', '50 KB'), true);
    assert.equal(matchesTool('compress', 'compress PDF'), false);
    assert.equal(Object.keys(TOOL_CATALOG).length, 9);
  },
);
console.log(`${checks} experience regression checks passed.`);
