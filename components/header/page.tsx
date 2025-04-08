"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MenuIcon } from "lucide-react"
import SearchBar from "@/components/header/search-bar"
import UserMenu from "@/components/header/user-menu"
import ShoppingCart from "@/components/header/shopping-cart"
import NavigationMenu from "@/components/header/navigation-menu"
import HotProductsBanner from "@/components/header/hot-products-banner"
import OffersBanner from "@/components/header/offers-banner"
import { useCart } from "@/context/CartContext"

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export default function Header() {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      {/* Hot Products Banner - above everything */}
      <HotProductsBanner />

      <div className="container mx-auto px-4">
        {/* Top header with logo, search bar and user controls */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/tsn.png"
              alt="Store Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <MenuIcon className="h-6 w-6" />
          </button>

          {/* Search bar - desktop only in top row */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          <div className="flex items-center space-x-4">
            {/* User avatar/login */}
            <UserMenu isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

            {/* Shopping cart */}
            <ShoppingCart cartItems={cartItems} addToCart={addToCart} removeFromCart={removeFromCart} />
          </div>
        </div>

        {/* Search bar - mobile only */}
        <div className="md:hidden py-3">
          <SearchBar />
        </div>

        {/* Navigation menu - below search bar */}
        <NavigationMenu mobileMenuOpen={mobileMenuOpen} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      </div>

      {/* Offers Banner - below navigation */}
      <OffersBanner />
    </header>
  );
}
