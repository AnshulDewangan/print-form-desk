# Feature coverage

Reference: https://www.ilovepdf.com/ — public catalog reviewed 2026-09-14.
This is an implementation checklist, not a claim of feature parity or a test of the reference site's paid features.

## Current tools

Photo resizing, signature resizing, image compression, photo print sheets, images to PDF, merging PDFs, extracting pages, rotating PDF pages, removing PDF pages.
These process files in the browser. Existing PDF tools reject encrypted and interactive-form PDFs. Extract pages is not the same as splitting into multiple output files.

## Reference catalog coverage

| Feature | Current coverage / remaining implementation |
| --- | --- |
| Merge PDF | Available; file ordering, limited to 300 pages per job |
| Split PDF | Extract into one file available; separate files/range ZIP still missing |
| Compress PDF | Missing; image compression does not compress PDFs |
| JPG to PDF | Available through Images to PDF; more page-layout options needed |
| PDF to JPG | Missing; page rendering and ZIP export needed |
| Word to PDF | Missing; conversion service/engine needed |
| PowerPoint to PDF | Missing; conversion service/engine needed |
| Excel to PDF | Missing; conversion engine and print-layout handling needed |
| HTML to PDF | Missing; isolated renderer with network access restrictions needed |
| PDF to Word | Missing; layout reconstruction/OCR engine needed |
| PDF to PowerPoint | Missing; conversion engine needed |
| PDF to Excel | Missing; table detection and conversion engine needed |
| PDF to PDF/A | Missing; standards-compliant conversion and validation needed |
| Remove pages | Available |
| Extract pages | Available |
| Organize PDF | Partial: extraction order and file ordering; visual page organizer missing |
| Scan to PDF | Missing; camera capture and perspective correction needed |
| Repair PDF | Missing; recovery engine and damaged-file test set needed |
| OCR PDF | Missing; OCR engine/languages and searchable text-layer output needed |
| Rotate PDF | Available; selected pages or all pages in selected PDF |
| Page numbers | Missing |
| Watermark | Missing |
| Crop PDF | Missing; crop boxes must not be represented as secure redaction |
| Edit PDF | Missing; overlay editor distinct from editing original document text |
| PDF Forms | Missing; current importer rejects interactive forms |
| Unlock PDF | Missing; authenticated password input/decryption support needed |
| Protect PDF | Missing; encryption-capable PDF engine needed |
| Sign PDF | Missing; local signature placement and remote signing are separate capabilities |
| Redact PDF | Missing; permanent content removal and verification required |
| Compare PDF | Missing; page alignment and comparison display needed |
| AI Summarizer | Missing; model provider and usage/cost controls needed |
| Translate PDF | Missing; translation provider and layout reconstruction needed |
| PDF to Markdown | Missing; text/layout extraction with explicit scanned-page limitations needed |
| Saved workflows | Missing; existing saved sizes are not multi-tool workflows |

## Site/product content

Tool catalog/search available; category filtering added. Individual tool landing pages, FAQs by tool, multilingual interface, SEO sitemap, and working support contact remain incomplete. Pricing, account, privacy, terms and refund pages exist but require validation against actual production behavior. Desktop/mobile native apps, public API, business/team products and signature-request services are separate products, not implemented website features. Do not copy reference marketing claims, certifications, usage numbers, legal text or branding.

## Approved architecture boundary

User permits server-side processing, with approval required before paid services. No new paid service has been selected or enabled. Browser processing remains the default for existing tools. A server conversion rollout needs: chosen runtime/provider, engine licensing review, upload caps, bounded jobs, per-user quotas, timeouts, isolation, temporary-file deletion, status/cancel APIs and updated privacy disclosures. Existing Cloudflare hosting is not evidence that a native document conversion engine is already available there.

## Delivery order

1. Accurate catalog, consistent simple navigation, existing-tool regression fixes.
2. Browser tools: split ZIP, PDF-to-JPG, numbering, watermark, visual organizer.
3. Conversion engine integration: office formats, optimization, protection, repair, PDF/A.
4. OCR, editing/forms, redaction, comparison, signing, AI and translation.
5. Per-tool documentation, real support channel, mobile and file-corpus QA.

Each feature must pass upload-to-download checks before being advertised as available. This checklist does not mean all features are complete.
