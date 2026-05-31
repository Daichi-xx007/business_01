import { Form, useLoaderData, useActionData, useSubmit } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { SudoModal } from "~/components/SudoModal";
import { Save, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import "~/styles/admin.css";

// ... skipping to the component ...

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
    // Resubmit the form now that Sudo is unlocked
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
          <div className="admin-success">
            <CheckCircle size={18} />
            Settings saved successfully! Changes are live immediately.
          </div>
        )}

        <Form method="post" className="admin-form" ref={formRef}>

          {/* ---- Branding ---- */}
          <h3 className="admin-section-title">Branding</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="siteName">Site Name</label>
            <input id="siteName" name="siteName" type="text" className="form-input" defaultValue={data.siteName} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="logoUrl">Logo Image</label>
            <input id="logoUrl" name="logoUrl" type="text" className="form-input" defaultValue={data.logoUrl} placeholder="/images/logo.png or https://..." />
            <span className="form-hint">Place your logo file in <code>public/images/</code> and enter the path here, e.g. <code>/images/logo.png</code>. Recommended size: 200×60px (transparent PNG).</span>
            {data.logoUrl && (
              <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                <img src={data.logoUrl} alt="Logo preview" style={{ maxHeight: '50px', maxWidth: '200px' }} />
              </div>
            )}
          </div>

          {/* ---- Hero Section ---- */}
          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>Homepage Hero</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="heroImageUrl">Hero Background Image</label>
            <input id="heroImageUrl" name="heroImageUrl" type="text" className="form-input" defaultValue={data.heroImageUrl} placeholder="/images/hero-bg.jpg or https://..." />
            <span className="form-hint">A wide banner image (1920×800px recommended). It will be displayed behind the hero text with a semi-transparent overlay. Place it in <code>public/images/</code>.</span>
            {data.heroImageUrl && (
              <div style={{ marginTop: '8px', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: '400px' }}>
                <img src={data.heroImageUrl} alt="Hero preview" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="heroTitle">Hero Title (optional)</label>
            <input id="heroTitle" name="heroTitle" type="text" className="form-input" defaultValue={data.heroTitle} placeholder="Discover Unique Treasures" />
            <span className="form-hint">Leave blank to use the default title.</span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="heroSubtitle">Hero Subtitle (optional)</label>
            <input id="heroSubtitle" name="heroSubtitle" type="text" className="form-input" defaultValue={data.heroSubtitle} placeholder="Every item is exclusive — once it's gone, it's gone forever." />
          </div>

          {/* ---- AI Chatbot ---- */}
          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>AI Chatbot</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="geminiApiKey">Google Gemini API Key</label>
            <input id="geminiApiKey" name="geminiApiKey" type="password" className="form-input" defaultValue={data.geminiApiKey} placeholder="AIza..." />
            <span className="form-hint">Get a free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google AI Studio</a>. Powers the AI chat assistant.</span>
          </div>

          {/* ---- Social ---- */}
          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>Social Media & Contact</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="whatsappNumber">WhatsApp Number</label>
            <input id="whatsappNumber" name="whatsappNumber" type="text" className="form-input" defaultValue={data.whatsappNumber} placeholder="+923001234567" />
            <span className="form-hint">Include country code. Adds a WhatsApp button on the site.</span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="instagramUrl">Instagram Page URL</label>
            <input id="instagramUrl" name="instagramUrl" type="url" className="form-input" defaultValue={data.instagramUrl} placeholder="https://instagram.com/yourpage" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="facebookUrl">Facebook Page URL</label>
            <input id="facebookUrl" name="facebookUrl" type="url" className="form-input" defaultValue={data.facebookUrl} placeholder="https://facebook.com/yourpage" />
          </div>

          {/* ---- JazzCash ---- */}
          <h3 className="admin-section-title" style={{ marginTop: "2rem" }}>JazzCash Payment Gateway</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="merchantId">Merchant ID</label>
            <input id="merchantId" name="merchantId" type="text" className="form-input" defaultValue={data.merchantId} placeholder="MC12345" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="form-input" defaultValue={data.password} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="integritySalt">Integrity Salt</label>
            <input id="integritySalt" name="integritySalt" type="password" className="form-input" defaultValue={data.integritySalt} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sandboxUrl">Payment Gateway URL</label>
            <input id="sandboxUrl" name="sandboxUrl" type="text" className="form-input" defaultValue={data.sandboxUrl} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="returnUrl">Return URL</label>
            <input id="returnUrl" name="returnUrl" type="text" className="form-input" defaultValue={data.returnUrl} />
          </div>

          <button type="submit" className="btn btn-primary">
            <Save size={18} /> Save Settings
          </button>
        </Form>
      </div>
    </AdminLayout>
  );
}
