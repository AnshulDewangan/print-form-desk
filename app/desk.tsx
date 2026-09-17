'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { flushSync } from 'react-dom';
import {
  Printer,
  ShieldCheck,
  Upload,
  Download,
  RotateCw,
  Trash2,
  BookmarkPlus,
  HelpCircle,
  Check,
  FileImage,
  Files,
  PenLine,
  Minimize2,
  FileText,
  Combine,
  Scissors,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Undo2,
  X,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Empty } from '@/components/ui/empty';
import PDFPreview from './pdf-preview';
import PaidWorkspace from './paid-workspace';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  PRESETS,
  SHEETS,
  LIMITS,
  arrange,
  validateSettings,
  type Settings,
  type Preset,
} from '@/lib/geometry';
import {
  decode,
  renderCanvas,
  encodeJPEG,
  encodeForPrint,
  filename,
  type Asset,
} from '@/lib/images';
import {
  TOOL_INFO,
  initialSettings,
  moveItem,
  formatBytes,
  type ToolId,
} from '@/lib/workflow';
import type { PDFAsset } from '@/lib/pdf-tools';

const ICONS = {
  photo: FileImage,
  signature: PenLine,
  compress: Minimize2,
  sheet: Printer,
  pdf: FileText,
  merge: Combine,
  extract: Scissors,
  rotatePdf: RotateCw,
  removePages: Trash2,
};
const STORAGE = 'print-form-desk.presets.v1';
type Result = {
  url: string;
  name: string;
  size: number;
  description: string;
  type: string;
};
type Registry = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

