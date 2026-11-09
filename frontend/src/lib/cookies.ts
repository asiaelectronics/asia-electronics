/**
 * Asia Electronics & Cellular - Cookie Consent & Preferences Management
 * Handles persistent storage across localStorage and HTTP cookies, ensuring
 * GDPR, CCPA and local privacy compliance for storefront visitors.
 */

export interface CookieConsentPreferences {
  essential: true; // Always required for cart, checkout & security
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export const COOKIE_CONSENT_KEY = "ae_cookie_consent_v1";
export const COOKIE_CONSENT_EVENT = "ae-cookie-consent-updated";
export const OPEN_COOKIE_PREFERENCES_EVENT = "ae-open-cookie-preferences";
export const CURRENT_CONSENT_VERSION = "1.0.0";

/**
 * Reads a raw cookie string by name from document.cookie
 */
function getRawCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match && match[3] ? decodeURIComponent(match[3]) : null;
}

/**
 * Sets a persistent browser cookie with 365-day lifetime and SameSite=Lax
 */
function setRawCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

/**
 * Retrieves the stored cookie consent preferences, checking localStorage first,
 * then falling back to document.cookie.
 */
export function getCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const fromLocal = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (fromLocal) {
      const parsed = JSON.parse(fromLocal);
      if (parsed && typeof parsed === "object" && parsed.essential === true) {
        return parsed as CookieConsentPreferences;
      }
    }
  } catch {
    // Fall back to cookie
  }

  try {
    const fromCookie = getRawCookie(COOKIE_CONSENT_KEY);
    if (fromCookie) {
      const parsed = JSON.parse(fromCookie);
      if (parsed && typeof parsed === "object" && parsed.essential === true) {
        return parsed as CookieConsentPreferences;
      }
    }
  } catch {
    // Return null if malformed
  }

  return null;
}

/**
 * Saves cookie consent preferences to both localStorage and document.cookie.
 * Dispatches an event so all components react immediately.
 */
export function saveCookieConsent(
  prefs: Omit<CookieConsentPreferences, "essential" | "timestamp" | "version">,
): CookieConsentPreferences {
  const fullPrefs: CookieConsentPreferences = {
    essential: true,
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    timestamp: new Date().toISOString(),
    version: CURRENT_CONSENT_VERSION,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(fullPrefs));
    } catch (e) {
      console.warn("Could not save cookie consent to localStorage:", e);
    }

    try {
      setRawCookie(COOKIE_CONSENT_KEY, JSON.stringify(fullPrefs), 365);
    } catch (e) {
      console.warn("Could not write consent cookie:", e);
    }

    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: fullPrefs }));
  }

  return fullPrefs;
}

/**
 * Checks whether the user has already made a consent choice.
 */
export function hasCookieConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Triggers the preferences dialog to open from anywhere (e.g. footer link).
 */
export function openCookiePreferences(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
  }
}
