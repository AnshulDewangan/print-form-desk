export function suggestTask(input: string) {
  const text = input.trim().toLowerCase();
  const params = new URLSearchParams();
  if (!text) return { error: 'Describe the file and what you want to change.' };
  if (
    /ocr|\bword\b|excel|powerpoint|translate|summari|background|watermark|redact|encrypt|unlock|protect|compress.*pdf|pdf.*compress/.test(
      text,
    )
  )
    return {
      error:
        'This guide cannot prepare that task yet. Try resizing an image, merging PDFs, extracting pages or rotating a PDF.',
    };
  const pdf = /pdf/.test(text);
  if (
    pdf &&
    (/pdf\s*(?:to|into|as)\s*(?:an?\s+)?(?:image|photo|jpg|jpeg|png)/.test(
      text,
    ) ||
      /sign(?:ature)?\b/.test(text) ||
      /smaller|reduce|\bkb\b|\bmb\b/.test(text))
  )
    return {
      error:
        'PDF-to-image conversion, signing PDFs and PDF compression are not available. The signature tool only resizes an existing signature image.',
    };
  if (
    (/photo|image/.test(text) && /signature/.test(text)) ||
    /\bthen\b/.test(text)
  )
    return {
      error:
        'Describe one task at a time so the settings stay clear. For a photo and signature together, use Packs & plans in the workspace.',
    };
  let tool = /signature/.test(text)
    ? 'signature'
    : pdf && /image|photo|jpg|png/.test(text)
      ? 'pdf'
      : pdf && /merge|combine|join/.test(text)
        ? 'merge'
        : pdf && /remove|delete/.test(text)
          ? 'removePages'
          : pdf && /extract|split|keep/.test(text)
            ? 'extract'
            : pdf && /rotate|sideways/.test(text)
              ? 'rotatePdf'
              : /print|sheet|copies/.test(text)
                ? 'sheet'
                : !pdf && /compress|smaller|reduce|\d\s*(?:kb|mb)\b/.test(text)
                  ? 'compress'
                  : /photo|image|resize/.test(text)
                    ? 'photo'
                    : '';
  if (!tool)
    return {
      error:
        'Please name a supported task, such as “merge PDFs” or “resize photo to 200 × 230 px”.',
    };
  const notes: string[] = [];
  const dimensions = text.match(
    /(-?\d+(?:\.\d+)?)\s*[x×]\s*(-?\d+(?:\.\d+)?)\s*(px|pixels|mm|cm|inch)?/,
  );
  if (dimensions && ['photo', 'signature', 'compress'].includes(tool)) {
    if (!dimensions[3] || !/px|pixels/.test(dimensions[3]))
      return {
        error:
          'Please specify dimensions in pixels (for example 200 × 230 px). Physical sizes need a print resolution.',
      };
    const [width, height] = [Number(dimensions[1]), Number(dimensions[2])];
    if ([width, height].some((n) => !Number.isInteger(n) || n < 32 || n > 2400))
      return {
        error: 'Use whole-pixel dimensions from 32–2400 pixels per side.',
      };
    params.set('width', String(width));
    params.set('height', String(height));
    notes.push(`${width} × ${height} pixels`);
    if (tool === 'compress') tool = 'photo';
  }
  const sizes = [...text.matchAll(/(-?\d+(?:\.\d+)?)\s*(kb|mb)\b/g)];
  if (sizes.length > 1)
    return {
      error:
        'Use one maximum file size for this task. For example: photo under 50 KB.',
    };
  const size = sizes[0];
  if (size && ['photo', 'signature', 'compress'].includes(tool)) {
    const value = Number(size[1]) * (size[2] === 'mb' ? 1000 : 1);
    if (value < 5 || value > 5000)
      return { error: 'Supported image limits are 5–5000 KB.' };
    params.set('maxKB', String(value));
    notes.push(`Maximum ${value} KB`);
  }
  if (['photo', 'signature', 'compress'].includes(tool))
    notes.push('Output: JPG; review the crop before downloading');
  if (['extract', 'removePages', 'rotatePdf'].includes(tool))
    notes.push(
      'Choose page numbers and rotation in the tool; they are not filled by this guide',
    );
  if (tool === 'extract' && /split/.test(text))
    notes.push('Extract creates one PDF, not separate files');
  params.set('assist', tool);
  return { tool, notes, href: `/workspace?${params}`, error: undefined };
}
