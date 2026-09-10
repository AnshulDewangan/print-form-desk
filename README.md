# Print & Form Desk

Device-local photo, signature and PDF workspace. Seven discoverable tools share an Add → Adjust & preview → Download flow. Customer files live in tab memory; localStorage contains reusable settings only. No customer file uploads, checkout, subscriptions, account sync or official portal compliance verification is implemented.

## Development

`npm ci`, then `npm run dev`. Run `node scripts/test.mjs`, `npx tsc --noEmit` and `npm run build` before publishing. Sites metadata is in `.openai/hosting.json`.

## Included

- Multiple JPEG/PNG/WebP images, independent crop, zoom, rotation and dimensions.
- JPEG quality search within a decimal KB limit; fails if the dimensions cannot meet that limit.
- Local presets and batch settings. Crop placement is kept per image.
- Individual JPG, ZIP, mixed-copy A4/4×6 print PDF and one-image-per-A4 PDF exports.
- Merge PDFs, extract selected pages, reorder files and preview PDF pages with the bundled PDF.js viewer.
- Original-versus-edited image comparison, full-image/white-padding mode, crop undo, saved-size management, batch processing cancellation and an explicit new-job confirmation.
- Print PDFs use high quality independently of upload KB limits. Images to PDF uses uncropped originals by default.
- Browser-optional WebMCP tools `read_print_job` and `configure_selected_image`; validate input and use visible React state.

## Validation and launch boundaries

Automated checks cover crop bounds, non-overlap, paper margins, multi-page packing, invalid settings, compression ceilings, readable PDF output, merge/extract page order, file reordering and ZIP integrity. Browser checks cover file selection, real JPG/PDF generation, saved-size persistence, error messages, 390px mobile layout and PDF.js page rendering/navigation. The WebMCP read/configure tools were exercised with valid and invalid inputs and read-back of visible state.

The embedded testing browser did not emit a native download event for blob links, so saving into a normal browser's Downloads folder remains a manual release check. Generated files are exposed as explicit download links, with a separate open-file fallback. Use a normal browser if an embedded browser does not support local file downloads. Check a physical print at 100% before customer use. Password-protected and interactive PDF forms are intentionally rejected; PDF limits are 12 files, 20 MB per file, 60 MB combined and 300 total pages. Image batches are capped at 30 files and 60 megapixels in memory.

PDF viewer assets are copied from the installed pdfjs-dist version by predev/prebuild. They are served from this site rather than an external CDN. `scripts/browser-fixtures.mjs` creates synthetic local QA files in ignored `work/qa/`.

This beta is intended for private review. Taking payments requires a real payment provider, server-side entitlement checks, account recovery, pricing and support policies before public commercial launch.
