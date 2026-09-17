import { notFound } from 'next/navigation';
import Desk from '../../desk';
import { TOOL_INFO, type ToolId } from '@/lib/workflow';
const ids = Object.keys(TOOL_INFO) as ToolId[];
export function generateStaticParams() {
  return ids.map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!ids.includes(slug as ToolId)) return {};
  const info = TOOL_INFO[slug as ToolId];
  return {
    title: `${info.title} — Free Online Tool`,
    description: `${info.description} ${info.hint} Free, no sign-up required.`,
    alternates: { canonical: `/tools/${slug}` },
    openGraph: {
      title: `${info.title} | Sahajly`,
      description: info.description,
      url: `/tools/${slug}`,
    },
  };
}
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!ids.includes(slug as ToolId)) notFound();
  return <Desk key={slug} initialTool={slug as ToolId} />;
}
