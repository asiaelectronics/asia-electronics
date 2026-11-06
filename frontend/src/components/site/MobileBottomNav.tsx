import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Bookmark, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart";

interface MobileBottomNavProps {
  onCategoryDrawerOpen: () => void;
  onBrandsDrawerOpen: () => void;
}

export function MobileBottomNav({
  onCategoryDrawerOpen,
  onBrandsDrawerOpen,
}: MobileBottomNavProps) {
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isHome = pathname === "/";
  const isCart = pathname === "/cart";
  const isShop = pathname === "/shop";

  const itemCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors outline-none select-none
    ${active ? "text-primary" : "text-zinc-500 hover:text-zinc-800 active:text-primary"}`;

  return (
    <>
      {/* Spacer for the fixed bar is rendered in the root layout after the footer */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white border-t border-zinc-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-14 items-stretch">
          {/* Home */}
          <Link
            to="/"
            aria-label="Home"
            aria-current={isHome ? "page" : undefined}
            className={itemCls(isHome)}
          >
            <Home className="h-5 w-5 shrink-0" />
            <span>Home</span>
          </Link>

          {/* Categories — opens the mobile drawer */}
          <button
            type="button"
            aria-label="Browse categories"
            onClick={onCategoryDrawerOpen}
            className={itemCls(isShop)}
          >
            <LayoutGrid className="h-5 w-5 shrink-0" />
            <span>Category</span>
          </button>

          {/* Brands — opens the brands drawer */}
          <button
            type="button"
            aria-label="Browse brands"
            onClick={onBrandsDrawerOpen}
            className={itemCls(false)}
          >
            <Bookmark className="h-5 w-5 shrink-0" />
            <span>Brands</span>
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label={`Cart, ${count} item${count !== 1 ? "s" : ""}`}
            aria-current={isCart ? "page" : undefined}
            className={itemCls(isCart)}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 shrink-0" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
            <span>Cart</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
