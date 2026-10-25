import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { MessageCircle, ShieldCheck, Loader2 } from "lucide-react";
import { useCart } from "@/context/cart";
import { Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "./cart";
import { PageHeading } from "@/components/site/PageHeading";
import { createOrderApi } from "@/services/api";
import { toast } from "sonner";
import { useSettings } from "@/context/settings";
import { useAuth } from "@/context/auth";

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+94|0094|0)?[1-9]\d{8}$/, "Enter a valid phone number, e.g. 0771234567"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  address: z.string().trim().min(3, "Enter your delivery address").max(200),
  city: z.string().trim().min(2, "Enter your city").max(60),
  notes: z.string().max(500).optional(),
});

type Values = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Request Quotation - Asia Electronics" },
      {
        name: "description",
        content:
          "Fill your details to request a quotation. AEC will respond via WhatsApp with pricing and availability.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPage,
});

// ─── WhatsApp message builder ──────────────────────────────────────────────────
function buildWhatsAppMessage(
  orderId: string,
  customerName: string,
  items: Array<{
    name: string;
    sku: string;
    qty: number;
    productUrl: string;
  }>,
): string {
  const itemLines = items
    .map(
      (it, i) =>
        `${i + 1}. ${it.name}\n` +
        `   Item Code: ${it.sku}\n` +
        `   Qty: ${it.qty}\n` +
        `   Product Link: ${it.productUrl}`,
    )
    .join("\n\n");

  return (
    `*Quotation Request*\n\n` +
    `Order ID: #${orderId}\n` +
    `Customer: ${customerName}\n\n` +
    `*Items:*\n${itemLines}\n\n` +
    `Please confirm the availability and quotation for these items.`
  );
}

