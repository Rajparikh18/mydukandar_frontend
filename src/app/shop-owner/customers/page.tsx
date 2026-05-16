"use client";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  totalOrders: number;
  totalDues: number;
  connectedAt: string;
}

export default function ShopOwnerCustomersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SHOP_OWNER") {
      router.push("/login");
      return;
    }
    fetchCustomers();
  }, [user, loading]);

  async function fetchCustomers() {
    try {
      const data = await api<{ balances: any[] }>("/api/customers", { token: token! });
      const mapped = (data.balances || []).map((conn) => ({
        id: conn.customer.id,
        name: conn.customer.name,
        phone: conn.customer.phone,
        email: "",
        totalOrders: conn.customer._count?.orders || 0,
        totalDues: conn.balance,
        connectedAt: conn.createdAt,
      }));
      setCustomers(mapped);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
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
          <span className="section-kicker">Customer directory</span>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">View your customers, their order history, and track their total dues.</p>
        </div>

        {fetching ? (
          <div className="hero-panel py-16 text-center text-slate-500">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="hero-panel py-16 text-center text-slate-500">No customers found</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/shop-owner/customers/${customer.id}`}>
                <Card className="h-full border-white/70 bg-white/75 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-emerald-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-950 truncate" title={customer.name}>{customer.name}</CardTitle>
                    <p className="text-xs text-slate-500">{customer.phone || customer.email}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Total Orders</div>
                        <div className="text-sm font-semibold text-slate-900">{customer.totalOrders}</div>
                      </div>
                      <div className={`flex items-center justify-between rounded-xl p-3 ${customer.totalDues > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        <div className="text-xs font-medium text-slate-500">Total Dues</div>
                        <div className={`text-sm font-semibold ${customer.totalDues > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          ₹{customer.totalDues}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
