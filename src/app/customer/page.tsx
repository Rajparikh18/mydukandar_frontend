"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Shop {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  owner: { name: string };
  _count: { products: number };
}

export default function CustomerPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "CUSTOMER") {
      router.push("/login");
      return;
    }
    fetchShops();
  }, [user, loading]);

  async function fetchShops(query?: string) {
    setFetching(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const data = await api<{ shops: Shop[] }>(`/api/shops${params}`, { token: token! });
      setShops(data.shops);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
    } finally {
      setFetching(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchShops(search);
  }

  if (loading) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="section-kicker">Customer marketplace</span>
            <h1 className="page-title">Discover trusted shops around you.</h1>
            <p className="page-subtitle">Search by name or location, open a shop, and order in a flow that feels fast and familiar.</p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full gap-2 lg:max-w-xl">
            <div className="field-shell flex-1">
              <Input
                placeholder="Search by shop name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" className="shrink-0 px-6">
              Search
            </Button>
          </form>
        </div>

        {fetching ? (
          <div className="hero-panel py-16 text-center text-slate-500">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="hero-panel py-16 text-center">
            <div className="text-4xl">🛍️</div>
            <div className="mt-3 text-lg font-semibold text-slate-950">No shops found</div>
            <div className="mt-1 text-sm text-slate-500">Try a different search or explore the seeded stores.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/customer/shop/${shop.id}`}>
                <Card className="h-full cursor-pointer border-white/70 bg-white/75 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_50px_-24px_rgba(15,23,42,0.28)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-slate-950">{shop.name}</CardTitle>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                        {shop._count.products} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {shop.description && <p className="mb-3 text-sm leading-6 text-slate-600">{shop.description}</p>}
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>📍 {shop.address}</p>
                      <p>🏙️ {shop.city} - {shop.pincode}</p>
                      <p>📞 {shop.phone}</p>
                    </div>
                    <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Owner: {shop.owner.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
