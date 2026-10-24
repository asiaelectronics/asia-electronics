import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  Eye,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  ExternalLink,
  ImageIcon,
  List,
  PlusCircle,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { adminStyles } from "@/components/admin/shared";
import logoImg from "@/assets/imgs/logopng.png";
import { useAuth } from "@/context/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Asiaelectronics" }, { name: "robots", content: "noindex, nofollow" }],
    links: [
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
  { to: "/admin/products", label: "Products", icon: <Package className="h-4 w-4" />, exact: false },
  { to: "/admin/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" />, exact: false },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    exact: false,
  },
  {
    to: "/admin/offers",
    label: "Homepage Offers",
    icon: <ImageIcon className="h-4 w-4" />,
    exact: false,
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
    exact: false,
  },
] as const;

const TITLES: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/products": "Product Management",
  "/admin/orders": "Order Management",
  "/admin/inventory": "Inventory",
  "/admin/analytics": "Analytics",
  "/admin/offers": "Homepage Offers",
  "/admin/settings": "Settings",
};

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { logout, user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const productAction = useRouterState({
    select: (s) => (s.location.search as { action?: string }).action,
  });
  const [productsMenuOpen, setProductsMenuOpen] = useState(pathname.startsWith("/admin/products"));
  const title = TITLES[pathname] ?? "Admin";

  useEffect(() => {
    if (pathname.startsWith("/admin/products")) setProductsMenuOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateMobileState = () => setIsMobile(mediaQuery.matches);
    updateMobileState();
    mediaQuery.addEventListener("change", updateMobileState);
    return () => mediaQuery.removeEventListener("change", updateMobileState);
  }, []);

  if (isLoading || !isAdmin) {
    return null;
  }

  if (isMobile && pathname !== "/admin/inventory") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <div className="max-w-sm space-y-4">
          <h1 className="text-2xl font-bold">Desktop access required</h1>
          <p className="text-sm leading-6 text-zinc-400">
            The admin dashboard is not available on mobile devices. Please use a desktop or laptop.
          </p>
          <Link
            to="/"
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Return to store
          </Link>
        </div>
      </main>
    );
  }
  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <>
      <style>{adminStyles}</style>
      <div
        className="min-h-screen"
        style={{
          background: "oklch(0.10 0.004 270)",
          color: "oklch(0.9 0.004 270)",
          fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div className="flex h-screen overflow-hidden">
          {/* â”€â”€ Sidebar â”€â”€ */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:static lg:flex transition-transform duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
            style={{
              background: "oklch(0.11 0.004 270)",
              borderRight: "1px solid oklch(0.18 0.004 270)",
            }}
          >
            {/* Logo */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: "oklch(0.18 0.004 270)" }}
            >
              <Link
                to="/"
                className="flex items-center gap-3 group"
                title="Return to customer store"
              >
                <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-white/10 group-hover:scale-105 transition-transform overflow-hidden">
                  <img
                    src={logoImg}
                    alt="Asia Electronics Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-black text-white tracking-tight">
                    ASIA<span style={{ color: "oklch(0.65 0.235 22)" }}>ELECTRONICS</span>
                  </p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    Admin Panel
                  </p>
                </div>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <p className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Main
              </p>
              {NAV.map((item) => {
                const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to);

                if (item.to === "/admin/products") {
                  const addActive = isActive && productAction === "add";
                  const brandsActive = isActive && productAction === "brands";
                  const listActive = isActive && !productAction;

                  return (
                    <div key={item.to}>
                      <button
                        type="button"
                        onClick={() => setProductsMenuOpen((open) => !open)}
                        aria-expanded={productsMenuOpen}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          isActive
                            ? "text-white"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        }`}
                        style={
                          isActive
                            ? {
                                background:
                                  "linear-gradient(135deg, oklch(0.58 0.235 22 / 20%), oklch(0.58 0.235 22 / 10%))",
                                color: "oklch(0.8 0.15 22)",
                              }
                            : {}
                        }
                      >
                        <span className={isActive ? "text-orange-400" : ""}>{item.icon}</span>
                        {item.label}
                        {productsMenuOpen ? (
                          <ChevronDown className="h-3 w-3 ml-auto text-orange-400/60" />
                        ) : (
                          <ChevronRight className="h-3 w-3 ml-auto text-zinc-600" />
                        )}
                      </button>

                      {productsMenuOpen && (
                        <div className="ml-5 mt-1 space-y-0.5 border-l border-zinc-800 pl-3">
                          <Link
                            to="/admin/products"
                            search={{ action: "add" }}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                              addActive
                                ? "bg-orange-500/10 text-orange-300"
                                : "text-zinc-500 hover:bg-zinc-800/50 hover:text-white"
                            }`}
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Product
                          </Link>
                          <Link
                            to="/admin/products"
                            search={{}}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                              listActive
                                ? "bg-orange-500/10 text-orange-300"
                                : "text-zinc-500 hover:bg-zinc-800/50 hover:text-white"
                            }`}
                          >
                            <List className="h-3.5 w-3.5" />
                            View Existing Products
                          </Link>
                          <Link
                            to="/admin/products"
                            search={{ action: "brands" }}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                              brandsActive
                                ? "bg-orange-500/10 text-orange-300"
                                : "text-zinc-500 hover:bg-zinc-800/50 hover:text-white"
                            }`}
                          >
                            <Tag className="h-3.5 w-3.5" />
                            Brands &amp; Logos
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, oklch(0.58 0.235 22 / 20%), oklch(0.58 0.235 22 / 10%))",
                            color: "oklch(0.8 0.15 22)",
                          }
                        : {}
                    }
                  >
                    <span className={isActive ? "text-orange-400" : ""}>{item.icon}</span>
                    {item.label}
                    {isActive && <ChevronRight className="h-3 w-3 ml-auto text-orange-400/50" />}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom user strip */}
            <div
              className="p-3 border-t space-y-2"
              style={{ borderColor: "oklch(0.18 0.004 270)" }}
            >
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "oklch(0.14 0.004 270)" }}
              >
                <Link
                  to="/admin/settings"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Open admin settings"
                  title="Admin settings"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-xs font-black text-white transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  A
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">Admin</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user?.email ?? ""}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Sign out & return to customer portal"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* â”€â”€ Main â”€â”€ */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top bar */}
            <header
              className="flex items-center gap-4 px-6 py-4 border-b shrink-0"
              style={{
                background: "oklch(0.11 0.004 270)",
                borderColor: "oklch(0.18 0.004 270)",
              }}
            >
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-zinc-400 hover:text-white"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded bg-white p-0.5 flex items-center justify-center shrink-0 lg:hidden shadow-xs">
                  <img
                    src={logoImg}
                    alt="Asia Electronics Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h1
                    className="text-base font-black text-white"
                    style={{ fontFamily: "Montserrat, ui-sans-serif" }}
                  >
                    {title}
                  </h1>
                  <p className="text-[10px] text-zinc-500">
                    Asiaelectronics · Admin Portal
                  </p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-orange-400" />
                  Exit Admin
                </button>
              </div>
            </header>

            {/* Page outlet */}
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
