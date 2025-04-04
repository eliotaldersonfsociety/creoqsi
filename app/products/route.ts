import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { products } from "@/app/schema/schema";
import { sql } from "drizzle-orm";

const db = drizzle(
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
);

// 🔹 Obtener productos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (productId) {
      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, sql.placeholder('id')))
        .prepare()
        .execute({ id: Number(productId) });

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }

      const product = result.rows[0] as typeof products.$inferSelect;
      return NextResponse.json({
        ...product,
        images: typeof product.images === "string" ? JSON.parse(product.images) : product.images
      });
    }

    const allProducts = await db.select().from(products);
    const formattedProducts = allProducts.map(product => ({
      ...product,
      images: typeof product.images === "string" ? JSON.parse(product.images) : product.images
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// 🔹 Crear nuevo producto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validación de campos requeridos
    if (!body.title || !body.price || !body.images || !Array.isArray(body.images)) {
      return NextResponse.json(
        { error: "Título, precio e imágenes son requeridos" },
        { status: 400 }
      );
    }

    // Construir objeto de inserción con tipos correctos
    const insertData: typeof products.$inferInsert = {
      title: body.title,
      description: body.description || null,
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      costPerItem: body.costPerItem ? Number(body.costPerItem) : null,
      vendor: body.vendor || null,
      productType: body.productType || 'physical',
      status: Boolean(body.status),
      category: body.category || null,
      tags: body.tags || null,
      sku: body.sku || null,
      barcode: body.barcode || null,
      quantity: body.quantity ? Number(body.quantity) : 0,
      trackInventory: Boolean(body.trackInventory),
      images: JSON.stringify(body.images),
    };

    // Ejecutar inserción
    const result = await db.insert(products).values(insertData).returning();

    return NextResponse.json({
      message: "Producto creado exitosamente",
      data: {
        ...result[0],
        images: typeof result[0].images === "string" ? JSON.parse(result[0].images) : result[0].images
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error al guardar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
