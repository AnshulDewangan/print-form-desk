import { cp, mkdir } from 'node:fs/promises';
for (const folder of ['cmaps', 'standard_fonts', 'wasm']) {
  const destination = new URL(`../public/pdfjs/${folder}/`, import.meta.url);
  await mkdir(destination, { recursive: true });
  await cp(
    new URL(`../node_modules/pdfjs-dist/${folder}/`, import.meta.url),
    destination,
    { recursive: true },
  );
}
