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

// 🔹 GET: Obtener producto(s)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    // Si se envía "id", se obtiene ese producto y se devuelve envuelto en un arreglo
    if (id) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(id)))
        .limit(1);
      console.log("Producto obtenido de la base de datos:", product); // Log para verificar el producto obtenido

      if (!product.length) {
        // Si no se encuentra el producto, devuelve arreglo vacío con status 404
        return NextResponse.json([], { status: 404 });
      }

      const prod = product[1];
      const formattedProduct = {
        ...prod,
        images: prod.images
          ? Array.isArray(prod.images)
            ? prod.images
            : JSON.parse(prod.images)
          : [],
      };

      return NextResponse.json([formattedProduct]);
    }

    // Si no se especifica "id", se obtienen TODOS los productos
    const allProducts = await db.select().from(products);
    const formattedProducts = allProducts.map((product) => ({
      ...product,
      images: product.images
        ? Array.isArray(product.images)
          ? product.images
          : JSON.parse(product.images)
        : [],
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error al obtener producto(s):", error);
    return NextResponse.json({ error: "Error al obtener producto(s)" }, { status: 500 });
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
