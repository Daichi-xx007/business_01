const xlsx = require('xlsx');

const data = [
  {
    "Product Name": "Vintage Leather Jacket",
    "Description": "Authentic brown leather jacket from the 80s in excellent condition.",
    "Price": 120.00,
    "Category Slug": "clothing",
    "Image File": "vintage_leather_jacket.png",
    "Status": "available",
    "Featured": 1
  },
  {
    "Product Name": "Antique Wooden Chair",
    "Description": "Handcrafted wooden chair with intricate carvings. Minor scratches but structurally perfect.",
    "Price": 85.00,
    "Category Slug": "home-living",
    "Image File": "antique_wooden_chair.png",
    "Status": "available",
    "Featured": 1
  },
  {
    "Product Name": "Retro Polaroid Camera",
    "Description": "Classic instant film camera with rainbow stripe. Tested and working perfectly.",
    "Price": 150.00,
    "Category Slug": "electronics",
    "Image File": "retro_polaroid_camera.png",
    "Status": "available",
    "Featured": 0
  },
  {
    "Product Name": "Handwoven Wool Blanket",
    "Description": "Warm, geometric pattern wool blanket. Leftover stock from a local artisan.",
    "Price": 45.00,
    "Category Slug": "home-living",
    "Image File": "handwoven_wool_blanket.png",
    "Status": "available",
    "Featured": 0
  }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Inventory");

xlsx.writeFile(workbook, "sample_inventory.xlsx");
console.log("Created sample_inventory.xlsx");
