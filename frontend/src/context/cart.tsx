import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getStoredProducts } from "@/services/catalog";
import type { Product } from "@/lib/types";
import { trackProductAnalyticsEvent } from "@/services/api";

export interface CartLine {
  key: string;
  productId: string;
  variant?: string | undefined;
  qty: number;
}

type Action =
  | { type: "add"; productId: string; variant?: string | undefined; qty: number }
  | { type: "set"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "ae-demo-cart";
const findProduct = (id: string) => getStoredProducts().find((p) => p.id === id);
const cap = (id: string, qty: number) => Math.max(0, Math.min(qty, findProduct(id)?.stock ?? 0));

export function reducer(state: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case "add": {
      const key = `${a.productId}::${a.variant ?? ""}`;
      const existing = state.find((l) => l.key === key);
      // stock cap is per product across variants
      const otherQty = state
        .filter((l) => l.productId === a.productId && l.key !== key)
        .reduce((s, l) => s + l.qty, 0);
      const stock = findProduct(a.productId)?.stock ?? 0;
      const next = Math.min((existing?.qty ?? 0) + a.qty, Math.max(0, stock - otherQty));
      if (next <= 0) return state;
      if (existing) return state.map((l) => (l.key === key ? { ...l, qty: next } : l));
      return [...state, { key, productId: a.productId, variant: a.variant, qty: next }];
    }
    case "set": {
      const line = state.find((l) => l.key === a.key);
      if (!line) return state;
      const otherQty = state
        .filter((l) => l.productId === line.productId && l.key !== a.key)
        .reduce((s, l) => s + l.qty, 0);
      const stock = findProduct(line.productId)?.stock ?? 0;
      const qty = Math.min(Math.max(1, a.qty), Math.max(1, stock - otherQty));
      return state.map((l) => (l.key === a.key ? { ...l, qty } : l));
    }
    case "remove":
      return state.filter((l) => l.key !== a.key);
    case "clear":
      return [];
    case "hydrate":
      return a.lines
        .filter((l) => findProduct(l.productId))
        .map((l) => ({ ...l, qty: cap(l.productId, l.qty) }))
        .filter((l) => l.qty > 0);
  }
}

export const DELIVERY_FLAT_CENTS = 450_00;
export const FREE_DELIVERY_OVER_CENTS = 25_000_00;

interface CartCtx {
  lines: (CartLine & { product: Product; lineTotal: number })[];
  count: number;
  subtotal: number;
  delivery: number;
  total: number;
  add: (productId: string, qty?: number, variant?: string) => void | undefined;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  remainingFor: (productId: string) => number;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, []);
  const hydrated = useRef(false);
  const [catalogReady, setCatalogReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", lines: JSON.parse(raw) });
    } catch {
      /* ignore corrupt storage */
    }
    hydrated.current = true;
    // Browser catalogue storage can differ from SSR seed data. Do not use it
    // for button availability until React has completed its first hydration.
    setCatalogReady(true);
  }, []);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<CartCtx>(() => {
    const lines = state.flatMap((l) => {
      const product = findProduct(l.productId);
      return product ? [{ ...l, product, lineTotal: product.priceCents * l.qty }] : [];
    });
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const delivery =
      subtotal === 0 || subtotal >= FREE_DELIVERY_OVER_CENTS ? 0 : DELIVERY_FLAT_CENTS;
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      delivery,
      total: subtotal + delivery,
      add: (productId, qty = 1, variant) => {
        dispatch({ type: "add", productId, qty, variant });
        trackProductAnalyticsEvent(productId, "add_to_cart");
      },
      setQty: (key, qty) => dispatch({ type: "set", key, qty }),
      remove: (key) => dispatch({ type: "remove", key }),
      clear: () => dispatch({ type: "clear" }),
      remainingFor: (productId) =>
        (!catalogReady ? Number.MAX_SAFE_INTEGER : (findProduct(productId)?.stock ?? 0)) -
        state.filter((l) => l.productId === productId).reduce((s, l) => s + l.qty, 0),
    };
  }, [catalogReady, state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
