"use client";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; unit: string };
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  createdAt: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  isPaid: boolean;
  paymentMode: string;
  deliveryMode: string;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
}

interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };
  balance: number;
  orders: Order[];
  payments: Payment[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PACKING: "bg-violet-100 text-violet-800",
  READY: "bg-emerald-100 text-emerald-800",
  PICKED_UP: "bg-slate-100 text-slate-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

export default function ShopOwnerCustomerDetailPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SHOP_OWNER") {
      router.push("/login");
      return;
    }
    fetchCustomerDetail();
  }, [user, loading]);

  async function fetchCustomerDetail() {
    try {
      const result = await api<CustomerDetail>(`/api/customers/${customerId}`, { token: token! });
      setData(result);
    } catch (err) {
      console.error("Failed to fetch customer detail:", err);
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!data) {
    return <div className="page-frame flex min-h-screen items-center justify-center text-slate-500">Customer not found</div>;
  }

  const { customer, balance, orders } = data;

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="page-frame py-8">
        <Link href="/shop-owner/customers">
          <Button variant="ghost" className="mb-4 pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent">
            ← Back to Customers
          </Button>
        </Link>
        
        <div className="hero-panel mb-8 flex flex-col gap-3">
          <span className="section-kicker">Customer Summary</span>
          <h1 className="page-title">{customer.name}</h1>
          <p className="page-subtitle">{customer.phone || customer.email}</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Orders</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{orders.length}</div>
            </CardContent>
          </Card>
          <Card className="metric-card bg-rose-50/50">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Dues</div>
              <div className="mt-2 text-3xl font-semibold text-rose-700">₹{balance}</div>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Value Ordered</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">
                ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-slate-900">Order History</h2>
        
        <div className="grid gap-4">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders found.</p>
          ) : (
            orders.map((order) => {
              const paidAmount = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              const duesRemaining = order.totalAmount - paidAmount;
              
              return (
                <Card key={order.id} className="border-white/70 bg-white/75 transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {new Date(order.createdAt).toLocaleString("en-IN")}
                          </span>
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                          <Badge variant={order.isPaid ? "secondary" : "destructive"} className={order.isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                            {order.paymentMode} {order.isPaid ? "(Paid)" : "(Unpaid)"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600 max-w-md">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity} x {item.product.name}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:w-64">
                        <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Order Total:</span>
                            <span className="font-medium text-slate-900">₹{order.totalAmount}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-slate-200/60 pt-1">
                            <span className="text-slate-500">Paid:</span>
                            <span className="font-medium text-emerald-600">₹{paidAmount}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-slate-200/60 pt-1">
                            <span className="font-medium text-slate-700">Dues Remaining:</span>
                            <span className={`font-bold ${duesRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              ₹{duesRemaining}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
