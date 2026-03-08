"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ShopDetails {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  _count: { products: number; orders: number; customers: number };
}

export default function ShopOwnerDashboard() {
  const { user, shop, token, loading } = useAuth();
  const router = useRouter();
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [recentOrders, setRecentOrders] = useState<number>(0);
  const [fetching, setFetching] = useState(true);

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
    fetchShopDetails();
  }, [user, shop, loading]);

  async function fetchShopDetails() {
    try {
      const data = await api<{ shop: ShopDetails }>(`/api/shops/${shop!.id}`, { token: token! });
      setShopDetails(data.shop);

      const ordersData = await api<{ orders: { status: string }[] }>("/api/orders", { token: token! });
      const pending = ordersData.orders.filter(
        (o) => o.status === "PENDING" || o.status === "ACCEPTED" || o.status === "PACKING"
      ).length;
      setRecentOrders(pending);
    } catch (err) {
      console.error("Failed to fetch shop details:", err);
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {user?.name}!</h1>
        <p className="text-gray-500 mb-6">{shop?.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-800">{shopDetails?._count.products || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-800">{shopDetails?._count.orders || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-800">{recentOrders}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/shop-owner/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="text-4xl">📦</div>
                <div>
                  <p className="font-semibold text-lg">Manage Orders</p>
                  <p className="text-sm text-gray-500">View and update order status</p>
                  {recentOrders > 0 && (
                    <p className="text-sm text-orange-600 font-medium mt-1">
                      {recentOrders} orders need attention
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/shop-owner/products">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="text-4xl">🛒</div>
                <div>
                  <p className="font-semibold text-lg">View Products</p>
                  <p className="text-sm text-gray-500">See your product catalog</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Shop Info */}
        {shopDetails && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Shop Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Name:</strong> {shopDetails.name}</p>
              {shopDetails.description && <p><strong>Description:</strong> {shopDetails.description}</p>}
              <p><strong>Address:</strong> {shopDetails.address}, {shopDetails.city} - {shopDetails.pincode}</p>
              <p><strong>Phone:</strong> {shopDetails.phone}</p>
              <p><strong>Connected Customers:</strong> {shopDetails._count.customers}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
