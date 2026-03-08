import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur border-b">
        <span className="text-xl font-bold text-green-700">🏪 MyDukandar</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Register
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
          Your Neighbourhood Dukan,<br />
          <span className="text-green-600">Now Digital</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-10">
          MyDukandar connects local shops with customers. Browse products from your favourite kirana stores, place orders, and pick them up — hassle free.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3 text-lg font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-semibold text-green-700 border-2 border-green-300 rounded-xl hover:bg-green-50"
          >
            Login
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold text-lg mb-2">Find Shops</h3>
            <p className="text-sm text-gray-500">Search for local shops by name or city and browse their products.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="font-semibold text-lg mb-2">Place Orders</h3>
            <p className="text-sm text-gray-500">Add items to your cart and place orders directly with the shop.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-semibold text-lg mb-2">Track & Pickup</h3>
            <p className="text-sm text-gray-500">Track your order status in real-time and pick up when ready.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
