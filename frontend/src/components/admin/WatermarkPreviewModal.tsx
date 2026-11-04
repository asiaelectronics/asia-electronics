import React, { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Layers,
  Upload,
  RotateCcw,
  Database,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { fetchProductApi } from "@/services/api";
import {
  applyWatermarkToImage,
  WATERMARK_LOGO_URL,
  LOCAL_FALLBACK_LOGO_URL,
  type WatermarkLogoPosition,
  type WatermarkTextPosition,
} from "@/lib/watermark";

interface WatermarkPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyWatermark: (
    productId: string,
    watermarkedImages: string[],
    originalImages: string[],
  ) => Promise<boolean>;
  targetProduct?: Product | null;
}

type SampleMode = "product" | "square" | "portrait" | "landscape" | "transparent";

export function WatermarkPreviewModal({
  isOpen,
  onClose,
  products,
  onApplyWatermark,
  targetProduct = null,
}: WatermarkPreviewModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return targetProduct ? targetProduct.id : products[0]?.id || "";
  });

  // Keep selectedProductId in sync when targetProduct changes
  useEffect(() => {
    if (targetProduct) {
      setSelectedProductId(targetProduct.id);
    }
  }, [targetProduct]);

  // Direct database product state
  const [dbProduct, setDbProduct] = useState<Product | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);

  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [originalSrc, setOriginalSrc] = useState<string>("");
  const [watermarkedSrc, setWatermarkedSrc] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [logoOpacity, setLogoOpacity] = useState<number>(0.9);
  const [textOpacity, setTextOpacity] = useState<number>(0.32);
  const [logoPosition, setLogoPosition] = useState<WatermarkLogoPosition>("top-left");
  const [textPosition, setTextPosition] = useState<WatermarkTextPosition>("bottom-center");
  const [sampleMode, setSampleMode] = useState<SampleMode>("product");

  // Per-slot override: when the DB original is stale/watermarked, the user can
  // upload a fresh clean image directly inside this modal. Key = `${productId}-${slotIndex}`.
  const [freshOriginals, setFreshOriginals] = useState<Record<string, string>>({});
  const freshUploadRef = useRef<HTMLInputElement>(null);

  // Load the fresh product directly from the database whenever modal is open and productId is set
  const loadProductFromDb = async (id: string, selectLast = true) => {
    if (!id) return;
    setIsLoadingDb(true);
    try {
      const data = await fetchProductApi(id);
      if (data) {
        setDbProduct(data);
        const total = Math.max(data.images?.length || 0, data.originalImages?.length || 0);
        if (total > 0 && selectLast) {
          // Default to the LAST image in the database as requested
          setActiveImgIndex(total - 1);
        }
      }
    } catch (err) {
      console.warn("Could not fetch latest product from database:", err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedProductId) {
      void loadProductFromDb(selectedProductId, true);
    }
  }, [isOpen, selectedProductId]);

  // Prefer fresh database data first, then cached catalog products
  const currentProduct =
    dbProduct || products.find((p) => p.id === selectedProductId) || targetProduct || products[0];

  const outputAspectRatio =
    sampleMode === "square"
      ? 1
      : sampleMode === "landscape"
        ? 16 / 9
        : sampleMode === "portrait"
          ? 3 / 4
          : undefined;

  // ── Resolve source images ───────────────────────────────────────────────────
  // Build a per-slot resolved list covering all images.
  const displayImages: string[] = currentProduct?.images ?? [];
  const storedOriginals: string[] =
    currentProduct &&
    Array.isArray(currentProduct.originalImages) &&
    currentProduct.originalImages.length > 0
      ? currentProduct.originalImages
      : displayImages;

  const maxLen = Math.max(displayImages.length, storedOriginals.length);
  const resolvedOriginals: string[] = Array.from({ length: maxLen }).map((_, i) => {
    const slotKey = `${selectedProductId}-${i}`;
    // 1. Fresh user upload takes top priority
    if (freshOriginals[slotKey]) return freshOriginals[slotKey];
    // 2. Use stored original if available in DB
    if (storedOriginals[i]) return storedOriginals[i];
    // 3. Fallback to display image
    return displayImages[i] || "";
  });

  const gallerySize = maxLen;

  // Check if active slot has a user override
  const activeSlotKey = `${selectedProductId}-${activeImgIndex}`;
  const hasUserOverride = Boolean(freshOriginals[activeSlotKey]);

  // ── Sync originalSrc whenever product / index / overrides change ────────────
  useEffect(() => {
    let source = "";
    if (currentProduct && resolvedOriginals.length > 0) {
      const safeIdx = Math.min(activeImgIndex, resolvedOriginals.length - 1);
      source = resolvedOriginals[safeIdx] || resolvedOriginals[0] || "";
    }
    setWatermarkedSrc("");
    if (!source) setIsProcessing(false);
    setOriginalSrc(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, activeImgIndex, currentProduct, freshOriginals, resolvedOriginals.length]);

  // ── Generate watermark preview whenever source or settings change ───────────
  useEffect(() => {
    if (!originalSrc) return;
    let cancelled = false;
    setIsProcessing(true);

    applyWatermarkToImage(originalSrc, {
      logoOpacity,
      textOpacity,
      logoPosition,
      textPosition,
      ...(outputAspectRatio ? { outputAspectRatio } : {}),
      logoUrl: WATERMARK_LOGO_URL,
    })
      .then((res) => {
        if (!cancelled) {
          setWatermarkedSrc(res.dataUrl);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        console.warn("Watermarking preview error, retrying fallback:", err);
        applyWatermarkToImage(originalSrc, {
          logoOpacity,
          textOpacity,
          logoPosition,
          textPosition,
          ...(outputAspectRatio ? { outputAspectRatio } : {}),
          logoUrl: LOCAL_FALLBACK_LOGO_URL,
        })
          .then((res) => {
            if (!cancelled) {
              setWatermarkedSrc(res.dataUrl);
              setIsProcessing(false);
            }
          })
          .catch(() => {
            if (!cancelled) setIsProcessing(false);
          });
      });

    return () => {
      cancelled = true;
    };
  }, [originalSrc, logoOpacity, textOpacity, logoPosition, textPosition, outputAspectRatio]);

  if (!isOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  /** User uploads a fresh clean image directly inside the modal */
  const handleFreshUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      setFreshOriginals((prev) => ({ ...prev, [activeSlotKey]: dataUrl }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /** Remove the user-uploaded override for the current slot */
  const handleClearOverride = () => {
    setFreshOriginals((prev) => {
      const next = { ...prev };
      delete next[activeSlotKey];
      return next;
    });
  };

  const handleApplyToCurrent = async () => {
    if (!currentProduct || !watermarkedSrc) return;
    setIsApplying(true);
    try {
      // Build originals array
      const baseOriginals =
        currentProduct.originalImages && currentProduct.originalImages.length > 0
          ? [...currentProduct.originalImages]
          : [...currentProduct.images];

      while (baseOriginals.length <= activeImgIndex) {
        baseOriginals.push(originalSrc || "");
      }

      // If user uploaded a fresh original for this slot, persist it
      if (freshOriginals[activeSlotKey]) {
        baseOriginals[activeImgIndex] = freshOriginals[activeSlotKey];
      }

      // Build display images array
      const baseDisplay =
        currentProduct.images && currentProduct.images.length > 0
          ? [...currentProduct.images]
          : [...baseOriginals];

      while (baseDisplay.length <= activeImgIndex) {
        baseDisplay.push(baseOriginals[baseDisplay.length] || "");
      }

      // Replace active slot with freshly watermarked version
      baseDisplay[activeImgIndex] = watermarkedSrc;

      const success = await onApplyWatermark(currentProduct.id, baseDisplay, baseOriginals);
      if (success) {
        setDbProduct((prev) =>
          prev ? { ...prev, images: baseDisplay, originalImages: baseOriginals } : null,
        );
      }
    } finally {
      setIsApplying(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                Asia Electronics Watermark Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Live Database
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Load images from database, select an image (or the last updated one), and apply watermark.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 text-xs">
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-orange-400" /> Output Shape:
              </label>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: "product", label: "Catalog Product" },
                    { id: "square", label: "Square (1:1)" },
                    { id: "landscape", label: "Landscape" },
                    { id: "portrait", label: "Portrait" },
                    { id: "transparent", label: "Transparent PNG" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSampleMode(t.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      sampleMode === t.id
                        ? "bg-orange-500 text-white shadow-xs"
                        : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-7 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Product:</span>
                  {isLoadingDb && (
                    <span className="text-[10px] text-orange-400 flex items-center gap-1 font-normal">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Loading from DB...
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => void loadProductFromDb(selectedProductId, false)}
                  disabled={isLoadingDb}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 underline"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${isLoadingDb ? "animate-spin" : ""}`} /> Refresh DB
                </button>
              </div>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  void loadProductFromDb(e.target.value, true);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-orange-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} ({p.images?.length || 1} image{p.images?.length === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multiple Image Gallery Selector & Quick Switcher */}
          {sampleMode === "product" && currentProduct && gallerySize > 1 && (
            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-orange-400" />
                  Images in Database ({gallerySize}):
                  <span className="text-zinc-500 font-normal">
                    Currently editing Image #{activeImgIndex + 1}
                    {activeImgIndex === gallerySize - 1 ? " (Last Image)" : ""}
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex(0)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      activeImgIndex === 0
                        ? "bg-orange-500 text-white shadow-xs"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    First Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex(gallerySize - 1)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      activeImgIndex === gallerySize - 1
                        ? "bg-orange-500 text-white shadow-xs"
                        : "bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25"
                    }`}
                  >
                    ★ Last Image ({gallerySize})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {Array.from({ length: gallerySize }).map((_, idx) => {
                  const slotKey = `${selectedProductId}-${idx}`;
                  const thumb =
                    freshOriginals[slotKey] ||
                    resolvedOriginals[idx] ||
                    currentProduct.images?.[idx] ||
                    "";
                  const isLast = idx === gallerySize - 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIndex(idx)}
                      className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all flex flex-col items-center justify-center bg-zinc-950 ${
                        activeImgIndex === idx
                          ? "border-orange-500 ring-2 ring-orange-500/40"
                          : "border-zinc-800 opacity-65 hover:opacity-100"
                      }`}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-zinc-600 text-xs font-mono">{idx + 1}</span>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-mono text-center text-zinc-300 py-0.5">
                        {isLast ? "LAST" : `#${idx + 1}`}
                      </span>
                      {freshOriginals[slotKey] && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-1 ring-zinc-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* User-override active indicator */}
          {sampleMode === "product" && currentProduct && hasUserOverride && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Fresh original loaded.</strong> Watermark will be applied to your uploaded clean image.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={freshUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFreshUpload}
                />
                <button
                  type="button"
                  onClick={() => freshUploadRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-[11px] transition-colors"
                >
                  <Upload className="h-3 w-3" /> Replace
                </button>
                <button
                  type="button"
                  onClick={handleClearOverride}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold text-[11px] transition-colors"
                  title="Revert to database image"
                >
                  <RotateCcw className="h-3 w-3" /> Revert
                </button>
              </div>
            </div>
          )}

          {/* Comparison Viewport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  Original (Image #{activeImgIndex + 1} from Database)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    ref={freshUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFreshUpload}
                  />
                  <button
                    type="button"
                    onClick={() => freshUploadRef.current?.click()}
                    className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold underline flex items-center gap-1"
                  >
                    <Upload className="h-3 w-3" /> Upload clean file
                  </button>
                </div>
              </div>
              <div className="relative h-[280px] sm:h-[350px] w-full rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center p-3 overflow-hidden group">
                {originalSrc ? (
                  <img
                    src={originalSrc}
                    alt="Original"
                    className={`max-h-full max-w-full drop-shadow-sm transition-transform duration-200 group-hover:scale-102 ${
                      outputAspectRatio ? "h-full object-cover" : "object-contain"
                    }`}
                    style={outputAspectRatio ? { aspectRatio: outputAspectRatio } : undefined}
                  />
                ) : (
                  <span className="text-xs text-zinc-500">No image available in database</span>
                )}
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-zinc-400 font-mono">
                  ORIGINAL #{activeImgIndex + 1}
                </span>
              </div>
            </div>

            {/* Right: Watermarked Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-orange-400 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  Branded / Watermarked (Customer Storefront)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Permanent in Downloads
                </span>
              </div>
              <div className="relative h-[280px] sm:h-[350px] w-full rounded-xl border border-orange-500/30 bg-zinc-900/70 flex items-center justify-center p-3 overflow-hidden group shadow-lg shadow-orange-500/5">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
                    <span className="text-xs">Applying branding &amp; watermark...</span>
                  </div>
                ) : watermarkedSrc ? (
                  <img
                    src={watermarkedSrc}
                    alt="Watermarked Preview"
                    className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-102"
                  />
                ) : (
                  <span className="text-xs text-zinc-500">Failed to render watermark</span>
                )}
                <span className="absolute bottom-2 right-2 text-[10px] bg-orange-600/90 text-white font-bold px-2 py-0.5 rounded shadow-sm">
                  STOREFRONT VERSION
                </span>
              </div>
            </div>
          </div>

          {/* Watermark layout fine-tuning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 text-xs">
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-300">Logo Position</label>
              <select
                value={logoPosition}
                onChange={(e) => setLogoPosition(e.target.value as WatermarkLogoPosition)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500"
              >
                <option value="top-left">Top left</option>
                <option value="top-right">Top right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="bottom-right">Bottom right</option>
                <option value="center">Center</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-300">
                Website Text Position
              </label>
              <select
                value={textPosition}
                onChange={(e) => setTextPosition(e.target.value as WatermarkTextPosition)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500"
              >
                <option value="bottom-left">Bottom left</option>
                <option value="bottom-center">Bottom center</option>
                <option value="bottom-right">Bottom right</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between font-semibold text-zinc-300 mb-1.5">
                <span>Logo Opacity:</span>
                <span className="text-orange-400 font-mono">{Math.round(logoOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={logoOpacity}
                onChange={(e) => setLogoOpacity(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-zinc-300 mb-1.5">
                <span>Website Text Opacity:</span>
                <span className="text-orange-400 font-mono">{Math.round(textOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.02"
                value={textOpacity}
                onChange={(e) => setTextOpacity(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Safety Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300/90 leading-relaxed">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange-400 mt-0.5" />
            <p>
              <strong>Safety Protected:</strong> Watermark is baked onto the chosen image. Clean original photos are safely archived in the database record (<code className="text-white">originalImages</code>).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
          <button onClick={onClose} className="admin-btn-ghost text-xs">
            Cancel / Close Preview
          </button>

          {currentProduct ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isApplying || !watermarkedSrc}
                onClick={handleApplyToCurrent}
                className="admin-btn-primary flex items-center gap-1.5 text-xs font-bold px-4 py-2"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving Watermark...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Watermark Image #{activeImgIndex + 1} ({currentProduct.sku})
                  </>
                )}
              </button>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 italic">
              Select a catalog product to watermark its image.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
