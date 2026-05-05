"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  unit: string;
  category: string;
  inStock: boolean;
  quantity: number;
}

const categoryLabels: Record<string, string> = {
  GROCERY: "🛒 Grocery",
  STATIONERY: "📝 Stationery",
  MEDICAL: "💊 Medical",
  HOUSEHOLD: "🏠 Household",
  OTHER: "📦 Other",
};

export default function ShopOwnerProductsPage() {
  const { user, shop, token, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    mrp: "",
    unit: "piece",
    category: "GROCERY",
    quantity: "10",
  });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SHOP_OWNER") {
      router.push("/login");
      return;
    }
    if (!shop) {
      router.push("/shop-owner/setup");
      return;
    }
    fetchProducts();
  }, [user, shop, loading]);

  async function fetchProducts() {
    try {
      const data = await api<{ products: Product[] }>(`/api/products?shopId=${shop!.id}`, { token: token! });
      setProducts(data.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setFetching(false);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api("/api/products", {
        method: "POST",
        token: token!,
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          mrp: newProduct.mrp ? parseFloat(newProduct.mrp) : undefined,
          unit: newProduct.unit,
          category: newProduct.category,
          quantity: parseInt(newProduct.quantity) || 0,
        }),
      });
      setNewProduct({ name: "", price: "", mrp: "", unit: "piece", category: "GROCERY", quantity: "10" });
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || fetching) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  // Group by category
  const grouped = products.reduce((acc, product) => {
    const cat = product.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categoryEntries = Object.entries(grouped);
  const displayEntries: Array<[string, Product[]]> =
    activeCategory === "ALL" ? categoryEntries : [[activeCategory, grouped[activeCategory] || []]];
  const totalProducts = products.length;
  const inStockProducts = products.filter((product) => product.inStock).length;
  const outOfStockProducts = totalProducts - inStockProducts;
  const lowStockProducts = products.filter((product) => product.quantity > 0 && product.quantity <= 10).length;
  const activeProducts = activeCategory === "ALL" ? products : grouped[activeCategory] || [];

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-3">
            <span className="section-kicker">Catalog manager</span>
            <h1 className="page-title mt-3">Products</h1>
            <p className="page-subtitle mt-2">A catalog workspace for shaping how your inventory is presented, stocked, and sold.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [totalProducts, "total", "📦"],
              [inStockProducts, "in stock", "✅"],
              [lowStockProducts, "low stock", "⚠️"],
              [outOfStockProducts, "out", "⛔"],
            ].map(([value, label, icon]) => (
              <div key={label as string} className="metric-card min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
                  <div className="text-lg">{icon as string}</div>
                </div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{value as number}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/75 p-3 shadow-sm backdrop-blur-xl">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Browse categories</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("ALL")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeCategory === "ALL"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : "border border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:bg-white"
                }`}
              >
                All products
              </button>
              {categoryEntries.map(([category, list]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeCategory === category
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                      : "border border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:bg-white"
                  }`}
                >
                  {categoryLabels[category] || category} <span className="ml-1 text-xs opacity-70">({list.length})</span>
                </button>
              ))}
            </div>
          </div>

          <Button className="px-5" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Close editor" : "+ Add Product"}
          </Button>
        </div>

        {showForm && (
          <Card className="metric-card mb-6">
            <CardContent className="p-5">
              <form onSubmit={handleAddProduct} className="space-y-3">
                {formError && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label htmlFor="pname">Product Name *</Label>
                    <Input id="pname" placeholder="e.g. Toor Dal" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-sm shadow-sm outline-none"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="GROCERY">Grocery</option>
                      <option value="STATIONERY">Stationery</option>
                      <option value="MEDICAL">Medical</option>
                      <option value="HOUSEHOLD">Household</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input id="price" type="number" step="0.01" min="0.01" placeholder="120" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} required />
                  </div>
                  <div>
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input id="mrp" type="number" step="0.01" min="0" placeholder="150" value={newProduct.mrp} onChange={(e) => setNewProduct((p) => ({ ...p, mrp: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" placeholder="kg, piece, pack..." value={newProduct.unit} onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="qty">Quantity in Stock</Label>
                    <Input id="qty" type="number" min="0" value={newProduct.quantity} onChange={(e) => setNewProduct((p) => ({ ...p, quantity: e.target.value }))} />
                  </div>
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Product"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <div className="hero-panel py-16 text-center text-slate-500">
            No products in your catalog yet
          </div>
        ) : (
          <div className="space-y-8">
            {displayEntries.map(([category, prods]) => (
              <section key={category} className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{categoryLabels[category] || category}</h2>
                    <p className="text-sm text-slate-500">{prods.length} products in this shelf</p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {activeProducts.length} visible
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {prods.length > 0 ? (
                    prods.map((product, index) => (
                      <Card
                        key={product.id}
                        className={`border-white/70 bg-white/75 transition-all duration-200 hover:-translate-y-1 ${index % 5 === 0 ? "md:col-span-2 xl:col-span-2" : ""}`}
                      >
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">SKU {index + 1}</div>
                            <p className="mt-2 text-sm font-medium text-slate-950">{product.name}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-lg font-bold text-emerald-700">₹{product.price}</span>
                              {product.mrp && product.mrp > product.price && <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>}
                              <span className="text-xs text-slate-400">/ {product.unit}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Stock {product.quantity}</span>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                {product.inStock ? "Visible" : "Hidden"}
                              </span>
                            </div>
                          </div>
                          <Badge variant={product.inStock ? "secondary" : "destructive"} className={product.inStock ? "bg-emerald-50 text-emerald-700" : ""}>
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="md:col-span-2 xl:col-span-3 border-dashed border-slate-300/70 bg-white/40">
                      <CardContent className="p-6 text-sm text-slate-500">
                        No products in this category.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
