"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role === "CUSTOMER") {
      router.push("/customer");
    } else {
      router.push("/shop-owner");
    }
  }, [user, loading, router]);

  return (
    <div className="page-frame flex min-h-screen items-center justify-center py-16">
      <div className="hero-panel flex flex-col items-center gap-4 px-8 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-2xl shadow-lg shadow-emerald-500/20">
          🏪
        </div>
        <div>
          <div className="text-xl font-semibold text-slate-950">Loading your workspace</div>
          <div className="mt-1 text-sm text-slate-500">Redirecting you to the right dashboard...</div>
        </div>
      </div>
    </div>
  );
}
