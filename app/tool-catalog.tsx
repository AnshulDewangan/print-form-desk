'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowUpRight,
  Search,
  Image,
  PenLine,
  Minimize2,
  LayoutGrid,
  Images,
  Files,
  Scissors,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { TOOL_INFO, type ToolId } from '@/lib/workflow';
import { TOOL_CATALOG, matchesTool } from '@/lib/tool-catalog';
const icons = {
  photo: Image,
  signature: PenLine,
  compress: Minimize2,
  sheet: LayoutGrid,
  pdf: Images,
  merge: Files,
  extract: Scissors,
  rotatePdf: RotateCw,
  removePages: Trash2,
};
export default function ToolCatalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All tools');
  const ids = (Object.keys(TOOL_INFO) as ToolId[]).filter(
    (id) =>
      (category === 'All tools' || TOOL_CATALOG[id].category === category) &&
      matchesTool(id, query),
  );
  return (
    <section
      id="tools"
      className="catalog-section"
      aria-labelledby="catalog-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR EVERYDAY TOOLKIT</p>
          <h2 id="catalog-title">What would you like to do?</h2>
        </div>
        <span className="free-label">Free · No sign-up needed</span>
      </div>
      <div className="catalog-controls">
        <div className="catalog-filters" aria-label="Filter tools">
          {['All tools', 'Images', 'PDFs'].map((item) => (
            <button
              key={item}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="catalog-search">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tools"
            placeholder="Search: merge PDF, resize, 50 KB…"
          />
        </label>
      </div>
      <output className="catalog-count">
        {ids.length} {ids.length === 1 ? 'tool' : 'tools'}{' '}
        {query || category !== 'All tools' ? 'found' : 'ready to use'}
      </output>
      <div className="landing-grid">
        {ids.map((id) => {
          const Icon = icons[id];
          return (
            <Link
              key={id}
              className={`feature-card catalog-card category-${TOOL_CATALOG[id].category.toLowerCase()}`}
              href={`/tools/${id}`}
            >
              <div className="card-top">
                <span className="feature-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </div>
              <h3>{TOOL_INFO[id].title}</h3>
              <p>{TOOL_CATALOG[id].detail}</p>
              <span className="card-category">
                {TOOL_CATALOG[id].category} <span aria-hidden="true">·</span>{' '}
                Free
              </span>
            </Link>
          );
        })}
      </div>
      {!ids.length && (
        <div className="catalog-empty">
          <h3>No matching tool yet</h3>
          <p>
            Try a shorter search. For example, “merge” or “photo”. PDF
            compression, OCR and Office conversion are not available yet.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setCategory('All tools');
            }}
          >
            Show all tools
          </button>
        </div>
      )}
    </section>
  );
}
