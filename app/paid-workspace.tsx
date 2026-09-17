'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PLANS, type Account, type PlanId } from '@/lib/plans';
import {
  DEFAULT_PACK,
  validatePack,
  safeJobName,
  type PackSettings,
} from '@/lib/pack';
import { decode, encodeJPEG, renderCanvas } from '@/lib/images';
import { formatBytes } from '@/lib/workflow';
import type { Settings } from '@/lib/geometry';
import { supabaseBrowser } from '@/lib/supabase-browser';
import AuthPanel from './auth-panel';

async function api<T = Record<string, unknown>>(
  path: string,
  body?: object,
  method?: string,
): Promise<T> {
  const session = (await (await supabaseBrowser())?.auth.getSession())?.data
    .session;
  const headers: Record<string, string> = body
    ? { 'Content-Type': 'application/json' }
    : {};
  if (session?.access_token)
    headers.Authorization = `Bearer ${session.access_token}`;
  const r = await fetch(path, {
    method: method ?? (body ? 'POST' : 'GET'),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = (await r.json()) as T & { error?: string };
  if (!r.ok)
    throw new Error(result.error ?? 'Could not complete this request.');
  return result;
}
type Template = { id: string; name: string; settings: PackSettings };
type ImageFile = { image: HTMLImageElement; name: string };
type Checkout = {
  open: () => void;
  on: (event: string, callback: () => void) => void;
};
async function currentUserEmail() {
  const session = (await (await supabaseBrowser())?.auth.getSession())?.data
    .session;
  return session?.user?.email ?? undefined;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => Checkout;
  }
}
let checkoutScript: Promise<void> | undefined;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript)
    checkoutScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        checkoutScript = undefined;
        reject(
          new Error(
            'Checkout could not load. Check your connection and try again.',
          ),
        );
      };
      document.head.appendChild(script);
    });
  return checkoutScript;
}
function ImagePreview({
  file,
  settings,
}: {
  file: ImageFile | null;
  settings: Settings;
}) {
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = canvas.current;
    if (!host) return;
    host.replaceChildren();
    if (!file) return;
    try {
      const image = renderCanvas(file.image, settings, 320);
      image.setAttribute('role', 'img');
      image.setAttribute(
        'aria-label',
        `Output preview, ${settings.width} by ${settings.height} pixels`,
      );
      host.appendChild(image);
    } catch {
      /* Invalid form fields are reported before export. */
    }
    return () => host.replaceChildren();
  }, [file, settings]);
  return (
    <div className="pack-preview">
      <div ref={canvas} />
      {!file && 'Your preview appears here'}
    </div>
  );
}

