"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; unit: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  shop: { name: string; address: string };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PACKING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  PICKED_UP: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "⏳ Pending",
  ACCEPTED: "✅ Accepted",
  PACKING: "📦 Packing",
  READY: "🎉 Ready for Pickup",
  PICKED_UP: "✔️ Picked Up",
  CANCELLED: "❌ Cancelled",
};

export default function CustomerOrdersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "CUSTOMER") {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [user, loading]);

  async function fetchOrders() {
    try {
      const data = await api<{ orders: Order[] }>("/api/orders", { token: token! });
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setFetching(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

        {fetching ? (
          <div className="text-gray-500 text-center py-12">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No orders yet</p>
            <button
              onClick={() => router.push("/customer")}
              className="text-green-600 hover:underline"
            >
              Browse shops and place your first order
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{order.shop.name}</CardTitle>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="text-gray-700">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <p className="text-xs text-gray-400 mt-2 italic">Note: {order.notes}</p>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="font-medium text-sm">Total</span>
                    <span className="font-bold text-green-700">₹{order.totalAmount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
