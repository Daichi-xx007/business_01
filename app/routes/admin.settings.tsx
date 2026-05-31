import { Form, useLoaderData, useActionData, useSubmit } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { SudoModal } from "~/components/SudoModal";
import { Save, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Settings | Admin" }];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);
  const { getAllSettings } = await import("~/db/models/settings.server");
  const settings = await getAllSettings();
  
  return {
    siteName: settings.SITE_NAME || process.env.SITE_NAME || "Leftovers Zindabad",
    logoUrl: settings.LOGO_URL || process.env.LOGO_URL || "",
    heroImageUrl: settings.HERO_IMAGE_URL || process.env.HERO_IMAGE_URL || "",
    heroTitle: settings.HERO_TITLE || process.env.HERO_TITLE || "",
    heroSubtitle: settings.HERO_SUBTITLE || process.env.HERO_SUBTITLE || "",
    geminiApiKey: settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
    whatsappNumber: settings.WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || "",
    instagramUrl: settings.INSTAGRAM_URL || process.env.INSTAGRAM_URL || "",
    facebookUrl: settings.FACEBOOK_URL || process.env.FACEBOOK_URL || "",
    merchantId: settings.JAZZCASH_MERCHANT_ID || process.env.JAZZCASH_MERCHANT_ID || "",
    password: settings.JAZZCASH_PASSWORD || process.env.JAZZCASH_PASSWORD || "",
    integritySalt: settings.JAZZCASH_INTEGRITY_SALT || process.env.JAZZCASH_INTEGRITY_SALT || "",
    sandboxUrl: settings.JAZZCASH_SANDBOX_URL || process.env.JAZZCASH_SANDBOX_URL || "",
    returnUrl: settings.JAZZCASH_RETURN_URL || process.env.JAZZCASH_RETURN_URL || "",
    ownerAvatar: settings.OWNER_AVATAR || "",
    ownerName: settings.OWNER_NAME || "Syeda Asia",
    ownerBio: settings.OWNER_BIO || "",
    supabaseUrl: settings.SUPABASE_URL || process.env.SUPABASE_URL || "",
    supabaseAnonKey: settings.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
  };
}

export async function action({ request }: { request: Request }) {
  const { requireAdmin, isSudoUnlocked } = await import("~/services/auth.server");
  await requireAdmin(request);

  if (!isSudoUnlocked(request)) {
    return Response.json({ error: "sudo_required" }, { status: 403 });
  }

  const formData = await request.formData();
  const { setSetting } = await import("~/db/models/settings.server");

  const keysToSave = [
    { key: "SITE_NAME", field: "siteName" },
    { key: "LOGO_URL", field: "logoUrl" },
    { key: "HERO_IMAGE_URL", field: "heroImageUrl" },
    { key: "HERO_TITLE", field: "heroTitle" },
    { key: "HERO_SUBTITLE", field: "heroSubtitle" },
    { key: "GEMINI_API_KEY", field: "geminiApiKey" },
    { key: "WHATSAPP_NUMBER", field: "whatsappNumber" },
    { key: "INSTAGRAM_URL", field: "instagramUrl" },
    { key: "FACEBOOK_URL", field: "facebookUrl" },
    { key: "JAZZCASH_MERCHANT_ID", field: "merchantId" },
    { key: "JAZZCASH_PASSWORD", field: "password" },
    { key: "JAZZCASH_INTEGRITY_SALT", field: "integritySalt" },
    { key: "JAZZCASH_SANDBOX_URL", field: "sandboxUrl" },
    { key: "JAZZCASH_RETURN_URL", field: "returnUrl" },
    { key: "OWNER_AVATAR", field: "ownerAvatar" },
    { key: "OWNER_NAME", field: "ownerName" },
    { key: "OWNER_BIO", field: "ownerBio" },
    { key: "SUPABASE_URL", field: "supabaseUrl" },
    { key: "SUPABASE_ANON_KEY", field: "supabaseAnonKey" }
  ];

  for (const item of keysToSave) {
    const val = String(formData.get(item.field) || "");
    await setSetting(item.key, val);
  }

  return { success: true };
}

export default function AdminSettingsPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [showSudoModal, setShowSudoModal] = useState(false);

  useEffect(() => {
    if (actionData?.error === "sudo_required") {
      setShowSudoModal(true);
    }
  }, [actionData]);

  const handleSudoSuccess = () => {
    setShowSudoModal(false);
    if (formRef.current) {
      submit(formRef.current);
    }
  };

  return (
    <AdminLayout>
      <SudoModal 
        isOpen={showSudoModal} 
        onCancel={() => setShowSudoModal(false)} 
        onSuccess={handleSudoSuccess} 
      />
      <div className="admin-page">
        <h1 className="admin-page-title">Settings</h1>

        {actionData?.success && (
          <div className="admin-success" style={{ color: "var(--success)", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <CheckCircle size={18} />
            Settings saved successfully! Changes are live immediately.
          </div>
        )}

        <Form method="post" className="admin-form" ref={formRef}>

          <h3 className="admin-section-title">Branding</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="siteName">Site Name</label>
            <input id="siteName" name="siteName" type="text" className="form-input" defaultValue={data.siteName} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="logoUrl">Logo Image</label>
            <input id="logoUrl" name="logoUrl" type="text" className="form-input" defaultValue={data.logoUrl} placeholder="/images/logo.png or https://..." />
          </div>

          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>About Us Section</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ownerName">Owner Name</label>
              <input id="ownerName" name="ownerName" type="text" className="form-input" defaultValue={data.ownerName} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ownerAvatar">Owner Photo URL</label>
              <input id="ownerAvatar" name="ownerAvatar" type="text" className="form-input" defaultValue={data.ownerAvatar} placeholder="/images/owner.jpg or https://..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ownerBio">Owner Bio</label>
            <textarea id="ownerBio" name="ownerBio" className="form-textarea" rows={4} defaultValue={data.ownerBio}></textarea>
          </div>

          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>API Keys & Integrations</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="geminiApiKey">Google Gemini API Key</label>
            <input id="geminiApiKey" name="geminiApiKey" type="password" className="form-input" defaultValue={data.geminiApiKey} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="supabaseUrl">Supabase Project URL</label>
              <input id="supabaseUrl" name="supabaseUrl" type="url" className="form-input" defaultValue={data.supabaseUrl} placeholder="https://xyz.supabase.co" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="supabaseAnonKey">Supabase Anon Key</label>
              <input id="supabaseAnonKey" name="supabaseAnonKey" type="password" className="form-input" defaultValue={data.supabaseAnonKey} />
            </div>
          </div>

          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>Social Media & Contact</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="whatsappNumber">WhatsApp Number</label>
            <input id="whatsappNumber" name="whatsappNumber" type="text" className="form-input" defaultValue={data.whatsappNumber} placeholder="+923001234567" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="instagramUrl">Instagram Page URL</label>
            <input id="instagramUrl" name="instagramUrl" type="url" className="form-input" defaultValue={data.instagramUrl} placeholder="https://instagram.com/yourpage" />
          </div>

          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>JazzCash</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="merchantId">Merchant ID</label>
            <input id="merchantId" name="merchantId" type="text" className="form-input" defaultValue={data.merchantId} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "2rem" }}>
            <Save size={18} /> Save Settings
          </button>
        </Form>
      </div>
    </AdminLayout>
  );
}
