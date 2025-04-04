// app/schema/schema.ts
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
  status: integer("status", { mode: "boolean" }).notNull().default(true),
  category: text("category"),
  tags: text("tags"),
  sku: text("sku"),
  barcode: text("barcode"),
  quantity: integer("quantity").notNull().default(0),
  trackInventory: integer("track_inventory", { mode: "boolean" }).default(false),
  images: text("images", { mode: "json" }).notNull().$type<string[]>(),
  sizes: text("sizes", { mode: "json" }).notNull().$type<string[]>(),
  sizeRange: text("size_range", { mode: "json" })
    .notNull()
    .$type<{ min: number; max: number }>(),
  colors: text("colors", { mode: "json" }).notNull().$type<string[]>(),
});

// Esquemas Zod
export const insertProductSchema = createInsertSchema(products, {
  images: z.array(z.string()).min(1),
  sizes: z.array(z.string()).optional(),
  sizeRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  colors: z.array(z.string()).optional(),
});

export const selectProductSchema = createSelectSchema(products);
export type Product = z.infer<typeof selectProductSchema>;
