//app/api/product/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { products } from "../../../schema/schema";

const db = drizzle(
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  console.log("❤️ ID recibido en la solicitud:", id);

  try {
    if (id && !isNaN(Number(id))) {
      const numericId = parseInt(id, 10);
      console.log("✅ ID convertido a número:", numericId);

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, numericId))
        .limit(1);

      console.log("📦 Producto obtenido de la base de datos:", product);

      if (product.length === 0) {
        console.warn("⚠️ Producto no encontrado en la base de datos");
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }

      const formattedProduct = {
        ...product[0],
        images: Array.isArray(product[0].images)
          ? product[0].images
          : JSON.parse(product[0].images || "[]"),
      };

      return NextResponse.json(formattedProduct);
    }

    console.warn("⚠️ ID de producto no proporcionado o inválido");
    return NextResponse.json({ error: "ID de producto no proporcionado o inválido" }, { status: 400 });
  } catch (error) {
    console.error("💥 Error al obtener producto:", error);
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
  }
}


// 🔹 PUT: Actualizar un producto por ID
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

// 🔹 DELETE: Eliminar un producto por ID
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
    console.error("Error al eliminar producto:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
