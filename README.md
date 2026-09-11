# SafwanTiger ZiniPay success page

Standalone, dependency-free payment status page for `SafwanTiger.com`.

## Run locally

```bash
ZINIPAY_API_KEY=your_live_key npm start
```

Open `http://localhost:4173/?invoice_id=YOUR_INVOICE_ID`.

The API key stays on the server. The browser only calls `/api/payment-status`, which verifies the invoice with ZiniPay’s `POST /v1/payment/verify` endpoint. The webhook endpoint is available at `/api/zinipay/webhook?invoice_id=...`.

## Production wiring

1. Point `success_url`/`redirect_url` from invoice creation to `https://safwantiger.com/?invoice_id={invoice_id}`.
2. Set `ZINIPAY_API_KEY` in the hosting provider’s secret/environment settings.
3. Configure ZiniPay’s `webhook_url` as `https://safwantiger.com/api/zinipay/webhook`.
4. Keep the bot’s fulfilment logic server-side and idempotent: mark an order paid only after a verified `COMPLETED` response.
5. Use HTTPS and add the domain to the active ZiniPay brand configuration.

## Railway deployment

1. In Railway, choose **New Project → Deploy from GitHub repo** and select `SafwanTiger.Com-Success-`.
2. Add `ZINIPAY_API_KEY` under the service’s **Variables**. Do not commit the real key.
3. Railway detects the `npm start` command from `package.json`.
4. Add `safwantiger.com` under **Settings → Networking → Custom Domain**, then create the DNS record Railway provides.
5. Confirm the generated Railway URL works before switching ZiniPay redirects to the custom domain.
