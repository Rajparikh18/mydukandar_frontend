"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  customer: { id: string; name: string; phone: string | null };
}

interface PaymentsResponse {
  payments: PaymentRecord[];
  balance: number | null;
  balances: BalanceRecord[];
}

type FilterMode = "all" | "owing" | "settled";

export default function ShopOwnerPaymentsPage() {
  const { user, token, loading } = useAuth();
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "ONLINE" | "UDHAAR">("CASH");
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [balances, setBalances] = useState<BalanceRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const customers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const b of balances) map.set(b.customer.id, b.customer);
    for (const o of orders) map.set(o.customer.id, { id: o.customer.id, name: o.customer.name });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [balances, orders]);

  const customerOrders = useMemo(
    () => orders.filter((o) => (customerId ? o.customer.id === customerId : false)),
    [orders, customerId]
  );

  const selectedBalance = useMemo(() => {
    const rec = balances.find((b) => b.customerId === customerId);
    return rec?.balance ?? 0;
  }, [balances, customerId]);

  const customerDirectory = useMemo(() => {
    return customers
      .map((customer) => {
        const balance = balances.find((b) => b.customerId === customer.id)?.balance ?? 0;
        const customerPayments = payments.filter((payment) => payment.customer.id === customer.id);
        const lastPayment = customerPayments[0] ?? null;
        const latestOrder = orders.find((order) => order.customer.id === customer.id) ?? null;

        return {
          ...customer,
          balance,
          paymentCount: customerPayments.length,
          lastPayment,
          latestOrder,
        };
      })
      .filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
          filterMode === "all"
            ? true
            : filterMode === "owing"
              ? customer.balance > 0
              : customer.balance <= 0;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
  }, [customers, balances, payments, orders, search, filterMode]);

  const summaryCards = useMemo(() => {
    const owingCount = balances.filter((balance) => balance.balance > 0).length;
    const settledCount = balances.filter((balance) => balance.balance <= 0).length;
    const totalDue = balances.reduce((sum, balance) => sum + Math.max(balance.balance, 0), 0);
    return { owingCount, settledCount, totalDue };
  }, [balances]);

  useEffect(() => {
    if (loading || !token || !user || user.role !== "SHOP_OWNER") {
      console.log("Skipping fetchData:", { loading, hasToken: !!token, hasUser: !!user, isShopOwner: user?.role === "SHOP_OWNER" });
      return;
    }
    console.log("Calling fetchData...");
    void fetchData();
  }, [loading, token, user?.id]);

  // Debounced server-side customer search: when `search` changes, fetch filtered customer balances
  useEffect(() => {
    if (loading || !token || !user || user.role !== "SHOP_OWNER") return;

    const q = search.trim();
    const timer = setTimeout(async () => {
      try {
        if (!q) {
          // empty search -> restore full dashboard data
          await fetchData();
          return;
        }

        const resp = await api<{ balances: BalanceRecord[] }>(`/api/customers?q=${encodeURIComponent(q)}`, { token: token ?? undefined });
        if (resp && Array.isArray((resp as any).balances)) {
          setBalances((resp as any).balances);
        }
      } catch (err) {
        console.error("Customer search error:", err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, token, loading, user?.id]);

  useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [customerId, customers]);

  if (!loading && (!user || user.role !== "SHOP_OWNER")) {
    return <div className="page-frame py-20 text-center">Please login as a shop owner to access this page.</div>;
  }

  async function fetchData() {
    setFetching(true);
    setError("");
    try {
       console.log("Fetching payments and orders...");
      const [paymentsData, ordersData] = await Promise.all([
        api<PaymentsResponse>("/api/payments", { token: token ?? undefined }),
        api<{ orders: OrderRecord[] }>("/api/orders", { token: token ?? undefined }),
      ]);
       console.log("Fetch successful:", { paymentsData, ordersData });
      setPayments(paymentsData.payments);
      setBalances(paymentsData.balances || []);
      setOrders(ordersData.orders || []);
    } catch (err) {
       const errMsg = err instanceof Error ? err.message : String(err);
       console.error("Fetch error:", errMsg);
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
        customerId,
        amount: parseFloat(amount),
        method,
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
        <div className="hero-panel mb-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-3">
            <span className="section-kicker">Customer management</span>
            <h1 className="page-title">Customers, balances, and dues</h1>
            <p className="page-subtitle">Track who owes money, settle dues, and record payments from a single ledger.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="metric-card">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Customers owing</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{summaryCards.owingCount}</div>
            </Card>
            <Card className="metric-card">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Settled</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{summaryCards.settledCount}</div>
            </Card>
            <Card className="metric-card">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total due</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">₹{summaryCards.totalDue.toFixed(2)}</div>
            </Card>
          </div>
        </div>

        {fetching && <div className="mb-4 text-sm text-slate-500">Loading payment dashboard...</div>}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-white/70 bg-white/75 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl">
            <CardHeader className="space-y-3">
              <CardTitle className="text-lg text-slate-950">Customer Directory</CardTitle>
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search customers..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "All"],
                    ["owing", "Owing"],
                    ["settled", "Settled"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilterMode(value as FilterMode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        filterMode === value
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                          : "border border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:bg-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customerDirectory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300/70 bg-white/50 p-6 text-sm text-slate-500">
                  No customers match the current filter.
                </div>
              ) : (
                customerDirectory.map((customer) => {
                  const active = customer.id === customerId;
                  const due = customer.balance > 0;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setCustomerId(customer.id)}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
                        active
                          ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.5)]"
                          : "border-slate-200/80 bg-white/80 hover:-translate-y-0.5 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-950">{customer.name}</div>
                          <div className="mt-1 text-sm text-slate-500">{customer.paymentCount} payments recorded</div>
                        </div>
                        <Badge variant={due ? "destructive" : "secondary"} className={due ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}>
                          {due ? "Owes" : "Settled"}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-950 px-3 py-3 text-white">
                          <div className="text-xs uppercase tracking-[0.16em] text-white/60">Balance</div>
                          <div className="mt-1 text-lg font-semibold">₹{customer.balance.toFixed(2)}</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Last payment</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {customer.lastPayment ? `₹${customer.lastPayment.amount}` : "No payments"}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest order</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {customer.latestOrder ? `₹${customer.latestOrder.totalAmount}` : "No orders"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/70 bg-white/75 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg text-slate-950">Record payment</CardTitle>
                <p className="text-sm text-slate-500">Log cash, online, or udhaar and keep the balance updated.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <select
                      id="customer"
                      className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 shadow-sm outline-none"
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value);
                        setOrderId("");
                      }}
                      required
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="method">Method</Label>
                      <select id="method" className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 shadow-sm outline-none" value={method} onChange={(e) => setMethod(e.target.value as "CASH" | "ONLINE" | "UDHAAR") }>
                        <option value="CASH">Cash</option>
                        <option value="ONLINE">Online</option>
                        <option value="UDHAAR">Udhaar (credit)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Order (optional)</Label>
                    <select id="order" className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 shadow-sm outline-none" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                      <option value="">No order mapping</option>
                      {customerOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.id.slice(0, 8)} | ₹{order.totalAmount} | {order.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note (optional)</Label>
                    <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Current customer balance: <span className={`font-semibold ${selectedBalance > 0 ? "text-amber-700" : "text-emerald-700"}`}>₹{selectedBalance.toFixed(2)}</span>
                  </div>
                  {method === "UDHAAR" && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      This will increase the selected customer&apos;s dues.
                    </div>
                  )}
                  <Button type="submit" disabled={saving} className="w-full">{saving ? "Saving..." : "Record Payment"}</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/75 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg text-slate-950">Payment History</CardTitle>
                <p className="text-sm text-slate-500">Recent activity for the selected customer set.</p>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.slice(0, 8).map((p) => (
                      <div key={p.id} className="rounded-[1.25rem] border border-slate-200/80 bg-white/85 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">{p.customer.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{new Date(p.createdAt).toLocaleString("en-IN")}</div>
                          </div>
                          <Badge variant={p.method === "UDHAAR" ? "destructive" : "secondary"} className={p.method === "UDHAAR" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}>
                            {p.method}
                          </Badge>
                        </div>
                        <div className="mt-3 text-sm text-slate-700">
                          ₹{p.amount}
                          {p.order ? ` · Order ${p.order.id.slice(0, 8)}` : ""}
                        </div>
                        {p.note && <div className="mt-2 text-xs text-slate-500">Note: {p.note}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
