"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface CartContextType {
  addToCart: (productId: number) => void
  cartItems: number[]
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<number[]>([])

  const addToCart = (productId: number) => {
    setCartItems((prev) => [...prev, productId])
    console.log("🛒 Producto agregado:", productId)
  }

  return (
    <CartContext.Provider value={{ addToCart, cartItems }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart debe usarse dentro del <CartProvider>")
  return context
}
