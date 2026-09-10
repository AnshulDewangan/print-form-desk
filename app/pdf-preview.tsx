'use client';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import type { PDFAsset } from '@/lib/pdf-tools';

export default function PDFPreview({ file }: { file: PDFAsset }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let disposed = false,
      task:
        | ReturnType<(typeof import('pdfjs-dist'))['getDocument']>
        | undefined;
    setDocument(null);
    setPage(1);
    setLoading(true);
    setError('');
    (async () => {
      const pdfjs = await import('pdfjs-dist');
      const { default: workerURL } =
        await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      if (disposed) return;
      pdfjs.GlobalWorkerOptions.workerSrc = workerURL;
      task = pdfjs.getDocument({
        data: file.bytes.slice(),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        useSystemFonts: true,
      });
      const doc = await task.promise;
      if (!disposed) setDocument(doc);
    })().catch(() => {
      if (!disposed) {
        setError(
          'This PDF could not be previewed. You can still open the original file below.',
        );
        setLoading(false);
      }
    });
    return () => {
      disposed = true;
      void task?.destroy();
    };
  }, [file]);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let disposed = false,
      render: RenderTask | undefined;
    setLoading(true);
    setError('');
    (async () => {
      const source = await document.getPage(page);
      if (disposed || !canvas.current) return;
      const initial = source.getViewport({ scale: 1 });
      const viewport = source.getViewport({
        scale: Math.min(1.5, 1000 / Math.max(initial.width, initial.height)),
      });
      canvas.current.width = Math.ceil(viewport.width);
      canvas.current.height = Math.ceil(viewport.height);
      render = source.render({ canvas: canvas.current, viewport });
      await render.promise;
      if (!disposed) setLoading(false);
    })().catch(() => {
      if (!disposed) {
        setError(
          'This page could not be previewed. Try another page or open the original file.',
        );
        setLoading(false);
      }
    });
    return () => {
      disposed = true;
      render?.cancel();
    };
  }, [document, page]);
  return (
    <>
      <div className="pdf-canvas-stage">
        {loading && <p role="status">Loading PDF preview…</p>}
        {error && <p role="alert">{error}</p>}
        <canvas
          hidden={loading || !!error}
          ref={canvas}
          role="img"
          aria-label={`${file.name} — page ${page}`}
        />
      </div>
      <div className="page-nav">
        <Button
          variant="outline"
          disabled={page === 1 || loading || !document}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous page
        </Button>
        <span>
          Page {page} of {file.pages}
        </span>
        <Button
          variant="outline"
          disabled={page === file.pages || loading || !document}
          onClick={() => setPage((p) => p + 1)}
        >
          Next page
        </Button>
      </div>
    </>
  );
}
