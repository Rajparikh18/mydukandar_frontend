"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) return null;

  const customerLinks = [
    { href: "/customer", label: "Shops" },
    { href: "/customer/orders", label: "Orders" },
    { href: "/customer/payments", label: "Payments" },
  ];

  const ownerLinks = [
    { href: "/shop-owner", label: "Dashboard" },
    { href: "/shop-owner/orders", label: "Orders" },
    { href: "/shop-owner/customers", label: "Customers" },
    { href: "/shop-owner/products", label: "Products" },
    { href: "/shop-owner/payments", label: "Payments" },
    { href: "/shop-owner/analytics", label: "Analytics" },
  ];

  const links = user.role === "CUSTOMER" ? customerLinks : ownerLinks;

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

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 lg:flex">
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            {user.role === "CUSTOMER" ? "Customer" : "Shop Owner"}
          </span>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950">
              {link.label}
            </Link>
          ))}
          <div className="ml-2">
            <PushNotificationToggle />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm text-slate-600 shadow-sm md:block">
            {user.name}
          </div>
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-lg shadow-sm lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-200 bg-white/80 text-slate-700 shadow-sm hover:bg-white">
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-white/70 bg-white/80 backdrop-blur-xl lg:hidden">
          <div className="page-frame flex flex-col gap-1 py-3">
            <span className="mb-2 self-start rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {user.role === "CUSTOMER" ? "Customer" : "Shop Owner"}
            </span>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 px-4">
              <PushNotificationToggle />
            </div>
            <div className="mt-2 px-4 text-sm text-slate-500">Logged in as {user.name}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
