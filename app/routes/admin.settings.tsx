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
  const { uploadImage } = await import("~/services/storage.server");

  const logoFile = formData.get("logoFile") as File | null;
  const heroImageFile = formData.get("heroImageFile") as File | null;
  const ownerAvatarFile = formData.get("ownerAvatarFile") as File | null;

  let logoUrl = String(formData.get("logoUrl") || "");
  let heroImageUrl = String(formData.get("heroImageUrl") || "");
  let ownerAvatar = String(formData.get("ownerAvatar") || "");

  if (logoFile && logoFile.size > 0) {
    const up = await uploadImage(logoFile);
    if (up) logoUrl = up;
  }
  if (heroImageFile && heroImageFile.size > 0) {
    const up = await uploadImage(heroImageFile);
    if (up) heroImageUrl = up;
  }
  if (ownerAvatarFile && ownerAvatarFile.size > 0) {
    const up = await uploadImage(ownerAvatarFile);
    if (up) ownerAvatar = up;
  }

  const keysToSave = [
    { key: "SITE_NAME", value: String(formData.get("siteName") || "") },
    { key: "LOGO_URL", value: logoUrl },
    { key: "HERO_IMAGE_URL", value: heroImageUrl },
    { key: "HERO_TITLE", value: String(formData.get("heroTitle") || "") },
    { key: "HERO_SUBTITLE", value: String(formData.get("heroSubtitle") || "") },
    { key: "GEMINI_API_KEY", value: String(formData.get("geminiApiKey") || "") },
    { key: "WHATSAPP_NUMBER", value: String(formData.get("whatsappNumber") || "") },
    { key: "INSTAGRAM_URL", value: String(formData.get("instagramUrl") || "") },
    { key: "FACEBOOK_URL", value: String(formData.get("facebookUrl") || "") },
    { key: "JAZZCASH_MERCHANT_ID", value: String(formData.get("merchantId") || "") },
    { key: "JAZZCASH_PASSWORD", value: String(formData.get("password") || "") },
    { key: "JAZZCASH_INTEGRITY_SALT", value: String(formData.get("integritySalt") || "") },
    { key: "JAZZCASH_SANDBOX_URL", value: String(formData.get("sandboxUrl") || "") },
    { key: "JAZZCASH_RETURN_URL", value: String(formData.get("returnUrl") || "") },
    { key: "OWNER_AVATAR", value: ownerAvatar },
    { key: "OWNER_NAME", value: String(formData.get("ownerName") || "") },
    { key: "OWNER_BIO", value: String(formData.get("ownerBio") || "") },
    { key: "SUPABASE_URL", value: String(formData.get("supabaseUrl") || "") },
    { key: "SUPABASE_ANON_KEY", value: String(formData.get("supabaseAnonKey") || "") }
  ];

  for (const item of keysToSave) {
    await setSetting(item.key, item.value);
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

        <Form method="post" className="admin-form" encType="multipart/form-data" ref={formRef}>

          <h3 className="admin-section-title">Branding</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="siteName">Site Name</label>
            <input id="siteName" name="siteName" type="text" className="form-input" defaultValue={data.siteName} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="logoFile">Upload New Logo (Optional)</label>
              <input id="logoFile" name="logoFile" type="file" accept="image/*" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="logoUrl">Or Logo URL</label>
              <input id="logoUrl" name="logoUrl" type="text" className="form-input" defaultValue={data.logoUrl} placeholder="/images/logo.png or https://..." />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="heroImageFile">Upload Background Hero Image</label>
              <input id="heroImageFile" name="heroImageFile" type="file" accept="image/*" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="heroImageUrl">Or Hero Image URL</label>
              <input id="heroImageUrl" name="heroImageUrl" type="text" className="form-input" defaultValue={data.heroImageUrl} placeholder="/images/hero.jpg or https://..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="heroTitle">Hero Title</label>
              <input id="heroTitle" name="heroTitle" type="text" className="form-input" defaultValue={data.heroTitle} placeholder="Welcome to Leftovers Zindabad" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="heroSubtitle">Hero Subtitle</label>
              <input id="heroSubtitle" name="heroSubtitle" type="text" className="form-input" defaultValue={data.heroSubtitle} placeholder="Find the best deals..." />
            </div>
          </div>

          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>About Us Section</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ownerName">Owner Name</label>
              <input id="ownerName" name="ownerName" type="text" className="form-input" defaultValue={data.ownerName} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ownerAvatarFile">Upload Owner Photo (Optional)</label>
              <input id="ownerAvatarFile" name="ownerAvatarFile" type="file" accept="image/*" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ownerAvatar">Or Owner Photo URL</label>
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
