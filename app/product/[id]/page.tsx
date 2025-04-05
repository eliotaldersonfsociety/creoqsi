"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import ProductDisplay from "./product-display"

interface Product {
  id: number
  title: string
  description: string
  price: number
  compareAtPrice?: number
  costPerItem?: number
  vendor?: string
  productType?: string
  status?: boolean
  category?: string
  tags?: string
  sku?: string
  barcode?: string
  quantity?: number
  trackInventory?: boolean
  images: string[]
  sizes?: string[]
  sizeRange?: { min: number; max: number }
  colors?: string[]
}
export default function ProductPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const router = useRouter()
  const params = useParams() // ✅ Obtiene los parámetros de la URL

  useEffect(() => {
  if (!params.id) {
    router.push("/404");
    return;
  }

  fetch(`/api/products?id=${params.id}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("Producto recibido:", data);
      if (!data || !Array.isArray(data) || data.length === 0) {
        router.push("/404");
      } else {
        // Asumiendo que la API devuelve un array, encontramos el producto por id
        const product = data.find(item => item.id === parseInt(params.id, 10));
        if (product) {
          setProduct(product);
        } else {
          router.push("/404");
        }
      }
    })
    .catch(() => router.push("/404"));
}, [params.id, router]);
