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

interface OrderSummary {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer: { name: string; phone: string | null };
}

interface PaymentSummary {
  id: string;
  amount: number;
  method: "CASH" | "ONLINE" | "UDHAAR";
  createdAt: string;
  customer: { name: string };
  order: { id: string; totalAmount: number } | null;
}

interface BalanceSummary {
  customerId: string;
  balance: number;
  customer: { id: string; name: string; phone: string | null };
}

export default function ShopOwnerDashboard() {
  const { user, shop, token, loading } = useAuth();
  const router = useRouter();
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentSummary[]>([]);
  const [balances, setBalances] = useState<BalanceSummary[]>([]);
  const [customerConnections, setCustomerConnections] = useState<BalanceSummary[]>([]);
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
      const [shopData, ordersData, paymentsData] = await Promise.all([
        api<{ shop: ShopDetails }>(`/api/shops/${shop!.id}`, { token: token! }),
        api<{ orders: OrderSummary[] }>("/api/orders", { token: token! }),
        api<{ payments: PaymentSummary[]; balances: BalanceSummary[] }>("/api/payments", { token: token! }),
      ]);
      const customersData = await api<{ balances: BalanceSummary[] }>("/api/customers", { token: token! });

      setShopDetails(shopData.shop);
      setRecentOrders(
        ordersData.orders.filter((order) => ["PENDING", "ACCEPTED", "PACKING", "READY"].includes(order.status)).slice(0, 4)
      );
      setRecentPayments(paymentsData.payments.slice(0, 4));
      setCustomerConnections(customersData.balances);
      setBalances(paymentsData.balances.filter((balance) => balance.balance > 0).slice(0, 4));
    } catch (err) {
      console.error("Failed to fetch shop details:", err);
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <span className="section-kicker">Shop owner workspace</span>
            <h1 className="page-title">Welcome, {user?.name}!</h1>
            <p className="page-subtitle">{shop?.name} · manage orders, products, and customer connections from a refined dashboard.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <div className="font-semibold text-slate-950">Connected shop</div>
            <div>{shop?.name}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-700">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950">{shopDetails?._count.products || 0}</p>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950">{shopDetails?._count.orders || 0}</p>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950">{recentOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-violet-700">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950">{shopDetails?._count.customers || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Names listed below</p>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-700">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950">{recentOrders.length}</p>
              <p className="mt-1 text-xs text-slate-500">Awaiting action now</p>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-rose-700">Customers Owing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950">{balances.length}</p>
              <p className="mt-1 text-xs text-slate-500">Need follow-up</p>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950">₹{recentPayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500">Recent receipts in view</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/shop-owner/orders">
            <Card className="cursor-pointer border-white/70 bg-white/75 transition-all duration-200 hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl">📦</div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">Manage Orders</p>
                  <p className="text-sm text-slate-500">View, accept, and advance customer orders</p>
                  {recentOrders.length > 0 && (
                    <p className="mt-1 text-sm font-medium text-orange-600">
                      {recentOrders.length} orders need attention
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/shop-owner/products">
            <Card className="cursor-pointer border-white/70 bg-white/75 transition-all duration-200 hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">🛒</div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">View Products</p>
                  <p className="text-sm text-slate-500">See and expand your catalog</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500">No active orders right now.</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{order.customer.name}</p>
                        <p className="text-xs text-slate-500">{order.customer.phone || "No phone"}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">₹{order.totalAmount}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{order.status}</span>
                      <span>{new Date(order.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Connected Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {customerConnections.length === 0 ? (
                <p className="text-sm text-slate-500">No customers are connected to this shop yet.</p>
              ) : (
                <div className="space-y-3">
                  {customerConnections.map((connection) => (
                    <div key={connection.customerId} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{connection.customer.name}</p>
                          <p className="text-xs text-slate-500">{connection.customer.phone || "No phone"}</p>
                        </div>
                        <span className={`text-sm font-semibold ${connection.balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                          ₹{connection.balance.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {connection.balance > 0 ? "Outstanding balance" : "Settled account"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Top Outstanding Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {balances.length === 0 ? (
                <p className="text-sm text-slate-500">No customers are owing money.</p>
              ) : (
                balances.map((balance) => (
                  <div key={balance.customerId} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{balance.customer.name}</p>
                        <p className="text-xs text-slate-500">{balance.customer.phone || "No phone"}</p>
                      </div>
                      <span className="text-sm font-semibold text-amber-700">₹{balance.balance.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPayments.length === 0 ? (
                <p className="text-sm text-slate-500">No payments recorded yet.</p>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{payment.customer.name}</p>
                        <p className="text-xs text-slate-500">{payment.method}{payment.order ? ` · Order ${payment.order.id.slice(0, 8)}` : ""}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-950">₹{payment.amount}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{new Date(payment.createdAt).toLocaleString("en-IN")}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link href="/shop-owner/orders" className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                <div className="text-sm font-semibold text-slate-950">Open orders queue</div>
                <div className="mt-1 text-xs text-slate-500">Process pending items and update status</div>
              </Link>
              <Link href="/shop-owner/payments" className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                <div className="text-sm font-semibold text-slate-950">Open customer ledger</div>
                <div className="mt-1 text-xs text-slate-500">Record cash, online, and udhaar</div>
              </Link>
              <Link href="/shop-owner/products" className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                <div className="text-sm font-semibold text-slate-950">Manage products</div>
                <div className="mt-1 text-xs text-slate-500">Edit inventory and availability</div>
              </Link>
              <Link href="/shop-owner/setup" className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                <div className="text-sm font-semibold text-slate-950">Update shop profile</div>
                <div className="mt-1 text-xs text-slate-500">Review address and contact details</div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Shop Info */}
        {shopDetails && (
          <Card className="metric-card mt-8">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Shop Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-950">Name:</strong> {shopDetails.name}</p>
              {shopDetails.description && <p><strong className="text-slate-950">Description:</strong> {shopDetails.description}</p>}
              <p><strong className="text-slate-950">Address:</strong> {shopDetails.address}, {shopDetails.city} - {shopDetails.pincode}</p>
              <p><strong className="text-slate-950">Phone:</strong> {shopDetails.phone}</p>
              <p><strong className="text-slate-950">Connected Customers:</strong> {shopDetails._count.customers}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
