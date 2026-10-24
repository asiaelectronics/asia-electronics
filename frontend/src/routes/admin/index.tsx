import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { useCatalog } from "@/services/catalog";
import { formatLKR, formatRupees } from "@/lib/format";
import { StatusBadge } from "@/components/admin/shared";
import { fetchOrdersApi, type ApiOrder } from "@/services/api";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Overview — Admin" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const { products, categories } = useCatalog();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingOrders(true);
      const data = await fetchOrdersApi();
      if (data) setOrders(data);
      setLoadingOrders(false);
    }
    void load();
  }, []);

  const validOrders = orders.filter((o) => o.status !== "Cancelled");
  const totalRevenueLKR = validOrders.reduce((a, o) => a + (Number(o.totalLKR) || 0), 0);

  const processingOrders = orders.filter(
    (o) =>
      o.status === "Processing" ||
      o.status === "Quotation Requested" ||
      o.status === "Quotation Sent",
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled").length;

  const kpis = [
    {
      label: "Total Revenue",
      value: formatRupees(totalRevenueLKR),
      sub: `${deliveredOrders} delivered (${validOrders.length} valid sales)`,
      icon: <DollarSign className="h-5 w-5" />,
      color: "from-orange-500 to-pink-600",
    },
    {
      label: "Total Orders",
      value: String(orders.length),
      sub: `${processingOrders} processing · ${cancelledOrders} cancelled`,
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "from-violet-500 to-indigo-600",
    },
    {
      label: "Active Products in DB",
      value: String(products.length),
      sub: `${categories.length} categories active`,
      icon: <Package className="h-5 w-5" />,
      color: "from-cyan-500 to-blue-600",
    },
    {
      label: "Product Categories",
      value: String(categories.length),
      sub: `${products.length} products cataloged`,
      icon: <Layers className="h-5 w-5" />,
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="admin-card group relative overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${k.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {k.label}
                </p>
                <p className="mt-1.5 text-2xl font-black text-white tracking-tight">{k.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${k.color} shadow-lg`}>
                <span className="text-white">{k.icon}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="admin-card w-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-violet-400" /> Recent Orders in Database
          </h3>
          <Link
            to="/admin/orders"
            className="text-[11px] text-violet-400 font-semibold hover:text-violet-300"
          >
            View all orders ({orders.length}) →
          </Link>
        </div>

        {loadingOrders ? (
          <div className="py-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <span>Loading live orders from Supabase...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-zinc-800 rounded-xl">
            <ShoppingBag className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-semibold text-zinc-300">No Orders in Database Yet</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Customer purchases and inquiries will appear here in real-time as they are placed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 8).map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 py-2 border-b border-zinc-800/60 last:border-0"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center text-[10px] font-black text-violet-400 shrink-0">
                  {o.customerName?.charAt(0) || "C"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{o.customerName}</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {o.items?.map((it) => it.name).join(", ") || "Order items"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-white">
                    {formatLKR((o.totalLKR || 0) * 100)}
                  </p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
