import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  MessageCircle,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/settings";
import { fetchOrderStatusApi, type ApiOrder } from "@/services/api";

interface S {
  order?: string;
  items?: number;
}
type OrderStatus = ApiOrder["status"];

const TRACKING_STEPS: OrderStatus[] = [
  "Quotation Requested",
  "Quotation Sent",
  "Processing",
  "Shipped",
  "Delivered",
];

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (s: Record<string, unknown>): S => ({
    order: typeof s.order === "string" ? s.order : undefined,
    items: Number.isFinite(Number(s.items)) ? Number(s.items) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Quotation Submitted — Asiaelectronics" },
      {
        name: "description",
        content: "Your quotation request has been saved. AEC will contact you via WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirm,
});

function TrackingStatus({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-left">
        <div className="flex items-center gap-2 text-rose-700">
          <XCircle className="h-5 w-5" />
          <p className="text-sm font-bold">This order has been cancelled</p>
        </div>
        <p className="mt-1 text-xs text-rose-700/80">
          Please contact us on WhatsApp if you need help with this order.
        </p>
      </div>
    );
  }

  const currentStep = Math.max(0, TRACKING_STEPS.indexOf(status));
  return (
    <section
      className="mt-6 rounded-lg border border-border bg-muted/25 p-4 text-left"
      aria-label="Order tracking"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Order tracking
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">{status}</p>
        </div>
        {status === "Delivered" ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        ) : status === "Shipped" ? (
          <Truck className="h-6 w-6 text-primary" />
        ) : (
          <Clock3 className="h-6 w-6 text-amber-500" />
        )}
      </div>
      <ol className="mt-5 grid grid-cols-5 gap-1">
        {TRACKING_STEPS.map((step, index) => {
          const complete = index <= currentStep;
          return (
            <li key={step} className="min-w-0">
              <div className={`h-1 rounded-full ${complete ? "bg-primary" : "bg-border"}`} />
              <div className="mt-1.5 flex items-start gap-1">
                {complete ? (
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                ) : (
                  <Circle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={`text-[9px] leading-tight ${complete ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {step.replace("Quotation ", "Quote ")}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Confirm() {
  const s = Route.useSearch();
  const { whatsappDigits } = useSettings();
  const [status, setStatus] = useState<OrderStatus>("Quotation Requested");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshStatus = async () => {
    if (!s.order) return;
    setCheckingStatus(true);
    const updatedStatus = await fetchOrderStatusApi(s.order);
    if (updatedStatus) setStatus(updatedStatus);
    setCheckingStatus(false);
  };

  useEffect(() => {
    void refreshStatus();
  }, [s.order]);

  if (!s.order) {
    return (
      <div className="container-shop py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold">No quotation to show</h1>
        <Button asChild className="mt-5 rounded-none">
          <Link to="/shop">Go shopping</Link>
        </Button>
      </div>
    );
  }

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(s.order);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const waText = encodeURIComponent(
    `Hi AEC, I would like an update regarding order #${s.order}. Current status: ${status}.`,
  );
  const waLink = `https://wa.me/${whatsappDigits}?text=${waText}`;
  const nextStep =
    status === "Delivered"
      ? "Your order has been delivered."
      : status === "Cancelled"
        ? "Please contact AEC if you need assistance."
        : "AEC will keep this page updated as your order progresses.";

  return (
    <div className="container-shop max-w-xl py-16 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h1 className="mt-4 font-display text-2xl font-extrabold uppercase">
        Quotation Request Submitted!
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your request has been saved to our system. Our team will reach out to you via WhatsApp with
        pricing and availability shortly.
      </p>
      <TrackingStatus status={status} />
      <button
        type="button"
        onClick={() => void refreshStatus()}
        disabled={checkingStatus}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${checkingStatus ? "animate-spin" : ""}`} />
        {checkingStatus ? "Checking status..." : "Refresh status"}
      </button>
      <dl className="mt-5 divide-y divide-border border border-border text-left text-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-muted-foreground">Order / Quotation ID</dt>
          <dd className="flex items-center gap-2 text-right font-bold text-primary">
            <span>{s.order}</span>
            <button
              type="button"
              onClick={() => void copyOrderId()}
              title="Copy order ID"
              aria-label="Copy order ID"
              className="rounded p-1 text-primary hover:bg-primary/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </dd>
        </div>
        <Row k="Items Requested" v={String(s.items ?? 0)} />
        <Row k="Current Status" v={status} />
        <Row k="What's next?" v={nextStep} />
      </dl>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-none bg-[#25D366] px-6 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          Open WhatsApp
        </a>
        <Button asChild variant="outline" className="rounded-none">
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

const Row = ({ k, v, highlight = false }: { k: string; v: string; highlight?: boolean }) => (
  <div className="flex justify-between gap-4 px-4 py-3">
    <dt className="text-muted-foreground">{k}</dt>
    <dd className={`text-right font-bold ${highlight ? "text-primary" : ""}`}>{v}</dd>
  </div>
);
