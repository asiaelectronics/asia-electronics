import { createFileRoute } from "@tanstack/react-router";
import {
  AudioLines,
  CircuitBoard,
  ExternalLink,
  Lightbulb,
  Mail,
  MapPin,
  MessageSquare,
  PackageSearch,
  Phone,
  Smartphone,
} from "lucide-react";
import { PageHeading } from "@/components/site/PageHeading";
import { useSettings } from "@/context/settings";

const enquiryTypes = [
  { icon: CircuitBoard, label: "Electronic components and spare parts" },
  { icon: Lightbulb, label: "Lighting and electrical products" },
  { icon: AudioLines, label: "Audio equipment and accessories" },
  { icon: Smartphone, label: "Mobile repair parts and accessories" },
];

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Asiaelectronics" },
      {
        name: "description",
        content:
          "Contact Asiaelectronics for products, parts, availability, and directions.",
      },
      { property: "og:title", content: "Contact Us — Asiaelectronics" },
      {
        property: "og:description",
        content: "Get in touch with Asiaelectronics.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { settings, whatsappDigits } = useSettings();

  return (
    <>
      <PageHeading title="Contact Us" />
      <div className="container-shop grid gap-8 pb-16 lg:grid-cols-2">
        <section className="border border-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Official AEC Business Inquiries
          </h2>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Reach our customer service and parts specialists directly via official WhatsApp, office
            email, or telephone.
          </p>

          <dl className="mt-5 divide-y divide-border border border-border text-sm">
            <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="flex items-center gap-2 font-bold">
                <MessageSquare className="h-4 w-4 text-[#25D366]" /> Official WhatsApp
              </dt>
              <dd>
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hello Asia Electronics, I would like to inquire about parts.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-primary hover:underline"
                >
                  {settings.whatsappNumber}
                </a>
              </dd>
            </div>

            <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="flex items-center gap-2 font-bold">
                <Mail className="h-4 w-4 text-orange-500" /> Office Email
              </dt>
              <dd>
                <a
                  href={`mailto:${settings.officeEmail}`}
                  className="break-all font-mono font-bold text-primary hover:underline"
                >
                  {settings.officeEmail}
                </a>
              </dd>
            </div>

            <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="flex items-center gap-2 font-bold">
                <Phone className="h-4 w-4 text-muted-foreground" /> Voice Hotline
              </dt>
              <dd className="font-mono text-muted-foreground">{settings.phone}</dd>
            </div>

            <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <dt className="flex shrink-0 items-center gap-2 font-bold">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Location
              </dt>
              <dd className="max-w-sm text-muted-foreground sm:text-right">
                {settings.address || "60 1st Cross St, Colombo 01100, Sri Lanka"}
              </dd>
            </div>
          </dl>
        </section>

        <div className="space-y-5">
          <section className="border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider">How we can help</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Contact our team for availability, prices, technical details, bulk orders, and
                  help finding the correct replacement part.
                </p>
              </div>
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {enquiryTypes.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 bg-tile p-3 text-xs font-semibold"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-border bg-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider">Before you contact us</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              For a faster response, send the product name, model or part number, required quantity,
              and a clear photo when applicable. Our team can then check the correct item and
              current availability.
            </p>

            <a
              href="https://www.google.com/maps/search/?api=1&query=60%201st%20Cross%20St%2C%20Colombo%2001100%2C%20Sri%20Lanka"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 items-center gap-2 bg-ink px-5 text-xs font-bold uppercase text-ink-foreground transition-colors hover:bg-primary"
            >
              <MapPin className="h-4 w-4" /> Get directions
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
