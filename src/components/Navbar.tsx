"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-green-700">
          🏪 MyDukandar
        </Link>
        <div className="flex items-center gap-4">
          {user.role === "CUSTOMER" && (
            <>
              <Link href="/customer" className="text-sm text-gray-600 hover:text-green-700">
                Shops
              </Link>
              <Link href="/customer/orders" className="text-sm text-gray-600 hover:text-green-700">
                My Orders
              </Link>
            </>
          )}
          {user.role === "SHOP_OWNER" && (
            <>
              <Link href="/shop-owner" className="text-sm text-gray-600 hover:text-green-700">
                Dashboard
              </Link>
              <Link href="/shop-owner/orders" className="text-sm text-gray-600 hover:text-green-700">
                Orders
              </Link>
              <Link href="/shop-owner/products" className="text-sm text-gray-600 hover:text-green-700">
                Products
              </Link>
            </>
          )}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-gray-500">{user.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
