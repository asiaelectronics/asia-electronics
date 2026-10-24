import { createFileRoute, Link } from "@tanstack/react-router";
import componentsImg from "@/assets/imgs/ics-repair-components-v1.png";
import solarImg from "@/assets/imgs/power-solar-batteries.png";
import repairImg from "@/assets/imgs/tools-installation-supplies.png";
import lightingImg from "@/assets/imgs/lighting.png";
import audioImg from "@/assets/imgs/audio-music.png";
import mobileImg from "@/assets/imgs/mobile-parts-accessories.png";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Headphones,
  Lightbulb,
  MapPin,
  MessageCircle,
  Microchip,
  Smartphone,
  Truck,
  ShieldCheck,
  Sun,
  Wrench,
} from "lucide-react";
import { PageHeading } from "@/components/site/PageHeading";
import { useSettings } from "@/context/settings";

const FACEBOOK_URL =
  "https://www.facebook.com/p/Asia-Electronics-And-Cellular-Pvt-Ltd-100067031593071/";

const specialties = [
  {
    title: "ICs & repair components",
    description:
      "ICs, IGBTs, resistors, capacitors, sensors, modules and tools for repair and projects.",
    image: componentsImg,
  },
  {
    title: "Solar & electrical",
    description: "Solar panels, controllers, inverters, batteries and electrical solutions.",
    image: solarImg,
  },
  {
    title: "Repair equipment",
    description: "Soldering stations, meters, microscopes and practical equipment for technicians.",
    image: repairImg,
  },
  {
    title: "Lighting",
    description:
      "A wide lighting range, from chandeliers and decorative fittings to practical LED bulbs.",
    image: lightingImg,
  },
  {
    title: "Audio Equipment",
    description:
      "Home and professional audio equipment, speakers, accessories and replacement parts.",
    image: audioImg,
  },
  {
    title: "Mobile Parts",
    description: "Popular mobile repair parts and accessories for technicians and device owners.",
    image: mobileImg,
  },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Asiaelectronics" },
      {
        name: "description",
        content:
          "Learn about Asia Electronics and Cellular Pvt Ltd, an electronics, lighting, audio and mobile parts retailer in Colombo 01100, Sri Lanka.",
      },
      { property: "og:title", content: "About Asiaelectronics" },
      {
        property: "og:description",
        content:
          "Electronic components, lighting, audio equipment and mobile repair parts from Colombo 01100, with islandwide delivery available.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.asiaelectronics.lk/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { settings, buildWhatsAppUrl } = useSettings();

  return (
    <>
      <PageHeading title="About Us" />

      <main className="container-shop pb-16 sm:pb-20">
        <section className="relative overflow-hidden bg-ink px-6 py-10 text-ink-foreground sm:px-10 sm:py-14 lg:px-14">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">
              Serving Sri Lanka since 1983
            </p>
            <h2 className="mt-4 font-display text-3xl font-black uppercase leading-tight sm:text-4xl lg:text-5xl">
              A trusted electronics supplier for over four decades
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-foreground/75 sm:text-base">
              Asia Electronics and Cellular Pvt Ltd is a direct importer, distributor and supplier
              of electronic products, components, equipment and accessories. We support retailers,
              wholesalers, professional technicians, repair centres, businesses, institutions and
              industrial clients across Sri Lanka.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex h-11 items-center gap-2 bg-primary px-5 text-xs font-extrabold uppercase text-primary-foreground transition-opacity hover:opacity-90"
              >
                Explore products <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={buildWhatsAppUrl(
                  "Hello Asia Electronics, I would like to inquire about your products.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 border border-white/25 px-5 text-xs font-extrabold uppercase transition-colors hover:border-white hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp us
              </a>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
              What we offer
            </p>
            <h2 className="mt-2 font-display text-2xl font-black uppercase sm:text-3xl">
              A broad range for every electronics need
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              From a single replacement component to equipment for a complete installation, our
              product selection brings together essential electronics and specialist categories.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialties.map(({ title, description, image }) => (
              <article key={title} className="border border-border bg-card p-5">
                <img src={image} alt="" className="h-32 w-full object-cover" loading="lazy" />
                <h3 className="mt-5 font-display text-sm font-extrabold uppercase">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 border-y border-border py-10 sm:grid-cols-3">
          {[
            ["40+ years", "Established in 1983 with deep industry experience."],
            ["Direct supply", "Reliable sourcing, availability and competitive value."],
            ["Built on trust", "Professional service and long-term customer relationships."],
          ].map(([title, description]) => (
            <div key={title} className="flex gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-display text-sm font-extrabold uppercase">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid overflow-hidden border border-border lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-tile p-6 sm:p-9">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
              Visit our store
            </p>
            <h2 className="mt-2 font-display text-2xl font-black uppercase">Find us in Colombo</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              Visit our 1st Cross Street store to explore the range and speak with our team, or contact
              us before your visit to confirm availability. Islandwide delivery is also available
              for selected orders.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-extrabold uppercase">Address</p>
                  <address className="mt-1 text-sm not-italic leading-6 text-muted-foreground">
                    60 1st Cross St
                    <br />
                    Colombo 01100, Sri Lanka
                  </address>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-extrabold uppercase">Opening hours</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Monday–Friday: 9:30 AM–6:30 PM
                    <br />
                    Saturday: 9:30 AM–5:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-primary p-6 text-primary-foreground sm:p-9">
            <div>
              <Truck className="h-9 w-9" />
              <h2 className="mt-5 font-display text-2xl font-black uppercase">
                Islandwide delivery available
              </h2>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
                Ask our team about product availability, delivery options and ordering through
                WhatsApp.
              </p>
            </div>
            <div className="mt-8 space-y-3 border-t border-primary-foreground/25 pt-6 text-sm">
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="block font-bold hover:underline"
              >
                Call: {settings.phone}
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 font-bold hover:underline"
              >
                View all contact details <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="/aec-company-profile.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block font-bold hover:underline"
              >
                Download company profile
              </a>
            </div>
          </div>
        </section>

        <section className="mt-10 bg-tile p-6 sm:p-9">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
            Our philosophy
          </p>
          <h2 className="mt-2 font-display text-2xl font-black uppercase">
            Build trust. Deliver value. Grow together.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            We continue to expand our range, improve sourcing and embrace new technologies so every
            customer can find reliable, practical products that offer value.
          </p>
          <Link
            to="/wholesale"
            className="mt-6 inline-flex h-11 items-center gap-2 bg-primary px-5 text-xs font-extrabold uppercase text-primary-foreground"
          >
            Wholesale & bulk enquiries <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="mt-10 flex flex-col gap-5 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-black uppercase">Follow our latest updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              See new arrivals, product demonstrations and current offers on our official Facebook
              page.
            </p>
          </div>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 border border-border px-5 text-xs font-extrabold uppercase transition-colors hover:border-primary hover:text-primary"
          >
            Visit Facebook <ExternalLink className="h-4 w-4" />
          </a>
        </section>
      </main>
    </>
  );
}
