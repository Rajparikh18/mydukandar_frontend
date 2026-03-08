"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
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
  customer: { name: string; phone: string | null };
  shop: { name: string };
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

const nextStatusMap: Record<string, { label: string; status: string }> = {
  PENDING: { label: "Accept Order", status: "ACCEPTED" },
  ACCEPTED: { label: "Start Packing", status: "PACKING" },
  PACKING: { label: "Mark Ready", status: "READY" },
  READY: { label: "Mark Picked Up", status: "PICKED_UP" },
};

export default function ShopOwnerOrdersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<string>("active");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SHOP_OWNER") {
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

  async function updateStatus(orderId: string, status: string) {
    try {
      await api(`/api/orders/${orderId}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === "active") return ["PENDING", "ACCEPTED", "PACKING", "READY"].includes(o.status);
    if (filter === "completed") return ["PICKED_UP", "CANCELLED"].includes(o.status);
    return true;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Orders</h1>

        <div className="flex gap-2 mb-6">
          {["active", "completed", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="text-gray-500 text-center py-12">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No orders found</div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        👤 {order.customer.name}
                      </CardTitle>
                      {order.customer.phone && (
                        <p className="text-xs text-gray-400">📞 {order.customer.phone}</p>
                      )}
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
                    <p className="text-xs text-gray-400 mt-2 italic">📝 Note: {order.notes}</p>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="font-bold text-green-700">Total: ₹{order.totalAmount}</span>
                    <div className="flex gap-2">
                      {nextStatusMap[order.status] && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(order.id, nextStatusMap[order.status].status)}
                        >
                          {nextStatusMap[order.status].label}
                        </Button>
                      )}
                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => updateStatus(order.id, "CANCELLED")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
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
