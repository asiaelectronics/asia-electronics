/**
 * Asia Electronics & Cellular - Automatic Product Image Watermarking Utility
 *
 * Requirements:
 * - Top-left corner: Proportional Asia Electronics Logo.
 * - Lower part: Subtle, semi-transparent "asiaelectronics.lk" watermark text.
 * - Proportional scaling for portrait, landscape, square, and transparent images.
 * - Preserves transparency for PNG/WebP files without distorting or cropping products.
 * - Direct pixel baking onto canvas (permanent on downloads).
 * - Metadata marker to prevent duplicate watermarking.
 */

export const WATERMARK_LOGO_URL =
  "https://dbjdxvzdwmsfwovlbkni.supabase.co/storage/v1/object/public/brand-images/site/logopng.png";

export const LOCAL_FALLBACK_LOGO_URL = "/assets/imgs/logopng.png";

export interface WatermarkOptions {
  logoUrl?: string;
  websiteText?: string;
  logoOpacity?: number;
  textOpacity?: number;
  /** Corner used for the brand logo. */
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Vertical placement used for the website text. */
  textPosition?: "top" | "center" | "bottom";
  /** Output width/height ratio. The source is centre-cropped without distortion. */
  outputAspectRatio?: number;
  quality?: number; // 0.85 default
}

let cachedLogoImage: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement | null> | null = null;

/**
 * Loads the Asia Electronics brand logo image with CORS support and fallback
 */
export async function loadWatermarkLogo(customUrl?: string): Promise<HTMLImageElement | null> {
  if (cachedLogoImage && cachedLogoImage.complete && cachedLogoImage.naturalWidth > 0) {
    return cachedLogoImage;
  }

  if (logoLoadPromise) {
    return logoLoadPromise;
  }

  const urlsToTry = [
    customUrl,
    WATERMARK_LOGO_URL,
    LOCAL_FALLBACK_LOGO_URL,
    "/logo.png",
  ].filter(Boolean) as string[];

  logoLoadPromise = (async () => {
    for (const url of urlsToTry) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error(`Failed to load ${url}`));
          image.src = url;
        });
        if (img.naturalWidth > 0) {
          cachedLogoImage = img;
          return img;
        }
      } catch {
        // Continue to next fallback
      }
    }
    return null;
  })();

  const result = await logoLoadPromise;
  logoLoadPromise = null;
  return result;
}

/**
 * Checks whether an image URL or data string is already marked with our watermark signature
 */
export function isWatermarked(imageUrlOrData: string): boolean {
  if (!imageUrlOrData) return false;
  return (
    imageUrlOrData.includes("watermarked=true") ||
    imageUrlOrData.includes("-wm.") ||
    imageUrlOrData.includes("watermark_v1")
  );
}

/**
 * Helper to load an image source into an HTMLImageElement
 */
function loadImageSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load source image for watermarking"));
    img.src = src;
  });
}

/**
 * Applies Asia Electronics branding watermark onto an image file or data URL.
 * Returns a high-quality data URL (PNG if original had transparency, otherwise JPEG/WebP).
 */
