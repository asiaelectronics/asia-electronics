import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Cookie,
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCookieConsent,
  saveCookieConsent,
  OPEN_COOKIE_PREFERENCES_EVENT,
  type CookieConsentPreferences,
} from "@/lib/cookies";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Preference toggles
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);
  const [marketingAllowed, setMarketingAllowed] = useState(true);

  useEffect(() => {
    // Check if consent has already been saved
    const existing = getCookieConsent();
    if (!existing) {
      // Small delay on first load so it appears gracefully after page paint
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => {
        clearTimeout(timer);
      };
    }
    setAnalyticsAllowed(existing.analytics);
    setMarketingAllowed(existing.marketing);
    return undefined;
  }, []);

  // Listen for the custom event to reopen preferences anytime (e.g. from footer)
  useEffect(() => {
    const handleOpen = () => {
      const existing = getCookieConsent();
      if (existing) {
        setAnalyticsAllowed(existing.analytics);
        setMarketingAllowed(existing.marketing);
      }
      setShowDetailsModal(true);
    };

    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpen);
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({
      analytics: true,
      marketing: true,
    });
    setIsVisible(false);
    setShowDetailsModal(false);
    toast.success("Cookie preferences saved. Thank you!");
  };

  const handleAcceptEssentialOnly = () => {
    saveCookieConsent({
      analytics: false,
      marketing: false,
    });
    setAnalyticsAllowed(false);
    setMarketingAllowed(false);
    setIsVisible(false);
    setShowDetailsModal(false);
    toast.info("Essential cookies enabled. Optional cookies declined.");
  };

  const handleSaveCustom = () => {
    saveCookieConsent({
      analytics: analyticsAllowed,
      marketing: marketingAllowed,
    });
    setIsVisible(false);
    setShowDetailsModal(false);
    toast.success("Custom cookie preferences saved.");
  };

  return (
    <>
      {/* ─── Bottom Floating Consent Banner ─── */}
      {isVisible && !showDetailsModal && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-6 sm:max-w-xl sm:right-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-zinc-950/95 text-white border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Cookie &amp; Website Preferences
                </h3>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                  We use cookies and local storage to remember your shopping cart items, process quotations, 
                  and deliver a smooth browsing experience on{" "}
                  <strong className="text-white">Asia Electronics &amp; Cellular</strong>.
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px]">
                  <Link
                    to="/policy/$slug"
                    params={{ slug: "cookies" }}
                    className="text-orange-400 hover:text-orange-300 underline font-medium inline-flex items-center gap-0.5"
                  >
                    <span>Read Cookie Policy</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(true)}
                    className="text-zinc-400 hover:text-white underline font-medium inline-flex items-center gap-1"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Customize Details</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleAcceptEssentialOnly}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-95"
              >
                Accept All Cookies
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ─── Detailed Preferences Modal ─── */}
      {showDetailsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetailsModal(false);
          }}
        >
          <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="cookie-settings-title" className="text-sm sm:text-base font-extrabold text-white">
                    Cookie &amp; Website Details
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Asia Electronics &amp; Cellular (asiaelectronics.lk)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Cookie Categories */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                We respect your privacy choices. Below you can manage your preferences for the different types of cookies and local storage used on our website.
              </p>

              {/* 1. Essential Cookies */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Strictly Necessary Cookies
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Always Active
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Required for essential store operations: maintaining your shopping cart, saving quotation requests, secure user authentication, and inventory caching. The website cannot function properly without these.
                </p>
                <div className="pt-1 text-[11px] font-mono text-zinc-500">
                  Examples: <code>ae_cart_items_v2</code>, <code>ae_auth_token_v1</code>, <code>ae_cookie_consent_v1</code>
                </div>
              </div>

              {/* 2. Analytics Cookies */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Analytics &amp; Performance Cookies
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Allows us to count visits and traffic sources to measure and improve the speed and responsiveness of our electronics catalog. All data is anonymous and aggregated.
                </p>
                <div className="pt-1 text-[11px] font-mono text-zinc-500">
                  Examples: Vercel Speed Insights, Anonymous product view counter
                </div>
              </div>

              {/* 3. Marketing & Functionality Cookies */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Personalization &amp; WhatsApp Integration
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingAllowed}
                      onChange={(e) => setMarketingAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Remembers your currency preferences, recent component searches, and enables direct WhatsApp click-to-chat inquiry pre-fills with product codes.
                </p>
                <div className="pt-1 text-[11px] font-mono text-zinc-500">
                  Examples: WhatsApp inquiry routing, currency filter preferences
                </div>
              </div>

              {/* Link to Full Cookie Policy */}
              <div className="pt-2 text-center">
                <Link
                  to="/policy/$slug"
                  params={{ slug: "cookies" }}
                  onClick={() => setShowDetailsModal(false)}
                  className="text-orange-400 hover:text-orange-300 underline font-semibold inline-flex items-center gap-1"
                >
                  <span>View our full Cookie &amp; Privacy Policy</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleAcceptEssentialOnly}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Reject Non-Essential
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors"
                >
                  Save My Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-95"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
