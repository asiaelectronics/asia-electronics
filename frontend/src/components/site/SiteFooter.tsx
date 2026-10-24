import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Logo } from "./SiteHeader";
import { useSettings } from "@/context/settings";

const policies = [
  { slug: "delivery", label: "Delivery information" },
  { slug: "returns", label: "Returns & refunds" },
  { slug: "warranty", label: "Warranty" },
  { slug: "privacy", label: "Privacy policy" },
  { slug: "terms", label: "Terms & conditions" },
];

export function SiteFooter() {
  const { settings, whatsappDigits } = useSettings();

  return (
    <footer className="mt-10 w-full max-w-full border-t border-border sm:mt-16">
      <div className="container-shop grid grid-cols-1 gap-x-8 gap-y-7 py-8 sm:grid-cols-2 sm:py-10 lg:grid-cols-4">
        <div className="min-w-0">
          <Logo />
          <div className="mt-4 space-y-1.5 text-sm text-muted-foreground sm:text-xs">
            <p>
              Email:{" "}
              <a
                href={`mailto:${settings.officeEmail}`}
                className="text-foreground hover:text-primary font-medium transition-colors [overflow-wrap:anywhere]"
              >
                {settings.officeEmail}
              </a>
            </p>
            <p>
              WhatsApp:{" "}
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] hover:underline font-mono font-medium"
              >
                {settings.whatsappNumber}
              </a>
            </p>
          </div>
          <Link
            to="/contact"
            className="group mt-3.5 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-all duration-200 hover:translate-x-1 active:scale-95"
          >
            <span>Contact page</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>
        <FooterCol title="Customer service">
          <FooterNavLink to="/account">My account</FooterNavLink>
          <FooterNavLink to="/cart">Cart</FooterNavLink>
          <FooterNavLink to="/contact">Contact us</FooterNavLink>
          <FooterNavLink to="/about">About us</FooterNavLink>
          <FooterNavLink to="/wholesale">Wholesale & bulk orders</FooterNavLink>
        </FooterCol>
        <FooterCol title="Policies">
          {policies.map((p) => (
            <FooterNavLink
              key={p.slug}
              to="/policy/$slug"
              params={{ slug: p.slug }}
            >
              {p.label}
            </FooterNavLink>
          ))}
        </FooterCol>
        <div className="min-w-0">
          <h3 className="text-xs font-extrabold uppercase tracking-wider">Store location</h3>
          <div className="relative mt-3 h-44 w-full max-w-full overflow-hidden border border-border bg-tile transition-colors hover:border-primary sm:h-32 lg:h-28">
            <iframe
              src="https://www.google.com/maps?q=60%201st%20Cross%20St%2C%20Colombo%2001100%2C%20Sri%20Lanka&output=embed"
              title="Asia Electronics store location"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-none block h-full w-full max-w-full border-0"
            />
            <a
              href="https://www.google.com/maps/search/?api=1&query=60%201st%20Cross%20St%2C%20Colombo%2001100%2C%20Sri%20Lanka"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0"
              aria-label="Open Asia Electronics store location in Google Maps"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground sm:mt-1.5 sm:text-[11px] sm:leading-4">
            60 1st Cross St, Colombo 01100
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-shop py-3.5 text-center text-[11px] text-muted-foreground">
          <p>© 2026 Asia Electronics and Cellular Pvt Ltd. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="text-xs font-extrabold uppercase tracking-wider">{title}</h3>
      <div className="mt-3 flex flex-col items-start gap-2.5 text-sm text-muted-foreground sm:gap-1.5">
        {children}
      </div>
    </div>
  );
}

function FooterNavLink({
  to,
  params,
  children,
}: {
  to: string;
  params?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      className="group relative inline-flex items-center gap-1.5 py-0.5 text-sm text-muted-foreground transition-all duration-200 ease-out hover:text-primary hover:translate-x-1.5 active:scale-[0.96] active:translate-x-2"
    >
      <ChevronRight
        className="h-3.5 w-3.5 -ml-4 opacity-0 transition-all duration-200 ease-out group-hover:ml-0 group-hover:opacity-100 text-primary shrink-0"
        aria-hidden="true"
      />
      <span className="relative">
        {children}
        <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full" />
      </span>
    </Link>
  );
}
