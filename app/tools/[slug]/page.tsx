import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import Desk from '../../desk';
import { TOOL_INFO, type ToolId } from '@/lib/workflow';
const ids = Object.keys(TOOL_INFO) as ToolId[];
export function generateStaticParams() {
  return ids.map((slug) => ({ slug }));
}
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!ids.includes(slug as ToolId)) notFound();
  const id = slug as ToolId,
    info = TOOL_INFO[id];
  return (
    <>
      <div className="tool-detail">
        <aside className="detail-sidebar">
          <Link href="/" className="detail-brand">
            <img className="sahajly-wordmark" src="/brand/sahajly-wordmark.svg" alt="Sahajly" width={198} height={60} />
          </Link>
          <p className="eyebrow">ALL TOOLS</p>
          {ids.map((item) => (
            <Link
              className={item === id ? 'active' : ''}
              href={`/tools/${item}`}
              key={item}
            >
              {TOOL_INFO[item].title}
            </Link>
          ))}
          <Link className="detail-workspace" href="/workspace">
            Open workspace <ArrowRight size={16} />
          </Link>
        </aside>
        <main className="detail-main">
          <Link href="/" className="detail-back">
            ← All tools
          </Link>
          <p className="eyebrow">
            {id === 'photo' ||
            id === 'signature' ||
            id === 'compress' ||
            id === 'sheet'
              ? 'PHOTO TOOLS'
              : 'PDF TOOLS'}
          </p>
          <h1>{info.title}</h1>
          <p className="detail-lead">{info.description}</p>
          <div className="detail-card">
            <div>
              <h2>What this tool does</h2>
              <p>{info.hint}</p>
              <Link className="landing-primary" href="/workspace">
                Use {info.title} <ArrowRight size={18} />
              </Link>
            </div>
            <div className="detail-points">
              <p>
                <Check size={18} /> Clear step-by-step workflow
              </p>
              <p>
                <Check size={18} /> Preview before downloading
              </p>
              <p>
                <ShieldCheck size={18} /> Original files stay unchanged
              </p>
            </div>
          </div>
          <h2>How it works</h2>
          <ol className="detail-steps">
            <li>
              <strong>Add your file</strong>
              <span>Choose a file or drag it into the workspace.</span>
            </li>
            <li>
              <strong>Set the options</strong>
              <span>Use the fields shown for this job.</span>
            </li>
            <li>
              <strong>Download the result</strong>
              <span>Check the preview and save the finished file.</span>
            </li>
          </ol>
        </main>
      </div>
    </>
  );
}
