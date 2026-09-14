# Print & Form Desk

Device-local photo, signature and PDF workspace. Seven free tools share an Add → Adjust & preview → Download flow. The application workspace adds photo/signature packs, optional original attachments, account templates and Personal/Shop passes. Customer files live in tab memory. D1 stores template settings and billing records; customer file uploads and official portal compliance verification are not implemented.

## Development

`npm ci`, then `npm run dev`. Run `node scripts/test.mjs`, `npx tsc --noEmit` and `npm run build` before publishing. The production target is Cloudflare Workers with a D1 binding named `DB`.

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

The Cloudflare deployment includes Supabase sign-in, D1-backed templates and Razorpay test-mode checkout wiring. Keep live purchases closed until Razorpay onboarding, UPI/payment-method activation, live keys, webhook verification, refund handling and support/legal details are checked end to end.

## Paid workspace

- Personal: proposed ₹49 / 30 days, application-pack ZIP downloads and 5 account templates.
- Shop: proposed ₹199 / 30 days, the same processing, 50 account templates and next-customer reset preserving settings.
- Free tools stay free. Passes do not renew automatically; another pass can be purchased after expiry. Test grants are isolated from live grants.
- Supabase Auth supports public Google login and email magic links. The client keeps its session and sends its access token to the Worker; the Worker asks Supabase to validate the token and stores only a namespaced provider ID in D1.
- Razorpay orders use server-defined prices, signature verification and API-confirmed captured payments. Payment/order uniqueness prevents duplicate grants. Webhooks activate access even if the customer closes checkout, and refund notifications revoke access. A refreshed account checks expiry on every request.
- D1 uses generated Drizzle migrations. Apply the migration locally using Wrangler against the configured DB before testing signed-in pages. The hosted package applies migrations during deployment.
- `node scripts/test-billing.mjs` exercises production modules against an isolated in-memory SQLite database and mocked payment-provider responses. No test grants are written to the app database.

### Merchant setup before enabling purchases

Configure the keys named in `.env.example` securely in Sites, starting with `BILLING_MODE=test`. Subscribe the merchant webhook to `payment.captured`, `refund.created` and `refund.processed` at `/api/billing/webhook`. Set its secret separately from the API secret. Set `BILLING_ENABLED=true` only after keys and webhook are configured. Keep local environment values and hosted runtime values aligned; never commit credentials.

Before live mode, verify actual test checkout, payment failure, closing checkout after payment, duplicate webhook delivery, refunds, template ownership and normal-browser downloads. Finalise business identity, support contact, customer-facing refund terms and applicable tax treatment before opening sales. Configure live keys and a live webhook secret, then set `BILLING_MODE=live` and deploy. Existing test passes cannot become live passes.

Client-side processing cannot provide tamper-proof feature locks. Server-backed templates and account operations are access-controlled; determined users can reproduce browser-only image/ZIP processing. Background removal, document cleanup, receipts, automatic renewals and team seats are not part of this release.
