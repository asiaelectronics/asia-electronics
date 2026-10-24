import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  MessageCircle,
  PackageCheck,
  Send,
  Store,
  Wrench,
} from "lucide-react";
import { PageHeading } from "@/components/site/PageHeading";
import { useSettings } from "@/context/settings";

const customers = [
  [Store, "Retailers & wholesalers"],
  [Wrench, "Technicians & repair centres"],
  [Building2, "Businesses, institutions & industrial clients"],
] as const;
const requestItems = [
  "Product name, model or part number",
  "Required quantity",
  "Preferred brand or specification",
  "A clear photo for repair parts, where available",
];

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "Wholesale & Bulk Orders — Asiaelectronics" },
      {
        name: "description",
        content:
          "Request a wholesale or bulk quotation for electronics, repair parts, lighting, solar products and equipment.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.asiaelectronics.lk/wholesale" }],
  }),
  component: WholesalePage,
});

function WholesalePage() {
  const { buildWhatsAppUrl } = useSettings();
  const message = "Hello Asia Electronics, I would like a quotation for a wholesale or bulk order.";
  return (
    <>
      <PageHeading title="Wholesale & Bulk Orders" />
      <main className="container-shop pb-16 sm:pb-20">
        <section className="overflow-hidden bg-ink px-6 py-10 text-ink-foreground sm:px-10 sm:py-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">
            Business supply solutions
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Reliable supply for your business and technical requirements
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-foreground/75 sm:text-base">
            AEC supplies electronic components, repair parts, lighting, solar products, accessories
            and equipment for bulk and trade requirements throughout Sri Lanka.
          </p>
          <a
            href={buildWhatsAppUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex h-11 items-center gap-2 bg-primary px-5 text-xs font-extrabold uppercase text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" /> Request a quotation
          </a>
        </section>
        <section className="grid gap-4 py-10 sm:grid-cols-3">
          {customers.map(([Icon, label]) => (
            <article key={label} className="border border-border bg-card p-5">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 font-display text-sm font-extrabold uppercase">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Talk to our team about availability, quantities and suitable product options.
              </p>
            </article>
          ))}
        </section>
        <section className="grid gap-6 border border-border bg-tile p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
              Get a faster quote
            </p>
            <h2 className="mt-2 font-display text-2xl font-black uppercase">
              Send the details of what you need
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Providing the information below helps our team identify the correct product and
              respond efficiently.
            </p>
            <ul className="mt-5 space-y-3">
              {requestItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center border border-border bg-card p-6">
            <PackageCheck className="h-8 w-8 text-primary" />
            <h2 className="mt-4 font-display text-lg font-black uppercase">Start your enquiry</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Send your list on WhatsApp or contact our team for a quotation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={buildWhatsAppUrl(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 bg-primary px-4 text-xs font-extrabold uppercase text-primary-foreground"
              >
                <Send className="h-4 w-4" /> WhatsApp us
              </a>
              <Link
                to="/contact"
                className="inline-flex h-11 items-center border border-border px-4 text-xs font-extrabold uppercase"
              >
                Contact details
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
