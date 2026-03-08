"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShopSetupPage() {
  const { user, shop, token, loading, updateShop } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    pincode: "",
    phone: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SHOP_OWNER") {
      router.push("/login");
      return;
    }
    if (shop) {
      router.push("/shop-owner");
    }
  }, [user, shop, loading]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api<{ shop: { id: string; name: string } }>("/api/shops", {
        method: "POST",
        token: token!,
        body: JSON.stringify(form),
      });
      updateShop(data.shop);
      router.push("/shop-owner");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <Card>
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🏪</div>
            <CardTitle className="text-xl">Set Up Your Shop</CardTitle>
            <p className="text-sm text-gray-500">Fill in the details to create your digital dukan</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}

              <div>
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Raj Kirana Store"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell customers about your shop..."
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Shop address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  minLength={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={handleChange}
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    placeholder="400001"
                    value={form.pincode}
                    onChange={handleChange}
                    required
                    minLength={6}
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  minLength={10}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Shop"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
