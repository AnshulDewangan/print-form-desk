import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';

const target = new URL('../work/billing-tests/', import.meta.url);
await mkdir(target, { recursive: true });
for (const name of [
  'plans',
  'geometry',
  'pack',
  'billing-crypto',
  'server',
  'razorpay',
]) {
  let source = await readFile(
    new URL(`../lib/${name}.ts`, import.meta.url),
    'utf8',
  );
  source = source
    .replace(
      "import { env } from 'cloudflare:workers';",
      'const env = globalThis.testEnv;',
    )
    .replace(
      "import { headers } from 'next/headers';",
      'const headers = async () => globalThis.testHeaders;',
    );
  source = source.replace(
    /from '(\.\/[^']+?)(?:\.js)?'/g,
    (_, p) => `from '${p}.js'`,
  );
  await writeFile(
    new URL(`${name}.js`, target),
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  );
}
for (const [name, path] of [
  ['templates-route', 'templates'],
  ['order-route', 'billing/order'],
  ['verify-route', 'billing/verify'],
  ['webhook-route', 'billing/webhook'],
]) {
  let source = await readFile(
    new URL(`../app/api/${path}/route.ts`, import.meta.url),
    'utf8',
  );
  source = source.replace(/from '@\/lib\/([^']+)'/g, "from './$1.js'");
  await writeFile(
    new URL(`${name}.js`, target),
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  );
}
const sql = new DatabaseSync(':memory:');
sql.exec(
  await readFile(
    new URL('../drizzle/0000_nifty_mentallo.sql', import.meta.url),
    'utf8',
  ),
);
const wrap = (query, args = []) => ({
  bind: (...next) => wrap(query, next),
  first: async () => sql.prepare(query).get(...args) ?? null,
  all: async () => ({ results: sql.prepare(query).all(...args) }),
  run: async () => ({
    meta: { changes: sql.prepare(query).run(...args).changes },
  }),
});
globalThis.testEnv = {
  DB: { prepare: (query) => wrap(query) },
  BILLING_MODE: 'test',
  BILLING_ENABLED: 'false',
  RAZORPAY_KEY_ID: 'rzp_test_fixture',
  RAZORPAY_KEY_SECRET: 'fixture-secret',
  RAZORPAY_WEBHOOK_SECRET: 'webhook-fixture',
};
globalThis.testHeaders = new Headers();
const { verifySignature, validateCapturedPayment } = await import(
  new URL('billing-crypto.js', target)
);
const { DEFAULT_PACK, validatePack, safeJobName } = await import(
  new URL('pack.js', target)
);
const server = await import(new URL('server.js', target));
const templateRoute = await import(new URL('templates-route.js', target));
const orderRoute = await import(new URL('order-route.js', target));
const { grantPayment } = await import(new URL('razorpay.js', target));
let checks = 0;
async function check(name, fn) {
  await fn();
  checks++;
  console.log(`PASS ${name}`);
}
const request = (body, origin = 'https://desk.test', method = 'POST') =>
  new Request('https://desk.test/api/templates', {
    method,
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
await check(
  'HMAC rejects tampering, malformed and missing signatures',
  async () => {
    const sig = createHmac('sha256', 'secret')
      .update('order|payment')
      .digest('hex');
    assert.equal(await verifySignature('order|payment', sig, 'secret'), true);
    assert.equal(await verifySignature('other|payment', sig, 'secret'), false);
    assert.equal(await verifySignature('order|payment', '', 'secret'), false);
    assert.equal(
      await verifySignature('order|payment', 'x'.repeat(64), 'secret'),
      false,
    );
  },
);
const payment = {
  id: 'pay_fixture',
  order_id: 'order_fixture',
  amount: 4900,
  currency: 'INR',
  status: 'captured',
  captured: true,
  amount_refunded: 0,
  created_at: Math.floor(Date.now() / 1000),
};
await check('Only exact captured, unrefunded payments qualify', () => {
  validateCapturedPayment(payment, { id: 'order_fixture', amount: 4900 });
  for (const patch of [
    { amount: 1 },
    { currency: 'USD' },
    { status: 'authorized' },
    { captured: false },
    { amount_refunded: 1 },
    { order_id: 'order_other' },
  ])
    assert.throws(() =>
      validateCapturedPayment(
        { ...payment, ...patch },
        { id: 'order_fixture', amount: 4900 },
      ),
    );
});
await check('Pack validation and safe filenames', () => {
  assert.equal(validatePack(DEFAULT_PACK).signature.width, 600);
  assert.throws(() =>
    validatePack({
      ...DEFAULT_PACK,
      photo: { ...DEFAULT_PACK.photo, width: 0 },
    }),
  );
  assert.equal(safeJobName('../../bad/name'), '-bad-name');
});
await check(
  'Anonymous users and cross-origin writes are rejected',
  async () => {
    assert.equal((await templateRoute.GET()).status, 401);
    assert.equal(
      (await templateRoute.POST(request({}, 'https://other.test'))).status,
      403,
    );
  },
);
globalThis.testHeaders.set('oai-authenticated-user-id', 'alice');
await check('No paid access and no checkout when disabled', async () => {
  assert.equal(
    (
      await templateRoute.POST(
        request({ name: 'Template', settings: DEFAULT_PACK }),
      )
    ).status,
    403,
  );
  assert.equal((await orderRoute.POST(request({ plan: 'shop' }))).status, 503);
  assert.equal((await server.account('alice')).plan, null);
});
sql
  .prepare(
    'INSERT INTO orders (id,user_id,plan,mode,amount,created_at) VALUES (?,?,?,?,?,?)',
  )
  .run('order_fixture', 'alice', 'personal', 'test', 4900, Date.now());
globalThis.fetch = async () => Response.json(payment);
await check('Payment ownership, idempotence and pass activation', async () => {
  await assert.rejects(() => grantPayment('pay_fixture', 'bob'));
  await grantPayment('pay_fixture', 'alice');
  await grantPayment('pay_fixture', 'alice');
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM grants').get().n, 1);
  assert.equal((await server.account('alice')).plan, 'personal');
  assert.equal((await server.account('bob')).plan, null);
});
await check('Test purchases never unlock live mode', async () => {
  globalThis.testEnv.BILLING_MODE = 'live';
  assert.equal((await server.account('alice')).plan, null);
  assert.equal(server.billingReady(), false);
  globalThis.testEnv.BILLING_MODE = 'test';
});
await check(
  'Personal template quota enforced server-side with validated content',
  async () => {
    assert.equal(
      (await templateRoute.POST(request({ name: 'Bad', settings: {} }))).status,
      400,
    );
    for (let i = 0; i < 5; i++)
      assert.equal(
        (
          await templateRoute.POST(
            request({ name: `Template ${i}`, settings: DEFAULT_PACK }),
          )
        ).status,
        200,
      );
    assert.equal(
      (
        await templateRoute.POST(
          request({ name: 'Sixth', settings: DEFAULT_PACK }),
        )
      ).status,
      409,
    );
    assert.equal(
      (await (await templateRoute.GET()).json()).templates.length,
      5,
    );
  },
);
await check(
  'Template ownership prevents cross-account reading and deletion',
  async () => {
    const victim = sql.prepare('SELECT id FROM templates LIMIT 1').get().id;
    sql
      .prepare(
        'INSERT INTO orders (id,user_id,plan,mode,amount,created_at) VALUES (?,?,?,?,?,?)',
      )
      .run('order_bob', 'bob', 'shop', 'test', 19900, Date.now());
    sql
      .prepare(
        'INSERT INTO grants (payment_id,order_id,user_id,plan,mode,expires_at) VALUES (?,?,?,?,?,?)',
      )
      .run(
        'pay_bob',
        'order_bob',
        'bob',
        'shop',
        'test',
        Date.now() + 86400000,
      );
    globalThis.testHeaders.set('oai-authenticated-user-id', 'bob');
    assert.equal(
      (await (await templateRoute.GET()).json()).templates.length,
      0,
    );
    assert.equal(
      (
        await templateRoute.DELETE(
          request({ id: victim }, 'https://desk.test', 'DELETE'),
        )
      ).status,
      200,
    );
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM templates').get().n, 5);
    globalThis.testHeaders.set('oai-authenticated-user-id', 'alice');
  },
);
await check('Webhook signatures and duplicate captured events', async () => {
  const webhook = await import(new URL('webhook-route.js', target));
  const body = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_fixture' } } },
  });
  assert.equal(
    (
      await webhook.POST(
        new Request('https://desk.test/api/billing/webhook', {
          method: 'POST',
          body,
        }),
      )
    ).status,
    400,
  );
  const signature = createHmac('sha256', 'webhook-fixture')
    .update(body)
    .digest('hex');
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await webhook.POST(
          new Request('https://desk.test/api/billing/webhook', {
            method: 'POST',
            headers: { 'x-razorpay-signature': signature },
            body,
          }),
        )
      ).status,
      200,
    );
  assert.equal(
    sql
      .prepare('SELECT COUNT(*) AS n FROM grants WHERE user_id = ?')
      .get('alice').n,
    1,
  );
});
await check(
  'Expiry and refunds revoke access without deleting templates',
  async () => {
    sql
      .prepare('UPDATE orders SET refunded = 1 WHERE id = ?')
      .run('order_fixture');
    assert.equal((await server.account('alice')).plan, null);
    await assert.rejects(() => grantPayment('pay_fixture', 'alice'));
    sql
      .prepare('UPDATE orders SET refunded = 0 WHERE id = ?')
      .run('order_fixture');
    sql.prepare('UPDATE grants SET expires_at = ?').run(Date.now() - 1);
    assert.equal((await server.account('alice')).plan, null);
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM templates').get().n, 5);
  },
);
sql.close();
console.log(`${checks} billing and account checks passed.`);
