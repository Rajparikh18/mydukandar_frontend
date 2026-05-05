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
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-8 flex flex-col gap-3">
          <span className="section-kicker">Order timeline</span>
          <h1 className="page-title">My orders</h1>
          <p className="page-subtitle">Track the progress of every order from acceptance to pickup.</p>
        </div>

        {fetching ? (
          <div className="hero-panel py-16 text-center text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="hero-panel py-16 text-center">
            <p className="mb-4 text-slate-500">No orders yet</p>
            <button
              onClick={() => router.push("/customer")}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5"
            >
              Browse shops and place your first order
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-white/70 bg-white/75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-950">{order.shop.name}</CardTitle>
                      <p className="mt-1 text-xs text-slate-400">
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
                    <p className="mt-2 text-xs italic text-slate-400">Note: {order.notes}</p>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="text-sm font-medium text-slate-600">Total</span>
                    <span className="font-bold text-emerald-700">₹{order.totalAmount}</span>
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
