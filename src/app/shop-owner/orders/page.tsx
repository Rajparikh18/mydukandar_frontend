"use client";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  paymentMode: "CASH" | "ONLINE" | "UDHAAR";
  deliveryMode: "SELF_PICKUP" | "DELIVERY";
  payments: { amount: number }[];
  createdAt: string;
  items: OrderItem[];
  customer: { id: string; name: string; phone: string | null };
  shop: { name: string };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PACKING: "bg-violet-100 text-violet-800",
  READY: "bg-emerald-100 text-emerald-800",
  PICKED_UP: "bg-slate-100 text-slate-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "⏳ Pending",
  ACCEPTED: "✅ Accepted",
  PACKING: "📦 Packing",
  READY: "🚚 Ready",
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
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    orderId: string;
    customerId: string;
    maxAmount: number;
    amount: string;
    method: string;
  }>({ isOpen: false, orderId: "", customerId: "", maxAmount: 0, amount: "", method: "" });

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

  async function collectPayment(orderId: string, customerId: string, amount: number, method: string) {
    try {
      await api("/api/payments", {
        method: "POST",
        token: token!,
        body: JSON.stringify({
          amount,
          method,
          orderId,
          customerId,
          note: "Payment collected for order",
        }),
      });
      fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to collect payment");
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "active") return ["PENDING", "ACCEPTED", "PACKING", "READY"].includes(order.status);
    if (filter === "completed") return ["PICKED_UP", "CANCELLED"].includes(order.status);
    return true;
  });

  const summary = useMemo(() => {
    const activeCount = orders.filter((order) => ["PENDING", "ACCEPTED", "PACKING", "READY"].includes(order.status)).length;
    const completedCount = orders.filter((order) => ["PICKED_UP", "CANCELLED"].includes(order.status)).length;
    const pendingCount = orders.filter((order) => order.status === "PENDING").length;
    const paidCount = orders.filter((order) => order.isPaid).length;
    const totalValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    return { activeCount, completedCount, pendingCount, paidCount, totalValue };
  }, [orders]);

  const selectedOrder = filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? null;

  useEffect(() => {
    if (!selectedOrderId && filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id);
    }
    if (selectedOrderId && !filteredOrders.some((order) => order.id === selectedOrderId) && filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  if (loading) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-8 flex flex-col gap-3">
          <span className="section-kicker">Order operations</span>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Accept, pack, and complete orders with a clean processing flow.</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Active</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{summary.activeCount}</div>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{summary.pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Completed</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{summary.completedCount}</div>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Paid</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{summary.paidCount}</div>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total value</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">₹{summary.totalValue}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {["active", "completed", "all"].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                filter === option
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "border border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:bg-white"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="hero-panel py-16 text-center text-slate-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="hero-panel py-16 text-center text-slate-500">No orders found</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`border-white/70 bg-white/75 transition-all ${selectedOrder?.id === order.id ? "ring-2 ring-emerald-400" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <button type="button" onClick={() => setSelectedOrderId(order.id)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg text-slate-950">👤 {order.customer.name}</CardTitle>
                          {order.customer.phone && <p className="text-xs text-slate-400">📞 {order.customer.phone}</p>}
                          <p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[order.status]}>{statusLabels[order.status] || order.status}</Badge>
                          <div className="flex gap-1">
                            <Badge variant={order.isPaid ? "secondary" : "destructive"} className={order.isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                              {order.paymentMode}
                            </Badge>
                          </div>
                          <Badge className={order.deliveryMode === "DELIVERY" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}>
                            {order.deliveryMode === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.product.name} × {item.quantity}</span>
                          <span className="text-slate-700">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {order.notes && <p className="mt-2 text-xs italic text-slate-400">📝 Note: {order.notes}</p>}

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-3">
                      <span className="font-semibold text-slate-700">
                        Total: <span className="text-emerald-700">₹{order.totalAmount}</span>
                      </span>
                      <div className="flex gap-2">
                        {nextStatusMap[order.status] && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(order.id, nextStatusMap[order.status].status)}>
                            {nextStatusMap[order.status].label}
                          </Button>
                        )}
                        {order.status === "PENDING" && (
                          <Button size="sm" variant="outline" className="border-rose-200 bg-white/80 text-rose-700 hover:bg-rose-50" onClick={() => updateStatus(order.id, "CANCELLED")}>Cancel</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="sticky top-6 h-fit border-white/70 bg-white/85 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)]">
              <CardHeader>
                <CardTitle className="text-lg text-slate-950">Order detail</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{selectedOrder.customer.name}</div>
                      <div className="text-xs text-slate-500">{selectedOrder.customer.phone || "No phone"}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className={statusColors[selectedOrder.status]}>{statusLabels[selectedOrder.status] || selectedOrder.status}</Badge>
                        <Badge variant={selectedOrder.isPaid ? "secondary" : "destructive"} className={selectedOrder.isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                          {selectedOrder.paymentMode} {selectedOrder.isPaid ? "(Paid)" : "(Unpaid)"}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Items</div>
                      <div className="mt-3 space-y-2">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.product.name} × {item.quantity}</span>
                            <span className="text-slate-700">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Amount</span>
                        <span className="font-semibold text-slate-950">₹{selectedOrder.totalAmount}</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t border-slate-200/80 pt-2">
                        <span>Paid Amount</span>
                        <span className="font-semibold text-emerald-700">₹{selectedOrder.payments?.reduce((sum, p) => sum + p.amount, 0) || 0}</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t border-slate-200/80 pt-2">
                        <span>Dues Remaining</span>
                        <span className="font-semibold text-amber-600">₹{selectedOrder.totalAmount - (selectedOrder.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)}</span>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <span>Created</span>
                        <span>{new Date(selectedOrder.createdAt).toLocaleString("en-IN")}</span>
                      </div>
                      {selectedOrder.notes && <div className="mt-2 text-xs italic text-slate-500">Note: {selectedOrder.notes}</div>}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {nextStatusMap[selectedOrder.status] && (
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(selectedOrder.id, nextStatusMap[selectedOrder.status].status)}>
                          {nextStatusMap[selectedOrder.status].label}
                        </Button>
                      )}
                      
                      {!selectedOrder.isPaid && (
                        <Button 
                          variant="secondary" 
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" 
                          onClick={() => {
                            const dues = selectedOrder.totalAmount - (selectedOrder.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
                            const method = selectedOrder.paymentMode === "UDHAAR" ? "CASH" : selectedOrder.paymentMode;
                            setPaymentModalState({
                              isOpen: true,
                              orderId: selectedOrder.id,
                              customerId: selectedOrder.customer.id,
                              maxAmount: dues,
                              amount: dues.toString(),
                              method,
                            });
                          }}
                        >
                          Collect Payment (₹{selectedOrder.totalAmount - (selectedOrder.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)})
                        </Button>
                      )}

                      {selectedOrder.status === "PENDING" && (
                        <Button variant="outline" className="border-rose-200 bg-white/80 text-rose-700 hover:bg-rose-50" onClick={() => updateStatus(selectedOrder.id, "CANCELLED")}>Cancel order</Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select an order to inspect its items, totals, and next action.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {paymentModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Collect Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Amount Received (₹)</label>
                  <input
                    type="number"
                    value={paymentModalState.amount}
                    onChange={(e) => setPaymentModalState({ ...paymentModalState, amount: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder={`Max: ₹${paymentModalState.maxAmount}`}
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-slate-500">Maximum collectable: ₹{paymentModalState.maxAmount}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPaymentModalState({ ...paymentModalState, isOpen: false })}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      const amount = parseFloat(paymentModalState.amount);
                      if (isNaN(amount) || amount <= 0 || amount > paymentModalState.maxAmount) {
                        alert(`Invalid amount entered. Must be between 1 and ${paymentModalState.maxAmount}`);
                        return;
                      }
                      collectPayment(paymentModalState.orderId, paymentModalState.customerId, amount, paymentModalState.method);
                      setPaymentModalState({ ...paymentModalState, isOpen: false });
                    }}
                  >
                    Confirm Payment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
