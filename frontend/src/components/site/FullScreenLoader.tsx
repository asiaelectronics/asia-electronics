import { useEffect, useState } from "react";
import logoImg from "@/assets/imgs/logopng.png";
import { syncCatalogWithBackend } from "@/services/catalog";
import { fetchSettingsApi } from "@/services/api";

export function FullScreenLoader() {
  const [isReady, setIsReady] = useState(false);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Track initial application & backend / Supabase loading in background
    void syncCatalogWithBackend();
    void fetchSettingsApi().catch(() => null);

    // Document readiness check
    const docReadyPromise = new Promise<void>((resolve) => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        resolve();
      } else {
        const onReady = () => {
          window.removeEventListener("DOMContentLoaded", onReady);
          window.removeEventListener("load", onReady);
          resolve();
        };
        window.addEventListener("DOMContentLoaded", onReady);
        window.addEventListener("load", onReady);
      }
    });

    // Provide a brief, polished 350ms minimum display so brand logo is crisp without stalling
    const minDisplayPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, 350);
    });

    Promise.all([docReadyPromise, minDisplayPromise]).then(() => {
      if (isMounted) {
        setIsReady(true);
      }
    });

    // Safety fallback: reveal after max 650ms under any network conditions
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setIsReady(true);
      }
    }, 650);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Quick, smooth fade-out duration before removing from DOM
  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => {
      setIsRendered(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [isReady]);

  if (!isRendered) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Asiaelectronics"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background px-4 transition-opacity duration-300 ease-out select-none ${
        isReady ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Subtle radial ambient glow behind the loader */}
      <div
        className="pointer-events-none absolute h-64 w-64 rounded-full bg-primary/5 blur-3xl sm:h-80 sm:w-80"
        aria-hidden="true"
      />

      {/* Rotating Circular Loader with stationary Center Logo */}
      <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
        {/* Continuous rotating circular arcs ring */}
        <svg
          className="aec-loader-ring absolute inset-0 h-full w-full"
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Subtle faint orbital track */}
          <circle
            cx="70"
            cy="70"
            r="58"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="2"
          />

          {/* Primary Curved Arc: AEC Signature Red with rounded ends & glow */}
          <circle
            cx="70"
            cy="70"
            r="58"
            stroke="var(--primary)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="125 239.42"
            strokeDashoffset="0"
            className="aec-arc-primary"
          />

          {/* Secondary Curved Arc: Light Gray / Subtle White on opposite side */}
          <circle
            cx="70"
            cy="70"
            r="58"
            stroke="currentColor"
            strokeOpacity="0.32"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="85 279.42"
            strokeDashoffset="-182"
            className="aec-arc-secondary"
          />
        </svg>

        {/* Stationary Center AEC Logo */}
        <div className="relative z-10 flex items-center justify-center rounded-2xl overflow-hidden p-3 sm:p-3.5">
          <img
            src={logoImg}
            alt="Asia Electronic & Cellular"
            className="h-auto max-h-12 w-20 rounded-xl object-contain drop-shadow-sm sm:max-h-16 sm:w-24"
          />
        </div>
      </div>

      {/* "LOADING..." with subtle animated dot pulse effect */}
      <p className="mt-8 flex items-center justify-center font-display text-xs font-extrabold tracking-[0.28em] text-foreground/85 uppercase sm:text-sm">
        <span>LOADING</span>
        <span className="aec-loading-dot inline-block" style={{ animationDelay: "0ms" }}>
          .
        </span>
        <span className="aec-loading-dot inline-block" style={{ animationDelay: "220ms" }}>
          .
        </span>
        <span className="aec-loading-dot inline-block" style={{ animationDelay: "440ms" }}>
          .
        </span>
      </p>
    </div>
  );
}
