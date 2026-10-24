import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  PackageSearch,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import deliveryVisual from "@/assets/imgs/hero-electronics-showcase.png";
import { PageHeading } from "@/components/site/PageHeading";
import { useSettings } from "@/context/settings";
import { fetchOrderStatusApi, type ApiOrder } from "@/services/api";

const POLICY_CONTENT: Record<string, { intro: string; sections: Array<[string, string]> }> = {
  delivery: {
    intro:
      "We aim to process confirmed orders carefully and keep customers informed throughout the delivery process.",
    sections: [
      [
        "Order confirmation",
        "Orders are subject to product availability and confirmation by our team. We may contact you to confirm specifications, quantities or delivery details.",
      ],
      [
        "Delivery charges and timing",
        "Applicable delivery charges and estimated delivery arrangements are communicated during checkout or before a quotation is confirmed. Delivery timing can vary by location, product type and stock availability.",
      ],
      [
        "Receiving your order",
        "Please check the items and visible package condition when receiving your order. Contact us promptly if you need assistance with a delivery.",
      ],
    ],
  },
  returns: {
    intro:
      "If you have an issue with an item, please contact our team before returning it so we can advise on the correct next step.",
    sections: [
      [
        "Before returning an item",
        "Keep your proof of purchase, original packaging and all supplied accessories where possible. Our team will review the item and explain the available resolution.",
      ],
      [
        "Incorrect or damaged items",
        "Contact us promptly with your order details and clear photos where applicable. We will assess the issue and guide you through the return or replacement process.",
      ],
      [
        "Non-returnable items",
        "Some electronic components, special-order products and items affected by handling or installation may have return limitations. Please confirm eligibility with our team before purchase.",
      ],
    ],
  },
  warranty: {
    intro:
      "Warranty support depends on the specific product and any manufacturer or supplier warranty that applies.",
    sections: [
      [
        "Warranty coverage",
        "Where a warranty applies, the product page, quotation or invoice will identify the relevant coverage. Retain your proof of purchase for any warranty enquiry.",
      ],
      [
        "Making a claim",
        "Contact our team with the invoice number, product details and a description of the issue. We may request photos, testing information or an inspection of the item.",
      ],
      [
        "Exclusions",
        "Warranty support does not normally cover accidental damage, misuse, incorrect installation, unauthorised modification or normal wear. Final assessment follows the applicable product warranty terms.",
      ],
    ],
  },
  privacy: {
    intro:
      "We use the information you provide to process enquiries and orders, provide support and improve our service.",
    sections: [
      [
        "Information we collect",
        "This may include your name, contact details, delivery address, order details and messages you send to us.",
      ],
      [
        "How we use it",
        "We use this information to fulfil orders, respond to enquiries, provide delivery updates and support customers. We do not sell personal information.",
      ],
      [
        "Your choices",
        "Contact us if you want to correct your contact details or have a question about how your information is used.",
      ],
    ],
  },
  terms: {
    intro:
      "These terms explain the general basis on which products and quotations are supplied by Asia Electronics and Cellular.",
    sections: [
      [
        "Product information",
        "We take care to present product details accurately. Images, specifications and availability can change, so please confirm critical compatibility requirements with our team before ordering.",
      ],
      [
        "Prices and availability",
        "Prices, offers and stock availability may change. A quotation or order confirmation from our team is the final confirmation of the supplied items and price.",
      ],
      [
        "Technical compatibility",
        "Customers are responsible for confirming that a component, spare part or accessory is suitable for their intended equipment. Our team can help where model, part number or a clear photo is provided.",
      ],
    ],
  },
};

const POLICIES: Record<string, string> = {
  delivery: "Delivery Information",
  returns: "Returns & Refunds",
  warranty: "Warranty",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
};

type OrderStatus = ApiOrder["status"];
const TRACKING_STEPS: OrderStatus[] = [
  "Quotation Requested",
  "Quotation Sent",
  "Processing",
  "Shipped",
  "Delivered",
];

export const Route = createFileRoute("/policy/$slug")({
  loader: ({ params }) => {
    const title = POLICIES[params.slug];
    if (!title) throw notFound();
    return { title, slug: params.slug };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Asiaelectronics` },
          {
            name: "description",
            content:
              loaderData.title === "Delivery Information"
                ? "Delivery and order tracking information for Asiaelectronics, Sri Lanka."
                : `${loaderData.title} and customer policies for Asiaelectronics, Sri Lanka.`,
          },
        ]
      : [{ title: "Page not found — Asiaelectronics" }, { name: "robots", content: "noindex" }],
    links: loaderData
      ? [{ rel: "canonical", href: `https://www.asiaelectronics.lk/policy/${loaderData.slug}` }]
      : [],
  }),
  component: Policy,
});

