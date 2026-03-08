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
        body: JSON.stringify({ shopId, items, notes: notes || undefined }),
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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!shop) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Shop not found</div>;
  }

  // Group products by category
  const grouped = shop.products.reduce((acc, product) => {
    const cat = product.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Shop Header */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">{shop.name}</h1>
          {shop.description && <p className="text-gray-500 mt-1">{shop.description}</p>}
          <div className="flex gap-4 mt-3 text-sm text-gray-600">
            <span>📍 {shop.address}, {shop.city}</span>
            <span>📞 {shop.phone}</span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Product List */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-4">Products</h2>
            {Object.entries(grouped).map(([category, products]) => (
              <div key={category} className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map((product) => {
                    const inCart = cart.get(product.id);
                    return (
                      <Card key={product.id} className="hover:shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-green-700 font-bold">₹{product.price}</span>
                              {product.mrp && product.mrp > product.price && (
                                <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                              )}
                              <span className="text-xs text-gray-400">/ {product.unit}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {inCart ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                                >
                                  −
                                </button>
                                <span className="text-sm font-medium w-5 text-center">{inCart.quantity}</span>
                                <button
                                  onClick={() => addToCart(product)}
                                  className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-sm hover:bg-green-700"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => addToCart(product)}
                              >
                                Add
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">🛒 Your Cart</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.size === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Cart is empty</p>
                  ) : (
                    <>
                      {Array.from(cart.values()).map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center py-2">
                          <div>
                            <p className="text-sm font-medium">{item.product.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.quantity} × ₹{item.product.price}
                            </p>
                          </div>
                          <span className="text-sm font-medium">
                            ₹{item.product.price * item.quantity}
                          </span>
                        </div>
                      ))}
                      <Separator className="my-3" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-green-700">₹{getCartTotal()}</span>
                      </div>
                      <Textarea
                        placeholder="Any special notes for the shopkeeper..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-3 text-sm"
                        rows={2}
                      />
                      <Button
                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
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
              className="w-full bg-green-600 hover:bg-green-700 py-6 text-base"
              onClick={() => setShowCart(!showCart)}
            >
              🛒 {cart.size} items — ₹{getCartTotal()} — {showCart ? "Hide" : "View Cart"}
            </Button>
            {showCart && (
              <Card className="mt-2">
                <CardContent className="p-4">
                  {Array.from(cart.values()).map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.quantity} × ₹{item.product.price}
                        </p>
                      </div>
                      <span className="text-sm font-medium">₹{item.product.price * item.quantity}</span>
                    </div>
                  ))}
                  <Separator className="my-3" />
                  <Textarea
                    placeholder="Any special notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <Button
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
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
