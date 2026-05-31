import { requireAdmin, createSudoUnlockedCookie } from "~/services/auth.server";
import { generateOTP, verifyOTP } from "~/db/models/otps.server";
import { sendOTPEmail } from "~/services/email.server";

export async function action({ request }: { request: Request }) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "send_otp") {
    try {
      // Send OTP to the admin's email
      const code = await generateOTP(admin.email, "admin_sudo");
      await sendOTPEmail(admin.email, code, "admin_sudo");
      return Response.json({ success: true, message: `OTP sent to ${admin.email}` });
    } catch (e) {
      console.error(e);
      return Response.json({ error: "Failed to send OTP" }, { status: 500 });
    }
  }

  if (intent === "verify_otp") {
    const code = String(formData.get("otpCode") || "").trim();
    if (!code) return Response.json({ error: "Code is required" }, { status: 400 });

    const isValid = await verifyOTP(admin.email, code, "admin_sudo");
    if (!isValid) {
      return Response.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    // Unlock session for 15 minutes!
    const cookieHeader = createSudoUnlockedCookie(request);

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Set-Cookie": cookieHeader,
        "Content-Type": "application/json",
      },
    });
  }

  return Response.json({ error: "Invalid intent" }, { status: 400 });
}
