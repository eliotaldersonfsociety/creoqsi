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

// 🔹 Obtener productos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (productId) {
      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(productId)));

      if (result.length === 0) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }

      const product = result[0];
      return NextResponse.json({
        ...product,
        images: Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')
      });
    }

    const allProducts = await db.select().from(products);
    const formattedProducts = allProducts.map(product => ({
      ...product,
      images: Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// 🔹 Crear nuevo producto (corregido)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validación mejorada
    if (!body.title || typeof body.price !== 'number' || !Array.isArray(body.images)) {
      return NextResponse.json(
        { error: "Datos inválidos: título, precio numérico y array de imágenes requeridos" },
        { status: 400 }
      );
    }

    // Crear objeto de inserción con tipos correctos
    const insertData = {
      title: body.title,
      description: body.description || null,
      price: body.price,
      compareAtPrice: body.compareAtPrice || null,
      costPerItem: body.costPerItem || null,
      vendor: body.vendor || null,
      productType: body.productType || 'physical',
      status: Boolean(body.status),
      category: body.category || null,
      tags: body.tags ? String(body.tags) : null,
      sku: body.sku || null,
      barcode: body.barcode || null,
      quantity: body.quantity || 0,
      trackInventory: Boolean(body.trackInventory),
      images: body.images // Usamos el array directamente
    };

    // Insertar en la base de datos
    const result = await db.insert(products)
      .values(insertData)
      .returning();

    return NextResponse.json({
      message: "Producto creado exitosamente",
      data: result[0]
    }, { status: 201 });

  } catch (error) {
    console.error("Error al guardar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
