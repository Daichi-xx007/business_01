import { Form, useLoaderData, useActionData, useNavigation, useSubmit } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { SudoModal } from "~/components/SudoModal";
import { Upload, FileSpreadsheet, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as xlsx from "xlsx";
import path from "node:path";
import fs from "node:fs";

export function meta() {
  return [{ title: "Bulk Inventory Import | Admin" }];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);
  return null;
}

export async function action({ request }: { request: Request }) {
  const { requireAdmin, isSudoUnlocked } = await import("~/services/auth.server");
  await requireAdmin(request);

  if (!isSudoUnlocked(request)) {
    return Response.json({ error: "sudo_required" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    
    // Grab the excel file
    const excelFile = formData.get("excelFile") as File | null;
    if (!excelFile || !excelFile.name) {
      return Response.json({ error: "No Excel file provided." }, { status: 400 });
    }

    // Grab the images
    const imageFiles = formData.getAll("images") as File[];
    
    // Parse Excel
    const arrayBuffer = await excelFile.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const rows: any[] = xlsx.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return Response.json({ error: "Excel file is empty." }, { status: 400 });
    }

    const { db } = await import("~/db/database.server");
    const { uploadImage } = await import("~/services/storage.server");
    
    const imageMap = new Map<string, string>();
    for (const img of imageFiles) {
      if (img && img.name) {
        const url = await uploadImage(img);
        if (url) imageMap.set(img.name, url);
      }
    }

    let importedCount = 0;
    let errors = [];

    // Helper: generate slug
    const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    for (const [index, row] of rows.entries()) {
      try {
        const rawName = row["Name"] || row["name"];
        const rawPrice = row["Price"] || row["price"];
        const rawCategory = row["Category"] || row["category"] || "Uncategorized";
        const rawImageName = row["ImageName"] || row["imagename"] || row["Image"] || row["image"];
        const description = row["Description"] || row["description"] || "";
        const featured = (row["Featured"] || row["featured"]) ? 1 : 0;

        if (!rawName || !rawPrice) {
          errors.push(`Row ${index + 2}: Missing Name or Price.`);
          continue;
        }

        // Category logic
        let categoryId = null;
        let catRes = await db.query("SELECT id FROM categories WHERE name ILIKE $1", [rawCategory]);
        if (catRes.rows.length > 0) {
          categoryId = catRes.rows[0].id;
        } else {
          // Create category
          const cSlug = generateSlug(rawCategory);
          const insCat = await db.query(
            "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id",
            [rawCategory, cSlug]
          );
          categoryId = insCat.rows[0].id;
        }

        // Image Mapping
        let finalImageUrl = "/images/placeholder.jpg";
        if (rawImageName) {
          const targetName = String(rawImageName).trim();
          if (imageMap.has(targetName)) {
            finalImageUrl = imageMap.get(targetName)!;
          } else {
             // Look for fuzzy match
             const possibleMatches = Array.from(imageMap.keys()).filter(n => n.includes(targetName) || targetName.includes(n));
             if (possibleMatches.length > 0) {
               finalImageUrl = imageMap.get(possibleMatches[0])!;
             }
          }
        }

        // Insert product
        const baseSlug = generateSlug(rawName);
        let finalSlug = baseSlug;
        let counter = 1;
        while (true) {
          const check = await db.query("SELECT id FROM products WHERE slug = $1", [finalSlug]);
          if (check.rows.length === 0) break;
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        await db.query(
          `INSERT INTO products (name, slug, description, price, category_id, image_url, featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [String(rawName), finalSlug, String(description), parseFloat(rawPrice), categoryId, finalImageUrl, featured]
        );
        
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${index + 2}: ${err.message}`);
      }
    }

    return Response.json({ 
      success: true, 
      importedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("Import error:", error);
    return Response.json({ error: error.message || "Failed to process import." }, { status: 500 });
  }
}

export default function AdminInventoryImport() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const [showSudoModal, setShowSudoModal] = useState(false);

  const isSubmitting = navigation.state === "submitting";

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
        <h1 className="admin-page-title">Bulk Inventory Import</h1>

        <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-md)", marginBottom: "2rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: 0 }}>
            <FileSpreadsheet size={20} style={{ color: "var(--accent)" }} />
            How it works
          </h3>
          <p>You can upload an Excel sheet (<code>.xlsx</code> or <code>.csv</code>) to instantly create hundreds of products at once. You can also upload all of their images at the same time!</p>
          <p><strong>Required Columns in your Excel file:</strong></p>
          <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
            <li><code>Name</code> (required) - Name of the product</li>
            <li><code>Price</code> (required) - Number (e.g. 500)</li>
            <li><code>Category</code> - e.g. "Vintage Rings" (Will be auto-created if it doesn't exist!)</li>
            <li><code>Description</code> - Text about the product</li>
            <li><code>ImageName</code> - The exact filename of the image you are uploading (e.g. <code>ring-1.jpg</code>). The system will automatically link it to the product!</li>
          </ul>
        </div>

        {actionData?.success && (
          <div className="admin-success" style={{ color: "var(--success)", background: "rgba(34,197,94,0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
            <CheckCircle size={20} />
            <div>
              <strong>Import Successful!</strong><br/>
              Successfully created {actionData.importedCount} products!
            </div>
          </div>
        )}

        {actionData?.errors && actionData.errors.length > 0 && (
          <div className="admin-error" style={{ color: "var(--error)", background: "rgba(239,68,68,0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
              <AlertCircle size={18} /> Some rows had issues:
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              {actionData.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {actionData?.error && actionData.error !== "sudo_required" && (
          <div className="admin-error" style={{ color: "var(--error)", background: "rgba(239,68,68,0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
             {actionData.error}
          </div>
        )}

        <Form method="post" className="admin-form" encType="multipart/form-data" ref={formRef}>
          <div className="form-group">
            <label className="form-label">
              <FileSpreadsheet size={16} /> 1. Upload Excel File (.xlsx or .csv)
            </label>
            <input 
              type="file" 
              name="excelFile" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              className="form-input" 
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: "1.5rem" }}>
            <label className="form-label">
              <ImageIcon size={16} /> 2. Upload Product Images (Select multiple)
            </label>
            <input 
              type="file" 
              name="images" 
              accept="image/*" 
              multiple 
              className="form-input" 
            />
            <span className="form-hint">Hold Ctrl (or Cmd) to select multiple images. Make sure their filenames match the `ImageName` column in your excel sheet!</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: "2rem", width: "100%", justifyContent: "center" }}>
            <Upload size={18} />
            {isSubmitting ? "Importing Data... Please wait..." : "Start Import"}
          </button>
        </Form>
      </div>
    </AdminLayout>
  );
}
