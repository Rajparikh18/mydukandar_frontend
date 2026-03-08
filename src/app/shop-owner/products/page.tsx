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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  // Group by category
  const grouped = products.reduce((acc, product) => {
    const cat = product.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-500 text-sm">{products.length} items in your catalog</p>
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Product"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <form onSubmit={handleAddProduct} className="space-y-3">
                {formError && (
                  <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{formError}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pname">Product Name *</Label>
                    <Input
                      id="pname"
                      placeholder="e.g. Toor Dal"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full h-9 rounded-md border px-3 text-sm"
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
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="120"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="150"
                      value={newProduct.mrp}
                      onChange={(e) => setNewProduct((p) => ({ ...p, mrp: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="kg, piece, pack..."
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="qty">Quantity in Stock</Label>
                    <Input
                      id="qty"
                      type="number"
                      min="0"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct((p) => ({ ...p, quantity: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Product"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <div className="text-gray-500 text-center py-12">
            No products in your catalog yet
          </div>
        ) : (
          Object.entries(grouped).map(([category, prods]) => (
            <div key={category} className="mb-6">
              <h2 className="text-md font-semibold text-gray-700 mb-3">
                {categoryLabels[category] || category} ({prods.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prods.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-green-700 font-bold">₹{product.price}</span>
                          {product.mrp && product.mrp > product.price && (
                            <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                          )}
                          <span className="text-xs text-gray-400">/ {product.unit}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Stock: {product.quantity}</p>
                      </div>
                      <Badge variant={product.inStock ? "secondary" : "destructive"}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
