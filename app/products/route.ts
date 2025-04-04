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

// 🔹 Crear nuevo producto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validación de campos requeridos
    const requiredFields = ['title', 'price', 'images'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos requeridos faltantes: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.images)) {
      return NextResponse.json(
        { error: "Las imágenes deben ser un array" },
        { status: 400 }
      );
    }

    // Construir objeto de inserción con tipos explícitos
    const insertData: typeof products.$inferInsert = {
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      costPerItem: body.costPerItem ? Number(body.costPerItem) : null,
      vendor: body.vendor ? String(body.vendor) : null,
      productType: body.productType ? String(body.productType) : 'physical',
      status: Boolean(body.status),
      category: body.category ? String(body.category) : null,
      tags: body.tags ? String(body.tags) : null,
      sku: body.sku ? String(body.sku) : null,
      barcode: body.barcode ? String(body.barcode) : null,
      quantity: body.quantity ? Number(body.quantity) : 0,
      trackInventory: Boolean(body.trackInventory),
      images: sql`${JSON.stringify(body.images)}`
    };

    // Insertar usando consulta preparada
    const result = await db.insert(products)
      .values(insertData)
      .returning()
      .prepare()
      .execute();

    return NextResponse.json({
      message: "Producto creado exitosamente",
      data: {
        ...result[0],
        images: Array.isArray(result[0].images) ? result[0].images : JSON.parse(result[0].images)
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
