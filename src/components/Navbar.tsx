"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PushNotificationToggle from "@/components/PushNotificationToggle";
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
    <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/65 backdrop-blur-xl">
      <div className="page-frame flex min-h-20 items-center justify-between gap-4 py-3">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-xl shadow-lg shadow-emerald-500/25 transition-transform group-hover:-translate-y-0.5">
            🏪
          </span>
          <div>
            <div className="text-lg font-semibold tracking-tight text-slate-950">MyDukandar</div>
            <div className="text-xs text-slate-500">Smart local commerce</div>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            {user.role === "CUSTOMER" ? "Customer" : "Shop Owner"}
          </span>
          {user.role === "CUSTOMER" && (
            <>
              <Link href="/customer" className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
                Shops
              </Link>
              <Link href="/customer/orders" className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
                Orders
              </Link>
              <Link href="/customer/payments" className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
                Payments
              </Link>
            </>
          )}
          {user.role === "SHOP_OWNER" && (
            <>
              <Link href="/shop-owner" className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
                Dashboard
              </Link>
              <Link href="/shop-owner/orders" className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
                Orders
              </Link>
              <Link href="/shop-owner/products" className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
                Products
              </Link>
              <Link href="/shop-owner/payments" className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
                Payments
              </Link>
              <div className="ml-2">
                <PushNotificationToggle />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm text-slate-600 shadow-sm md:block">
            {user.name}
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-200 bg-white/80 text-slate-700 shadow-sm hover:bg-white">
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
