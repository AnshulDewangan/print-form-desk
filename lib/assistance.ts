export function suggestTask(input: string) {
  const text = input.trim().toLowerCase();
  const params = new URLSearchParams();
  if (!text) return { error: 'Describe the file and what you want to change.' };
  if (/ocr|word|excel|translate|summari|background|compress.*pdf|pdf.*compress/.test(text))
    return { error: 'This guide cannot prepare that task yet. Try resizing an image, merging PDFs, extracting pages or rotating a PDF.' };
  const pdf = /pdf/.test(text);
  let tool = /signature/.test(text) ? 'signature'
    : pdf && /image|photo|jpg|png/.test(text) ? 'pdf'
    : pdf && /merge|combine|join/.test(text) ? 'merge'
    : pdf && /remove|delete/.test(text) ? 'removePages'
    : pdf && /extract|split|keep/.test(text) ? 'extract'
    : pdf && /rotate|sideways/.test(text) ? 'rotatePdf'
    : /print|sheet|copies/.test(text) ? 'sheet'
    : !pdf && /compress|smaller|reduce|\bkb\b/.test(text) ? 'compress'
    : /photo|image|resize/.test(text) ? 'photo' : '';
  if (!tool) return { error: 'Please name a supported task, such as “merge PDFs” or “resize photo to 200 × 230 px”.' };
  const notes: string[] = [];
  const dimensions = text.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(px|pixels|mm|cm|inch)?/);
  if (dimensions && ['photo', 'signature', 'compress'].includes(tool)) {
    if (!dimensions[3] || !/px|pixels/.test(dimensions[3])) return { error: 'Please specify dimensions in pixels (for example 200 × 230 px). Physical sizes need a print resolution.' };
    const [width, height] = [Number(dimensions[1]), Number(dimensions[2])];
    if ([width, height].some(n => n < 32 || n > 2400)) return { error: 'Supported image dimensions are 32–2400 pixels per side.' };
    params.set('width', String(width)); params.set('height', String(height));
    notes.push(`${width} × ${height} pixels`);
    if (tool === 'compress') tool = 'photo';
  }
  const size = text.match(/(\d+(?:\.\d+)?)\s*kb\b/);
  if (size && ['photo', 'signature', 'compress'].includes(tool)) {
    const value = Number(size[1]);
    if (value < 5 || value > 5000) return { error: 'Supported image limits are 5–5000 KB.' };
    params.set('maxKB', String(value)); notes.push(`Maximum ${value} KB`);
  }
  params.set('assist', tool);
  return { tool, notes, href: `/workspace?${params}`, error: undefined };
}
