"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    totalRevenue: number;
    totalCollected: number;
    totalUdhaar: number;
    avgOrderValue: number;
  };
  revenueByDay: Record<string, number>;
  ordersByDay: Record<string, number>;
  revenueByCategory: Record<string, number>;
  paymentBreakdown: { CASH: number; ONLINE: number; UDHAAR: number };
  statusBreakdown: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  topCustomers: Array<{ name: string; orderCount: number; totalSpent: number }>;
}

const categoryLabels: Record<string, string> = {
  GROCERY: "🛒 Grocery",
  STATIONERY: "📝 Stationery",
  MEDICAL: "💊 Medical",
  HOUSEHOLD: "🏠 Household",
  OTHER: "📦 Other",
};

export default function AnalyticsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SHOP_OWNER") {
      router.push("/login");
      return;
    }
    fetchAnalytics();
  }, [user, loading]);

  async function fetchAnalytics() {
    try {
      const result = await api<AnalyticsData>("/api/analytics", { token: token! });
      setData(result);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">No data available</div>;
  }

  const { summary, revenueByCategory, paymentBreakdown, topProducts, topCustomers, statusBreakdown, revenueByDay } = data;

  // Build bar chart for revenue by day (last 7 entries)
  const dayEntries = Object.entries(revenueByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-7);
  const maxRevenue = Math.max(...dayEntries.map(([, v]) => v), 1);

  // Category revenue for bar chart
  const categoryEntries = Object.entries(revenueByCategory).sort(([, a], [, b]) => b - a);
  const maxCatRevenue = Math.max(...categoryEntries.map(([, v]) => v), 1);

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <div className="hero-panel mb-8 flex flex-col gap-3">
          <span className="section-kicker">Business intelligence</span>
          <h1 className="page-title">Sales Analytics</h1>
          <p className="page-subtitle">A comprehensive view of your shop's performance, revenue, and customer trends.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Total Revenue", value: `₹${summary.totalRevenue.toFixed(0)}`, icon: "💰", color: "text-emerald-700" },
            { label: "Total Orders", value: summary.totalOrders, icon: "📦", color: "text-blue-700" },
            { label: "Avg Order Value", value: `₹${summary.avgOrderValue.toFixed(0)}`, icon: "📊", color: "text-violet-700" },
            { label: "Active Orders", value: summary.activeOrders, icon: "🔥", color: "text-orange-700" },
            { label: "Completed", value: summary.completedOrders, icon: "✅", color: "text-emerald-700" },
            { label: "Cancelled", value: summary.cancelledOrders, icon: "❌", color: "text-rose-700" },
            { label: "Cash + Online", value: `₹${summary.totalCollected.toFixed(0)}`, icon: "💳", color: "text-teal-700" },
            { label: "Udhaar Given", value: `₹${summary.totalUdhaar.toFixed(0)}`, icon: "📋", color: "text-amber-700" },
          ].map((item) => (
            <Card key={item.label} className="metric-card">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                <div className="text-lg">{item.icon}</div>
              </div>
              <div className={`mt-2 text-3xl font-semibold ${item.color}`}>{item.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Revenue by Day Chart */}
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">📈 Revenue Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {dayEntries.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {dayEntries.map(([day, amount]) => {
                    const pct = (amount / maxRevenue) * 100;
                    const label = new Date(day).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <div className="w-16 text-xs font-medium text-slate-500">{label}</div>
                        <div className="flex-1 h-8 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                        <div className="w-20 text-right text-sm font-semibold text-slate-700">₹{amount.toFixed(0)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Category */}
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">📂 Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryEntries.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {categoryEntries.map(([cat, amount]) => {
                    const pct = (amount / maxCatRevenue) * 100;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-28 text-xs font-medium text-slate-600">{categoryLabels[cat] || cat}</div>
                        <div className="flex-1 h-8 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-500"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                        <div className="w-20 text-right text-sm font-semibold text-slate-700">₹{amount.toFixed(0)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">💳 Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Cash", value: paymentBreakdown.CASH, color: "bg-emerald-500", icon: "💵" },
                  { label: "Online", value: paymentBreakdown.ONLINE, color: "bg-blue-500", icon: "📱" },
                  { label: "Udhaar", value: paymentBreakdown.UDHAAR, color: "bg-amber-500", icon: "📋" },
                ].map((method) => {
                  const total = paymentBreakdown.CASH + paymentBreakdown.ONLINE + paymentBreakdown.UDHAAR;
                  const pct = total > 0 ? (method.value / total) * 100 : 0;
                  return (
                    <div key={method.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{method.icon} {method.label}</span>
                        <span className="text-slate-500">₹{method.value.toFixed(0)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${method.color} transition-all duration-500`} style={{ width: `${Math.max(pct, 1)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Breakdown */}
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">📊 Order Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(statusBreakdown).map(([status, count]) => {
                  const statusLabels: Record<string, string> = {
                    PENDING: "⏳ Pending",
                    ACCEPTED: "✅ Accepted",
                    PACKING: "📦 Packing",
                    READY: "🎉 Ready",
                    PICKED_UP: "✔️ Picked Up",
                    CANCELLED: "❌ Cancelled",
                  };
                  return (
                    <div key={status} className="rounded-2xl border border-slate-200/80 bg-white/85 p-3 text-center">
                      <div className="text-2xl font-bold text-slate-950">{count}</div>
                      <div className="mt-1 text-xs text-slate-500">{statusLabels[status] || status}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">🏆 Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-500">No sales data yet</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/85 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 text-xs font-bold text-white">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-950">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.quantity} units sold</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">₹{product.revenue.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="border-white/70 bg-white/75">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">👥 Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-slate-500">No customer data yet</p>
              ) : (
                <div className="space-y-2">
                  {topCustomers.map((customer, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/85 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-bold text-white">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-950">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.orderCount} orders</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-blue-700">₹{customer.totalSpent.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
