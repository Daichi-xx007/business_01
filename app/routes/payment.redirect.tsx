import "~/styles/checkout.css";

export function meta() {
  return [{ title: "Processing Payment... | Store" }];
}

export async function loader({ request }: { request: Request }) {
  return {};
}

export default function PaymentRedirectPage() {
  return (
    <div className="payment-redirect">
      <div className="payment-redirect-card">
        <div className="payment-redirect-spinner" />
        <h2>Redirecting to Payment...</h2>
        <p>Please wait while we redirect you to JazzCash to complete your payment.</p>
      </div>
    </div>
  );
}
