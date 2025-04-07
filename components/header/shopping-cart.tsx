"use client"

import Image from "next/image"
import { ShoppingCartIcon as CartIcon, Plus, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import type { CartItem } from "@/components/header/page"

interface ShoppingCartProps {
  cartItems: CartItem[]
  addToCart: (productId: number) => void
  removeFromCart: (productId: number) => void
}

export default function ShoppingCart({ cartItems, addToCart, removeFromCart }: ShoppingCartProps) {
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CartIcon className="h-5 w-5" />
          {cartItems.length > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 min-w-[1.25rem] h-5">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="backdrop-blur-lg bg-background/80">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-5">
          {cartItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Your cart is empty</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToCart(item.id)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <SheetFooter className="mt-6">
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </SheetClose>
              <Button className="w-full">Checkout</Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