function Choice({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
        disabled={disabled}
      >
        <SelectTrigger aria-label={label} className="w-full h-11">
          <SelectValue>
            {options.find((o) => o.value === value)?.label ?? 'Choose a size'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function Numeric({
  label,
  value,
  min,
  max,
  onChange,
  integer = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  integer?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <Input
        required
        type="number"
        min={min}
        max={max}
        step={integer ? 1 : 0.1}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (e.target.validity.valid && e.target.value !== '')
            onChange(Number(e.target.value));
        }}
      />
    </label>
  );
}
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const labelId = useId();
  return (
    <div className="range-field">
      <div className="field-label" id={labelId}>
        {label}
        <span>{label === 'Zoom' ? `${value.toFixed(2)}×` : `${value}%`}</span>
      </div>
      <Slider
        aria-labelledby={labelId}
        disabled={disabled}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
function ProcessedImage({
  asset,
  small = false,
}: {
  asset: Asset;
  small?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    try {
      if (!canvas.current) return;
      const rendered = renderCanvas(
        asset.image,
        asset.settings,
        small ? 96 : 700,
      );
      canvas.current.width = rendered.width;
      canvas.current.height = rendered.height;
      canvas.current.getContext('2d')?.drawImage(rendered, 0, 0);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [asset.image, asset.settings, small]);
  return failed ? (
    <span className="preview-error">
      Preview unavailable. Try a smaller image.
    </span>
  ) : (
    <canvas
      ref={canvas}
      className={small ? '' : 'prepared-preview'}
      role="img"
      aria-label={`Result preview: ${asset.name}`}
    />
  );
}
function Step({
  number,
  title,
  detail,
}: {
  number: number;
  title: string;
  detail?: string;
}) {
  return (
    <div className="step-heading">
      <span className="step-number">{number}</span>
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
    </div>
  );
}

export default function Desk({ initialTool = 'photo' }: { initialTool?: ToolId }) {
  const assistantSettings = useRef<Partial<Settings>>({});
  const input = useRef<HTMLInputElement>(null),
    form = useRef<HTMLFormElement>(null);
  const [tool, setTool] = useState<ToolId>(initialTool);
  const [assets, setAssets] = useState<Asset[]>([]),
    [selected, setSelected] = useState('');
  const [pdfs, setPdfs] = useState<PDFAsset[]>([]),
    [pdfSelected, setPdfSelected] = useState('');
  const [saved, setSaved] = useState<Preset[]>([]),
    [presetId, setPresetId] = useState(initialTool === 'signature' ? 'signature' : initialTool === 'photo' || initialTool === 'sheet' ? 'photo' : 'custom');
  const [sheetId, setSheetId] = useState<keyof typeof SHEETS>('a4'),
    [view, setView] = useState(initialTool === 'sheet' ? 'sheet' : 'prepared'),
    [page, setPage] = useState(0);
  const [pdfSource, setPdfSource] = useState('original'),
    [pageRange, setPageRange] = useState(''),
    [pdfRotation, setPdfRotation] = useState('90'),
    [rangeError, setRangeError] = useState('');
  const [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [result, setResult] = useState<Result | null>(null),
    [dragging, setDragging] = useState(false),
    [dirty, setDirty] = useState(false);
  const [dialog, setDialog] = useState<
      'help' | 'privacy' | 'preset' | 'saved' | null
    >(null),
    [clearOpen, setClearOpen] = useState(false),
    [presetName, setPresetName] = useState('');
  const history = useRef<Record<string, Settings[]>>({}),
    [canUndo, setCanUndo] = useState(false);
  const operation = useRef<AbortController | null>(null),
    mounted = useRef(true);
  const state = useRef({
    assets,
    selected,
    pdfs,
    pdfSelected,
    busy,
    result,
    tool,
  });
  state.current = { assets, selected, pdfs, pdfSelected, busy, result, tool };
  const documentTool =
      tool === 'merge' ||
      tool === 'extract' ||
      tool === 'rotatePdf' ||
      tool === 'removePages',
    info = TOOL_INFO[tool],
    presets = [...PRESETS, ...saved];
  const active = assets.find((a) => a.id === selected) ?? assets[0],
    activePDF = pdfs.find((p) => p.id === pdfSelected) ?? pdfs[0];
  const settings = active?.settings,
    sheet = SHEETS[sheetId],
    hasFiles = documentTool ? !!pdfs.length : !!assets.length;
  let layout: ReturnType<typeof arrange> = [],
    layoutError = '';
  if (tool === 'sheet')
    try {
      layout = arrange(assets, sheet);
    } catch (e) {
      layoutError = (e as Error).message;
    }
  const pages = (layout.at(-1)?.page ?? -1) + 1,
    visiblePage = Math.min(page, Math.max(0, pages - 1));

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requested = query.get('assist') ?? query.get('tool');
    if (!requested || !Object.prototype.hasOwnProperty.call(TOOL_INFO, requested)) return;
    setTool(requested as ToolId);
    setPresetId('custom');
    const patch: Partial<Settings> = {};
    for (const key of ['width', 'height', 'maxKB'] as const) {
      const value = Number(query.get(key));
      const min = key === 'maxKB' ? 5 : 32;
      const max = key === 'maxKB' ? 5000 : 2400;
      if (query.has(key) && Number.isFinite(value) && value >= min && value <= max) patch[key] = value;
    }
    assistantSettings.current = patch;
    if (query.has('assist')) setMessage('Your guide settings are ready. Add a file, then review the settings and preview before downloading.');
  }, []);
  useEffect(() => {
    mounted.current = true;
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE) ?? '[]');
      if (!Array.isArray(data)) throw new Error();
      setSaved(
        data.slice(0, 30).map((p) => {
          if (
            typeof p.id !== 'string' ||
            !p.id.startsWith('saved-') ||
            typeof p.name !== 'string' ||
            p.name.length > 60
          )
            throw new Error();
          return {
            id: p.id,
            name: p.name,
            settings: validateSettings(p.settings),
          };
        }),
      );
    } catch {
      setError(
        'Saved sizes could not be loaded. The tools still work; browser storage may be disabled.',
      );
    }
    return () => {
      mounted.current = false;
      operation.current?.abort();
      state.current.assets.forEach((a) => URL.revokeObjectURL(a.url));
      state.current.pdfs.forEach((p) => URL.revokeObjectURL(p.url));
      if (state.current.result) URL.revokeObjectURL(state.current.result.url);
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    setCanUndo(!!history.current[active?.id ?? '']?.length);
  }, [active?.id]);
  function invalidate() {
    setResult((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    setMessage('');
    setError('');
    setDirty(true);
  }
  function update(patch: Partial<Settings>) {
    if (!active || operation.current) return;
    const next = validateSettings({ ...active.settings, ...patch });
    history.current[active.id] = [
      ...(history.current[active.id] ?? []),
      active.settings,
    ].slice(-30);
    setCanUndo(true);
    setAssets((list) =>
      list.map((a) => (a.id === active.id ? { ...a, settings: next } : a)),
    );
    setPresetId('custom');
    invalidate();
  }
  function choosePreset(id: string) {
    if (id === 'custom') return;
    const p = presets.find((p) => p.id === id);
    if (!p) return;
    if (active) update({ ...p.settings, fit: p.settings.fit ?? 'cover' });
    setPresetId(id);
  }
  function undo() {
    if (!active) return;
    const previous = history.current[active.id]?.pop();
    if (!previous) return;
    setAssets((list) =>
      list.map((a) => (a.id === active.id ? { ...a, settings: previous } : a)),
    );
    setCanUndo(!!history.current[active.id]?.length);
    setPresetId('custom');
    invalidate();
  }
  function changeTool(next: ToolId) {
    if (operation.current) return;
    assistantSettings.current = {};
    setTool(next);
    setPageRange('');
    setPdfRotation('90');
    const nextUrl = new URL(window.location.href);
    nextUrl.search = '';
    nextUrl.searchParams.set('tool', next);
    window.history.replaceState(window.history.state, '', nextUrl);
    setView(next === 'sheet' ? 'sheet' : 'prepared');
    setPage(0);
    setError('');
    setMessage('');
    setRangeError('');
    setResult((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    if (!assets.length)
      setPresetId(
        next === 'signature'
          ? 'signature'
          : next === 'photo' || next === 'sheet'
            ? 'photo'
            : 'custom',
      );
  }
  function selectImage(id: string) {
    setSelected(id);
    setPresetId('custom');
    setMessage('');
    setError('');
    setResult((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
  }

  useEffect(() => {
    const context = (document as Document & { modelContext?: Registry })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Parameters<Registry['registerTool']>[0]) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Unsupported optional capability. */
      }
    };
    register({
      name: 'read_print_job',
      description:
        'Read the selected tool, file counts and selected image settings, without customer names or file content.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (
          !input ||
          typeof input !== 'object' ||
          Array.isArray(input) ||
          Object.keys(input).length
        )
          throw new Error('Expected an empty object.');
        const s = state.current;
        return {
          tool: s.tool,
          imageCount: s.assets.length,
          pdfCount: s.pdfs.length,
          busy: !!s.busy,
          settings:
            s.assets.find((a) => a.id === s.selected)?.settings ??
            s.assets[0]?.settings ??
            null,
        };
      },
    });
    register({
      name: 'configure_selected_image',
      description:
        'Configure the selected image dimensions, crop, JPEG size limit or print copies. Does not prepare or download a file.',
      inputSchema: {
        type: 'object',
        properties: {
          ...Object.fromEntries(
            Object.entries(LIMITS).map(([key, [minimum, maximum]]) => [
              key,
              { type: 'number', minimum, maximum },
            ]),
          ),
          fit: { type: 'string', enum: ['cover', 'contain'] },
        },
        minProperties: 1,
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const s = state.current;
        if (operation.current)
          throw new Error('Wait for the current operation.');
        if (s.tool === 'merge' || s.tool === 'extract')
          throw new Error('Open an image tool first.');
        const a = s.assets.find((a) => a.id === s.selected) ?? s.assets[0];
        if (!a) throw new Error('Choose an image first.');
        if (
          !input ||
          typeof input !== 'object' ||
          Array.isArray(input) ||
          !Object.keys(input).length ||
          Object.keys(input).some((k) => !(k in LIMITS) && k !== 'fit')
        )
          throw new Error('Provide supported settings only.');
        const settings = validateSettings({ ...a.settings, ...input });
        flushSync(() => {
          setAssets((list) =>
            list.map((item) =>
              item.id === a.id ? { ...item, settings } : item,
            ),
          );
          setPresetId('custom');
          setDirty(true);
          setResult((old) => {
            if (old) URL.revokeObjectURL(old.url);
            return null;
          });
        });
        return { settings };
      },
    });
    return () => lifecycle.abort();
  }, []);

  async function addFiles(files: File[]) {
    if (operation.current || !files.length) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy('Opening your files…');
    setError('');
    setMessage('');
    const images: Asset[] = [],
      documents: PDFAsset[] = [],
      errors: string[] = [];
    try {
      const pdfLimit = tool === 'merge' ? 12 : 1;
      const limit = documentTool ? pdfLimit - pdfs.length : 30 - assets.length;
      if (files.length > limit)
        errors.push(
          `This workspace accepts ${documentTool ? (tool === 'merge' ? '12 PDFs' : 'one PDF') : '30 images'}. Extra files were skipped.`,
        );
      let pixels = assets.reduce(
          (n, a) => n + a.image.naturalWidth * a.image.naturalHeight,
          0,
        ),
        bytes = pdfs.reduce((n, p) => n + p.bytes.byteLength, 0),
        pageCount = pdfs.reduce((n, p) => n + p.pages, 0);
      for (const file of files.slice(0, limit)) {
        if (controller.signal.aborted) break;
        try {
          if (documentTool) {
            if (
              file.type !== 'application/pdf' &&
              !file.name.toLowerCase().endsWith('.pdf')
            )
              throw new Error('Choose a PDF file for this tool.');
            if (file.size > 20000000)
              throw new Error('Use a PDF smaller than 20 MB.');
            if (bytes + file.size > 60000000)
              throw new Error(
                'The PDF workspace limit is 60 MB. Remove a file before adding more.',
              );
            const data = new Uint8Array(await file.arrayBuffer()),
              { inspectPDF } = await import('@/lib/pdf-tools');
            const count = await inspectPDF(data);
            if (pageCount + count > 300)
              throw new Error('The workspace limit is 300 PDF pages.');
            bytes += file.size;
            pageCount += count;
            documents.push({
              id: crypto.randomUUID(),
              name: file.name,
              url: URL.createObjectURL(file),
              bytes: data,
              pages: count,
            });
          } else {
            const image = await decode(file),
              size = image.naturalWidth * image.naturalHeight;
            if (pixels + size > 60000000) {
              URL.revokeObjectURL(image.src);
              throw new Error(
                'This batch is too large for safe processing. Remove a few images or use smaller files.',
              );
            }
            pixels += size;
            const chosen = !assets.length
              ? presets.find((p) => p.id === presetId)
              : undefined;
            images.push({
              id: crypto.randomUUID(),
              name: file.name,
              url: image.src,
              image,
              originalBytes: file.size,
              settings: { ...(chosen
                ? { ...chosen.settings }
                : initialSettings(
                    tool,
                    image.naturalWidth,
                    image.naturalHeight,
                  )), ...assistantSettings.current },
            });
          }
        } catch (e) {
          errors.push(`${file.name}: ${(e as Error).message}`);
        }
      }
      if (!mounted.current || controller.signal.aborted) {
        images.forEach((a) => URL.revokeObjectURL(a.url));
        documents.forEach((p) => URL.revokeObjectURL(p.url));
        return;
      }
      if (images.length) {
        setAssets((list) => [...list, ...images]);
        setSelected(images[0].id);
        setView(tool === 'sheet' ? 'sheet' : 'prepared');
      }
      if (documents.length) {
        setPdfs((list) => [...list, ...documents]);
        setPdfSelected(documents[0].id);
        setPageRange('');
      }
      if (images.length || documents.length) {
        invalidate();
        setMessage(
          `${images.length + documents.length} file${images.length + documents.length === 1 ? '' : 's'} added. Continue to step 2.`,
        );
      }
      if (errors.length) setError(errors.join(' '));
    } finally {
      operation.current = null;
      if (mounted.current) {
        setBusy('');
        if (input.current) input.current.value = '';
      }
    }
  }
  function removeFile(id: string) {
    if (operation.current) return;
    if (documentTool) {
      const p = pdfs.find((p) => p.id === id);
      if (p) URL.revokeObjectURL(p.url);
      const next = pdfs.filter((p) => p.id !== id);
      setPdfs(next);
      if (pdfSelected === id) setPdfSelected(next[0]?.id ?? '');
      setPageRange('');
    } else {
      const a = assets.find((a) => a.id === id);
      if (a) URL.revokeObjectURL(a.url);
      const next = assets.filter((a) => a.id !== id);
      setAssets(next);
      if (selected === id) setSelected(next[0]?.id ?? '');
      delete history.current[id];
    }
    invalidate();
  }
  function reorder(index: number, direction: -1 | 1) {
    if (documentTool) setPdfs((list) => moveItem(list, index, direction));
    else setAssets((list) => moveItem(list, index, direction));
    invalidate();
  }
  function clearFiles() {
    assets.forEach((a) => URL.revokeObjectURL(a.url));
    pdfs.forEach((p) => URL.revokeObjectURL(p.url));
    setAssets([]);
    setPdfs([]);
    setSelected('');
    setPdfSelected('');
    history.current = {};
    setCanUndo(false);
    setPageRange('');
    setRangeError('');
    invalidate();
    setDirty(false);
    setClearOpen(false);
    setMessage('Workspace cleared. Your saved sizes are still available.');
  }
  function savePreset() {
    if (!active || !presetName.trim()) return;
    const next = [
      ...saved,
      {
        id: `saved-${crypto.randomUUID()}`,
        name: presetName.trim().slice(0, 60),
        settings: { ...active.settings, zoom: 1, x: 50, y: 50, rotation: 0 },
      },
    ];
    try {
      if (next.length > 30)
        throw new Error(
          'You can save up to 30 sizes. Delete an old one first.',
        );
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setSaved(next);
      setPresetId(next.at(-1)!.id);
      setDialog(null);
      setPresetName('');
      setMessage(
        'Size saved on this browser. Find it under Saved sizes or the size menu.',
      );
    } catch (e) {
      setError(`Could not save this size. ${(e as Error).message}`);
    }
  }
  function deletePreset(id: string) {
    try {
      const next = saved.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setSaved(next);
      if (presetId === id) setPresetId('custom');
    } catch {
      setError(
        'Browser storage is unavailable. The saved size could not be deleted.',
      );
    }
  }
  function applyAll() {
    if (!active) return;
    setAssets((list) =>
      list.map((a) => ({
        ...a,
        settings: {
          ...active.settings,
          zoom: a.settings.zoom,
          x: a.settings.x,
          y: a.settings.y,
          rotation: a.settings.rotation,
        },
      })),
    );
    invalidate();
    setMessage(
      'Size and print settings applied to all images. Check each crop before downloading.',
    );
  }

  async function prepare(batch = false) {
    if (operation.current || !hasFiles || !form.current?.reportValidity())
      return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy('Preparing your file…');
    setError('');
    setMessage('');
    setRangeError('');
    setResult((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    try {
      let blob: Blob, name: string, description: string;
      if (documentTool) {
        const { combinePDFs, parsePages, rotatePDF, removePDFPages } =
          await import('@/lib/pdf-tools');
        if (tool === 'merge' && pdfs.length < 2)
          throw new Error('Add at least two PDFs to merge.');
        let indices: number[] | undefined;
        if (tool !== 'merge') {
          try {
            if (tool === 'removePages' && !pageRange.trim())
              throw new Error('Enter at least one page to remove.');
            indices = parsePages(pageRange, activePDF.pages);
          } catch (e) {
            setRangeError((e as Error).message);
            throw e;
          }
        }
        const bytes =
          tool === 'rotatePdf'
            ? await rotatePDF(
                activePDF.bytes,
                indices!,
                Number(pdfRotation) as 90 | 180 | 270,
              )
            : tool === 'removePages'
              ? await removePDFPages(activePDF.bytes, indices!)
              : await combinePDFs(
                  tool === 'extract' ? [activePDF] : pdfs,
                  indices,
                );
        blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
        name =
          tool === 'merge'
            ? 'merged-document.pdf'
            : tool === 'rotatePdf'
              ? 'rotated-document.pdf'
              : tool === 'removePages'
                ? 'cleaned-document.pdf'
                : 'selected-pages.pdf';
        const outputPages =
          tool === 'removePages'
            ? activePDF.pages - indices!.length
            : tool === 'extract'
              ? indices!.length
              : tool === 'rotatePdf'
                ? activePDF.pages
                : pdfs.reduce((n, p) => n + p.pages, 0);
        description = `${outputPages} pages · PDF`;
      } else {
        if (tool === 'sheet' && layoutError) throw new Error(layoutError);
        const multi = batch || tool === 'sheet' || tool === 'pdf',
          chosen = multi ? assets : [active],
          encoded = new Map<string, Uint8Array>();
        for (let i = 0; i < chosen.length; i++) {
          if (controller.signal.aborted) return;
          setBusy(`Preparing image ${i + 1} of ${chosen.length}…`);
          const image = chosen[i],
            jpg =
              tool === 'sheet' || tool === 'pdf'
                ? await encodeForPrint(
                    image,
                    tool === 'pdf' && pdfSource === 'original',
                  )
                : await encodeJPEG(image);
          encoded.set(image.id, new Uint8Array(await jpg.arrayBuffer()));
        }
        if (tool === 'sheet' || tool === 'pdf') {
          const { printPDF, imagePDF } = await import('@/lib/pdf');
          const bytes =
            tool === 'sheet'
              ? await printPDF(encoded, layout, sheet)
              : await imagePDF([...encoded.values()]);
          blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
          name = tool === 'sheet' ? 'photo-print-sheet.pdf' : 'images.pdf';
          description =
            tool === 'sheet'
              ? `${pages} sheets · ${layout.length} photo copies`
              : `${assets.length} pages · one image per page`;
        } else if (batch) {
          const { zipSync } = await import('fflate');
          blob = new Blob(
            [
              zipSync(
                Object.fromEntries(
                  chosen.map((a, i) => [
                    filename(a.name, i),
                    encoded.get(a.id)!,
                  ]),
                ),
                { level: 0 },
              ) as BlobPart,
            ],
            { type: 'application/zip' },
          );
          name = 'prepared-images.zip';
          description = `${chosen.length} JPG files · extract the ZIP to use them`;
        } else {
          blob = new Blob([encoded.get(active.id)! as BlobPart], {
            type: 'image/jpeg',
          });
          name = filename(active.name, assets.indexOf(active));
          description = `${active.settings.width} × ${active.settings.height} pixels · JPG`;
        }
      }
      if (controller.signal.aborted || !mounted.current) return;
      setResult({
        url: URL.createObjectURL(blob),
        name,
        size: blob.size,
        description,
        type: blob.type,
      });
    } catch (e) {
      if (mounted.current && !controller.signal.aborted)
        setError(
          (e as Error).message ||
            'This file could not be prepared. Try a smaller batch.',
        );
    } finally {
      operation.current = null;
      if (mounted.current) setBusy('');
    }
  }
  function cancel() {
    operation.current?.abort();
    setMessage('Cancelled. Your files and settings are unchanged.');
  }
  const fileList = documentTool ? pdfs : assets;
  const Icon = ICONS[tool];
  return (
    <div className="desk">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Sahajly home">
          <img className="sahajly-wordmark" src="/brand/sahajly-wordmark.svg" alt="Sahajly" width={198} height={60} />
        </Link>
        <span className="privacy">
          <ShieldCheck size={17} /> Your files stay on your device
        </span>
        <nav className="top-links" aria-label="Product pages">
          <a href="/pricing">Pricing</a>
          <a href="/about">About</a>
          <a href="/contact">Support</a>
        </nav>
        <Button variant="ghost" onClick={() => setDialog('help')}>
          <HelpCircle size={17} /> Help
        </Button>
        <PaidWorkspace />
      </header>
      <main id="main-content" className="main">
        <Tabs
          orientation="vertical"
          value={tool}
          onValueChange={(value) => changeTool(value as ToolId)}
          className="tool-layout"
        >
          <aside className="tool-sidebar">
            <Link className="workspace-home-link" href="/">
              ← Home
            </Link>
            <p className="nav-heading">CHOOSE A TOOL</p>
            <TabsList className="tool-navigation" aria-label="File tools">
              {(Object.keys(TOOL_INFO) as ToolId[]).map((id) => {
                const ToolIcon = ICONS[id];
                return (
                  <TabsTrigger
                    key={id}
                    value={id}
                    disabled={!!busy}
                    className="tool-link"
                  >
                    <ToolIcon size={21} />
                    <span>
                      <strong>{TOOL_INFO[id].title}</strong>
                      <small>{TOOL_INFO[id].description}</small>
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <Button
              variant="outline"
              className="saved-button"
              onClick={() => setDialog('saved')}
            >
              <BookmarkPlus size={17} /> Saved sizes <span>{saved.length}</span>
            </Button>
            <p className="sidebar-note">
              <ShieldCheck size={16} /> No account needed.
              <br />
              No file uploads to a server.
            </p>
          </aside>
          <TabsContent
            value={tool}
            id="workspace"
            className="workspace-content"
          >
            <div className="page-heading">
              <div>
                <p className="eyebrow">SIMPLE TOOLS. READY-TO-USE FILES.</p>
                <h1>
                  <Icon size={27} />
                  {info.title}
                </h1>
                <p>{info.description}</p>
              </div>
              <Button
                variant="outline"
                disabled={!!busy || (!assets.length && !pdfs.length)}
                onClick={() => setClearOpen(true)}
              >
                <FolderPlus size={17} /> New job
              </Button>
            </div>
            <ol className="journey" aria-label="How this tool works">
              <li
                className={hasFiles ? 'complete' : 'current'}
                aria-current={!hasFiles ? 'step' : undefined}
              >
                <span>1</span> Add {documentTool ? 'PDFs' : 'images'}
              </li>
              <li
                className={result ? 'complete' : hasFiles ? 'current' : ''}
                aria-current={hasFiles && !result ? 'step' : undefined}
              >
                <span>2</span> Adjust & preview
              </li>
              <li
                className={result ? 'current' : ''}
                aria-current={result ? 'step' : undefined}
              >
                <span>3</span> Download
              </li>
            </ol>
            <div className="messages" aria-live="polite">
              {busy && (
                <div className="notice">
                  <span className="spinner" />
                  {busy}
                  <Button variant="ghost" onClick={cancel}>
                    Cancel
                  </Button>
                </div>
              )}
              {message && !busy && (
                <div className="notice">
                  <Check size={18} />
                  {message}
                </div>
              )}
            </div>
            {error && (
              <div className="error" role="alert">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  aria-label="Dismiss error"
                  onClick={() => setError('')}
                >
                  <X size={18} />
                </Button>
              </div>
            )}
            <section
              className={`panel upload-panel ${dragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void addFiles(Array.from(e.dataTransfer.files));
              }}
            >
              <div className="upload-intro">
                <Step
                  number={1}
                  title={
                    documentTool ? 'Add your PDF files' : 'Add your images'
                  }
                  detail={
                    documentTool
                      ? 'PDF · up to 20 MB per file. Password-protected and interactive PDFs are not supported.'
                      : 'JPG, PNG or WebP · up to 20 MB per image. You can choose several at once.'
                  }
                />
                <Button
                  className="choose-button"
                  disabled={!!busy}
                  onClick={() => input.current?.click()}
                >
                  <Upload size={18} />
                  {hasFiles ? 'Add more files' : info.accept}
                </Button>
              </div>
              <input
                ref={input}
                hidden
                type="file"
                multiple
                accept={
                  documentTool
                    ? 'application/pdf'
                    : '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
                }
                onChange={(e) =>
                  void addFiles(Array.from(e.target.files ?? []))
                }
              />
              {!hasFiles && (
                <p className="drop-hint">
                  Or drag and drop files here. They never leave your browser.
                </p>
              )}
              {hasFiles && (
                <div className="file-list" aria-label="Files in this job">
                  {fileList.map((f, i) => {
                    const image = !documentTool ? (f as Asset) : null,
                      pdf = documentTool ? (f as PDFAsset) : null,
                      isSelected = documentTool
                        ? activePDF?.id === f.id
                        : active?.id === f.id;
                    return (
                      <div
                        key={f.id}
                        className={`file-row ${isSelected ? 'selected' : ''}`}
                      >
                        <button
                          className="file-select"
                          disabled={!!busy}
                          aria-pressed={isSelected}
                          onClick={() => {
                            if (documentTool) {
                              setPdfSelected(f.id);
                              setPageRange('');
                              invalidate();
                            } else selectImage(f.id);
                          }}
                        >
                          {image ? (
                            <img src={image.url} alt="" />
                          ) : (
                            <FileText size={28} />
                          )}
                          <span>
                            <strong>{f.name}</strong>
                            <small>
                              {image
                                ? `${image.image.naturalWidth} × ${image.image.naturalHeight} px · ${formatBytes(image.originalBytes ?? 0)}`
                                : `${pdf!.pages} pages · ${formatBytes(pdf!.bytes.byteLength)}`}
                            </small>
                          </span>
                          {isSelected && <Check size={15} />}
                        </button>
                        <div className="file-actions">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={!!busy || i === 0}
                            aria-label={`Move ${f.name} earlier`}
                            onClick={() => reorder(i, -1)}
                          >
                            <ArrowUp size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={!!busy || i === fileList.length - 1}
                            aria-label={`Move ${f.name} later`}
                            onClick={() => reorder(i, 1)}
                          >
                            <ArrowDown size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={!!busy}
                            aria-label={`Remove ${f.name}`}
                            onClick={() => removeFile(f.id)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            {!hasFiles ? (
              <Empty className="getting-started">
                <div className="empty-symbol">
                  <Icon size={35} />
                </div>
                <h2>
                  {documentTool
                    ? 'Choose a PDF to get started'
                    : 'Choose an image to get started'}
                </h2>
                <p>{info.hint}</p>
                <div className="start-explainer">
                  <span>
                    <Check size={16} /> See a preview before saving
                  </span>
                  <span>
                    <Check size={16} /> Original files stay unchanged
                  </span>
                  <span>
                    <Check size={16} /> Free to use
                  </span>
                </div>
                <button className="text-link" onClick={() => setDialog('help')}>
                  First time? Read the quick guide <ArrowRight size={15} />
                </button>
              </Empty>
            ) : (
              <>
                <div className="editing-heading">
                  <Step
                    number={2}
                    title="Adjust and preview"
                    detail={info.hint}
                  />
                  {!documentTool && (
                    <Button
                      variant="ghost"
                      disabled={!!busy || !canUndo}
                      onClick={undo}
                    >
                      <Undo2 size={16} /> Undo change
                    </Button>
                  )}
                </div>
                <div className="editor-grid">
                  <section className="preview-panel">
                    {documentTool ? (
                      <>
                        <div className="preview-toolbar">
                          <h3>{activePDF.name}</h3>
                          <span>{activePDF.pages} pages</span>
                        </div>
                        <PDFPreview key={activePDF.id} file={activePDF} />
                        <p className="preview-note">
                          If your browser cannot show the preview,{' '}
                          <a
                            href={activePDF.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            open the PDF in a new tab
                          </a>
                          .
                        </p>
                      </>
                    ) : tool === 'pdf' ? (
                      <>
                        <div className="preview-toolbar">
                          <h3>PDF page preview</h3>
                          <span>
                            Page {assets.indexOf(active) + 1} of {assets.length}
                          </span>
                        </div>
                        <div className="preview-stage">
                          <div className="pdf-paper">
                            {pdfSource === 'original' ? (
                              <img
                                src={active.url}
                                alt={`Full view: ${active.name}`}
                              />
                            ) : (
                              <ProcessedImage asset={active} />
                            )}
                          </div>
                        </div>
                        <p className="preview-note">
                          Each image is centred on its own A4 page. Select
                          another file above to preview it.
                        </p>
                      </>
                    ) : (
                      <Tabs
                        value={view}
                        onValueChange={(v) => setView(String(v))}
                      >
                        <div className="preview-toolbar">
                          <TabsList aria-label="Preview options">
                            <TabsTrigger value="prepared">
                              Edited image
                            </TabsTrigger>
                            <TabsTrigger value="original">Original</TabsTrigger>
                            {tool === 'sheet' && (
                              <TabsTrigger value="sheet">
                                Print sheet
                              </TabsTrigger>
                            )}
                          </TabsList>
                        </div>
                        <TabsContent value="prepared">
                          <div className="preview-stage">
                            <div className="image-artboard">
                              <ProcessedImage asset={active} />
                              <span className="dimension-tag">
                                {settings!.width} × {settings!.height} pixels
                              </span>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="original">
                          <div className="preview-stage">
                            <div className="image-artboard">
                              <img
                                className="original-preview"
                                src={active.url}
                                alt={`Original: ${active.name}`}
                              />
                              <span className="dimension-tag">
                                Original · {active.image.naturalWidth} ×{' '}
                                {active.image.naturalHeight} pixels
                              </span>
                            </div>
                          </div>
                        </TabsContent>
                        {tool === 'sheet' && (
                          <TabsContent value="sheet">
                            <div className="preview-stage sheet-stage">
                              {layoutError ? (
                                <div className="preview-error">
                                  <p>{layoutError}</p>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSheetId('a4');
                                      invalidate();
                                    }}
                                  >
                                    Use A4 paper
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="paper"
                                  style={{
                                    aspectRatio: `${sheet.width}/${sheet.height}`,
                                  }}
                                >
                                  {layout
                                    .filter((p) => p.page === visiblePage)
                                    .map((p, i) => (
                                      <div
                                        key={`${p.id}-${i}`}
                                        className="paper-photo"
                                        style={{
                                          left: `${(p.x / sheet.width) * 100}%`,
                                          top: `${(p.y / sheet.height) * 100}%`,
                                          width: `${(p.width / sheet.width) * 100}%`,
                                          height: `${(p.height / sheet.height) * 100}%`,
                                        }}
                                      >
                                        <ProcessedImage
                                          asset={assets.find(
                                            (a) => a.id === p.id,
                                          )!}
                                          small
                                        />
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                            {pages > 0 && (
                              <div className="page-nav">
                                <Button
                                  variant="outline"
                                  disabled={visiblePage === 0}
                                  onClick={() => setPage(visiblePage - 1)}
                                >
                                  Previous
                                </Button>
                                <span>
                                  Sheet {visiblePage + 1} of {pages}
                                </span>
                                <Button
                                  variant="outline"
                                  disabled={visiblePage >= pages - 1}
                                  onClick={() => setPage(visiblePage + 1)}
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </TabsContent>
                        )}
                        <p className="preview-note">
                          {tool === 'sheet'
                            ? 'Print at “Actual size” or 100%. Turn “Fit to page” off.'
                            : 'Compare Edited image with Original to check what will be cropped.'}
                        </p>
                      </Tabs>
                    )}
                  </section>
                  <form
                    key={documentTool ? activePDF?.id : active?.id}
                    ref={form}
                    className="panel settings-panel"
                    onChange={() => {
                      if (!busy) invalidate();
                    }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      void prepare();
                    }}
                  >
                    <fieldset disabled={!!busy}>
                      {documentTool ? (
                        <>
                          <h3>
                            {tool === 'merge'
                              ? 'Merge settings'
                              : tool === 'rotatePdf'
                                ? 'Rotate pages'
                                : tool === 'removePages'
                                  ? 'Choose pages to remove'
                                  : 'Choose pages to save'}
                          </h3>
                          {tool === 'merge' ? (
                            <>
                              <div className="summary-number">
                                {pdfs.length}
                                <span>PDF files</span>
                              </div>
                              <p className="field-help">
                                {pdfs.reduce((n, p) => n + p.pages, 0)} pages in
                                total. Files will be combined in the order shown
                                above.
                              </p>
                              {pdfs.length < 2 && (
                                <p className="inline-tip">
                                  Add one more PDF to continue.
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <label className="field">
                                <span className="field-label">
                                  {tool === 'removePages'
                                    ? 'Pages to remove'
                                    : tool === 'rotatePdf'
                                      ? 'Pages to rotate'
                                      : 'Pages to include'}
                                </span>
                                <Input
                                  value={pageRange}
                                  placeholder="e.g. 1, 3, 5-8"
                                  onChange={(e) => {
                                    setPageRange(e.target.value);
                                    setRangeError('');
                                    invalidate();
                                  }}
                                  aria-invalid={!!rangeError}
                                  aria-describedby="page-range-help"
                                />
                              </label>
                              <p id="page-range-help" className="field-help">
                                {tool === 'removePages'
                                  ? `This PDF has ${activePDF.pages} pages. Enter numbers or ranges separated by commas.`
                                  : `Leave blank to use all ${activePDF.pages} pages. Enter numbers or ranges separated by commas.`}
                              </p>
                              {rangeError && (
                                <p className="input-error">{rangeError}</p>
                              )}
                              {tool === 'rotatePdf' && (
                                <Choice
                                  label="Turn pages"
                                  value={pdfRotation}
                                  options={[
                                    { value: '90', label: '90° clockwise' },
                                    { value: '180', label: '180° upside down' },
                                    {
                                      value: '270',
                                      label: '90° anticlockwise',
                                    },
                                  ]}
                                  onChange={(value) => {
                                    setPdfRotation(value);
                                    invalidate();
                                  }}
                                />
                              )}
                              <p className="inline-tip">
                                Creates a new PDF. Your original PDF is
                                unchanged.
                              </p>
                            </>
                          )}
                        </>
                      ) : tool === 'pdf' ? (
                        <>
                          <h3>PDF settings</h3>
                          <Choice
                            label="Images to include"
                            value={pdfSource}
                            options={[
                              {
                                value: 'original',
                                label: 'Whole original images (recommended)',
                              },
                              {
                                value: 'prepared',
                                label: 'Edited crops from the image tools',
                              },
                            ]}
                            onChange={(v) => {
                              setPdfSource(v);
                              invalidate();
                            }}
                            disabled={!!busy}
                          />
                          <p className="field-help">
                            {pdfSource === 'original'
                              ? 'Nothing is cropped. Large images are scaled to a maximum of 2,400 pixels on the longest side.'
                              : 'Uses the sizes and crops currently set for each image. Check them in Photo resizer before preparing the PDF.'}
                          </p>
                          <div className="output-summary">
                            <strong>{assets.length} pages</strong>
                            <span>A4 paper · one image per page</span>
                          </div>
                          <p className="inline-tip">
                            Use the up and down arrows beside each file to
                            change the page order.
                          </p>
                        </>
                      ) : (
                        settings && (
                          <>
                            <h3>Settings for the selected image</h3>
                            <p className="selected-name">{active.name}</p>
                            {tool !== 'compress' && (
                              <>
                                <Choice
                                  label="Choose a photo or signature size"
                                  value={presetId}
                                  options={[
                                    {
                                      value: 'custom',
                                      label: 'Custom size / current settings',
                                    },
                                    ...presets.map((p) => ({
                                      value: p.id,
                                      label: p.name,
                                    })),
                                  ]}
                                  onChange={choosePreset}
                                  disabled={!!busy}
                                />
                                <div className="two-columns">
                                  <Numeric
                                    label="Width (pixels)"
                                    value={settings.width}
                                    min={32}
                                    max={2400}
                                    integer
                                    onChange={(width) => update({ width })}
                                  />
                                  <Numeric
                                    label="Height (pixels)"
                                    value={settings.height}
                                    min={32}
                                    max={2400}
                                    integer
                                    onChange={(height) => update({ height })}
                                  />
                                </div>
                                <p className="field-help">
                                  Use the dimensions requested by your form. A
                                  preset is a starting point, not an official
                                  approval.
                                </p>
                              </>
                            )}
                            {tool !== 'sheet' && (
                              <>
                                <Numeric
                                  label="Maximum file size (KB)"
                                  value={settings.maxKB}
                                  min={5}
                                  max={5000}
                                  onChange={(maxKB) => update({ maxKB })}
                                />
                                <div
                                  className="quick-limits"
                                  aria-label="Common file size limits"
                                >
                                  {[20, 50, 100, 200].map((n) => (
                                    <Button
                                      key={n}
                                      variant="outline"
                                      aria-pressed={settings.maxKB === n}
                                      onClick={() => update({ maxKB: n })}
                                    >
                                      {n} KB
                                    </Button>
                                  ))}
                                </div>
                                <p className="field-help">
                                  The JPG will be at or below this limit. 1 KB =
                                  1,000 bytes.
                                </p>
                              </>
                            )}
                            {tool === 'compress' && (
                              <>
                                <div className="output-summary">
                                  <strong>
                                    {settings.width} × {settings.height} pixels
                                  </strong>
                                  <span>Output dimensions</span>
                                </div>
                                <Button
                                  variant="outline"
                                  className="wide-button"
                                  onClick={() =>
                                    update(
                                      initialSettings(
                                        'compress',
                                        active.image.naturalWidth,
                                        active.image.naturalHeight,
                                      ),
                                    )
                                  }
                                >
                                  Keep the whole original image
                                </Button>
                                <p className="field-help">
                                  Large images are resized to fit within 2,400
                                  pixels. You can change dimensions below.
                                </p>
                              </>
                            )}
                            {tool === 'sheet' && (
                              <>
                                <Choice
                                  label="Paper size"
                                  value={sheetId}
                                  options={Object.entries(SHEETS).map(
                                    ([value, s]) => ({ value, label: s.name }),
                                  )}
                                  onChange={(v) => {
                                    setSheetId(v as keyof typeof SHEETS);
                                    setPage(0);
                                    invalidate();
                                  }}
                                  disabled={!!busy}
                                />
                                <div className="two-columns">
                                  <Numeric
                                    label="Photo width (mm)"
                                    value={settings.printWidth}
                                    min={5}
                                    max={190}
                                    onChange={(printWidth) =>
                                      update({ printWidth })
                                    }
                                  />
                                  <Numeric
                                    label="Copies of this photo"
                                    value={settings.copies}
                                    min={1}
                                    max={40}
                                    integer
                                    onChange={(copies) => update({ copies })}
                                  />
                                </div>
                                <p className="field-help">
                                  Photo height:{' '}
                                  {(
                                    (settings.printWidth * settings.height) /
                                    settings.width
                                  ).toFixed(1)}{' '}
                                  mm. 5 mm paper margins and 2 mm gaps.
                                </p>
                                <div className="output-summary">
                                  <strong>
                                    {layoutError
                                      ? 'Check photo size'
                                      : `${layout.length} photos on ${pages} sheet${pages === 1 ? '' : 's'}`}
                                  </strong>
                                  <span>
                                    Print quality is kept high; upload KB limits
                                    do not apply.
                                  </span>
                                </div>
                                {layoutError && (
                                  <p className="input-error" role="alert">
                                    {layoutError}
                                  </p>
                                )}
                              </>
                            )}
                            <Accordion
                              defaultValue={
                                tool === 'signature' ? ['crop'] : []
                              }
                            >
                              <AccordionItem value="crop">
                                <AccordionTrigger>
                                  Crop, position & rotate
                                </AccordionTrigger>
                                <AccordionContent>
                                  <Choice
                                    label="How should the image fit?"
                                    value={settings.fit ?? 'cover'}
                                    options={[
                                      {
                                        value: 'cover',
                                        label:
                                          'Fill the frame — crop the edges',
                                      },
                                      {
                                        value: 'contain',
                                        label:
                                          'Keep the whole image — white padding',
                                      },
                                    ]}
                                    onChange={(fit) =>
                                      update({
                                        fit: fit as 'cover' | 'contain',
                                      })
                                    }
                                    disabled={!!busy}
                                  />
                                  {settings.fit !== 'contain' ? (
                                    <>
                                      <Range
                                        label="Zoom"
                                        value={settings.zoom}
                                        min={1}
                                        max={4}
                                        step={0.01}
                                        onChange={(zoom) => {
                                          update({ zoom });
                                          setView('prepared');
                                        }}
                                        disabled={!!busy}
                                      />
                                      <Range
                                        label="Move left / right"
                                        value={settings.x}
                                        min={0}
                                        max={100}
                                        onChange={(x) => {
                                          update({ x });
                                          setView('prepared');
                                        }}
                                        disabled={!!busy}
                                      />
                                      <Range
                                        label="Move up / down"
                                        value={settings.y}
                                        min={0}
                                        max={100}
                                        onChange={(y) => {
                                          update({ y });
                                          setView('prepared');
                                        }}
                                        disabled={!!busy}
                                      />
                                    </>
                                  ) : (
                                    <p className="field-help">
                                      The whole image is centred. Choose “Fill
                                      the frame” to crop and reposition it.
                                    </p>
                                  )}
                                  <div className="two-columns">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        update({
                                          rotation:
                                            (settings.rotation + 90) % 360,
                                        });
                                        setView('prepared');
                                      }}
                                    >
                                      <RotateCw size={16} /> Rotate 90°
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        update({
                                          zoom: 1,
                                          x: 50,
                                          y: 50,
                                          rotation: 0,
                                        });
                                        setView('prepared');
                                      }}
                                    >
                                      Reset crop
                                    </Button>
                                  </div>
                                  <p className="field-help">
                                    Transparent areas become white. Background
                                    removal is not applied.
                                  </p>
                                </AccordionContent>
                              </AccordionItem>
                              {tool === 'compress' && (
                                <AccordionItem value="dimensions">
                                  <AccordionTrigger>
                                    Change image dimensions
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="two-columns">
                                      <Numeric
                                        label="Width (pixels)"
                                        value={settings.width}
                                        min={32}
                                        max={2400}
                                        integer
                                        onChange={(width) => update({ width })}
                                      />
                                      <Numeric
                                        label="Height (pixels)"
                                        value={settings.height}
                                        min={32}
                                        max={2400}
                                        integer
                                        onChange={(height) =>
                                          update({ height })
                                        }
                                      />
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )}
                            </Accordion>
                            <div className="preset-actions">
                              <Button
                                variant="outline"
                                onClick={() => setDialog('preset')}
                              >
                                <BookmarkPlus size={16} /> Save this size
                              </Button>
                              {assets.length > 1 && (
                                <Button variant="outline" onClick={applyAll}>
                                  Apply to all {assets.length}
                                </Button>
                              )}
                            </div>
                            <p className="field-help">
                              Saved sizes remember settings on this browser,
                              never your files.
                            </p>
                          </>
                        )
                      )}
                    </fieldset>
                  </form>
                </div>
                <section className="panel download-panel">
                  <Step
                    number={3}
                    title={
                      result ? 'Your file is ready' : 'Prepare your download'
                    }
                    detail={
                      result
                        ? result.description
                        : documentTool
                          ? tool === 'merge'
                            ? 'Combine the PDFs above into one file.'
                            : tool === 'rotatePdf'
                              ? 'Turn the chosen pages and save a new PDF.'
                              : tool === 'removePages'
                                ? 'Delete the chosen pages and save a new PDF.'
                                : 'Save the chosen pages as a new PDF.'
                          : tool === 'sheet'
                            ? 'Create a PDF with every photo and its copy count.'
                            : tool === 'pdf'
                              ? 'Create one PDF from all the images above.'
                              : 'Prepare the selected image, or save every image together.'
                    }
                  />
                  {result ? (
                    <div className="download-result">
                      <div>
                        <strong>{result.name}</strong>
                        <span>
                          {formatBytes(result.size)}
                          {tool === 'sheet'
                            ? ' · Print at actual size (100%)'
                            : ''}
                        </span>
                      </div>
                      <a
                        className="download-link"
                        href={result.url}
                        download={result.name}
                        onClick={() => setDirty(false)}
                      >
                        <Download size={19} /> Download{' '}
                        {result.type === 'application/zip'
                          ? 'ZIP'
                          : result.type === 'application/pdf'
                            ? 'PDF'
                            : 'JPG'}
                      </a>
                      <p>
                        The file will be saved to your browser’s download
                        location. You can download it again until you change
                        this job.
                        {result.type !== 'application/zip' && (
                          <>
                            {' '}
                            Download not starting?{' '}
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open the file
                            </a>{' '}
                            and use your browser’s save option.
                          </>
                        )}{' '}
                        If files will not save inside an in-app browser, open
                        this website in Chrome, Edge or Safari.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setResult((old) => {
                            if (old) URL.revokeObjectURL(old.url);
                            return null;
                          })
                        }
                      >
                        Back to download options
                      </Button>
                    </div>
                  ) : (
                    <div className="prepare-actions">
                      <Button
                        className="prepare-button"
                        disabled={
                          !!busy ||
                          !!layoutError ||
                          (tool === 'merge' && pdfs.length < 2)
                        }
                        onClick={() => void prepare()}
                      >
                        <Download size={18} />
                        {busy ? 'Preparing…' : info.action}
                      </Button>
                      {!documentTool &&
                        tool !== 'pdf' &&
                        tool !== 'sheet' &&
                        assets.length > 1 && (
                          <Button
                            variant="outline"
                            disabled={!!busy}
                            onClick={() => void prepare(true)}
                          >
                            <Files size={18} /> Prepare all {assets.length} as
                            ZIP
                          </Button>
                        )}
                    </div>
                  )}
                </section>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="desk-dialog sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'preset'
                ? 'Save this size'
                : dialog === 'saved'
                  ? 'Your saved sizes'
                  : dialog === 'privacy'
                    ? 'Your files, on your device'
                    : 'A quick guide to every tool'}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'preset'
                ? 'Give these settings a name you will recognise next time.'
                : dialog === 'saved'
                  ? 'Reusable settings saved in this browser.'
                  : dialog === 'privacy'
                    ? 'File processing happens locally in your browser.'
                    : 'Choose a tool, add your files, preview the result and download.'}
            </DialogDescription>
          </DialogHeader>
          {dialog === 'preset' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                savePreset();
              }}
            >
              <label className="field" htmlFor="saved-size-name">
                <span className="field-label">Saved size name</span>
                <Input
                  id="saved-size-name"
                  required
                  maxLength={60}
                  placeholder="e.g. College form — photo"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
              </label>
              <Button
                type="submit"
                disabled={!presetName.trim()}
                className="wide-button"
              >
                Save size
              </Button>
            </form>
          )}
          {dialog === 'saved' && (
            <div className="saved-list">
              {!saved.length ? (
                <p>
                  No saved sizes yet. Add an image, set its dimensions, then
                  choose <strong>Save this size</strong>.
                </p>
              ) : (
                saved.map((p) => (
                  <div className="saved-row" key={p.id}>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.settings.width} × {p.settings.height} px · up to{' '}
                        {p.settings.maxKB} KB
                      </small>
                    </div>
                    <Button
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => {
                        if (documentTool || tool === 'pdf') changeTool('photo');
                        choosePreset(p.id);
                        setDialog(null);
                      }}
                    >
                      Use
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={!!busy}
                      aria-label={`Delete saved size ${p.name}`}
                      onClick={() => deletePreset(p.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
          {dialog === 'privacy' && (
            <div className="dialog-copy">
              <p>
                Images and PDF contents are not uploaded to our server. They
                stay in memory while this tab is open. Refreshing, closing the
                tab or choosing New job clears them.
              </p>
              <p>
                Only named size settings are saved in browser storage. Your
                downloaded files remain in your Downloads folder. You can remove
                saved sizes from the Saved sizes menu.
              </p>
              <p>
                <strong>File limits:</strong> up to 30 images, 20 MB each and 60
                megapixels per batch; or 12 PDFs, 20 MB each, 60 MB and 300
                pages combined. These limits help prevent your browser running
                out of memory.
              </p>
              <p>
                PDF tools support ordinary, unprotected PDFs. For interactive or
                signed forms, save a flattened copy first. The tools do not
                certify photos for government or other official requirements.
              </p>
            </div>
          )}
          {dialog === 'help' && (
            <div className="dialog-copy">
              <div className="help-tools">
                {(Object.keys(TOOL_INFO) as ToolId[]).map((id) => (
                  <button
                    key={id}
                    disabled={!!busy}
                    onClick={() => {
                      changeTool(id);
                      setDialog(null);
                    }}
                  >
                    <strong>
                      {TOOL_INFO[id].title}
                      <ArrowRight size={15} />
                    </strong>
                    <span>{TOOL_INFO[id].description}</span>
                  </button>
                ))}
              </div>
              <p>
                <strong>Pixels vs millimetres:</strong> use pixels for online
                uploads. Use millimetres for printed photo dimensions. KB
                controls the downloaded JPG’s file size.
              </p>
              <p>
                <strong>Several files?</strong> Select a file to edit it. “Apply
                to all” copies its size settings to other images. ZIP contains a
                separate JPG for each image. PDF combines pages into one
                document.
              </p>
              <p>
                <strong>Keep the whole image:</strong> open Crop, position &
                rotate and choose the white-padding option. Images to PDF uses
                full originals by default.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new job?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears all loaded images, PDFs and prepared downloads from
              this tab. Saved sizes and files already downloaded are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={clearFiles}>
              Clear and start new
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