export default function PaidWorkspace() {
  const [open, setOpen] = useState(false),
    [view, setView] = useState<'pack' | 'plans'>('pack');
  const [account, setAccount] = useState<Account | null>(null);
  const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<PackSettings>(
    structuredClone(DEFAULT_PACK),
  );
  const [files, setFiles] = useState<
    Record<'photo' | 'signature', ImageFile | null>
  >({ photo: null, signature: null });
  const filesRef = useRef(files);
  const uploads = useRef({ photo: 0, signature: 0 });
  const [documents, setDocuments] = useState<File[]>([]);
  const [job, setJob] = useState('application'),
    [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [result, setResult] = useState<{
    url: string;
    name: string;
    bytes: number;
  } | null>(null);
  const [pendingPayment, setPendingPayment] = useState<Record<
    string,
    string
  > | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const setFile = (slot: 'photo' | 'signature', value: ImageFile | null) => {
    const previous = filesRef.current[slot];
    if (previous) URL.revokeObjectURL(previous.image.src);
    const next = { ...filesRef.current, [slot]: value };
    filesRef.current = next;
    setFiles(next);
  };
  useEffect(
    () => () => {
      for (const f of Object.values(filesRef.current))
        if (f) URL.revokeObjectURL(f.image.src);
    },
    [],
  );
  useEffect(() => {
    setResult(null);
  }, [files, settings, documents, job]);
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (filesRef.current.photo || filesRef.current.signature)
        e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  async function refresh() {
    const next = await api<Account>('/api/account');
    setAccount(next);
    if (next.signedIn && !next.plan) {
      const trial = await api<{ remaining: number }>('/api/pack-trial');
      setTrialRemaining(trial.remaining);
    } else setTrialRemaining(null);
    if (next.plan) {
      const saved = await api<{ templates: Template[] }>('/api/templates');
      setTemplates(saved.templates);
    } else setTemplates([]);
    return next;
  }
  useEffect(() => {
    if (open) refresh().catch((e) => setMessage(e.message));
  }, [open]);
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get('workspace') === 'plans'
    ) {
      setOpen(true);
      setView('plans');
    }
  }, []);
  async function chooseImage(slot: 'photo' | 'signature', file?: File) {
    if (!file) return;
    const version = ++uploads.current[slot];
    setMessage('');
    setResult(null);
    try {
      const image = await decode(file);
      if (version !== uploads.current[slot]) {
        URL.revokeObjectURL(image.src);
        return;
      }
      const other = filesRef.current[slot === 'photo' ? 'signature' : 'photo'];
      if (
        image.naturalWidth * image.naturalHeight +
          (other ? other.image.naturalWidth * other.image.naturalHeight : 0) >
        60000000
      ) {
        URL.revokeObjectURL(image.src);
        throw new Error(
          'These two images are too large together. Use smaller source images.',
        );
      }
      setFile(slot, { image, name: file.name });
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function exportPack() {
    if (!form.current?.reportValidity()) return;
    setBusy(true);
    setMessage('');
    setResult(null);
    try {
      validatePack(settings);
      if (!files.photo || !files.signature)
        throw new Error('Choose both a photo and a signature.');
      const a = await refresh();
      if (!a.signedIn) {
        setView('plans');
        throw new Error(
          'Sign in to get three free application packs. No payment required.',
        );
      }
      const { zipSync, strToU8 } = await import('fflate');
      const entries: Record<string, Uint8Array> = {};
      for (const slot of ['photo', 'signature'] as const) {
        const f = files[slot]!;
        const blob = await encodeJPEG({
          id: slot,
          url: f.image.src,
          image: f.image,
          name: f.name,
          settings: settings[slot],
        });
        entries[`${slot}.jpg`] = new Uint8Array(await blob.arrayBuffer());
      }
      documents.forEach((f, i) => {
        if (f.size > 20 * 1024 * 1024)
          throw new Error(`Document ${i + 1} exceeds 20 MB.`);
      });
      for (const [i, doc] of documents.entries())
        entries[
          `documents/${i + 1}-${doc.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 90)}`
        ] = new Uint8Array(await doc.arrayBuffer());
      entries['Read-me.txt'] = strToU8(
        `Photo: ${settings.photo.width} x ${settings.photo.height} pixels; under ${settings.photo.maxKB} KB.\nSignature: ${settings.signature.width} x ${settings.signature.height} pixels; under ${settings.signature.maxKB} KB.\nSupporting documents are unchanged originals.\nCheck the actual application instructions before submitting. This tool cannot guarantee acceptance.\n`,
      );
      const blob = new Blob([zipSync(entries, { level: 0 }) as BlobPart], {
        type: 'application/zip',
      });
      if (!a.plan) {
        try {
          const trial = await api<{ remaining: number }>('/api/pack-trial', {});
          setTrialRemaining(trial.remaining);
        } catch (error) {
          setView('plans');
          throw error;
        }
      }
      setResult({
        url: URL.createObjectURL(blob),
        name: `${safeJobName(job)}.zip`,
        bytes: blob.size,
      });
      setMessage(
        'Your pack is ready. Extract the ZIP before uploading files to an application portal.',
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveTemplate() {
    if (!form.current?.reportValidity()) return;
    setBusy(true);
    setMessage('');
    try {
      await api('/api/templates', { name: templateName, settings });
      await refresh();
      setTemplateName('');
      setMessage(
        'Template saved to your account. No customer files were saved.',
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function verifyPayment(payment: Record<string, string>) {
    setPendingPayment(payment);
    setBusy(true);
    try {
      await api('/api/billing/verify', payment);
      await refresh();
      setPendingPayment(null);
      setMessage(
        'Your pass is active. You can now download application packs.',
      );
      setView('pack');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function buy(plan: PlanId) {
    setBusy(true);
    setMessage('');
    try {
      await loadCheckout();
      const order = await api<{
        key: string;
        orderId: string;
        amount: number;
        currency: string;
        name: string;
        testMode: boolean;
      }>('/api/billing/order', { plan });
      if (!window.Razorpay)
        throw new Error('Checkout did not load. Please try again.');
      const email = await currentUserEmail();
      const checkout = new window.Razorpay({
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Sahajly',
        image: '/brand/icon-192.png',
        theme: { color: '#513761' },
        description: `${order.name} · 30-day pass${order.testMode ? ' · TEST PAYMENT' : ''}`,
        prefill: email ? { email, method: 'upi' } : { method: 'upi' },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay with UPI',
                instruments: [{ method: 'upi' }],
              },
            },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: (payment: Record<string, string>) => {
          void verifyPayment(payment);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage(
              'Checkout closed. If charged, use Refresh access before trying again.',
            );
          },
        },
      });
      checkout.on('payment.failed', () => {
        setBusy(false);
        setMessage(
          'Payment was not completed. Check its status before retrying.',
        );
      });
      checkout.open();
    } catch (e) {
      setMessage((e as Error).message);
      setBusy(false);
    }
  }
  function clearJob() {
    uploads.current.photo++;
    uploads.current.signature++;
    setFile('photo', null);
    setFile('signature', null);
    setDocuments([]);
    setResult(null);
    setJob('application');
    setResetKey((k) => k + 1);
    setMessage('Ready for the next job. Your size settings are kept.');
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Packs & plans
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent className="paid-dialog">
          <DialogHeader>
            <DialogTitle>Application workspace</DialogTitle>
            <DialogDescription>
              Prepare a photo and signature together. Add original supporting
              documents to one downloadable pack.
            </DialogDescription>
          </DialogHeader>
          <nav className="paid-nav" aria-label="Application workspace">
            <Button
              variant={view === 'pack' ? 'default' : 'outline'}
              onClick={() => setView('pack')}
            >
              Make a pack
            </Button>
            <Button
              variant={view === 'plans' ? 'default' : 'outline'}
              onClick={() => setView('plans')}
            >
              Plans & billing
            </Button>
            {account?.plan && (
              <span>
                {PLANS[account.plan].name}
                {account.testMode ? ' · Test access' : ''}
              </span>
            )}
          </nav>
          {message && (
            <p className="paid-notice" role="status">
              {message}
            </p>
          )}
          {view === 'plans' ? (
            <section>
              <p>
                Basic photo, signature and PDF tools remain free. A 30-day pass
                adds application-pack downloads and templates saved to your
                account. Passes do not renew automatically.
              </p>
              {!account ? (
                <p>Checking account…</p>
              ) : (
                <>
                  {!account.plan && (
                    <section className="support-contact">
                      <h3>
                        {account.signedIn
                          ? `${trialRemaining ?? '…'} free packs remaining`
                          : 'Try 3 packs free'}
                      </h3>
                      <p>
                        One ZIP combines your photo, signature and supporting
                        files. Sign in to try three packs with no card. Upgrade
                        only when you need more.
                      </p>
                      <Button onClick={() => setView('pack')}>
                        Create a pack
                      </Button>
                    </section>
                  )}
                  {account.testMode && account.billingReady && (
                    <p className="paid-notice">
                      Test checkout only. No real money is collected and test
                      passes do not become live passes.
                    </p>
                  )}
                  {!account.billingReady && (
                    <section
                      className="billing-status"
                      aria-label="Payment status"
                    >
                      <span className="billing-badge">Preview mode</span>
                      <h3>Paid access is not open yet</h3>
                      <p>
                        Plans are ready for review, but no payment can be taken.
                        You can use every free tool and preview an application
                        pack.
                      </p>
                      <p className="paid-small">
                        When payments open, you will sign in, choose a plan and
                        complete checkout securely. We will never ask for card
                        details inside this site.
                      </p>
                    </section>
                  )}
                  {account.plan && (
                    <section className="account-summary">
                      <div>
                        <span className="billing-badge">Active pass</span>
                        <h3>{PLANS[account.plan].name}</h3>
                        <p>
                          Expires{' '}
                          {new Date(account.expiresAt!).toLocaleDateString(
                            'en-IN',
                          )}
                          . It does not renew automatically.
                        </p>
                      </div>
                      <div>
                        <strong>
                          {account.templatesUsed}
                          {account.templateLimit
                            ? ` / ${account.templateLimit}`
                            : ''}
                        </strong>
                        <span>saved templates</span>
                      </div>
                    </section>
                  )}
                  <AuthPanel
                    onChange={() => {
                      void refresh().catch((e) => setMessage(e.message));
                    }}
                  />
                  <div className="plan-grid">
                    <article className="plan-card">
                      <h3>Free</h3>
                      <p>Try the tools and prepare your first applications.</p>
                      <p className="plan-price">
                        ₹0<span> / no payment needed</span>
                      </p>
                      <ul>
                        <li>All 9 standard tools</li>
                        <li>3 application packs per account, once</li>
                        <li>Save custom image sizes in this browser</li>
                        <li>No card required</li>
                      </ul>
                      <Button
                        className="plan-cta"
                        variant="outline"
                        onClick={() => setView('pack')}
                      >
                        Try a free pack
                      </Button>
                    </article>
                    {(Object.keys(PLANS) as PlanId[]).map((id) => (
                      <article className="plan-card" key={id}>
                        <h3>{PLANS[id].name}</h3>
                        <p>{PLANS[id].description}</p>
                        <p className="plan-price">
                          ₹{PLANS[id].amount / 100}
                          <span> / 30 days</span>
                        </p>
                        <ul>
                          <li>Application packs throughout your 30-day pass</li>
                          <li>Include up to 5 original documents</li>
                          <li>
                            {PLANS[id].templates} templates saved across devices
                          </li>
                          {id === 'shop' && (
                            <li>Next-customer reset that keeps job settings</li>
                          )}
                        </ul>
                        <Button
                          className="plan-cta"
                          disabled={
                            busy ||
                            !account.billingReady ||
                            !account.signedIn ||
                            !!account.plan
                          }
                          onClick={() => buy(id)}
                        >
                          {account.plan === id
                            ? 'Current plan'
                            : !account.billingReady
                              ? 'Payments not open'
                              : account.plan
                                ? 'Available after your pass expires'
                                : !account.signedIn
                                  ? 'Sign in to purchase'
                                  : `Get ${PLANS[id].name}`}
                        </Button>
                      </article>
                    ))}
                  </div>
                  <p className="paid-small">
                    One payment for 30 days. No automatic renewal. Your existing
                    templates stay saved after expiry; an active pass is needed
                    to use them. Files are processed on this device and are
                    never stored in your account.
                  </p>
                  {account.orders.length > 0 && (
                    <section className="billing-history">
                      <h3>Recent billing activity</h3>
                      {account.orders.map((order) => (
                        <div className="billing-row" key={order.id}>
                          <span>
                            <strong>{PLANS[order.plan].name}</strong>
                            <small>
                              {new Date(order.createdAt).toLocaleDateString(
                                'en-IN',
                              )}{' '}
                              · {order.id}
                            </small>
                          </span>
                          <span>₹{order.amount / 100}</span>
                          <span>
                            {order.refunded
                              ? 'Refunded'
                              : order.active
                                ? 'Active'
                                : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </section>
                  )}
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      refresh()
                        .then((a) =>
                          setMessage(
                            a.plan
                              ? 'Your access is up to date.'
                              : 'No active pass found yet. If charged, wait a moment and refresh again.',
                          ),
                        )
                        .catch((e) => setMessage(e.message));
                    }}
                  >
                    Refresh access
                  </Button>
                  {pendingPayment && (
                    <Button
                      disabled={busy}
                      onClick={() => verifyPayment(pendingPayment)}
                    >
                      Retry payment confirmation
                    </Button>
                  )}
                </>
              )}
            </section>
          ) : (
            <form
              ref={form}
              onSubmit={(e) => {
                e.preventDefault();
                void exportPack();
              }}
              onChange={() => setResult(null)}
            >
              <fieldset disabled={busy} className="pack-fields">
                <label>
                  Download name
                  <Input
                    value={job}
                    maxLength={60}
                    onChange={(e) => setJob(e.target.value)}
                    placeholder="application"
                  />
                  <small>
                    Used only on this device. Avoid entering identity numbers.
                  </small>
                </label>
                <div className="pack-grid">
                  {(['photo', 'signature'] as const).map((slot) => (
                    <section className="pack-card" key={slot}>
                      <h3>{slot === 'photo' ? '1. Photo' : '2. Signature'}</h3>
                      <label>
                        Choose {slot}
                        <Input
                          key={`${slot}-${resetKey}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) =>
                            chooseImage(slot, e.target.files?.[0])
                          }
                        />
                      </label>
                      <ImagePreview
                        file={files[slot]}
                        settings={settings[slot]}
                      />
                      {files[slot] && (
                        <p className="paid-small">{files[slot]!.name}</p>
                      )}
                      <div className="pack-numbers">
                        {(['width', 'height', 'maxKB'] as const).map((key) => (
                          <label key={key}>
                            {key === 'maxKB'
                              ? 'Maximum KB'
                              : `${key === 'width' ? 'Width' : 'Height'} (px)`}
                            <Input
                              required
                              type="number"
                              min={key === 'maxKB' ? 5 : 32}
                              max={key === 'maxKB' ? 5000 : 2400}
                              step="1"
                              value={settings[slot][key] || ''}
                              onChange={(e) =>
                                setSettings((s) => ({
                                  ...s,
                                  [slot]: {
                                    ...s[slot],
                                    [key]: Number(e.target.value),
                                  },
                                }))
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="pack-check">
                        <input
                          type="checkbox"
                          checked={settings[slot].fit === 'cover'}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              [slot]: {
                                ...s[slot],
                                fit: e.target.checked ? 'cover' : 'contain',
                              },
                            }))
                          }
                        />{' '}
                        Crop to fill (check the preview)
                      </label>
                      <p className="paid-small">
                        Unchecked keeps the whole image with white padding. For
                        precise crop positioning, prepare it in the free resizer
                        first.
                      </p>
                    </section>
                  ))}
                </div>
                <section className="pack-card">
                  <h3>
                    3. Supporting documents{' '}
                    <span className="paid-small">Optional</span>
                  </h3>
                  <label>
                    Choose up to 5 PDFs or images
                    <Input
                      key={`docs-${resetKey}`}
                      type="file"
                      multiple
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const list = Array.from(e.target.files ?? []);
                        if (
                          list.length > 5 ||
                          list.some(
                            (f) =>
                              f.size > 20 * 1024 * 1024 ||
                              ![
                                'application/pdf',
                                'image/jpeg',
                                'image/png',
                                'image/webp',
                              ].includes(f.type),
                          ) ||
                          list.reduce((s, f) => s + f.size, 0) >
                            40 * 1024 * 1024
                        ) {
                          setMessage(
                            'Use up to 5 PDF or image files, at most 20 MB each and 40 MB together.',
                          );
                          e.target.value = '';
                          setDocuments([]);
                          return;
                        }
                        setDocuments(list);
                        setMessage('');
                      }}
                    />
                  </label>
                  <p className="paid-small">
                    These files are included unchanged. Use the free tools first
                    if they need resizing or PDF edits.
                  </p>
                  {documents.map((doc, i) => (
                    <p key={i} className="paid-small">
                      {doc.name} · {formatBytes(doc.size)}
                    </p>
                  ))}
                </section>
                <section className="pack-card">
                  <h3>Reuse these requirements</h3>
                  <p className="paid-small">
                    Save only photo and signature settings. Use a generic name
                    such as “College application”, without customer details.
                  </p>
                  <div className="paid-actions">
                    <Input
                      aria-label="Template name"
                      placeholder="Template name"
                      maxLength={60}
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!account?.plan || !templateName.trim()}
                      onClick={saveTemplate}
                    >
                      Save template
                    </Button>
                  </div>
                  {!account?.plan && (
                    <p className="paid-small">
                      Personal includes 5 saved templates. Shop includes 50.
                    </p>
                  )}
                  {templates.map((t) => (
                    <div className="paid-actions" key={t.id}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          try {
                            setSettings(validatePack(t.settings));
                            setMessage(
                              `Loaded ${t.name}. Check the previews for this customer.`,
                            );
                          } catch {
                            setMessage(
                              'This template has invalid settings. Delete it and save a new one.',
                            );
                          }
                        }}
                      >
                        {t.name}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await api('/api/templates', { id: t.id }, 'DELETE');
                            await refresh();
                          } catch (e) {
                            setMessage((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Delete<span className="sr-only"> {t.name}</span>
                      </Button>
                    </div>
                  ))}
                </section>
                <p className="paid-small">
                  Enter requirements from the actual form. Presets are not
                  official acceptance guarantees.
                </p>
                <div className="paid-actions">
                  <Button
                    type="submit"
                    disabled={!files.photo || !files.signature}
                  >
                    {busy ? 'Preparing…' : 'Prepare application ZIP'}
                  </Button>
                  {account?.plan === 'shop' && (
                    <Button variant="outline" type="button" onClick={clearJob}>
                      Next customer · clear files
                    </Button>
                  )}
                  {account?.plan !== 'shop' && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        clearJob();
                        setSettings(structuredClone(DEFAULT_PACK));
                        setMessage('Pack cleared. Ready to start again.');
                      }}
                    >
                      Clear pack
                    </Button>
                  )}
                </div>
                {!account?.plan && (
                  <p className="paid-small">
                    {account?.signedIn
                      ? trialRemaining === null
                        ? 'Checking your free allowance…'
                        : `${trialRemaining} of 3 free packs remaining. One prepared ZIP uses one pack. Re-downloading it does not use another.`
                      : 'Sign in for 3 free packs. No card needed. Each pack includes a photo, signature and supporting files.'}
                  </p>
                )}
              </fieldset>
              {result && (
                <div className="paid-notice">
                  <a
                    className="paid-link"
                    href={result.url}
                    download={result.name}
                  >
                    Download {result.name} · {formatBytes(result.bytes)}
                  </a>
                  <p className="paid-small">
                    If saving does not start in this browser, open the site in
                    Chrome, Edge or Safari.
                  </p>
                </div>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
