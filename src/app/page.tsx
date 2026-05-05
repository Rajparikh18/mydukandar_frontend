import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen pb-16">
      <header className="page-frame pt-5">
        <div className="glass-panel flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-2xl shadow-lg shadow-emerald-500/20">
              🏪
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-950">MyDukandar</div>
              <div className="text-sm text-slate-500">Local shops, beautifully digital</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
              Login
            </Link>
            <Link href="/register" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="page-frame pt-10 sm:pt-14">
        <section className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <span className="section-kicker">Digital ordering for neighborhood shops</span>
            <div className="space-y-4">
              <h1 className="page-title max-w-3xl">
                Your neighbourhood dukan,
                <span className="block bg-gradient-to-r from-emerald-700 to-teal-500 bg-clip-text text-transparent">reimagined for modern ordering.</span>
              </h1>
              <p className="page-subtitle max-w-2xl">
                MyDukandar gives customers a clean way to browse local shops, place orders, and receive status updates while shopkeepers manage products, orders, and instant alerts from one place.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-16px_rgba(16,185,129,0.7)] transition hover:-translate-y-0.5">
                Start ordering
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
                Access account
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Search shops", "Find nearby shops by name or area."],
                ["Order fast", "Cart-based checkout with live order states."],
                ["Shopkeeper alerts", "Notifications for new orders on every device."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <div className="mb-2 text-sm font-semibold text-slate-950">{title}</div>
                  <div className="text-sm leading-6 text-slate-600">{text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel relative overflow-hidden">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">Today&apos;s activity</div>
                  <div className="text-2xl font-semibold text-slate-950">Connected commerce</div>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Live
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["3", "shops seeded"],
                  ["39", "products ready"],
                  ["Push", "notifications enabled"],
                ].map(([value, label]) => (
                  <div key={label} className="metric-card">
                    <div className="text-3xl font-semibold text-slate-950">{value}</div>
                    <div className="mt-1 text-sm text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-3">
                {[
                  ["Customer", "Browse shops, add products, place order."],
                  ["Shop owner", "Manage orders, products, and notifications."],
                  ["Status flow", "Pending → Accepted → Packing → Ready → Picked up."],
                ].map(([title, text]) => (
                  <div key={title} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm">
                    <div>
                      <div className="font-medium text-slate-950">{title}</div>
                      <div className="text-sm text-slate-500">{text}</div>
                    </div>
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
