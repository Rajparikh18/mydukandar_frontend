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
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-10">
        <div className="mx-auto max-w-2xl">
          <div className="hero-panel mb-6 flex flex-col gap-3">
            <span className="section-kicker">Shop setup</span>
            <h1 className="page-title">Create your digital storefront.</h1>
            <p className="page-subtitle">Complete your shop profile so customers can discover and order from you.</p>
          </div>
          <Card className="border-white/70 bg-white/80 shadow-none backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-3xl shadow-lg shadow-emerald-500/20">🏪</div>
              <CardTitle className="mt-4 text-2xl">Set Up Your Shop</CardTitle>
              <p className="text-sm text-slate-500">Fill in the details to create your digital dukan</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

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

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Shop"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
