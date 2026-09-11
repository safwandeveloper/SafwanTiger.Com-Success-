import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 4173);
const ziniApiKey = process.env.ZINIPAY_API_KEY;
const ziniVerifyUrl = "https://api.zinipay.com/v1/payment/verify";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function json(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function verifyInvoice(invoiceId) {
  if (!ziniApiKey) {
    return {
      status: "PENDING",
      invoice_id: invoiceId,
      demo: true,
      message: "Add ZINIPAY_API_KEY to enable live verification.",
    };
  }

  const result = await fetch(ziniVerifyUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "zini-api-key": ziniApiKey,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  if (!result.ok) {
    throw new Error(`ZiniPay verification failed with HTTP ${result.status}`);
  }

  return result.json();
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/payment-status") {
    const invoiceId = url.searchParams.get("invoice_id")?.trim();
    if (!invoiceId || invoiceId.length > 160) {
      return json(response, 400, { error: "A valid invoice_id is required." });
    }

    try {
      const payment = await verifyInvoice(invoiceId);
      return json(response, 200, {
        invoice_id: payment.invoice_id || invoiceId,
        status: String(payment.status || "PENDING").toUpperCase(),
        amount: payment.amount ?? null,
        payment_method: payment.payment_method ?? "bKash",
        transaction_id: payment.transaction_id ?? null,
        customer_name: payment.cus_name ?? null,
        demo: payment.demo ?? false,
      });
    } catch (error) {
      return json(response, 502, {
        error: "Payment status could not be verified right now.",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (url.pathname === "/api/zinipay/webhook") {
    const invoiceId = url.searchParams.get("invoice_id")?.trim();
    if (!invoiceId) {
      return json(response, 400, { error: "invoice_id is required." });
    }

    try {
      const payment = await verifyInvoice(invoiceId);
      return json(response, 200, {
        received: true,
        invoice_id: invoiceId,
        status: String(payment.status || "PENDING").toUpperCase(),
      });
    } catch (error) {
      return json(response, 502, {
        received: false,
        error: error instanceof Error ? error.message : "Verification failed.",
      });
    }
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache",
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

createServer((request, response) => {
  handle(request, response).catch(() => json(response, 500, { error: "Unexpected server error." }));
}).listen(port, () => {
  console.log(`SafwanTiger payment page listening on http://localhost:${port}`);
});
