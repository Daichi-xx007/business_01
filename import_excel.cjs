const Database = require('better-sqlite3');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Get the file name from command line arguments
const fileName = process.argv[2];
if (!fileName) {
  console.error("Please provide an Excel file to import!");
  console.error("Usage: node import_excel.cjs <file.xlsx>");
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), fileName);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

try {
  console.log(`Reading Excel file: ${fileName}...`);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet);
  console.log(`Found ${data.length} items to import.`);

  // Connect to the SQLite DB
  const dbPath = path.resolve(process.cwd(), 'data/store.db');
  if (!fs.existsSync(dbPath)) {
    console.error("Database not found! Make sure you've started the server at least once.");
    process.exit(1);
  }
  
  const db = new Database(dbPath);
  let importedCount = 0;

  // Prepare SQL statements
  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, description, price, category_id, image_url, status, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const getCategoryId = db.prepare(`SELECT id FROM categories WHERE slug = ?`);

  // Run everything in a transaction for safety
  const importTransaction = db.transaction((items) => {
    for (const item of items) {
      const name = item['Product Name'];
      const description = item['Description'] || '';
      const price = parseFloat(item['Price']);
      const categorySlug = item['Category Slug'];
      const imageFile = item['Image File'] || 'placeholder.jpg';
      const status = item['Status'] || 'available';
      const featured = item['Featured'] === 1 ? 1 : 0;

      // Ensure price is valid
      if (isNaN(price)) {
        console.warn(`Skipping '${name}' - Invalid price.`);
        continue;
      }

      // Generate a unique slug
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

      // Lookup Category ID
      const catRow = getCategoryId.get(categorySlug);
      const categoryId = catRow ? catRow.id : null;

      // Build the public image URL
      const imageUrl = `/images/products/${imageFile}`;

      insertProduct.run(name, slug, description, price, categoryId, imageUrl, status, featured);
      importedCount++;
    }
  });

  importTransaction(data);
  db.close();

  console.log(`✅ Successfully imported ${importedCount} items into the database!`);
} catch (error) {
  console.error("An error occurred during import:");
  console.error(error);
}
