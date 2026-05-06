"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  isPaid: boolean;
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
  const [filter, setFilter] = useState<"active" | "past" | "all">("active");

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

  async function cancelOrder(orderId: string) {
    try {
      await api(`/api/orders/${orderId}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "active") return ["PENDING", "ACCEPTED", "PACKING", "READY"].includes(order.status);
    if (filter === "past") return ["PICKED_UP", "CANCELLED"].includes(order.status);
    return true;
  });

  const activeCount = orders.filter((o) => ["PENDING", "ACCEPTED", "PACKING", "READY"].includes(o.status)).length;
  const pastCount = orders.filter((o) => ["PICKED_UP", "CANCELLED"].includes(o.status)).length;

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

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "active" as const, label: "Active", count: activeCount },
            { key: "past" as const, label: "Past", count: pastCount },
            { key: "all" as const, label: "All", count: orders.length },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                filter === option.key
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "border border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:bg-white"
              }`}
            >
              {option.label} <span className="ml-1 text-xs opacity-70">({option.count})</span>
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="hero-panel py-16 text-center text-slate-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="hero-panel py-16 text-center">
            <div className="text-4xl">📦</div>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              {filter === "active" ? "No active orders" : filter === "past" ? "No past orders" : "No orders yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "active" ? "All caught up! Browse shops to place a new order." : "Place your first order to get started."}
            </p>
            <button
              onClick={() => router.push("/customer")}
              className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5"
            >
              Browse shops
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-white/70 bg-white/75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-950">{order.shop.name}</CardTitle>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <Badge
                        variant={order.isPaid ? "secondary" : "destructive"}
                        className={order.isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
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
                  {/* Cancel button for pending orders */}
                  {order.status === "PENDING" && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 bg-white/80 text-rose-700 hover:bg-rose-50"
                        onClick={() => cancelOrder(order.id)}
                      >
                        Cancel Order
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
