import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  Eye,
  Clock,
  CheckCircle2,
  Zap,
  X,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Package,
  Truck,
  FileText,
  ChevronRight,
  Save,
  Trash2,
} from "lucide-react";
import { formatLKR, formatRupees } from "@/lib/format";
import {
  mockOrders,
  StatusBadge,
  type MockOrder,
  type OrderStatus,
} from "@/components/admin/shared";
import { deletePastOrderApi, fetchOrdersApi, updateOrderStatusApi } from "@/services/api";
import { syncCatalogWithBackend } from "@/services/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

// Ã¢â€â‚¬Ã¢â€â‚¬ Order Detail Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const STATUS_OPTIONS: OrderStatus[] = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Quotation Requested",
  "Quotation Sent",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  Processing: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  Shipped: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  Delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
  "Quotation Requested": "bg-purple-500/20 text-purple-400 border-purple-500/40",
  "Quotation Sent": "bg-sky-500/20 text-sky-400 border-sky-500/40",
};

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onDelete,
}: {
  order: MockOrder;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: OrderStatus,
  ) => Promise<{ updated: boolean; emailSent: boolean; emailReason?: string }>;
  onDelete: (order: MockOrder) => Promise<void>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await onStatusChange(order.id, selectedStatus);
    setSaving(false);

    if (!result.updated) {
      toast.error("Could not update the order status. Please try again.");
      return;
    }

    toast.success(
      result.emailSent
        ? `Order ${order.id} updated and customer email sent.`
        : `Order ${order.id} status updated to "${selectedStatus}".`,
    );
    if (!result.emailSent) {
      toast.info(result.emailReason || "Customer email was not sent.");
    }
    onClose();
  };

  const subtotal = order.lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const deliveryFee = order.total > subtotal ? order.total - subtotal : 0;
  const isPastOrder = order.status === "Delivered" || order.status === "Cancelled";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: "oklch(0.12 0.004 270)",
          border: "1px solid oklch(0.22 0.004 270)",
          fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{
            background: "oklch(0.12 0.004 270)",
            borderColor: "oklch(0.22 0.004 270)",
          }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-orange-400 text-sm">{order.id}</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-xs text-zinc-400 font-semibold">Order Details</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Placed on {order.date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Status Changer Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: "oklch(0.15 0.004 270)",
              border: "1px solid oklch(0.25 0.004 270)",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Order Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedStatus === s
                      ? STATUS_COLORS[s]
                      : "bg-zinc-800/60 text-zinc-500 border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {selectedStatus !== order.status && (
              <p className="text-[11px] text-orange-400 font-semibold">
                Status will change from <strong>{order.status}</strong> Ã¢â€ â€™{" "}
                <strong>{selectedStatus}</strong>
              </p>
            )}
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Customer Details Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: "oklch(0.15 0.004 270)",
              border: "1px solid oklch(0.25 0.004 270)",
            }}
          >
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Customer Information
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-sm font-black text-white shrink-0">
                {order.customer.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{order.customer}</p>
                <p className="text-[10px] text-zinc-400">
                  {order.items} item{order.items > 1 ? "s" : ""} ordered
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <InfoRow
                icon={<Mail className="h-3.5 w-3.5 text-orange-400" />}
                label="Email"
                value={order.email}
              />
              <InfoRow
                icon={<Phone className="h-3.5 w-3.5 text-orange-400" />}
                label="Phone"
                value={order.phone}
              />
              <InfoRow
                icon={<MapPin className="h-3.5 w-3.5 text-orange-400" />}
                label="Delivery Address"
                value={`${order.address}, ${order.city}, ${order.district}`}
                className="sm:col-span-2"
              />
              <InfoRow
                icon={<CreditCard className="h-3.5 w-3.5 text-orange-400" />}
                label="Payment Method"
                value={order.paymentMethod}
              />
              {order.trackingNumber && (
                <InfoRow
                  icon={<Truck className="h-3.5 w-3.5 text-blue-400" />}
                  label="Tracking Number"
                  value={order.trackingNumber}
                />
              )}
            </div>
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Order Line Items Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid oklch(0.25 0.004 270)" }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{
                background: "oklch(0.15 0.004 270)",
                borderBottom: "1px solid oklch(0.22 0.004 270)",
              }}
            >
              <Package className="h-3.5 w-3.5 text-orange-400" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">Order Items</p>
            </div>
            <div style={{ background: "oklch(0.13 0.004 270)" }}>
              {order.lineItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 text-xs"
                  style={{
                    borderBottom:
                      i < order.lineItems.length - 1 ? "1px solid oklch(0.20 0.004 270)" : "none",
                  }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="h-6 w-6 rounded flex items-center justify-center shrink-0 text-[10px] font-black text-orange-400"
                      style={{
                        background: "oklch(0.18 0.004 270)",
                        border: "1px solid oklch(0.25 0.004 270)",
                      }}
                    >
                      {item.qty}Ãƒâ€”
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold text-white">
                      {formatRupees(item.qty * item.unitPrice)}
                    </p>
                    <p className="text-[10px] text-zinc-500">{formatRupees(item.unitPrice)} each</p>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div
                className="px-4 py-3 space-y-1.5 text-xs"
                style={{
                  borderTop: "1px solid oklch(0.22 0.004 270)",
                  background: "oklch(0.14 0.004 270)",
                }}
              >
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatRupees(subtotal)}</span>
                </div>
                {deliveryFee > 0 ? (
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery fee</span>
                    <span>{formatRupees(deliveryFee)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-zinc-500">
                    <span>Delivery fee</span>
                    <span>Included / Free</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-black text-white text-sm pt-1.5"
                  style={{ borderTop: "1px solid oklch(0.25 0.004 270)" }}
                >
                  <span>Total</span>
                  <span
                    className={
                      order.status === "Cancelled"
                        ? "text-zinc-500 line-through"
                        : "text-orange-400"
                    }
                  >
                    {formatRupees(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Notes Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {order.notes && (
            <div
              className="rounded-xl p-4 flex gap-3"
              style={{
                background: "oklch(0.58 0.235 22 / 8%)",
                border: "1px solid oklch(0.58 0.235 22 / 25%)",
              }}
            >
              <FileText className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-orange-400 mb-1">Customer Note</p>
                <p className="text-xs text-zinc-300">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t"
          style={{
            background: "oklch(0.12 0.004 270)",
            borderColor: "oklch(0.22 0.004 270)",
          }}
        >
          <button onClick={onClose} className="admin-btn-ghost text-xs">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {isPastOrder && (
              <button
                onClick={() => void onDelete(order)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete order
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || selectedStatus === order.status}
              className="admin-btn-primary text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Update Status
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 text-xs ${className}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-zinc-200 font-medium">{value}</p>
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Main Orders Page Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const sidebarFilter = useRouterState({ select: (state) => (state.location.search as { filter?: string }).filter });
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);
  const [selectedPastOrderIds, setSelectedPastOrderIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

  useEffect(() => {
    const filters = ["Active", "Processing", "Shipped", "Past Orders"];
    if (sidebarFilter && filters.includes(sidebarFilter)) setStatusFilter(sidebarFilter);
  }, [sidebarFilter]);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const liveOrders = await fetchOrdersApi();
      if (liveOrders) {
        const mapped: MockOrder[] = liveOrders.map((o) => {
          // Parse items safely (Supabase returns JSONB as parsed JS array already)
          const items = Array.isArray(o.items) ? o.items : [];
          const itemCount = items.reduce((s, it) => s + (Number(it.qty) || 1), 0);
          const productSummary =
            items.length > 0
              ? items.map((it) => `${it.qty > 1 ? `${it.qty}Ãƒâ€” ` : ""}${it.name}`).join(", ")
              : "Ã¢â‚¬â€";

          return {
            id: o.id,
            customer: o.customerName,
            email: o.email || "Ã¢â‚¬â€",
            phone: o.phone || "Ã¢â‚¬â€",
            product: productSummary,
            items: itemCount,
            total: Number(o.totalLKR) || 0,
            status: (o.status as MockOrder["status"]) || "Processing",
            date: new Date(o.createdAt).toLocaleDateString("en-GB"),
            paymentMethod: "Direct / WhatsApp",
            address: o.address || "Ã¢â‚¬â€",
            city: o.city || "Ã¢â‚¬â€",
            district: o.city || "Ã¢â‚¬â€", // DB has no separate district; use city
            notes: o.notes || undefined,
            lineItems: items.map((it) => ({
              name: it.name || "Unknown Item",
              sku: it.sku || "Ã¢â‚¬â€",
              qty: Number(it.qty) || 1,
              unitPrice: Number(it.priceLKR) || 0,
            })),
          };
        });
        setOrders(mapped);
      }
      setLoading(false);
    }
    void loadOrders();
  }, []);

  const stats = useMemo(() => {
    // Only non-cancelled orders count towards actual Total Sales revenue
    const validOrders = orders.filter((o) => o.status !== "Cancelled");
    const total = validOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const processing = orders.filter(
      (o) =>
        o.status === "Processing" ||
        o.status === "Quotation Requested" ||
        o.status === "Quotation Sent",
    ).length;
    const shipped = orders.filter((o) => o.status === "Shipped").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    return {
      total,
      processing,
      shipped,
      delivered,
      cancelled,
      validSalesCount: validOrders.length,
      totalOrders: orders.length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.product.toLowerCase().includes(search.toLowerCase());
      const isPastOrder = o.status === "Delivered" || o.status === "Cancelled";
      const matchStatus =
        (statusFilter === "Active" && !isPastOrder) ||
        (statusFilter === "Past Orders" && isPastOrder) ||
        o.status === statusFilter ||
        (statusFilter === "Processing" &&
          (o.status === "Quotation Requested" || o.status === "Quotation Sent"));
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, orders]);

  const visiblePastOrders = filteredOrders.filter((order) => order.status === "Delivered" || order.status === "Cancelled");
  const allVisiblePastOrdersSelected = visiblePastOrders.length > 0 && visiblePastOrders.every((order) => selectedPastOrderIds.has(order.id));
  const togglePastOrderSelection = (id: string) => setSelectedPastOrderIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAllVisiblePastOrders = () => setSelectedPastOrderIds((current) => { const next = new Set(current); if (allVisiblePastOrdersSelected) visiblePastOrders.forEach((order) => next.delete(order.id)); else visiblePastOrders.forEach((order) => next.add(order.id)); return next; });

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    const result = await updateOrderStatusApi(id, status);
    if (!result?.order) {
      return { updated: false, emailSent: false };
    }

    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    setSelectedOrder((current) => (current?.id === id ? { ...current, status } : current));

    // When status changes to Shipped or Cancelled, re-sync catalog so inventory changes update immediately
    if (status === "Shipped" || status === "Cancelled") {
      void syncCatalogWithBackend();
    }

    return { updated: true, emailSent: result.emailSent, emailReason: result.emailReason };
  };
  const handleDeletePastOrder = async (order: MockOrder) => {
    const confirmed = window.confirm(
      `Permanently delete ${order.id}? This cannot be undone and will remove the customer order details.`,
    );
    if (!confirmed) return;

    const result = await deletePastOrderApi(order.id);
    if (!result.success) {
      toast.error(result.error || "Could not delete the order. Please try again.");
      return;
    }

    setOrders((previous) => previous.filter((item) => item.id !== order.id));
    setSelectedOrder(null);
    toast.success(`Order ${order.id} deleted permanently.`);
  };
  const handleDeleteSelectedPastOrders = async () => { const ids = Array.from(selectedPastOrderIds); if (!ids.length || !window.confirm(`Permanently delete ${ids.length} selected past orders? This cannot be undone.`)) return; setDeletingSelected(true); const results = await Promise.all(ids.map((id) => deletePastOrderApi(id))); const deleted = new Set(ids.filter((_, i) => results[i]?.success)); if (deleted.size) { setOrders((current) => current.filter((order) => !deleted.has(order.id))); setSelectedPastOrderIds(new Set()); toast.success(`${deleted.size} orders deleted permanently.`); } if (deleted.size !== ids.length) toast.error("Some orders could not be deleted."); setDeletingSelected(false); };
  return (
    <>
      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDeletePastOrder}
        />
      )}

      <div className="space-y-6">
        {/* Top summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="admin-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Total Sales
              </p>
              <CreditCard className="h-4 w-4 text-orange-400" />
            </div>
            <p className="text-xl font-black text-white mt-1">{formatRupees(stats.total)}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {stats.validSalesCount} {stats.validSalesCount === 1 ? "order" : "orders"}
              {stats.cancelled > 0 ? ` (${stats.cancelled} cancelled excluded)` : " total"}
            </p>
          </div>
          <div className="admin-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-amber-500/80 uppercase tracking-wider">
                Processing
              </p>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-xl font-black text-amber-400 mt-1">{stats.processing}</p>
            <p className="text-xs text-zinc-400 mt-1">Needs fulfillment</p>
          </div>
          <div className="admin-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-blue-500/80 uppercase tracking-wider">
                In Transit
              </p>
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-xl font-black text-blue-400 mt-1">{stats.shipped}</p>
            <p className="text-xs text-zinc-400 mt-1">Shipped to customer</p>
          </div>
          <div className="admin-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-500/80 uppercase tracking-wider">
                Completed
              </p>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-emerald-400 mt-1">{stats.delivered}</p>
            <p className="text-xs text-zinc-400 mt-1">Successfully delivered</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="admin-card space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order ID, customer or item..."
                className="admin-input pl-8 w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              {[
                { id: "Active", label: "Active", count: stats.processing + stats.shipped },
                { id: "Processing", label: "Processing", count: stats.processing },
                { id: "Shipped", label: "Shipped", count: stats.shipped },
                {
                  id: "Past Orders",
                  label: "Past Orders",
                  count: stats.delivered + stats.cancelled,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                      : "bg-zinc-800/60 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      statusFilter === tab.id
                        ? "bg-orange-500/30 text-orange-300 font-bold"
                        : "bg-zinc-700/60 text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}

              {selectedPastOrderIds.size > 0 && <button type="button" onClick={() => void handleDeleteSelectedPastOrders()} disabled={deletingSelected} className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300"><Trash2 className="h-3.5 w-3.5" />{deletingSelected ? "Deleting..." : `Delete selected (${selectedPastOrderIds.size})`}</button>}

              <button className="admin-btn-ghost flex items-center gap-1.5 ml-auto sm:ml-2 shrink-0">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3 w-10"><input type="checkbox" checked={allVisiblePastOrdersSelected} onChange={toggleAllVisiblePastOrders} disabled={visiblePastOrders.length === 0 || deletingSelected} aria-label="Select all visible past orders" className="accent-orange-500" /></th>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Items / Product</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        <span>Loading live orders from Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-500">
                      No orders found in database. Customer orders will appear here in real-time.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3">{(o.status === "Delivered" || o.status === "Cancelled") && <input type="checkbox" checked={selectedPastOrderIds.has(o.id)} onChange={() => togglePastOrderSelection(o.id)} disabled={deletingSelected} aria-label={`Select order ${o.id}`} className="accent-orange-500" />}</td>
                      <td className="p-3 font-mono font-bold text-orange-400">{o.id}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-300">
                            {o.customer.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{o.customer}</p>
                            <p className="text-[10px] text-zinc-500">{o.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-zinc-400">{o.date}</td>
                      <td className="p-3 max-w-[320px]">
                        {o.lineItems && o.lineItems.length > 0 ? (
                          <div className="space-y-1">
                            {o.lineItems.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 shrink-0 leading-none">
                                  {item.qty}Ãƒâ€”
                                </span>
                                <span
                                  className="text-zinc-200 text-xs font-semibold truncate max-w-[180px]"
                                  title={item.name}
                                >
                                  {item.name}
                                </span>
                                {item.sku && item.sku !== "Ã¢â‚¬â€" && (
                                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-800/80 px-1 py-0.5 rounded shrink-0">
                                    {item.sku}
                                  </span>
                                )}
                              </div>
                            ))}
                            {o.lineItems.length > 2 && (
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold hover:underline block"
                              >
                                +{o.lineItems.length - 2} more item
                                {o.lineItems.length - 2 > 1 ? "s" : ""}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-1.5">
                            <span className="shrink-0 mt-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 leading-none">
                              {o.items}
                            </span>
                            <span className="text-zinc-300 text-xs leading-tight line-clamp-2">
                              {o.product}
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        className={`p-3 font-bold ${o.status === "Cancelled" ? "text-zinc-500 line-through" : "text-white"}`}
                      >
                        {formatRupees(o.total)}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 text-zinc-400 hover:text-orange-400 rounded hover:bg-orange-500/10 transition-colors"
                          title="View order details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {(o.status === "Delivered" || o.status === "Cancelled") && (
                          <button
                            onClick={() => void handleDeletePastOrder(o)}
                            className="ml-1 p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                            title="Delete past order permanently"
                            aria-label={`Delete order ${o.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
