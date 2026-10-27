import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { Product } from "@/lib/types";
import {
  applyWatermarkToImage,
  WATERMARK_LOGO_URL,
  LOCAL_FALLBACK_LOGO_URL,
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

  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [originalSrc, setOriginalSrc] = useState<string>("");
  const [watermarkedSrc, setWatermarkedSrc] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [zoomSide, setZoomSide] = useState<"split" | "watermarked" | "original">("split");
  const [logoOpacity, setLogoOpacity] = useState<number>(0.9);
  const [textOpacity, setTextOpacity] = useState<number>(0.32);

  // Sample mock items for testing geometry (square, portrait, landscape, transparent)
  const [sampleMode, setSampleMode] = useState<"product" | "square" | "portrait" | "landscape" | "transparent">("product");

  const currentProduct = products.find((p) => p.id === selectedProductId) || targetProduct || products[0];

  // Resolve source image based on mode
  useEffect(() => {
    let source = "";
    if (sampleMode === "square") {
      source = "/assets/imgs/electronic-components.png";
    } else if (sampleMode === "landscape") {
      source = "/assets/imgs/hero-electronics-showcase.png";
    } else if (sampleMode === "portrait") {
      source = "/assets/imgs/ics-repair-components-v1.png";
    } else if (sampleMode === "transparent") {
      source = "/assets/imgs/logopng.png";
    } else if (currentProduct) {
      const origs = currentProduct.originalImages && currentProduct.originalImages.length > 0
        ? currentProduct.originalImages
        : currentProduct.images;
      source = origs[activeImgIndex] || origs[0] || "/assets/imgs/electronic-components.png";
    }

    setOriginalSrc(source);
  }, [selectedProductId, activeImgIndex, sampleMode, currentProduct]);

  // Run watermark generation on preview
  useEffect(() => {
    if (!originalSrc) return;
    let cancelled = false;
    setIsProcessing(true);

    applyWatermarkToImage(originalSrc, {
      logoOpacity,
      textOpacity,
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
        // Fallback to local logo if cross-origin fails on preview
        applyWatermarkToImage(originalSrc, {
          logoOpacity,
          textOpacity,
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
  }, [originalSrc, logoOpacity, textOpacity]);

  if (!isOpen) return null;

  const handleApplyToCurrent = async () => {
    if (!currentProduct || !watermarkedSrc) return;
    setIsApplying(true);
    try {
      const origImages = currentProduct.originalImages && currentProduct.originalImages.length > 0
        ? [...currentProduct.originalImages]
        : [...currentProduct.images];

      // Prepare watermarked image array (watermark current active index)
      const currentImgs = [...currentProduct.images];
      currentImgs[activeImgIndex] = watermarkedSrc;

      await onApplyWatermark(currentProduct.id, currentImgs, origImages);
    } finally {
      setIsApplying(false);
    }
  };

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
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Preview & Explicit Actions
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Top-left brand logo + subtle bottom <span className="text-zinc-200 font-mono">asiaelectronics.lk</span> watermark. Baked permanently into pixel data.
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
          {/* Controls Bar: Test Samples & Product Select */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 text-xs">
            {/* Test Geometry Samples */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-orange-400" /> Test Geometry Types:
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

            {/* Product Selector */}
            {sampleMode === "product" && (
              <div className="md:col-span-7 space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Select Product to Preview:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setActiveImgIndex(0);
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
            )}
          </div>

          {/* Comparison Viewport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original (Clean, Unwatermarked) */}
            <div className={`space-y-2 ${zoomSide === "watermarked" ? "hidden md:block opacity-40" : ""}`}>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  Original (Unmodified for Feeds)
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">Clean raw source</span>
              </div>
              <div className="relative h-[280px] sm:h-[350px] w-full rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center p-3 overflow-hidden group">
                {originalSrc ? (
                  <img
                    src={originalSrc}
                    alt="Original"
                    className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-102"
                  />
                ) : (
                  <span className="text-xs text-zinc-500">No original image available</span>
                )}
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-zinc-400 font-mono">
                  ORIGINAL
                </span>
              </div>
            </div>

            {/* Right: Watermarked Preview (Branded with Logo & Text) */}
            <div className={`space-y-2 ${zoomSide === "original" ? "hidden md:block opacity-40" : ""}`}>
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
                    <span className="text-xs">Applying branding & watermark...</span>
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

          {/* Opacity and Fine-tuning Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-zinc-300 mb-1.5">
                <span>Top-Left Logo Opacity:</span>
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
                <span>Lower Watermark ("asiaelectronics.lk") Opacity:</span>
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

          {/* Multiple Image Gallery Selector (if product has multiple images) */}
          {sampleMode === "product" && currentProduct && currentProduct.images.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400">
                Product Gallery Images ({currentProduct.images.length}):
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {currentProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`h-14 w-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImgIndex === idx
                        ? "border-orange-500 ring-2 ring-orange-500/30"
                        : "border-zinc-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Safety Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300/90 leading-relaxed">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange-400 mt-0.5" />
            <p>
              <strong>Safety Protected:</strong> Bulk watermarking of production images is locked until preview is confirmed. Original clean photos are safely archived in the database record (<code className="text-white">originalImages</code>) so watermark-free copies remain available for external marketplaces or marketing feeds.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
          <button onClick={onClose} className="admin-btn-ghost text-xs">
            Cancel / Close Preview
          </button>

          {sampleMode === "product" && currentProduct ? (
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
                    <Sparkles className="h-3.5 w-3.5" /> Watermark This Product ({currentProduct.sku})
                  </>
                )}
              </button>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 italic">
              Switch to "Catalog Product" to watermark specific inventory items.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
