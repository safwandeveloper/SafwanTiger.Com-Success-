const params = new URLSearchParams(window.location.search);
const invoiceId = params.get("invoice_id");

const states = {
  loading: document.querySelector("#loading-state"),
  success: document.querySelector("#success-state"),
  pending: document.querySelector("#pending-state"),
  failed: document.querySelector("#failed-state"),
};
const details = document.querySelector("#payment-details");

function showState(name) {
  Object.entries(states).forEach(([key, element]) => element.classList.toggle("hidden", key !== name));
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value || "—";
}

function showDetails(payment) {
  details.classList.remove("hidden");
  setText("#invoice-value", payment.invoice_id);
  setText("#method-value", payment.payment_method || "bKash");
  setText("#amount-value", payment.amount ? `৳${Number(payment.amount).toLocaleString("en-BD")}` : "—");
  setText("#transaction-value", payment.transaction_id);
  document.querySelector("#transaction-row").classList.toggle("hidden", !payment.transaction_id);
  document.querySelector("#amount-row").classList.toggle("hidden", !payment.amount);
}

async function checkPayment() {
  details.classList.add("hidden");
  showState("loading");
  if (!invoiceId) {
    showState("failed");
    setText("#invoice-value", "Missing invoice ID");
    return;
  }

  try {
    const response = await fetch(`/api/payment-status?invoice_id=${encodeURIComponent(invoiceId)}`, {
      headers: { accept: "application/json" },
    });
    const payment = await response.json();
    if (!response.ok) throw new Error(payment.error || "Verification failed");

    showDetails(payment);
    if (payment.status === "COMPLETED") showState("success");
    else if (payment.status === "FAILED") showState("failed");
    else showState("pending");
  } catch {
    showState("failed");
  }
}

document.querySelector("#retry-button").addEventListener("click", checkPayment);
document.querySelector("#retry-failed-button").addEventListener("click", checkPayment);
checkPayment();
