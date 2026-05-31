import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, Unlock, Mail, Loader2 } from "lucide-react";

interface SudoModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SudoModal({ isOpen, onSuccess, onCancel }: SudoModalProps) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");
  const fetcher = useFetcher();

  if (!isOpen) return null;

  const isSubmitting = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  const handleRequestOTP = () => {
    fetcher.submit(
      { intent: "send_otp" },
      { method: "POST", action: "/api/admin-sudo" }
    );
    setStep("verify");
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(
      { intent: "verify_otp", otpCode },
      { method: "POST", action: "/api/admin-sudo" }
    );
  };

  // If successfully verified, close modal and call onSuccess
  if (fetcher.data?.success && step === "verify") {
    // Reset state for next time
    setTimeout(() => {
      setStep("request");
      setOtpCode("");
      onSuccess();
    }, 500);
  }

  return (
    <div className="sudo-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div className="sudo-modal-card" style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "90%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        
        {step === "request" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "var(--bg-secondary)", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
              <Lock size={24} color="var(--accent)" />
            </div>
            <h2 style={{ marginBottom: "0.5rem" }}>Admin Security Lock</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Sensitive actions require a security verification. We'll send a 6-digit code to your admin email.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRequestOTP} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={18} className="spin" /> : "Send Code"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "var(--bg-secondary)", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
              {fetcher.data?.success ? <Unlock size={24} color="green" /> : <Mail size={24} color="var(--accent)" />}
            </div>
            <h2 style={{ marginBottom: "0.5rem" }}>Enter Security Code</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              For your security, please verify your identity to perform sensitive actions. 
              This will unlock the dashboard for <strong>5 minutes</strong>.
            </p>
            
            {error && <div style={{ color: "red", background: "#fee", padding: "0.5rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}
            
            <form onSubmit={handleVerifyOTP}>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                style={{ width: "100%", padding: "1rem", fontSize: "2rem", textAlign: "center", letterSpacing: "8px", border: "2px solid #eee", borderRadius: "8px", marginBottom: "2rem", outline: "none" }}
              />
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting || otpCode.length < 6}>
                  {isSubmitting ? <Loader2 size={18} className="spin" /> : "Unlock"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
