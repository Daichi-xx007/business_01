import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Config from environment
// ---------------------------------------------------------------------------
const MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || "";
const PASSWORD = process.env.JAZZCASH_PASSWORD || "";
const INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT || "";
const RETURN_URL = process.env.JAZZCASH_RETURN_URL || "http://localhost:5173/payment/callback";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface JazzCashFormFields {
  pp_Version: string;
  pp_TxnType: string;
  pp_Language: string;
  pp_MerchantID: string;
  pp_SubMerchantID: string;
  pp_Password: string;
  pp_BankID: string;
  pp_ProductID: string;
  pp_TxnRefNo: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_TxnExpiryDateTime: string;
  pp_ReturnURL: string;
  pp_SecureHash: string;
  ppmpf_1: string;
  ppmpf_2: string;
  ppmpf_3: string;
  ppmpf_4: string;
  ppmpf_5: string;
}

export interface OrderForPayment {
  order_number: string;
  total_amount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date as YYYYMMDDHHmmss (JazzCash expected format).
 */
function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}${M}${d}${h}${m}${s}`;
}

// ---------------------------------------------------------------------------
// Secure Hash
// ---------------------------------------------------------------------------

/**
 * Generate a JazzCash secure hash.
 *
 * 1. Collect all non-empty `pp_` and `ppmpf_` fields.
 * 2. Sort the parameter *keys* alphabetically.
 * 3. Concatenate: IntegritySalt & value1 & value2 & …
 * 4. Compute HMAC-SHA256 using the Integrity Salt as the key.
 * 5. Return the hex digest (uppercase, as JazzCash expects).
 */
export function generateSecureHash(
  params: Record<string, string>
): string {
  // Only include pp_ and ppmpf_ keys that have non-empty values
  const hashKeys = Object.keys(params)
    .filter(
      (k) =>
        (k.startsWith("pp_") || k.startsWith("ppmpf_")) &&
        k !== "pp_SecureHash" &&
        params[k] !== ""
    )
    .sort();

  const hashString =
    INTEGRITY_SALT + "&" + hashKeys.map((k) => params[k]).join("&");

  return crypto
    .createHmac("sha256", INTEGRITY_SALT)
    .update(hashString)
    .digest("hex")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the complete form-field object needed to POST to JazzCash.
 */
export function generatePaymentForm(
  order: OrderForPayment
): { action: string; fields: JazzCashFormFields } {
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 60 * 1000); // 30 min
  const txnRefNo = `T${Date.now()}`;
  const amountInPaisa = String(Math.round(order.total_amount * 100));

  const fields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: MERCHANT_ID,
    pp_SubMerchantID: "",
    pp_Password: PASSWORD,
    pp_BankID: "TBANK",
    pp_ProductID: "",
    pp_TxnRefNo: txnRefNo,
    pp_Amount: amountInPaisa,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formatDateTime(now),
    pp_BillReference: order.order_number,
    pp_Description: `Payment for order ${order.order_number}`,
    pp_TxnExpiryDateTime: formatDateTime(expiry),
    pp_ReturnURL: RETURN_URL,
    ppmpf_1: "",
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  fields.pp_SecureHash = generateSecureHash(fields);

  const sandboxUrl = process.env.JAZZCASH_SANDBOX_URL ||
    "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

  return {
    action: sandboxUrl,
    fields: fields as JazzCashFormFields,
  };
}

/**
 * Verify the secure hash returned by JazzCash in the payment callback.
 * Returns true if the hash is valid and the response has not been tampered with.
 */
export function verifyPaymentResponse(
  params: Record<string, string>
): boolean {
  const receivedHash = params.pp_SecureHash;
  if (!receivedHash) return false;

  // Recompute the hash excluding pp_SecureHash itself
  const { pp_SecureHash: _, ...rest } = params;
  const computedHash = generateSecureHash(rest);

  // Timing-safe comparison
  if (receivedHash.length !== computedHash.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, "utf-8"),
      Buffer.from(computedHash, "utf-8")
    );
  } catch {
    return false;
  }
}
