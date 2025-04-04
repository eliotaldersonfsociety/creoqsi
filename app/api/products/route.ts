import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { products } from "@/app/schema/schema";

const db = drizzle(
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
);

// Mapeo de estados
const statusMap = {
  active: 1,
  draft: 0,
} as const;

type StatusKey = keyof typeof statusMap;

function parseMaybeJSONOrCSV(value: any) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof value === "string" ? value.split(",").map((v) => v.trim()) : [];
  }
}

function parseMaybeJSON(value: any, fallback: any = {}) {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

// 🔹 Obtener productos (GET)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (productId) {
      const numericId = Number(productId);
      if (isNaN(numericId)) {
        return NextResponse.json({ error: "ID inválido" }, { status: 400 });
      }

      const product = await db.select().from(products).where(eq(products.id, numericId)).limit(1);

      if (product.length === 0) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }

      const formattedProduct = {
        ...product[0],
        status: product[0].status ?? 0,
        images: parseMaybeJSONOrCSV(product[0].images),
        tags: parseMaybeJSONOrCSV(product[0].tags),
        sizes: parseMaybeJSONOrCSV(product[0].sizes),
        sizeRange: parseMaybeJSON(product[0].sizeRange, { min: 18, max: 45 }),
        colors: parseMaybeJSONOrCSV(product[0].colors),
      };

      return NextResponse.json(formattedProduct);
    }

    const allProducts = await db.select().from(products);

    const formattedProducts = allProducts.map((product) => ({
      ...product,
      status: product.status ?? 0, 
      images: parseMaybeJSONOrCSV(product.images),
      tags: parseMaybeJSONOrCSV(product.tags),
      sizes: parseMaybeJSONOrCSV(product.sizes),
      sizeRange: parseMaybeJSON(product.sizeRange, { min: 18, max: 45 }),
      colors: parseMaybeJSONOrCSV(product.colors),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}


// 🔹 Crear producto (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Datos recibidos:", body); // Agregar este log para verificar los datos recibidos

    // Validación de campos requeridos
    const requiredFields = ["title", "price", "images"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Convertir status a número
    const status = typeof body.status === "string" ? body.status.toLowerCase() : "draft";
    const numericStatus = status in statusMap ? statusMap[status as StatusKey] : statusMap.draft;

    // Verificar los valores antes de la inserción
    console.log("Valores a insertar:", {
      title: body.title,
      description: body.description || null,
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      costPerItem: body.costPerItem ? Number(body.costPerItem) : null,
      vendor: body.vendor || null,
      productType: body.productType || null,
      status: numericStatus,
      category: body.category || null,
      tags: body.tags ? JSON.stringify(body.tags) : "[]",
      sku: body.sku || null,
      barcode: body.barcode || null,
      quantity: body.quantity ? Number(body.quantity) : 0,
      trackInventory: Boolean(body.trackInventory),
      images: JSON.stringify(body.images),
      sizes: body.sizes ? JSON.stringify(body.sizes) : "[]",
      sizeRange: body.sizeRange ? JSON.stringify(body.sizeRange) : JSON.stringify({ min: 18, max: 45 }),
      colors: body.colors ? JSON.stringify(body.colors) : "[]",
    });

    // Insertar en la base de datos
    const result = await db
      .insert(products)
      .values({
        title: body.title,
        description: body.description || null,
        price: Number(body.price),
        compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
        costPerItem: body.costPerItem ? Number(body.costPerItem) : null,
        vendor: body.vendor || null,
        productType: body.productType || null,
        status: numericStatus,
        category: body.category || null,
        tags: body.tags ? JSON.stringify(body.tags) : "[]",
        sku: body.sku || null,
        barcode: body.barcode || null,
        quantity: body.quantity ? Number(body.quantity) : 0,
        trackInventory: Boolean(body.trackInventory),
        images: JSON.stringify(body.images),
        sizes: body.sizes ? JSON.stringify(body.sizes) : "[]",
        sizeRange: body.sizeRange ? JSON.stringify(body.sizeRange) : JSON.stringify({ min: 18, max: 45 }),
        colors: body.colors ? JSON.stringify(body.colors) : "[]",
      })
      .returning();

    return NextResponse.json({ message: "Producto creado exitosamente", productId: result[0].id }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔹 Actualizar producto (PUT)
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 });
    }

    const numericId = Number(productId);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    // Convertir status a número
    const status = body.status?.toLowerCase();
    const numericStatus = status && status in statusMap ? statusMap[status as StatusKey] : undefined;

    // Actualizar en la base de datos
    await db
      .update(products)
      .set({
        title: body.title,
        description: body.description || undefined,
        price: body.price ? Number(body.price) : undefined,
        compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
        costPerItem: body.costPerItem ? Number(body.costPerItem) : undefined,
        vendor: body.vendor || undefined,
        productType: body.productType || undefined,
        status: numericStatus,
        category: body.category || undefined,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        sku: body.sku || undefined,
        barcode: body.barcode || undefined,
        quantity: body.quantity ? Number(body.quantity) : undefined,
        trackInventory: body.trackInventory !== undefined ? Boolean(body.trackInventory) : undefined,
        images: body.images ? JSON.stringify(body.images) : undefined,
        sizes: body.sizes ? JSON.stringify(body.sizes) : undefined,
        sizeRange: body.sizeRange ? JSON.stringify(body.sizeRange) : undefined,
        colors: body.colors ? JSON.stringify(body.colors) : undefined,
      })
      .where(eq(products.id, numericId));

    return NextResponse.json({ message: "Producto actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔹 Eliminar producto (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 });
    }

    const numericId = Number(productId);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, numericId));

    return NextResponse.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
