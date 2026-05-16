"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  unit: string;
  category: string;
  inStock: boolean;
  quantity: number;
}

interface Shop {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone: string;
  owner: { name: string; phone: string | null };
  products: Product[];
  _count: { products: number; orders: number };
}

interface CartItem {
  product: Product;
  quantity: number;
}

const categoryLabels: Record<string, string> = {
  GROCERY: "🛒 Grocery",
  STATIONERY: "📝 Stationery",
  MEDICAL: "💊 Medical",
  HOUSEHOLD: "🏠 Household",
  OTHER: "📦 Other",
};

export default function ShopDetailPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [notes, setNotes] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"SELF_PICKUP" | "DELIVERY">("SELF_PICKUP");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "ONLINE" | "UDHAAR">("CASH");
  const [ordering, setOrdering] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "CUSTOMER") {
      router.push("/login");
      return;
    }
    fetchShop();
  }, [user, loading]);

  async function fetchShop() {
    try {
      const data = await api<{ shop: Shop }>(`/api/shops/${shopId}`, { token: token! });
      setShop(data.shop);
    } catch (err) {
      console.error("Failed to fetch shop:", err);
    } finally {
      setFetching(false);
    }
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      if (existing) {
        next.set(product.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(product.id, { product, quantity: 1 });
      }
      return next;
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(productId);
      if (existing && existing.quantity > 1) {
        next.set(productId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        next.delete(productId);
      }
      return next;
    });
  }

  function getCartTotal() {
    let total = 0;
    cart.forEach((item) => {
      total += item.product.price * item.quantity;
    });
    return total;
  }

  async function placeOrder() {
    if (cart.size === 0) return;
    setOrdering(true);

    try {
      const items = Array.from(cart.values()).map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      await api("/api/orders", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ shopId, items, notes: notes || undefined, deliveryMode, paymentMode }),
      });

      setCart(new Map());
      setNotes("");
      router.push("/customer/orders");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setOrdering(false);
    }
  }

  if (loading || fetching) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!shop) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Shop not found</div>;
  }

  // Group products by category
  const grouped = shop.products.reduce((acc, product) => {
    const cat = product.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="min-h-screen pb-28 lg:pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-3">
            <span className="section-kicker">Shop detail</span>
            <h1 className="page-title">{shop.name}</h1>
            {shop.description && <p className="page-subtitle">{shop.description}</p>}
            <div className="flex flex-wrap gap-2 pt-2 text-sm text-slate-600">
              <span className="rounded-full bg-white/80 px-3 py-2 shadow-sm">📍 {shop.address}, {shop.city}</span>
              <span className="rounded-full bg-white/80 px-3 py-2 shadow-sm">📞 {shop.phone}</span>
              <span className="rounded-full bg-white/80 px-3 py-2 shadow-sm">👤 {shop.owner.name}</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [shop._count.products, "products"],
              [shop._count.orders, "orders"],
              [shop.products.filter((product) => product.inStock).length, "available"],
            ].map(([value, label]) => (
              <div key={label as string} className="metric-card">
                <div className="text-3xl font-semibold text-slate-950">{value as number}</div>
                <div className="mt-1 text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.36fr]">
          {/* Product List */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-950">Products</h2>
            {Object.entries(grouped).map(([category, products]) => (
              <div key={category} className="mb-6">
                <h3 className="mb-3 text-md font-medium text-slate-700">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {products.map((product) => {
                    const inCart = cart.get(product.id);
                    return (
                      <Card key={product.id} className="border-white/70 bg-white/75 transition-all duration-200 hover:-translate-y-1">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex-1 pr-3">
                            <p className="text-sm font-medium text-slate-950">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-emerald-700">₹{product.price}</span>
                              {product.mrp && product.mrp > product.price && (
                                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                              )}
                              <span className="text-xs text-slate-400">/ {product.unit}</span>
                            </div>
                            {product.description && <p className="mt-2 text-xs leading-5 text-slate-500">{product.description}</p>}
                            {!product.inStock && <div className="mt-2 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Out of stock</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            {inCart ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm hover:bg-slate-50"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-sm font-medium text-slate-700">{inCart.quantity}</span>
                                <button
                                  onClick={() => addToCart(product)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm text-white shadow-sm hover:bg-emerald-700"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-200 bg-white/80 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => addToCart(product)}
                                disabled={!product.inStock}
                              >
                                {product.inStock ? "Add" : "Unavailable"}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Sidebar */}
          <div className="w-80 hidden lg:block">
            <div className="sticky top-20">
              <Card className="border-white/70 bg-white/80 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-slate-950">🛒 Your Cart</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.size === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">Cart is empty</p>
                  ) : (
                    <>
                      {Array.from(cart.values()).map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-950">{item.product.name}</p>
                            <p className="text-xs text-slate-400">
                              {item.quantity} × ₹{item.product.price}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            ₹{item.product.price * item.quantity}
                          </span>
                        </div>
                      ))}
                      <Separator className="my-3" />
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-700">Total</span>
                        <span className="text-emerald-700">₹{getCartTotal()}</span>
                      </div>
                      {/* Delivery mode selector */}
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Fulfillment</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryMode("SELF_PICKUP")}
                            className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                              deliveryMode === "SELF_PICKUP"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-white/70 text-slate-500 hover:bg-white"
                            }`}
                          >
                            🏪 Self Pickup
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryMode("DELIVERY")}
                            className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                              deliveryMode === "DELIVERY"
                                ? "border-blue-300 bg-blue-50 text-blue-800"
                                : "border-slate-200 bg-white/70 text-slate-500 hover:bg-white"
                            }`}
                          >
                            🚚 Delivery
                          </button>
                        </div>
                      </div>

                      {/* Payment mode selector */}
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Payment</div>
                        <div className="grid grid-cols-3 gap-2">
                          {["CASH", "ONLINE", "UDHAAR"].map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPaymentMode(mode as any)}
                              className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                                paymentMode === mode
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : "border-slate-200 bg-white/70 text-slate-500 hover:bg-white"
                              }`}
                            >
                              {mode === "CASH" ? "💵" : mode === "ONLINE" ? "📱" : "📒"} {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <Textarea
                        placeholder="Any special notes for the shopkeeper..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-3 text-sm"
                        rows={2}
                      />
                      <Button
                        className="mt-3 w-full"
                        onClick={placeOrder}
                        disabled={ordering}
                      >
                        {ordering ? "Placing Order..." : `Place Order (₹${getCartTotal()})`}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Cart Button */}
        {cart.size > 0 && (
          <div className="fixed bottom-4 left-4 right-4 lg:hidden">
            <Button
              className="w-full py-6 text-base"
              onClick={() => setShowCart(!showCart)}
            >
              🛒 {cart.size} items — ₹{getCartTotal()} — {showCart ? "Hide" : "View Cart"}
            </Button>
            {showCart && (
              <Card className="mt-2 border-white/70 bg-white/80 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                <CardContent className="p-4">
                  {Array.from(cart.values()).map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-950">{item.product.name}</p>
                        <p className="text-xs text-slate-400">
                          {item.quantity} × ₹{item.product.price}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-slate-700">₹{item.product.price * item.quantity}</span>
                    </div>
                  ))}
                  <Separator className="my-3" />
                  {/* Delivery mode selector - mobile */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Fulfillment</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMode("SELF_PICKUP")}
                        className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                          deliveryMode === "SELF_PICKUP"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white/70 text-slate-500"
                        }`}
                      >
                        🏪 Self Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMode("DELIVERY")}
                        className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                          deliveryMode === "DELIVERY"
                            ? "border-blue-300 bg-blue-50 text-blue-800"
                            : "border-slate-200 bg-white/70 text-slate-500"
                        }`}
                      >
                        🚚 Delivery
                      </button>
                    </div>
                  </div>

                  {/* Payment mode selector - mobile */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Payment</div>
                    <div className="grid grid-cols-3 gap-2">
                      {["CASH", "ONLINE", "UDHAAR"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMode(mode as any)}
                          className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                            paymentMode === mode
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-white/70 text-slate-500"
                          }`}
                        >
                          {mode === "CASH" ? "💵" : mode === "ONLINE" ? "📱" : "📒"} {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Any special notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <Button
                    className="mt-3 w-full"
                    onClick={placeOrder}
                    disabled={ordering}
                  >
                    {ordering ? "Placing..." : `Place Order (₹${getCartTotal()})`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
