"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import ProductDisplay from "./product-display"
import { Product } from "@/types/product"

export default function ProductPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const router = useRouter()
  const params = useParams() // ✅ Obtiene los parámetros de la URL

  useEffect(() => {
    if (!params.id) {
      router.push("/404")
      return
    }

    fetch(`/api/products?id=${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Producto recibido:", data)
        if (!data) router.push("/404")
        else setProduct(data)
      })
      .catch(() => router.push("/404"))
  }, [params.id, router])

  if (!product) return <p>Cargando...</p>

  return <ProductDisplay product={product} />
}
