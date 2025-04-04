import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  costPerItem: real("cost_per_item"),
  vendor: text("vendor"),
  productType: text("product_type"),
  status: integer("status", { mode: "boolean" }).notNull().default(1), // ✅ 1 = activo, 0 = inactivo
  category: text("category"),
  tags: text("tags"),
  sku: text("sku"),
  barcode: text("barcode"),
  quantity: integer("quantity").notNull().default(0),
  trackInventory: integer("track_inventory", { mode: "boolean" }).default(false),
  images: text("images", { mode: "json" }).notNull().$type<string[]>(), // ✅ JSON nativo para Drizzle
  sizes: text("sizes", { mode: "json" }).notNull().$type<string[]>(), // ✅ JSON nativo para Drizzle
  sizeRange: text("size_range", { mode: "json" }).notNull().$type<{ min: number; max: number }>(), // ✅ JSON nativo para Drizzle
  colors: text("colors", { mode: "json" }).notNull().$type<string[]>(), // ✅ JSON nativo para Drizzle
});

// 🔹 Esquemas Zod para validación
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

// 🔹 Tipo TypeScript basado en Zod
export type Product = z.infer<typeof selectProductSchema>;
