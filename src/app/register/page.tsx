"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "SHOP_OWNER">("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({ email, password, name, phone: phone || undefined, role });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-frame flex min-h-screen items-center py-10">
      <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden overflow-hidden p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between text-slate-950">
            <div>
              <div className="section-kicker w-fit">Create your account</div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight">A better buying and selling experience starts here.</h1>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                Choose whether you&apos;re a customer or a shop owner, then get into a polished dashboard built for your role.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Customer", "Browse shops, place orders, track progress."],
                ["Shop owner", "Manage products, orders, and push alerts."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                  <div className="font-medium text-slate-950">{title}</div>
                  <div className="mt-1 text-sm text-slate-600">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <Card className="border-white/70 bg-white/80 shadow-none backdrop-blur-xl">
              <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">MyDukandar</CardTitle>
                <CardDescription className="text-slate-500">Create your account in under a minute</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["CUSTOMER", "Customer", "🛒"],
                        ["SHOP_OWNER", "Shop Owner", "🏪"],
                      ].map(([value, label, icon]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value as "CUSTOMER" | "SHOP_OWNER")}
                          className={`rounded-2xl border p-4 text-center transition-all duration-200 ${
                            role === value
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
                              : "border-slate-200 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
                          }`}
                        >
                          <div className="mb-1 text-2xl">{icon}</div>
                          <div className="text-sm font-semibold">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
                <div className="mt-5 text-center text-sm text-slate-600">
                  Already have an account? <Link href="/login" className="font-semibold text-emerald-700 hover:underline">Login here</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