export async function applyWatermarkToImage(
  source: string | File,
  options: WatermarkOptions = {},
): Promise<{ dataUrl: string; width: number; height: number; mimeType: string }> {
  let sourceUrl = "";
  let isTransparentType = false;

  if (source instanceof File) {
    isTransparentType = source.type === "image/png" || source.type === "image/webp";
    sourceUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  } else {
    sourceUrl = source;
    isTransparentType =
      source.startsWith("data:image/png") ||
      source.startsWith("data:image/webp") ||
      /\.png(\?|$)/i.test(source) ||
      /\.webp(\?|$)/i.test(source);
  }

  // Load the source product image
  const baseImg = await loadImageSource(sourceUrl);
  const sourceWidth = baseImg.naturalWidth || baseImg.width;
  const sourceHeight = baseImg.naturalHeight || baseImg.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Invalid image dimensions for watermarking");
  }

  const requestedRatio = options.outputAspectRatio;
  const sourceRatio = sourceWidth / sourceHeight;
  const useCustomRatio = Boolean(requestedRatio && requestedRatio > 0);
  const width = useCustomRatio
    ? Math.max(1, Math.round(sourceRatio > requestedRatio! ? sourceHeight * requestedRatio! : sourceWidth))
    : sourceWidth;
  const height = useCustomRatio
    ? Math.max(1, Math.round(sourceRatio > requestedRatio! ? sourceHeight : sourceWidth / requestedRatio!))
    : sourceHeight;

  // Prepare canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  // Crop from the centre to the selected geometry without stretching the product.
  ctx.clearRect(0, 0, width, height);
  const cropWidth = sourceRatio > (requestedRatio || sourceRatio) ? width : sourceWidth;
  const cropHeight = sourceRatio > (requestedRatio || sourceRatio) ? sourceHeight : height;
  const cropX = Math.max(0, Math.round((sourceWidth - cropWidth) / 2));
  const cropY = Math.max(0, Math.round((sourceHeight - cropHeight) / 2));
  ctx.drawImage(baseImg, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);

  // 1. TOP-LEFT LOGO WATERMARK
  try {
    const logoImg = await loadWatermarkLogo(options.logoUrl);
    if (logoImg && logoImg.naturalWidth > 0) {
      // Calculate proportional logo size: ~18% of the image width, constrained nicely
      const minDimension = Math.min(width, height);
      let targetLogoWidth = Math.round(width * 0.18);

      // Clamp dimensions according to image size
      const minLogoW = Math.max(36, Math.round(minDimension * 0.12));
      const maxLogoW = Math.round(minDimension * 0.28);
      targetLogoWidth = Math.min(Math.max(targetLogoWidth, minLogoW), maxLogoW);

      const logoAspect = logoImg.naturalHeight / logoImg.naturalWidth;
      const targetLogoHeight = Math.round(targetLogoWidth * logoAspect);

      // Offset padding from top-left (proportional, ~3.5% of shortest side)
      const padding = Math.max(12, Math.round(minDimension * 0.035));
      const logoPosition = options.logoPosition ?? "top-left";
      const logoX = logoPosition.endsWith("right")
        ? width - targetLogoWidth - padding
        : padding;
      const logoY = logoPosition.startsWith("bottom")
        ? height - targetLogoHeight - padding
        : padding;

      ctx.save();
      ctx.globalAlpha = options.logoOpacity ?? 0.88;

      // Soft shadow so logo is visible against both bright white and dark product backgrounds
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = Math.max(3, Math.round(minDimension * 0.008));
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.drawImage(logoImg, logoX, logoY, targetLogoWidth, targetLogoHeight);
      ctx.restore();
    }
  } catch (err) {
    console.warn("Logo overlay skipped in watermarking:", err);
  }

  // 2. LOWER PART SUBTLE WEBSITE WATERMARK ("asiaelectronics.lk")
  const watermarkText = (options.websiteText || "asiaelectronics.lk").toLowerCase();
  const shortestSide = Math.min(width, height);
  const fontSize = Math.max(12, Math.round(shortestSide * 0.034));

  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textX = Math.round(width / 2);
  const textOffset = Math.max(fontSize * 1.5, height * 0.08);
  const textY = Math.round(
    options.textPosition === "top"
      ? textOffset
      : options.textPosition === "center"
        ? height / 2
        : height - textOffset,
  );

  // Subtle translucent pill background for consistent readability across high-contrast images
  const textMetrics = ctx.measureText(watermarkText);
  const textW = textMetrics.width;
  const pillPaddingX = Math.round(fontSize * 0.8);
  const pillPaddingY = Math.round(fontSize * 0.35);
  const pillW = textW + pillPaddingX * 2;
  const pillH = fontSize + pillPaddingY * 2;
  const pillRadius = Math.round(pillH / 2);

  ctx.globalAlpha = options.textOpacity ?? 0.28;
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(textX - pillW / 2, textY - pillH / 2, pillW, pillH, pillRadius);
  } else {
    ctx.rect(textX - pillW / 2, textY - pillH / 2, pillW, pillH);
  }
  ctx.fill();

  // Watermark text in crisp white with letter spacing feel
  ctx.globalAlpha = (options.textOpacity ?? 0.28) + 0.38;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = Math.max(2, Math.round(fontSize * 0.2));
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText(watermarkText, textX, textY);
  ctx.restore();

  // Export as WebP (preserves full alpha transparency + high compression); fall back if unsupported
  const outputQuality = options.quality ?? 0.85;
  let outputMime = "image/webp";
  let dataUrl = canvas.toDataURL(outputMime, outputQuality);
  if (!dataUrl.startsWith("data:image/webp")) {
    outputMime = isTransparentType ? "image/png" : "image/jpeg";
    dataUrl = canvas.toDataURL(outputMime, outputQuality);
  }

  return {
    dataUrl,
    width,
    height,
    mimeType: outputMime,
  };
}
