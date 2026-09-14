'use client';

import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { TOOL_INFO, type ToolId } from '@/lib/workflow';

const examples: Record<ToolId, string> = {
  photo: 'Change width and height · crop a passport photo',
  signature: 'Crop blank paper · resize a signature for a form',
  compress: 'Fit an image under 20 KB, 50 KB or 100 KB',
  sheet: 'Print multiple passport photos on one sheet',
  pdf: 'Turn document photos into a single PDF',
  merge: 'Combine certificates and documents into one PDF',
  extract: 'Keep only the pages you need · split a PDF',
  rotatePdf: 'Turn one page or the whole PDF left or right',
  removePages: 'Delete blank or unwanted pages from a PDF',
};

export default function ToolFinder({
  onChoose,
  disabled,
}: {
  onChoose: (tool: ToolId) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(true);
  const [category, setCategory] = useState('All tools');
  const categories = ['All tools', 'Photos & signatures', 'PDF tools'];
  const imageTools: ToolId[] = ['photo', 'signature', 'compress', 'sheet'];
  const matches = (Object.keys(TOOL_INFO) as ToolId[]).filter(
    (id) =>
      (category === 'All tools' ||
        (category === 'Photos & signatures'
          ? imageTools.includes(id)
          : !imageTools.includes(id))) &&
      `${TOOL_INFO[id].title} ${TOOL_INFO[id].description} ${examples[id]}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <section className="tool-finder" aria-label="Find the right tool">
      <button
        className="finder-toggle"
        aria-expanded={open}
        aria-controls="tool-finder-options"
        onClick={() => setOpen(!open)}
      >
        <span>
          <strong>What do you need to do?</strong>
          <small>Find the right tool for your photo, signature or PDF.</small>
        </span>
        <span>
          {open
            ? 'Close guide'
            : `Explore all ${Object.keys(TOOL_INFO).length} tools`}{' '}
          <ArrowRight size={16} />
        </span>
      </button>
      {open && (
        <div id="tool-finder-options" className="finder-content">
          <div className="finder-categories" aria-label="Tool categories">
            {categories.map((item) => (
              <button
                key={item}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="finder-search">
            <Search size={18} />
            <input
              type="search"
              aria-label="Search tools"
              placeholder="Try: 50 KB, passport photo, combine PDF…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <p className="finder-count" role="status">
            {matches.length} {matches.length === 1 ? 'tool' : 'tools'} available
            · Free, no sign-up required
          </p>
          <div className="finder-grid">
            {matches.map((id) => (
              <button
                key={id}
                disabled={disabled}
                onClick={() => {
                  onChoose(id);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <strong>
                  {TOOL_INFO[id].title}
                  <ArrowRight size={16} />
                </strong>
                <span>{examples[id]}</span>
              </button>
            ))}
          </div>
          {!matches.length && (
            <p>
              No matching tool. Try “photo”, “size” or “PDF”.{' '}
              <button
                className="finder-reset"
                onClick={() => {
                  setQuery('');
                  setCategory('All tools');
                }}
              >
                Show all tools
              </button>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
