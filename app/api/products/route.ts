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
    const { pathname } = new URL(req.url);
    const productId = pathname.split("/").pop();

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
        trackInventory: body.trackInventory ? 1 : 0, // Corregido aquí
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
    const { pathname } = new URL(req.url);
    const productId = pathname.split("/").pop();

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

    // Construir dinámicamente el objeto con campos definidos
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.compareAtPrice !== undefined) updateData.compareAtPrice = Number(body.compareAtPrice);
    if (body.costPerItem !== undefined) updateData.costPerItem = Number(body.costPerItem);
    if (body.vendor !== undefined) updateData.vendor = body.vendor;
    if (body.productType !== undefined) updateData.productType = body.productType;
    if (numericStatus !== undefined) updateData.status = numericStatus;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.trackInventory !== undefined) updateData.trackInventory = body.trackInventory ? 1 : 0; // Corregido aquí
    if (body.images !== undefined) updateData.images = JSON.stringify(body.images);
    if (body.sizes !== undefined) updateData.sizes = JSON.stringify(body.sizes);
    if (body.sizeRange !== undefined) updateData.sizeRange = JSON.stringify(body.sizeRange);
    if (body.colors !== undefined) updateData.colors = JSON.stringify(body.colors);

    // Verificar campos a actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No se proporcionaron campos para actualizar" }, { status: 400 });
    }

    await db.update(products).set(updateData).where(eq(products.id, numericId));

    return NextResponse.json({ message: "Producto actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔹 Eliminar producto (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const productId = pathname.split("/").pop();

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
