# Cloudflare deployment

This project can be deployed manually to Cloudflare Workers with static assets and a D1 database.

## One-time setup

1. Push the repository to GitHub.
2. Install dependencies locally with `npm ci`.
3. Log in to Cloudflare with `npx wrangler login`.
4. Create the D1 database:

   ```powershell
   npx wrangler d1 create print-form-desk-db
   ```

5. Copy the returned `database_id` into your local `.env`:

   ```text
   CLOUDFLARE_D1_DATABASE_NAME=print-form-desk-db
   CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id
   ```

6. Apply the first database schema:

   ```powershell
   npm run cf:d1:migrate
   ```

7. Add these Worker variables/secrets in the Cloudflare dashboard or with Wrangler:

   ```text
   BILLING_ENABLED=true
   BILLING_MODE=test
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=...
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   ```

## Deploy

Run:

```powershell
npm run cf:deploy
```

The build writes `dist/server/wrangler.json`. The deploy command uses that generated config.

## Razorpay webhook

After Cloudflare gives you the Worker URL, update the Razorpay webhook URL to:

```text
https://your-cloudflare-worker-url/api/billing/webhook
```

Keep the same webhook events:

```text
payment.captured
refund.created
refund.processed
```