function TrackingTimeline({ status }: { status: OrderStatus }) {
  if (status === "Cancelled")
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mt-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700"
      >
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">This order has been cancelled</p>
          <p className="mt-1 text-xs text-rose-700/80">Please contact us if you need assistance.</p>
        </div>
      </motion.div>
    );
  const activeStep = Math.max(0, TRACKING_STEPS.indexOf(status));
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="mt-5 rounded-lg border border-border bg-muted/25 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Current status
          </p>
          <p className="mt-1 text-base font-bold text-foreground">{status}</p>
        </div>
        {status === "Delivered" ? (
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        ) : status === "Shipped" ? (
          <Truck className="h-7 w-7 text-primary" />
        ) : (
          <Clock3 className="h-7 w-7 text-amber-500" />
        )}
      </div>
      <ol className="mt-5 space-y-1 sm:grid sm:grid-cols-5 sm:gap-1 sm:space-y-0">
        {TRACKING_STEPS.map((step, index) => {
          const complete = index <= activeStep;
          return (
            <li key={step} className="flex min-w-0 items-stretch gap-3 sm:block">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                className={`origin-top w-1 shrink-0 rounded-full ${complete ? "bg-primary" : "bg-border"} sm:origin-left sm:h-1 sm:w-full`}
              />
              <div className="flex items-start gap-1 pb-2 sm:mt-1.5 sm:pb-0">
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
    </motion.div>
  );
}

function DeliveryTracker() {
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const { settings, buildWhatsAppUrl } = useSettings();

  const trackOrder = async (event: FormEvent) => {
    event.preventDefault();
    const id = orderId.trim();
    if (!id) {
      setError("Enter your order ID to track it.");
      return;
    }
    setChecking(true);
    setError("");
    setStatus(null);
    const result = await fetchOrderStatusApi(id);
    if (result) setStatus(result);
    else setError("We could not find that order. Check the ID and try again.");
    setChecking(false);
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="container-shop max-w-6xl pb-16 sm:pb-20"
    >
      <section className="overflow-hidden border border-border bg-card shadow-[0_18px_50px_rgb(15_23_42/0.12)] lg:grid lg:grid-cols-2">
        <div className="relative min-h-[300px] overflow-hidden bg-ink sm:min-h-[420px] lg:min-h-[620px]">
          <img
            src={deliveryVisual}
            alt="Electronics and components from Asia Electronics"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="relative flex h-full min-h-[300px] flex-col justify-between p-6 text-ink-foreground sm:min-h-[420px] sm:p-9">
            <div className="inline-flex w-fit items-center gap-2 bg-primary px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary-foreground">
              <Truck className="h-3.5 w-3.5" /> Islandwide delivery
            </div>
            <div className="max-w-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
                Asia Electronics & Cellular
              </p>
              <h2 className="mt-3 font-display text-3xl font-black uppercase leading-[0.95] sm:text-4xl">
                Your order, handled with care.
              </h2>
              <p className="mt-4 text-sm leading-6 text-ink-foreground/80">
                From order confirmation to delivery, we keep you informed at every important step.
              </p>
            </div>
            <div className="flex items-center gap-3 border-t border-white/20 pt-4 text-xs text-ink-foreground/80">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              <span>Order updates, delivery support and product assistance from our team.</span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-9 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <PackageSearch className="h-5 w-5" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
                Track your delivery
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Enter your order or quotation ID to see the latest progress from our team.
              </p>
            </div>
            {status === "Delivered" && (
              <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
            )}
          </div>

          <form onSubmit={trackOrder} className="mt-7 space-y-3">
            <label
              className="text-xs font-extrabold uppercase tracking-wide text-foreground"
              htmlFor="tracking-order-id"
            >
              Order or quotation ID
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="tracking-order-id"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value.toUpperCase())}
                placeholder="Example: AEC-ABC123456"
                className="h-12 min-w-0 flex-1 border border-input bg-background px-3 text-sm font-bold uppercase outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={checking}
                className="inline-flex h-12 items-center justify-center gap-2 bg-primary px-5 text-xs font-extrabold uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Search className="h-4 w-4" /> {checking ? "Checking..." : "Track order"}
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm font-medium text-rose-600"
              >
                {error}
              </motion.p>
            )}
            {status ? (
              <TrackingTimeline status={status} />
            ) : (
              <div className="mt-7 border-y border-border py-5">
                {[
                  ["01", "Order confirmed", "Your order or quotation has been received."],
                  [
                    "02",
                    "Prepared by our team",
                    "We verify availability and arrange delivery details.",
                  ],
                  ["03", "Shipped or delivered", "Track the status until your order is complete."],
                ].map(([number, heading, detail], index) => (
                  <div key={number} className={`flex gap-4 ${index ? "mt-4" : ""}`}>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-primary text-[10px] font-black text-primary">
                      {number}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">{heading}</h2>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="mt-7 border-t border-border pt-5">
            <p className="text-xs font-bold text-muted-foreground">
              Need delivery help? Include your order ID when you contact us.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <a
                href={buildWhatsAppUrl(
                  "Hello Asia Electronics, I need a delivery update for order ID: ",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp support
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary"
              >
                <MapPin className="h-4 w-4" /> Contact details{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          [
            PackageCheck,
            "Check your package",
            "Inspect the package and item condition when receiving your order.",
          ],
          [
            Clock3,
            "Delivery timing",
            "Timing can vary by location, product type and stock availability.",
          ],
          [
            MessageCircle,
            "Talk to our team",
            `For quick support, contact us on WhatsApp or call ${settings.phone}.`,
          ],
        ].map(([Icon, heading, detail]) => {
          const ItemIcon = Icon as typeof PackageCheck;
          return (
            <article key={heading as string} className="border border-border bg-card p-5">
              <ItemIcon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-sm font-extrabold uppercase text-foreground">
                {heading as string}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail as string}</p>
            </article>
          );
        })}
      </section>
    </motion.main>
  );
}
function Policy() {
  const { title } = Route.useLoaderData();
  const slug = Route.useParams().slug;
  const content = POLICY_CONTENT[slug];
  return (
    <>
      <PageHeading title={title} />
      {title === "Delivery Information" ? (
        <DeliveryTracker />
      ) : (
        <main className="container-shop max-w-3xl space-y-7 pb-16 text-sm">
          <p className="text-base leading-7 text-muted-foreground">{content.intro}</p>
          {content.sections.map(([heading, body]) => (
            <section key={heading} className="border-t border-border pt-5">
              <h2 className="font-display text-base font-extrabold uppercase">{heading}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
            </section>
          ))}
        </main>
      )}
    </>
  );
}
