import assert from 'node:assert/strict';
const base = process.argv[2] || 'https://sites-project.anshuldewangan19.workers.dev';
const toolTitles = { photo: 'Photo resizer', signature: 'Signature resizer', compress: 'Reduce file size', sheet: 'Photo print sheet', pdf: 'Images to PDF', merge: 'Merge PDFs', extract: 'Extract PDF pages', rotatePdf: 'Rotate PDF', removePages: 'Remove PDF pages' };
const routes = ['/', '/about', '/pricing', '/contact', '/privacy', '/terms', '/refunds', ...Object.keys(toolTitles).map(id => `/tools/${id}`)];
let checks = 0;
for (const route of routes) {
  const response = await fetch(base + route, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, route);
  const html = await response.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical?.replace(/\/$/, ''), `${base}${route}`.replace(/\/$/, ''), `${route}: canonical`);
  assert.ok(html.includes('Everyday tasks, made simple.'), `${route}: footer`);
  assert.ok(!html.includes('signin-with-chatgpt'), `${route}: external login leak`);
  if (route.startsWith('/tools/')) {
    const id = route.split('/').at(-1);
    const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, '');
    assert.ok(heading?.includes(toolTitles[id]), `${route}: wrong active tool ${heading}`);
  }
  if (['/contact','/privacy','/refunds'].includes(route)) assert.ok(html.includes('support@sahajly.com'), `${route}: support email`);
  checks++; console.log(`PASS ${route}`);
}
for (const path of ['/robots.txt', '/sitemap.xml']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes(base));
  checks++; console.log(`PASS ${path}`);
}
const missing = await fetch(base + '/tools/not-a-tool');
assert.equal(missing.status, 404);
assert.ok((await missing.text()).includes('back on track'));
checks++; console.log('PASS unknown tool returns helpful 404');
const workspace = await fetch(base + '/workspace');
assert.ok(/name="robots" content="[^"]*noindex/.test(await workspace.text()));
checks++; console.log('PASS workspace excluded from indexing');
console.log(`${checks} deployed page checks passed.`);
