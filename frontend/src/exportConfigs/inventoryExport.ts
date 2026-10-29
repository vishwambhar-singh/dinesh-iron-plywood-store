import { Product } from "@/types/inventory";

export const transformInventoryData = (products: Product[]) => {
  return products.map((p) => ({
    Name: p.name,
    HSN: p.hsn,
    Category: p.category,
    Type: p.type,
    Unit: p.unit,
    Size: p.size,
    Color: p.color,
    Stock: p.availableStock,
    "Buying Price": p.buyingPrice,
    "Selling Price": p.sellingPrice,
    "Conversion Rate": p.conversionRate,
  }));
};

export const excelTemplate = [
  {
    hsn: "HSN123",
    name: "Sample Product",
    category: "General",
    type: "Trading",
    inventory_type: "PAKKA",
    unit: "PCS",
    size: "XL",
    color: "Red",
    stock: 0,
    buying_price: 0,
    selling_price: 0,
    conversion_rate: 1,
  },
];
