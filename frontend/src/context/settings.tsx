import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchSettingsApi,
  updateSettingsApi,
  type ApiSettings,
  DEFAULT_SETTINGS,
} from "@/services/api";
import { cleanWhatsAppNumber } from "@/lib/config";

interface SettingsContextValue {
  settings: ApiSettings;
  whatsappDigits: string;
  updateSettings: (newSettings: Partial<ApiSettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  buildWhatsAppUrl: (message: string) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const SETTINGS_CACHE_KEY = "ae_public_settings_v1";

function readCachedSettings(): ApiSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) || "null");
    return cached && typeof cached === "object" ? cached as ApiSettings : null;
  } catch {
    return null;
  }
}

function cacheSettings(settings: ApiSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Settings are still fetched normally when browser storage is unavailable.
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ApiSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const cached = readCachedSettings();
    if (cached) setSettings(cached);
  }, []);

  const load = async () => {
    try {
      const data = await fetchSettingsApi();
      if (data) {
        setSettings(data);
        cacheSettings(data);
      }
    } catch (err) {
      console.warn("Failed to load settings from API, using defaults:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const whatsappDigits = cleanWhatsAppNumber(settings.whatsappNumber);

  const update = async (updates: Partial<ApiSettings>) => {
    const res = await updateSettingsApi(updates);
    if (res) {
      setSettings(res);
      cacheSettings(res);
      return true;
    }
    return false;
  };

  const buildWhatsAppUrl = (message: string) => {
    return `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        whatsappDigits,
        updateSettings: update,
        refreshSettings: load,
        buildWhatsAppUrl,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    const whatsappDigits = cleanWhatsAppNumber(DEFAULT_SETTINGS.whatsappNumber);
    return {
      settings: DEFAULT_SETTINGS,
      whatsappDigits,
      updateSettings: async () => false,
      refreshSettings: async () => {},
      buildWhatsAppUrl: (message: string) =>
        `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`,
    };
  }
  return ctx;
}
