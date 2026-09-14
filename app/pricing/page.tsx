import InfoPage from '../info-page';
import { PLANS } from '@/lib/plans';

export const metadata = { title: 'Pricing · Print & Form Desk' };

export default function PricingPage() {
  return (
    <InfoPage eyebrow="Pricing" title="Simple pricing">
      <p>
        The main photo, signature and PDF tools are free. Paid passes are for
        application-pack downloads and account templates.
      </p>
      <div className="static-plan-grid">
        <section>
          <h2>Free</h2>
          <p>
            Photo resize, signature resize, image compression, print sheets,
            images to PDF, merge PDF and extract pages.
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
    </InfoPage>
  );
}
