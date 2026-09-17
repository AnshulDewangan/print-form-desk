'use client';
import { useEffect, useRef, useState } from 'react';
import { suggestTask } from '@/lib/assistance';
import { TOOL_INFO, type ToolId } from '@/lib/workflow';

export default function FileAssistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof suggestTask> | null>(
    null,
  );
  const toggle = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return (
    <aside className="file-assistant" aria-label="Sahajly file guide">
      <button
        ref={toggle}
        className="assistant-toggle"
        aria-expanded={open}
        aria-controls="file-guide"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close guide ×' : '✦ Help me prepare a file'}
      </button>
      {open && (
        <section id="file-guide" className="assistant-panel">
          <h2>What do you need?</h2>
          <p>
            Describe your task or paste the size requirements. This on-device
            guide understands common requests; it is not an AI chat service.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setResult(suggestTask(text));
            }}
          >
            <label htmlFor="assistant-request">Your requirements</label>
            <textarea
              ref={field}
              id="assistant-request"
              maxLength={1500}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
              placeholder="Resize photo to 200 × 230 px under 50 KB"
              rows={3}
            />
            <button type="submit">Find my tool</button>
          </form>
          <div className="assistant-examples">
            {[
              'Photo under 50 KB',
              'Merge PDFs',
              'Resize signature to 600 × 200 px',
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setText(example);
                  setResult(suggestTask(example));
                }}
              >
                {example}
              </button>
            ))}
          </div>
          <div aria-live="polite">
            {result &&
              (result.error ? (
                <p>{result.error}</p>
              ) : (
                <div>
                  <h3>{TOOL_INFO[result.tool as ToolId].title}</h3>
                  <p>
                    {result.notes?.length
                      ? result.notes.join(' · ')
                      : TOOL_INFO[result.tool as ToolId].hint}
                  </p>
                  <p>
                    Open the tool, add your file and review all settings before
                    preparing it. Unspecified settings use the tool defaults.
                  </p>
                  <a className="assistant-start" href={result.href}>
                    Open tool with these settings →
                  </a>
                </div>
              ))}
          </div>
          <small>
            No files or requests are sent to a server. Opening a tool leaves
            your current page.
          </small>
        </section>
      )}
    </aside>
  );
}
