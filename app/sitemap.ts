import type { MetadataRoute } from 'next';
import { TOOL_INFO, type ToolId } from '@/lib/workflow';
const base = 'https://sites-project.anshuldewangan19.workers.dev';
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '',
    '/workspace',
    '/about',
    '/contact',
    '/pricing',
    '/privacy',
    '/terms',
    '/refunds',
  ];
  const tools = (Object.keys(TOOL_INFO) as ToolId[]).map(
    (id) => `/tools/${id}`,
  );
  return [...pages, ...tools].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }));
}