function getWhatsAppUrl(
  orderId: string,
  customerName: string,
  cartItems: Array<{
    name: string;
    sku: string;
    qty: number;
    productUrl: string;
  }>,
  whatsappDigits: string,
) {
  const message = buildWhatsAppMessage(orderId, customerName, cartItems);
  return `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────
function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { whatsappDigits } = useSettings();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(checkoutSchema),
    values: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  const onSubmit = async (v: Values) => {
    if (submitting) return; // prevent double-submit
    setSubmitting(true);
    // Reserve the tab while this click is still a user gesture. Opening it only
    // after the API call is complete is commonly blocked as a popup by browsers.
    const whatsappWindow = window.open("about:blank", "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;

    try {
      // Build items payload from cart
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const items = cart.lines.map((l) => ({
        sku: l.product.sku,
        name: l.product.name,
        qty: l.qty,
        productUrl: `${origin}/product/${l.product.slug}`,
        priceLKR: l.product.showPrice !== false ? Math.round(l.product.priceCents / 100) : 0, // Quotation-based
      }));

      const saved = await createOrderApi({
        customerName: v.fullName,
        phone: v.phone,
        email: v.email || "",
        address: v.address,
        city: v.city,
        notes: v.notes || "",
        items: items.map((it) => ({
          sku: it.sku,
          name: it.name,
          qty: it.qty,
          priceLKR: it.priceLKR,
        })),
      });

      if (!saved) {
        whatsappWindow?.close();
        toast.error("Could not save your quotation request. Please try again.");
        setSubmitting(false);
        return;
      }

      // DB confirmed — clear cart and open WhatsApp
      cart.clear();
      toast.success(`Quotation #${saved.id} submitted! Opening WhatsApp…`);

      const whatsappUrl = getWhatsAppUrl(
        saved.id,
        v.fullName,
        items.map((it) => ({
          name: it.name,
          sku: it.sku,
          qty: it.qty,
          productUrl: it.productUrl,
        })),
        whatsappDigits,
      );
      if (whatsappWindow) {
        whatsappWindow.location.replace(whatsappUrl);
      } else {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      navigate({
        to: "/order-confirmation",
        search: { order: saved.id, items: cart.count },
      });
    } catch (err: unknown) {
      whatsappWindow?.close();
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to submit quotation: ${msg}`);
      setSubmitting(false);
    }
  };

  if (cart.lines.length === 0) {
    return (
      <>
        <PageHeading title="Request Quotation" />
        <div className="container-shop border border-border p-12 text-center">
          <p className="font-display text-lg font-extrabold">Your cart is empty</p>
          <Button asChild className="mt-5 rounded-none">
            <Link to="/shop">Browse products</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading title="Request Quotation" />
      <div className="container-shop mx-auto grid w-full min-w-0 max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-5 pb-10 sm:gap-8 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_390px]">
        {/* ── Customer Details Form ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="order-1 w-full min-w-0 space-y-6 border border-border bg-card p-4 shadow-sm min-[375px]:p-5 [&_input]:h-14 [&_input]:px-4 [&_input]:text-base [&_label]:text-[11px] sm:space-y-8 sm:p-8 sm:[&_input]:h-12 sm:[&_input]:text-sm lg:p-10"
        >
          {/* Info banner */}
          <div className="flex min-w-0 items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 sm:p-5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div className="min-w-0">
              <p className="text-base font-bold text-green-800 dark:text-green-300">
                Quotation-based ordering
              </p>
              <p className="mt-1 min-w-0 [overflow-wrap:anywhere] text-sm leading-6 text-green-700 dark:text-green-400">
                Fill your details and click{" "}
                <strong className="[overflow-wrap:anywhere]">
                  "Place Order / Request Quotation"
                </strong>
                . Your request will be saved and we'll contact you via WhatsApp with pricing and
                availability. No payment is collected online.
              </p>
            </div>
          </div>

          <section className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-5 border-t border-border pt-7 sm:grid-cols-2 sm:gap-y-5 sm:pt-8">
            <h2 className="flex items-center gap-3 font-display text-base font-extrabold uppercase sm:col-span-2">
              Customer Details
            </h2>

            <Field
              label="Full name *"
              error={errors.fullName?.message}
              {...register("fullName")}
              autoComplete="name"
              placeholder="e.g. Kasun Perera"
            />

            <Field
              label="Mobile number *"
              error={errors.phone?.message}
              {...register("phone")}
              autoComplete="tel"
              inputMode="tel"
              placeholder="e.g. 0771234567"
            />

            <Field
              label="Email (optional)"
              type="email"
              error={errors.email?.message}
              {...register("email")}
              autoComplete="email"
              className="sm:col-span-2"
              placeholder="your@email.com"
            />

            <Field
              label="Delivery address *"
              error={errors.address?.message}
              {...register("address")}
              autoComplete="street-address"
              className="sm:col-span-2"
              placeholder="No. 45, Galle Road"
            />

            <Field
              label="City *"
              error={errors.city?.message}
              {...register("city")}
              autoComplete="address-level2"
              placeholder="Colombo"
            />

            <Field
              label="Special notes (optional)"
              error={errors.notes?.message}
              {...register("notes")}
              placeholder="Any special requirements or notes for AEC…"
            />
          </section>

          <Button
            type="submit"
            disabled={submitting}
            id="place-quotation-btn"
            className="flex h-auto min-h-[3.25rem] w-full max-w-full items-center justify-center gap-2 whitespace-normal rounded-none px-4 py-3 text-center leading-tight font-bold uppercase shadow-sm sm:w-auto sm:px-10"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Place Order / Request Quotation
              </>
            )}
          </Button>
        </form>

        {/* ── Order Summary ── */}
        <aside className="order-2 w-full min-w-0 self-start lg:sticky lg:top-24">
          <OrderSummary>
            <ul className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 flex-1 leading-snug [overflow-wrap:anywhere]">
                    <span className="font-semibold">{l.qty} ×</span> {l.product.name}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-muted-foreground italic">
                    Price TBD
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              AEC will confirm pricing via WhatsApp after you submit your request.
            </p>
          </OrderSummary>
        </aside>
      </div>
    </>
  );
}
