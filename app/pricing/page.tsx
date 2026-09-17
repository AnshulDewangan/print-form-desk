import InfoPage from '../info-page';
import { PLANS } from '@/lib/plans';

export const metadata = { title: 'Pricing' };

export default function PricingPage() {
  return (
    <InfoPage eyebrow="Pricing" title="Simple pricing">
      <p>
        The main photo, signature and PDF tools are free. Paid passes are for
        application-pack downloads and account templates.
      </p>
      <section className="support-contact">
        <h2>Try 3 application packs free</h2>
        <p>
          Sign in and prepare three packs before choosing a plan. A pack is one
          ZIP containing your resized photo, signature and any supporting
          documents. No card is needed for the trial.
        </p>
        <p>
          The allowance is per account and does not reset each month. A
          successful pack preparation uses one credit; downloading the same
          prepared ZIP again uses none. Paid passes unlock further packs for 30
          days.
        </p>
        <a className="support-email" href="/workspace?workspace=plans">
          Start free or compare plans
        </a>
      </section>
      <h2>Choose by how you work</h2>
      <p>
        Only resizing a photo or changing a PDF? Use the free tools. Preparing a
        complete application? Try a pack. Handling repeated applications or
        customers? Choose a pass for more packs and reusable account templates.
      </p>
      <div className="static-plan-grid">
        <section>
          <h2>Free</h2>
          <p>
            Photo resize, signature resize, image compression, print sheets,
            images to PDF, merge PDF, extract pages, rotate PDF and remove
            pages.
          </p>
          <strong>₹0</strong>
        </section>
        <section>
          <h2>{PLANS.personal.name}</h2>
          <p>
            {PLANS.personal.description}. Includes application-pack downloads
            and {PLANS.personal.templates} saved templates.
          </p>
          <strong>₹{PLANS.personal.amount / 100} / 30 days</strong>
        </section>
        <section>
          <h2>{PLANS.shop.name}</h2>
          <p>
            {PLANS.shop.description}. Includes application-pack downloads,{' '}
            {PLANS.shop.templates} templates and shop-friendly reset workflow.
          </p>
          <strong>₹{PLANS.shop.amount / 100} / 30 days</strong>
        </section>
      </div>
      <p>
        Passes do not renew automatically. Live checkout opens only after the
        merchant account is fully ready.
      </p>
      <h2>What happens after my free packs?</h2>
      <div
        className="plan-comparison"
        role="region"
        aria-label="Compare plans"
        tabIndex={0}
      >
        <table>
          <caption>Compare Free, Personal Premium and Shop Premium</caption>
          <thead>
            <tr>
              <th scope="col">Included</th>
              <th scope="col">Free</th>
              <th scope="col">{PLANS.personal.name}</th>
              <th scope="col">{PLANS.shop.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Price</th>
              <td>₹0</td>
              <td>₹{PLANS.personal.amount / 100} for 30 days</td>
              <td>₹{PLANS.shop.amount / 100} for 30 days</td>
            </tr>
            <tr>
              <th scope="row">9 standard photo and PDF tools</th>
              <td>Included</td>
              <td>Included</td>
              <td>Included</td>
            </tr>
            <tr>
              <th scope="row">Application ZIP packs</th>
              <td>3 per account, once</td>
              <td>Throughout the pass</td>
              <td>Throughout the pass</td>
            </tr>
            <tr>
              <th scope="row">Supporting files per pack</th>
              <td>Up to 5</td>
              <td>Up to 5</td>
              <td>Up to 5</td>
            </tr>
            <tr>
              <th scope="row">Account templates</th>
              <td>Not included</td>
              <td>{PLANS.personal.templates}</td>
              <td>{PLANS.shop.templates}</td>
            </tr>
            <tr>
              <th scope="row">Next-customer reset retaining settings</th>
              <td>Not included</td>
              <td>Not included</td>
              <td>Included</td>
            </tr>
            <tr>
              <th scope="row">Automatic renewal</th>
              <td>No</td>
              <td>No</td>
              <td>No</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        File-size and browser memory limits apply to every plan. These are
        single-account passes. Paid access does not add office conversions, OCR
        or AI tools.
      </p>
      <p>
        Your standard tools continue to work. Creating another application pack
        requires a Personal or Shop pass. Personal suits individual
        applications; Shop provides more saved templates for repeat customer
        work.
      </p>
      <h2>What does a saved template remember?</h2>
      <p>
        A template remembers photo and signature dimensions and file-size
        settings. It does not store your documents. Templates are a paid feature
        and are not included in the free pack trial.
      </p>
      <p>
        <a href="/workspace?workspace=plans">Open plans & billing</a> to check
        account access and checkout availability.{' '}
        <a href="/contact">Contact support</a> for purchase questions.
      </p>
    </InfoPage>
  );
}
