import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  Files,
  Image,
  Download,
} from 'lucide-react';
import SiteHeader from './site-header';
import ToolCatalog from './tool-catalog';
export default function Landing() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="landing">
        <section className="landing-hero">
          <div>
            <p className="eyebrow">LESS FRICTION. MORE DONE.</p>
            <h1>Everyday tasks, made simple.</h1>
            <p className="landing-lead">
              A little help for the things that need doing. Resize images,
              prepare signatures and bring your PDFs together—all in your
              browser.
            </p>
            <Link className="landing-primary" href="#tools">
              Find your tool <ArrowRight size={18} />
            </Link>
            <div className="hero-proof">
              <span>
                <Check size={16} /> Free core tools
              </span>
              <span>
                <ShieldCheck size={16} /> Files stay on your device
              </span>
            </div>
          </div>
          <div className="hero-jobs">
            <p className="eyebrow">A GOOD PLACE TO START</p>
            <h2>Small jobs. Sorted.</h2>
            <Link href="/workspace?assist=compress&maxKB=50">
              <span className="job-icon">
                <Image size={22} />
              </span>
              <span>
                <strong>That photo is too large?</strong>
                <small>Prepare an image under 50 KB</small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/tools/merge">
              <span className="job-icon">
                <Files size={22} />
              </span>
              <span>
                <strong>Documents in too many files?</strong>
                <small>Combine your PDFs into one</small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/tools/sheet">
              <span className="job-icon">
                <Download size={22} />
              </span>
              <span>
                <strong>Need a sheet of photos?</strong>
                <small>Arrange copies, then print</small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <p className="hero-note">
              Choose a task. Add your file. Check and download.
            </p>
          </div>
        </section>
        <ToolCatalog />
        <section className="landing-benefits" aria-label="Why use Sahajly">
          <div>
            <Zap size={24} />
            <strong>Get straight to work</strong>
            <span>No installation or account for the core tools.</span>
          </div>
          <div>
            <Check size={24} />
            <strong>Stay in control</strong>
            <span>Adjust the settings and preview your result.</span>
          </div>
          <div>
            <ShieldCheck size={24} />
            <strong>Your files stay yours</strong>
            <span>Current tools process documents on your device.</span>
          </div>
        </section>
        <section className="pack-promo">
          <div>
            <p className="eyebrow">FOR REPEAT TASKS</p>
            <h2>One application. One organized pack.</h2>
            <p>
              Prepare a photo and signature together, add supporting documents,
              and download one ZIP. Try three packs free with an account. Paid
              passes add more packs and reusable templates.
            </p>
          </div>
          <Link className="landing-primary" href="/pricing">
            See what’s included <ArrowRight size={18} />
          </Link>
        </section>
        <section className="home-faq" aria-labelledby="faq-title">
          <div>
            <p className="eyebrow">A FEW HELPFUL ANSWERS</p>
            <h2 id="faq-title">Before you begin</h2>
            <Link href="/contact">Visit the help centre →</Link>
          </div>
          <div className="support-faq">
            <details>
              <summary>Are the tools really free?</summary>
              <p>
                Yes. The image and PDF tools listed above are free without
                signing in. Application packs have a separate three-pack account
                trial; paid passes add further packs and saved account
                templates.
              </p>
            </details>
            <details>
              <summary>Are my documents uploaded?</summary>
              <p>
                The current file tools process documents in your browser.
                Accounts, template settings and payment records use online
                services. Your original files are not changed.
              </p>
            </details>
            <details>
              <summary>Can I use Sahajly on my phone?</summary>
              <p>
                Use the website in your phone’s browser. Smaller batches work
                best on devices with limited memory. Native Android and iOS apps
                are not available yet.
              </p>
            </details>
            <details>
              <summary>Which files are supported?</summary>
              <p>
                Image tools accept JPG, PNG and WebP. PDF tools accept
                supported, unencrypted PDFs. Password-protected and
                interactive-form PDFs are rejected. The workspace shows file and
                batch limits before you start.
              </p>
            </details>
          </div>
        </section>
      </main>
    </>
  );
}
