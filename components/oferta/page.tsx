"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "./context/CartContext"; // Importa el contexto
import Link from "next/link";


// API credentials
const ck = "ck_6caec8dbb8183c4d8dfa54621166a33d54cb6c13";
const cs = "cs_34e358ad9715dff7db34a38688e8382877a2ed5a";

interface Product {
  id: number;
  name: string;
  images: { src: string }[];
  sale_price: string;
  regular_price: string;
  price: string;
}

export default function HomePage() {
  const { addToCart } = useCart(); // Accede a la función addToCart desde el contexto
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://texasstore-108ac1a.ingress-haven.ewp.live/wp-json/wc/v3/products/",
          {
            headers: {
              Authorization: `Basic ${btoa(`${ck}:${cs}`)}`,
            },
          }
        );

        if (!res.ok) {
          console.error("Error fetching products:", res.statusText);
          return;
        }

        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

    // Maneja la acción de agregar un producto al carrito
  const handleAddToCart = (product: Product) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.sale_price || product.price), // Usar el precio de descuento o el precio regular
      quantity: 1,
      image: product.images[0]?.src,
    };

    addToCart(cartItem); // Llamamos a addToCart del contexto
  };

  // Handle scroll navigation
  const scroll = useCallback(
    (direction: "left" | "right") => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollAmount = 320; // Approximate width of a card + margin

        if (direction === "left") {
          container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
          setCurrentProductIndex(Math.max(0, currentProductIndex - 1));
        } else {
          container.scrollBy({ left: scrollAmount, behavior: "smooth" });
          setCurrentProductIndex(
            Math.min(products.length - 1, currentProductIndex + 1)
          );
        }
      }
    },
    [currentProductIndex, products.length]
  );

  // Auto-cycle through products every 5 seconds
  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentProductIndex((prevIndex) =>
        prevIndex === products.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [products]);

  return (
  <div className="bg-gray-100 w-full">
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Ofertas del Día</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={currentProductIndex === 0}
            className="hidden md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={currentProductIndex >= products.length - 1}
            className="hidden md:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-lg font-semibold">Cargando productos...</p>
      ) : (
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Fixed "Ofertas del día" card */}
            <Card className="min-w-[200px] max-w-[200px] h-[400px] flex flex-col justify-center items-center snap-start bg-gradient-to-br from-primary/80 to-primary shadow-lg border-0">
              <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                  Ofertas del Día
                </h3>
                <p className="text-primary-foreground/90 mb-6">
                  Descubre nuestras mejores promociones con descuentos increíbles
                </p>
                <Link href="/pages/categorias/promociones">
                  <Badge variant="secondary" className="text-md py-1 px-4">
                    Hasta 40% OFF
                  </Badge>
                </Link>
              </CardContent>
            </Card>

            {/* Product cards */}
            {products.map((product) => (
              <Card
                key={product.id}
                className="min-w-[200px] max-w-[200px] snap-start hover:shadow-md transition-shadow duration-300"
              >
                <CardContent className="p-4">
                  <div className="relative">
                    <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
                      -{product.sale_price ? Math.round(
                        ((parseFloat(product.regular_price) - parseFloat(product.sale_price)) /
                          parseFloat(product.regular_price)) *
                          100
                      ) : 0}%
                    </Badge>
                    <Image
                      src={product.images[0]?.src || "/placeholder.svg"}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="w-full h-[200px] object-contain mb-4"
                    />
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 h-14">
                    {product.name}
                  </h3>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-primary">
                      ${product.sale_price || product.price}
                    </span>
                    {product.sale_price && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        ${product.regular_price}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0" onClick={() => handleAddToCart(product)}>
                  <Button className="w-full gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Añadir al carrito
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Mobile scroll indicators */}
          <div className="flex justify-center gap-1 mt-4 md:hidden">
            {products.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentProductIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
