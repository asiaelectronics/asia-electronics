import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircuitBoard, Lightbulb, ShieldCheck, Wrench } from "lucide-react";

const guides = [
  {
    icon: CircuitBoard,
    title: "How to choose electronic components for a repair",
    body: "Match the part number, voltage, package and pin layout before ordering. A clear photo of the original board and component helps identify compatible ICs, capacitors, relays and modules.",
    search: "electronic components Sri Lanka",
    shopSearch: "electronic components",
  },
  {
    icon: Wrench,
    title: "Finding the right mobile and appliance spare parts",
    body: "For displays, batteries, charging boards and appliance control boards, confirm the exact model number first. Parts that look similar can have different connectors, firmware or dimensions.",
    search: "mobile repair parts Colombo",
    shopSearch: "repair parts",
  },
  {
    icon: Lightbulb,
    title: "Planning practical LED and solar lighting",
    body: "Choose lighting by the required brightness, fitting type, colour temperature and installation environment. For solar products, check panel capacity, battery type and expected daily use.",
    search: "LED lights and solar products Sri Lanka",
    shopSearch: "solar lighting",
  },
];

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Electronics Buying & Repair Guides | Asia Electronics Sri Lanka" },
      {
        name: "description",
        content:
          "Helpful buying and repair guides for electronic components, mobile spare parts, LED lighting, solar products and tools in Sri Lanka.",
      },
      { property: "og:title", content: "Electronics Buying & Repair Guides | Asia Electronics" },
      {
        property: "og:description",
        content:
          "Practical guidance for choosing electronics, repair parts, lighting, solar products and tools.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.asiaelectronics.lk/blog" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.asiaelectronics.lk/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <main>
      <section className="bg-ink py-12 text-ink-foreground sm:py-16">
        <div className="container-shop max-w-4xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">Asia Electronics guides</p>
          <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight sm:text-5xl">
            Electronics buying and repair advice for Sri Lanka
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-foreground/75 sm:text-base">
            Clear, practical information to help technicians, businesses and home users select the
            right electronic components, repair parts, lighting, solar equipment and tools.
          </p>
        </div>
      </section>

      <section className="container-shop py-10 sm:py-14">
        <div className="max-w-3xl">
          <h2 className="font-display text-2xl font-black uppercase">Start with the correct details</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            The best purchase is the one that fits the job. Check model numbers, specifications and
            compatibility, then compare products before ordering. If you are unsure, contact our
            team with the product name, part number or a photo of the original item.
          </p>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {guides.map(({ icon: Icon, title, body, search, shopSearch }) => (
            <article key={title} className="flex flex-col border border-border bg-card p-6">
              <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <h2 className="mt-5 font-display text-lg font-extrabold uppercase leading-snug">{title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{body}</p>
              <p className="mt-5 text-xs font-bold text-foreground">Popular search: {search}</p>
              <Link
                to="/shop"
                search={{ q: shopSearch }}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Browse relevant products <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-tile">
        <div className="container-shop grid gap-6 py-10 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <ShieldCheck className="h-9 w-9 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-xl font-black uppercase">Need help identifying a part?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Send the model number, required quantity and a clear photo. We can help you find a
              suitable item from our electronics catalogue.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex h-11 items-center justify-center bg-primary px-5 text-xs font-extrabold uppercase text-primary-foreground hover:bg-primary/90"
          >
            Contact our team
          </Link>
        </div>
      </section>
    </main>
  );
}
