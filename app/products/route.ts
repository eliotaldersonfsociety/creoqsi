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

// 🔹 Obtener productos (todos o uno por ID)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (productId) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(productId)))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }

      return NextResponse.json({
        ...product[0],
        images: typeof product[0].images === "string" 
          ? JSON.parse(product[0].images)
          : product[0].images || []
      });
    }

    // Obtener todos los productos
    const allProducts = await db.select().from(products);
    const formattedProducts = allProducts.map((product) => ({
      ...product,
      images: typeof product.images === "string" 
        ? JSON.parse(product.images)
        : product.images || []
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// 🔹 Agregar un nuevo producto (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      price,
      compareAtPrice,
      costPerItem,
      vendor,
      productType,
      status,
      category,
      tags,
      sku,
      barcode,
      quantity,
      trackInventory,
      images,
    } = body;

    if (!title || !price || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Se requieren título, precio y al menos una imagen" },
        { status: 400 }
      );
    }

    await db.insert(products).values({
      title,
      description: description || "",
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      costPerItem: costPerItem ? Number(costPerItem) : null,
      vendor: vendor || "",
      productType: productType || "physical",
      status: Boolean(status),
      category: category || "",
      tags: tags || "",
      sku: sku || "",
      barcode: barcode || "",
      quantity: quantity ? Number(quantity) : 0,
      trackInventory: Boolean(trackInventory),
      images: JSON.stringify(images),
    });

    return NextResponse.json(
      { message: "Producto creado exitosamente" }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
