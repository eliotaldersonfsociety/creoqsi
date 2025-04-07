"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: number
  name: string
  price: number
  image: string
}

interface HotProductsBannerProps {
  products: Product[]
  addToCart: (productId: number) => void
}

export default function HotProductsBanner({ products, addToCart }: HotProductsBannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hotProducts = products.slice(0, 4) // Take first 4 products

  return (
    <div className="w-full">
      {/* Banner trigger button - now black */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-full py-1.5 text-sm font-medium bg-black text-white"
      >
        <Flame className="h-4 w-4 mr-2 text-orange-500" />
        Lo más hot
        <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Expandable content - now black background */}
      <div
        className={`w-full bg-black/95 backdrop-blur-md text-white overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hotProducts.map((product) => (
              <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex flex-col">
                <div className="relative mb-2">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={120}
                    height={120}
                    className="w-full h-auto object-cover rounded-md"
                  />
                  <Badge className="absolute top-2 right-2 bg-orange-500">Hot</Badge>
                </div>
                <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold">${product.price.toFixed(2)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    onClick={() => addToCart(product.id)}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

