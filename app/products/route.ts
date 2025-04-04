// app/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { products, insertProductSchema } from "@/app/schema/schema";
import { z } from "zod";

const db = drizzle(
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
);

// GET: Obtener productos
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

      return NextResponse.json(result[0]);
    }

    const allProducts = await db.select().from(products);
    return NextResponse.json(allProducts);

  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// POST: Crear nuevo producto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validar con Zod
    const validation = insertProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    // Insertar en la base de datos
    const result = await db.insert(products)
      .values(validation.data)
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
