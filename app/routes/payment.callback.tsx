import { Link, useLoaderData } from "react-router";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import "~/styles/checkout.css";

export function meta() {
  return [{ title: "Payment Result | Store" }];
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const { verifyPaymentResponse } = await import("~/services/jazzcash.server");
  const { updatePaymentStatus, getOrderByNumber } = await import("~/db/models/orders.server");
  const { clearCart } = await import("~/db/models/cart.server");
  const { getSessionId } = await import("~/services/auth.server");

  // JazzCash sends response as URL params (GET) or form data (POST)
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Also try POST body
  if (request.method === "POST") {
    const formData = await request.formData();
    formData.forEach((value, key) => {
      params[key] = String(value);
    });
  }

  const responseCode = params.pp_ResponseCode || "";
  const billRef = params.pp_BillReference || "";
  const txnRefNo = params.pp_TxnRefNo || "";
  const isSuccess = responseCode === "000";

  if (billRef) {
    if (isSuccess) {
      await updatePaymentStatus(billRef, "paid", txnRefNo);
      const sessionId = await getSessionId(request);
      await clearCart(sessionId);
    } else {
      await updatePaymentStatus(billRef, "failed", txnRefNo);
    }
  }

  const order = billRef ? await getOrderByNumber(billRef) : null;

  return { isSuccess, order, responseCode };
}

export default function PaymentCallbackPage() {
  const { isSuccess, order } = useLoaderData<typeof loader>();

  return (
    <div className="payment-result">
      <div className="payment-result-card">
        {isSuccess ? (
          <>
            <div className="payment-result-icon payment-success-icon">
              <CheckCircle size={64} />
            </div>
            <h1>Payment Successful!</h1>
            <p>Thank you for your purchase. Your order has been confirmed.</p>
            {order && (
              <div className="payment-result-details">
                <div className="payment-detail-row">
                  <span>Order Number</span>
                  <strong>{order.order_number}</strong>
                </div>
                <div className="payment-detail-row">
                  <span>Total</span>
                  <strong>Rs. {order.total_amount.toLocaleString()}</strong>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="payment-result-icon payment-failed-icon">
              <XCircle size={64} />
            </div>
            <h1>Payment Failed</h1>
            <p>
              Unfortunately, your payment could not be processed. Your cart items are still
              reserved — please try again.
            </p>
          </>
        )}

        <div className="payment-result-actions">
          <Link to="/products" className="btn btn-primary">
            Continue Shopping <ArrowRight size={16} />
          </Link>
          {!isSuccess && (
            <Link to="/cart" className="btn btn-outline">
              Return to Cart
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
