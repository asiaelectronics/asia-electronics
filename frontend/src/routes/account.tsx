import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { formatRupees } from "@/lib/format";
import { PageHeading } from "@/components/site/PageHeading";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useSettings } from "@/context/settings";
import { fetchOrdersApi, updateOrderDetailsApi, type ApiOrder } from "@/services/api";
import {
  LogOut,
  ShieldCheck,
  User,
  Package,
  Clock,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  Eye,
  RefreshCw,
  MessageCircle,
  X,
  Search,
  ExternalLink,
  Edit2,
  Save,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account & Orders - Asia Electronics" },
      { name: "description", content: "Customer account, profile details, and live order history." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Account,
});

// Helper to determine if an order can be edited by the customer
function isOrderEditable(status: string): boolean {
  const s = (status || "").trim().toLowerCase();
  return !["shipped", "delivered", "cancelled"].includes(s);
}

// Status badge styling helper
function StatusBadge({ status }: { status: string }) {
  let bg = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  if (status === "Delivered") {
    bg = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  } else if (status === "Shipped") {
    bg = "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
  } else if (status === "Processing") {
    bg = "bg-blue-500/10 text-blue-500 border-blue-500/20";
  } else if (status === "Cancelled") {
    bg = "bg-rose-500/10 text-rose-500 border-rose-500/20";
  } else if (status === "Quotation Sent") {
    bg = "bg-purple-500/10 text-purple-500 border-purple-500/20";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg}`}
    >
      {status || "Quotation Requested"}
    </span>
  );
}

// â”€â”€â”€ Order Details Modal (With Editing & Accurate LKR Prices) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrderDetailsModal({
  order: initialOrder,
  canEdit,
  onClose,
  onOrderUpdated,
  whatsappDigits,
}: {
  order: ApiOrder;
  canEdit: boolean;
  onClose: () => void;
  onOrderUpdated: (updated: ApiOrder) => void;
  whatsappDigits: string;
}) {
  const [order, setOrder] = useState<ApiOrder>(initialOrder);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    customerName: initialOrder.customerName || "",
    phone: initialOrder.phone || "",
    email: initialOrder.email || "",
    address: initialOrder.address || "",
    city: initialOrder.city || "",
    notes: initialOrder.notes || "",
  });

  const editable = canEdit && isOrderEditable(order.status);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    toast.success("Order ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!editForm.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setSaving(true);
    try {
      const result = await updateOrderDetailsApi(order.id, {
        customerName: editForm.customerName,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        city: editForm.city,
        notes: editForm.notes,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to update order details");
        setSaving(false);
        return;
      }

      setOrder(result.data);
      onOrderUpdated(result.data);
      setIsEditing(false);
      toast.success("Order details and delivery destination updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "â€”";

  // Build WhatsApp inquiry link
  const waMessage = encodeURIComponent(
    `Hello Asia Electronics! I would like an update regarding my Order #${order.id} (${order.customerName}). Status: ${order.status}`,
  );
  const waUrl = `https://wa.me/${whatsappDigits}?text=${waMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display font-extrabold text-xl text-foreground flex items-center gap-2">
                Order #{order.id}
              </h3>
              <button
                onClick={handleCopyId}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Copy Order ID"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Placed on {formattedDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status & Actions Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-muted/40 border border-border">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Current Status
            </span>
            <StatusBadge status={order.status} />
          </div>

          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
            >
              <MessageCircle className="h-4 w-4" />
              Inquire on WhatsApp
            </a>
          </div>
        </div>

        {/* Customer & Delivery Section (With Editable Mode) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Customer & Delivery Details
            </span>
            {editable ? (
              !isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2.5 rounded text-xs flex items-center gap-1.5 text-primary border-primary/40 hover:bg-primary hover:text-white"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit Details
                </Button>
              )
            ) : (
              <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Lock className="h-3 w-3" />
                Locked (Order {order.status})
              </span>
            )}
          </div>

          {isEditing ? (
            /* Inline Edit Form */
            <form
              onSubmit={handleSaveEdit}
              className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4 text-xs"
            >
              <div className="flex items-center gap-2 text-primary font-bold">
                <Edit2 className="h-4 w-4" />
                Edit Delivery Information
                <span className="text-[11px] font-normal text-muted-foreground ml-auto">
                  (Editable until order status is changed to Shipped)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-border bg-card rounded text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. 0771234567"
                    className="w-full px-3 py-1.5 border border-border bg-card rounded text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="your-email@example.com"
                    className="w-full px-3 py-1.5 border border-border bg-card rounded text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">City *</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="e.g. Colombo, Kandy"
                    className="w-full px-3 py-1.5 border border-border bg-card rounded text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-foreground">Delivery Street Address *</label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="e.g. No. 45, Main Street"
                    className="w-full px-3 py-1.5 border border-border bg-card rounded text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-foreground">
                    Delivery Notes / Special Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Any landmarks or delivery timing instructions..."
                    className="w-full px-3 py-1.5 border border-border bg-card rounded text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="rounded-none text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="rounded-none text-xs bg-primary text-white flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            /* Read-Only Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5 border-b border-border pb-2">
                  <User className="h-4 w-4 text-primary" /> Customer Details
                </h4>
                <p className="font-semibold text-foreground">{order.customerName}</p>
                {order.email && (
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {order.email}
                  </p>
                )}
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {order.phone}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5 border-b border-border pb-2">
                  <MapPin className="h-4 w-4 text-primary" /> Delivery Destination
                </h4>
                <p className="text-foreground">{order.address || "Standard Store Delivery"}</p>
                <p className="text-muted-foreground font-medium">{order.city || "Sri Lanka"}</p>
                {order.notes && (
                  <p className="text-muted-foreground italic text-[11px] pt-1">
                    Note: &ldquo;{order.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Items Breakdown with Correct Rupee Formatting */}
        <div className="space-y-3">
          <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Ordered Items ({order.items?.length || 0})
          </h4>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5 text-center">SKU</th>
                  <th className="px-4 py-2.5 text-center">Qty</th>
                  <th className="px-4 py-2.5 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => {
                    const price = it.priceLKR || 0;
                    const subtotal = price * (it.qty || 1);
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{it.name}</td>
                        <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                          {it.sku}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{it.qty}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {price > 0 ? formatRupees(price) : "Quote required"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {subtotal > 0 ? formatRupees(subtotal) : "Quote"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                      No item breakdown recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <span className="font-bold text-foreground">Total Quotation Value</span>
          <span className="font-display font-extrabold text-xl text-primary">
            {order.totalLKR > 0 ? formatRupees(order.totalLKR) : "Subject to WhatsApp Quotation"}
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="outline" className="rounded-none text-xs">
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Account Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Account() {
  const { user, logout, isAdmin, isLoading: authLoading } = useAuth();
  const { whatsappDigits } = useSettings();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllStoreOrders, setShowAllStoreOrders] = useState(false);
  const copyOrderId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Order ID copied to clipboard");
    } catch {
      toast.error("Could not copy the Order ID");
    }
  };

  // Load orders from backend ONLY if user is logged in
  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOrdersApi(isAdmin ? "all" : "mine");
      if (data && Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn("Could not load orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
      setOrders([]);
    }
  }, [user]);

  const handleOrderUpdated = (updatedOrder: ApiOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    if (selectedOrder && selectedOrder.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
  };

  // Filter orders according to user context
  const filteredOrders = useMemo(() => {
    if (!user) return [];
    let result = orders;

    // If user is regular customer and not toggling all orders
    if (!isAdmin || !showAllStoreOrders) {
      const userEmail = (user.email || "").trim().toLowerCase();
      result = result.filter(
        (o) =>
          (o.email && o.email.trim().toLowerCase() === userEmail) ||
          (o.customerName && o.customerName.toLowerCase() === user.name?.toLowerCase()),
      );
    }

    // Apply manual search query (Order ID, phone, customer name, sku)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.id?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.city?.toLowerCase().includes(q) ||
          o.items?.some(
            (it) => it.name?.toLowerCase().includes(q) || it.sku?.toLowerCase().includes(q),
          ),
      );
    }

    return result;
  }, [orders, user, isAdmin, showAllStoreOrders, searchQuery]);

  // 1. Loading state while authentication session is restored
  if (authLoading) {
    return (
      <>
        <PageHeading title="My Account & Order History" />
        <div className="container-shop py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-muted-foreground">
            Checking authentication session...
          </p>
        </div>
      </>
    );
  }

  // 2. Gated state: User is NOT logged in
  if (!user) {
    return (
      <main className="relative isolate min-h-[calc(100vh-7rem)] overflow-hidden bg-[#07111f] px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(240,0,63,.26),transparent_28%),radial-gradient(circle_at_86%_80%,rgba(24,104,173,.28),transparent_32%),linear-gradient(135deg,#07111f,#0d1b2d_52%,#070b13)]" />
        <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-sm lg:min-h-[570px] lg:grid-cols-[1.1fr_.9fr]">
          <section className="hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-[.16em]">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> PRIVATE ACCOUNT AREA
              </span>
              <h1 className="mt-8 max-w-xl text-4xl font-black leading-[1.08]">
                Your orders, enquiries and support — in one place.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                Sign in to keep track of your quotation requests and access help from our
                electronics specialists.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <Package className="h-5 w-5 text-primary" /> View active enquiries and order history
              </p>
              <p className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <ShieldCheck className="h-5 w-5 text-primary" /> Private information, protected
                securely
              </p>
            </div>
          </section>
          <section className="flex items-center bg-white p-7 sm:p-10 lg:p-12">
            <div className="w-full space-y-6 text-center lg:text-left">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary lg:mx-0">
                <Lock className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-primary">
                  Customer account
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
                  Sign in to view your orders
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Your order history, quotation status and delivery details are private. Sign in to
                  continue.
                </p>
              </div>
              <div className="space-y-3">
                <Button asChild className="h-12 w-full rounded-lg font-extrabold">
                  <Link to="/login">Sign in to your account</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 w-full rounded-lg font-bold">
                  <Link to="/register">Create a new account</Link>
                </Button>
              </div>
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-t border-border pt-5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary lg:justify-start"
              >
                <MessageCircle className="h-4 w-4 text-primary" /> Need help now? Contact us on
                WhatsApp
              </a>
            </div>
          </section>
        </div>
      </main>
    );
  }
  return (
    <>
      <PageHeading title="My Account & Order History" />
      <div className="container-shop space-y-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]">
          {/* User Profile Card */}
          <div className="h-fit min-w-0 border border-border bg-tile p-6 rounded shadow-xs space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate font-display font-extrabold text-foreground leading-tight"
                    title={user.name}
                  >
                    {user.name === user.email ? "Customer account" : user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" title={user.email}>
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Account Role:</span>
                <span className="font-semibold uppercase tracking-wider text-primary">
                  {user.role || "Customer"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Orders:</span>
                <span className="font-bold text-foreground">{filteredOrders.length}</span>
              </div>

              {isAdmin && (
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-bold text-xs"
                >
                  <Link to="/admin" className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Open Admin Portal
                  </Link>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={async () => {
                  await logout();
                  navigate({ to: "/login" });
                }}
                className="w-full rounded-none text-xs font-semibold hover:text-destructive hover:border-destructive flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>

            {/* Quick Support Card */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-2">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> Need Help with an Order?
              </p>
              <p className="text-[11px] leading-relaxed">
                Reach our customer desk directly on WhatsApp with your Order ID for rapid updates.
              </p>
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
              >
                Chat on WhatsApp <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* â”€â”€ Order History Section â”€â”€ */}
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="section-title">Order History & Details</h2>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {isAdmin
                    ? "Store administrator view: Displaying live customer quotation orders from Supabase"
                    : user
                      ? `Showing orders associated with ${user.email}`
                      : "Track recent customer quotation orders and live statuses"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadOrders}
                  disabled={loading}
                  className="rounded-none text-xs flex items-center gap-1.5"
                  title="Reload orders from database"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                {isAdmin && (
                  <Button
                    variant={showAllStoreOrders ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAllStoreOrders(!showAllStoreOrders)}
                    className="rounded-none text-xs"
                  >
                    {showAllStoreOrders ? "Showing All Orders" : "Filter Admin Orders"}
                  </Button>
                )}
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by Order ID (e.g. AEC-...), customer name, phone, or SKU..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-border bg-card rounded focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Orders Table Container */}
            {loading ? (
              <div className="border border-border p-12 text-center bg-tile rounded space-y-3">
                <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto" />
                <p className="text-xs font-semibold text-muted-foreground">
                  Loading orders from Supabase database...
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="border border-border p-12 text-center bg-tile rounded space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground">No Orders Found</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    {searchQuery
                      ? "No orders match your search criteria. Try searching with a different Order ID or phone number."
                      : user
                        ? "You haven't requested any quotations yet. When you request a quotation through checkout, it will be listed here with live updates."
                        : "Sign in to see your account's order history, or search by your Order ID above."}
                  </p>
                </div>
                <Button asChild className="rounded-none text-xs font-bold bg-primary text-white">
                  <Link to="/shop">Browse Electronic Components</Link>
                </Button>
              </div>
            ) : (
              <div className="border border-border bg-card rounded shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-xs text-left">
                    <thead className="bg-muted/60 border-b border-border uppercase font-bold text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Items Summary</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Total (LKR)</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredOrders.map((o) => {
                        const dateStr = o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "â€”";

                        const itemsCount = o.items
                          ? o.items.reduce((s, it) => s + (it.qty || 1), 0)
                          : 0;
                        const firstItemName = o.items?.[0]?.name || "Component Item";

                        return (
                          <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                                <span>#{o.id}</span>
                                <button
                                  type="button"
                                  onClick={() => void copyOrderId(o.id)}
                                  title="Copy Order ID"
                                  aria-label={`Copy order ID ${o.id}`}
                                  className="rounded p-1 text-primary hover:bg-primary/10"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-foreground">{o.customerName}</p>
                              <p className="text-[11px] text-muted-foreground">{o.phone}</p>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <p className="truncate font-medium text-foreground">
                                {firstItemName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {itemsCount} {itemsCount === 1 ? "item" : "items"} total
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <StatusBadge status={o.status} />
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                              {o.totalLKR > 0 ? formatRupees(o.totalLKR) : "Quotation"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrder(o)}
                                className="h-7 px-2.5 rounded-none text-xs flex items-center gap-1 font-semibold hover:bg-primary hover:text-white transition-colors"
                              >
                                <Eye className="h-3 w-3" />
                                Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Showing {filteredOrders.length} order(s)</span>
                  <span className="text-[11px]">
                    Click &ldquo;Details&rdquo; to view line items or edit delivery info before
                    shipping
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          canEdit={isAdmin}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleOrderUpdated}
          whatsappDigits={whatsappDigits}
        />
      )}
    </>
  );
}
