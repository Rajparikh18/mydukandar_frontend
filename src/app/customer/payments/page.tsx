"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentRecord {
  id: string;
  amount: number;
  method: "CASH" | "ONLINE" | "UDHAAR";
  note: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  shop: { id: string; name: string };
  order: { id: string; totalAmount: number; status: string; isPaid: boolean } | null;
}

interface BalanceRecord {
  customerId: string;
  shopId: string;
  balance: number;
  customer: { id: string; name: string };
  shop: { id: string; name: string };
}

interface OrderRecord {
  id: string;
  status: string;
  totalAmount: number;
  shop: { id: string; name: string; address: string };
}

interface PaymentsResponse {
  payments: PaymentRecord[];
  balance: number | null;
  balances: BalanceRecord[];
}

export default function CustomerPaymentsPage() {
  const { user, token, loading } = useAuth();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "ONLINE" | "UDHAAR">("CASH");
  const [shopId, setShopId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [balances, setBalances] = useState<BalanceRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState("");

  const shopOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const b of balances) map.set(b.shop.id, b.shop);
    for (const o of orders) map.set(o.shop.id, { id: o.shop.id, name: o.shop.name });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [balances, orders]);

  const selectedShopBalance = useMemo(() => {
    const rec = balances.find((b) => b.shopId === shopId);
    return rec?.balance ?? 0;
  }, [balances, shopId]);

  const shopOrders = useMemo(
    () => orders.filter((o) => (shopId ? o.shop.id === shopId : false)),
    [orders, shopId]
  );

  useEffect(() => {
    if (loading || !token || !user || user.role !== "CUSTOMER") return;
    void fetchData();
  }, [loading, token, user?.id]);

  useEffect(() => {
    if (!shopId && shopOptions.length > 0) {
      setShopId(shopOptions[0].id);
    }
  }, [shopId, shopOptions]);

  if (!loading && !user) return <div className="page-frame py-20 text-center">Please login to record a payment.</div>;

  async function fetchData() {
    setFetching(true);
    setError("");
    try {
      const [paymentsData, ordersData] = await Promise.all([
        api<PaymentsResponse>("/api/payments", { token: token ?? undefined }),
        api<{ orders: OrderRecord[] }>("/api/orders", { token: token ?? undefined }),
      ]);
      setPayments(paymentsData.payments || []);
      setBalances(paymentsData.balances || []);
      setOrders(ordersData.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body: any = {
        customerId: user!.id,
        amount: parseFloat(amount),
        method,
        shopId,
      };
      if (orderId) body.orderId = orderId;
      if (note) body.note = note;

      await api("/api/payments", { method: "POST", token: token ?? undefined, body: JSON.stringify(body) });
      setAmount("");
      setOrderId("");
      setNote("");
      setMethod("CASH");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-6">
          <h1 className="page-title">Make a Payment</h1>
          <p className="page-subtitle">Pay dues, add udhaar entries, and track your payment history per shop.</p>
        </div>

        {fetching && <div className="mb-4 text-sm text-slate-500">Loading payment details...</div>}

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="text-sm text-rose-700">{error}</div>}
            <div>
              <Label htmlFor="shop">Shop</Label>
              <select
                id="shop"
                className="h-11 w-full rounded-2xl border px-4"
                value={shopId}
                onChange={(e) => {
                  setShopId(e.target.value);
                  setOrderId("");
                }}
                required
              >
                <option value="">Select shop</option>
                {shopOptions.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="method">Method</Label>
              <select id="method" className="h-11 w-full rounded-2xl border px-4" value={method} onChange={(e) => setMethod(e.target.value as "CASH" | "ONLINE" | "UDHAAR")}>
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
                <option value="UDHAAR">Udhaar (credit) - use with shop owner's approval</option>
              </select>
            </div>
            <div>
              <Label htmlFor="order">Order (optional)</Label>
              <select id="order" className="h-11 w-full rounded-2xl border px-4" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">No order mapping</option>
                {shopOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id.slice(0, 8)} | ₹{order.totalAmount} | {order.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {method === "UDHAAR" && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This will increase your dues for the selected shop.
              </div>
            )}
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Pay"}</Button>
          </form>

          <div className="mt-5 rounded-md border bg-white p-4">
            <div className="text-sm text-slate-500">Selected shop balance</div>
            <div className={`mt-1 text-xl font-semibold ${selectedShopBalance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              ₹{selectedShopBalance.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">Positive means you owe this amount.</div>
          </div>

          <div className="mt-6 rounded-md border bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">My Payment History</h2>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No payment activity yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-800">{p.shop.name}</span>
                      <span className="text-slate-500">{new Date(p.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {p.method} | ₹{p.amount}
                      {p.order ? ` | Order ${p.order.id.slice(0, 8)}` : ""}
                    </div>
                    {p.note && <div className="mt-1 text-xs text-slate-500">Note: {p.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
