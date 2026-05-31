import { Form, Link, useActionData, useSearchParams } from "react-router";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import "~/styles/auth.css";

export function meta() {
  return [{ title: "Register | Store" }];
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const redirectTo = String(formData.get("redirectTo") || "/");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  if (!password) errors.password = "Password is required";
  if (password.length < 6) errors.password = "Password must be at least 6 characters";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match";

  if (Object.keys(errors).length > 0) {
    return { errors, values: { name, email, phone } };
  }

  const { findUserByEmail, createUser } = await import("~/db/models/users.server");
  const { createSession } = await import("~/services/auth.server");

  const existing = await findUserByEmail(email as string);
  if (existing) {
    return { errors: { email: "An account with this email already exists" }, values: { name, email, phone } };
  }

  const user = await createUser({ email: email as string, password: password as string, name: name as string, phone: phone as string });
  const { cookie } = createSession(user.id, user.role);

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": cookie,
    },
  });
}

export default function RegisterPage() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const [showPassword, setShowPassword] = useState(false);

  const errors = actionData?.errors || {};
  const values = actionData?.values || {};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">Store</Link>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us and start shopping</p>
        </div>

        <Form method="post" className="auth-form">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="form-input-wrapper">
              <User size={18} className="form-input-icon" />
              <input id="name" name="name" type="text" placeholder="John Doe" className="form-input form-input-with-icon" required defaultValue={values.name || ""} autoFocus />
            </div>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="form-input-wrapper">
              <Mail size={18} className="form-input-icon" />
              <input id="email" name="email" type="email" placeholder="you@example.com" className="form-input form-input-with-icon" required defaultValue={values.email || ""} />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone (optional)</label>
            <div className="form-input-wrapper">
              <Phone size={18} className="form-input-icon" />
              <input id="phone" name="phone" type="tel" placeholder="+92 300 1234567" className="form-input form-input-with-icon" defaultValue={values.phone || ""} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="form-input-wrapper">
              <Lock size={18} className="form-input-icon" />
              <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" className="form-input form-input-with-icon" required />
              <button type="button" className="form-input-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="form-input-wrapper">
              <Lock size={18} className="form-input-icon" />
              <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm your password" className="form-input form-input-with-icon" required />
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            Create Account
          </button>
        </Form>

        <div className="auth-divider" style={{ margin: "24px 0" }}>
          <span>or</span>
        </div>

        <Link to="/auth/google" className="btn btn-outline" style={{ width: "100%", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Link>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
