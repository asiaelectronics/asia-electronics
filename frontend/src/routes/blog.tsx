import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BatteryCharging, ChefHat, Microscope, Smartphone, Wrench } from "lucide-react";

const guides = [
  { icon: Smartphone, title: "Phone repair tools: heat and cleaning", body: "The current range includes heat tape, hot-air and rework stations, UV curing tools, contact cleaner, OCA remover, polishing tools, precision pliers and a motherboard cleaning brush. Confirm the repair process and operating requirements before ordering.", checks: ["Match the tool to the repair task", "Check working temperature and consumables", "Use suitable safety equipment"], shopSearch: "phone repair tools" },
  { icon: Microscope, title: "Build a practical electronics repair bench", body: "The catalogue includes a Yaxun repair lamp, mini hot-air station, soldering-iron tip cleaner and magnetic heat-resistant silicon mat. Keep boards, small components and hot tools organised before beginning a repair.", checks: ["Use a heat-resistant work surface", "Keep tips and tools clean", "Plan lighting and component storage"], shopSearch: "soldering station" },
  { icon: BatteryCharging, title: "Selecting a solar panel by wattage", body: "Asia Electronics lists Jarrett solar panels from 12W to 550W. Start with your load, expected daily energy use, available installation space and the rest of the system—such as the controller, battery and inverter—before selecting a panel size.", checks: ["Calculate the load before choosing wattage", "Confirm physical installation space", "Check compatibility with the full solar system"], shopSearch: "solar panel" },
  { icon: ChefHat, title: "Identify the correct replacement blender motor", body: "The current range includes 550W and 750W open-type motors plus two-leg, four-leg and 48 mm options. A motor that looks similar may still have a different shaft, mounting pattern, connector or wattage.", checks: ["Record the original motor wattage", "Compare the leg, shaft and mounting details", "Confirm the motor size before installation"], shopSearch: "blender motor" },
  { icon: Wrench, title: "Before ordering any repair part", body: "Use the exact model number, part number, dimensions and clear photos of the original part. This is especially important for mobile repair tools and appliance spare parts, where fitment and electrical specifications must be checked before purchase.", checks: ["Keep the model and part number", "Compare physical dimensions and connectors", "Contact the team if you need help identifying an item"], shopSearch: "repair" },
];

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Repair Tools, Solar & Spare-Part Guides | Asia Electronics Sri Lanka" },
      { name: "description", content: "Practical buying guides for phone repair tools, electronics workbenches, Jarrett solar panels and blender replacement motors in Sri Lanka." },
      { property: "og:title", content: "Repair Tools, Solar & Spare-Part Guides | Asia Electronics" },
      { property: "og:description", content: "Practical guidance for selecting repair tools, solar panels and appliance spare parts." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.asiaelectronics.lk/blog" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.asiaelectronics.lk/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  return <main>
    <section className="bg-ink py-12 text-ink-foreground sm:py-16"><div className="container-shop max-w-4xl">
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">Asia Electronics guides</p>
      <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight sm:text-5xl">Repair tools, solar panels and spare-part buying advice</h1>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-foreground/75 sm:text-base">Practical guidance based on our current catalogue of phone-repair tools, bench equipment, solar panels, blender motors and appliance spare parts.</p>
    </div></section>
    <section className="container-shop py-10 sm:py-14"><div className="max-w-3xl">
      <h2 className="font-display text-2xl font-black uppercase">Check compatibility first</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">A product name alone is not enough for a repair. Compare the original item’s model number, specifications, dimensions and connections before you order. When in doubt, send our team a clear photo and the relevant part number.</p>
    </div><div className="mt-8 grid gap-5 lg:grid-cols-2">{guides.map(({ icon: Icon, title, body, checks, shopSearch }) => <article key={title} className="flex flex-col border border-border bg-card p-6">
      <Icon className="h-7 w-7 text-primary" aria-hidden="true" /><h2 className="mt-5 font-display text-lg font-extrabold uppercase leading-snug">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      <ul className="mt-5 space-y-2 text-sm leading-6 text-muted-foreground">{checks.map((check) => <li key={check}>• {check}</li>)}</ul>
      <Link to="/shop" search={{ q: shopSearch }} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Browse relevant products <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </article>)}</div></section>
    <section className="border-y border-border bg-tile"><div className="container-shop grid gap-6 py-10 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <Wrench className="h-9 w-9 text-primary" aria-hidden="true" /><div><h2 className="font-display text-xl font-black uppercase">Need help identifying a part?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Send the model number, required quantity and clear photos of the original item. We can help you locate a suitable product from the current catalogue.</p></div>
      <Link to="/contact" className="inline-flex h-11 items-center justify-center bg-primary px-5 text-xs font-extrabold uppercase text-primary-foreground hover:bg-primary/90">Contact our team</Link>
    </div></section>
  </main>;
}
