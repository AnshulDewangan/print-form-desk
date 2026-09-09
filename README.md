# Print & Form Desk

Device-local photo and signature preparation beta for print shops. Customer files live in tab memory; localStorage contains reusable settings only. No customer image upload, checkout, subscriptions, account sync or official portal compliance verification is implemented.

## Development

`npm ci`, then `npm run dev`. Run `node scripts/test.mjs`, `npx tsc --noEmit` and `npm run build` before publishing. Sites metadata is in `.openai/hosting.json`.

## Included

- Multiple JPEG/PNG/WebP images, independent crop, zoom, rotation and dimensions.
- JPEG quality search within a decimal KB limit; fails if the dimensions cannot meet that limit.
- Local presets and batch settings. Crop placement is kept per image.
- Individual JPG, ZIP, mixed-copy A4/4×6 print PDF and one-image-per-A4 PDF exports.
- Browser-optional WebMCP tools `read_print_job` and `configure_selected_image`; validate input and use visible React state.

## Validation and launch boundaries

Automated checks cover crop bounds, layout non-overlap and margins, multi-page packing, invalid settings, readable PDF output, page dimensions and ZIP integrity. Browser UI, native canvas output and download behavior have not been browser-tested in this session. No supported WebMCP validation context was exposed, so its runtime contract remains unverified. Print at 100% and check a physical sample before customer use.

This beta is intended for private review. Taking payments requires a real payment provider, server-side entitlement checks, account recovery, pricing and support policies before public commercial launch.
