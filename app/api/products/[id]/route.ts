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

// 🔹 Obtener un producto por ID
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID del producto es requerido" }, { status: 400 });
  }

  try {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, Number(id)))
      .limit(1);

    if (!product.length) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const prod = product[0];

    return NextResponse.json({
      ...prod,
      images: prod.images
        ? Array.isArray(prod.images)
          ? prod.images
          : JSON.parse(prod.images)
        : [],
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
  }
}

// 🔹 Actualizar un producto por ID
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID del producto es requerido" }, { status: 400 });
  }

  try {
    const body = await request.json();

    await db
      .update(products)
      .set({ ...body, images: JSON.stringify(body.images) })
      .where(eq(products.id, Number(id)));

    return NextResponse.json({ message: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

// 🔹 Eliminar un producto por ID
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "ID de producto inválido o faltante" }, { status: 400 });
  }

  const productId = parseInt(id, 10);

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({
      success: true,
      message: "Producto eliminado exitosamente",
      deletedId: productId,
    });
  } catch (error) {
    console.error("Error en DELETE /api/products/[id]:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
