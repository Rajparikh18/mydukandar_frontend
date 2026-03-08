"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Find Shops Near You</h1>
        <p className="text-gray-500 mb-6">Search for your trusted local shops and order in advance</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            placeholder="Search by shop name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Search
          </button>
        </form>

        {fetching ? (
          <div className="text-gray-500 text-center py-12">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No shops found. Try a different search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/customer/shop/${shop.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{shop.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {shop._count.products} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {shop.description && (
                      <p className="text-sm text-gray-500 mb-2">{shop.description}</p>
                    )}
                    <p className="text-sm text-gray-600">📍 {shop.address}</p>
                    <p className="text-sm text-gray-600">🏙️ {shop.city} - {shop.pincode}</p>
                    <p className="text-sm text-gray-600">📞 {shop.phone}</p>
                    <p className="text-xs text-gray-400 mt-2">Owner: {shop.owner.name}</p>
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
