import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { supabase } from "../data/supabase.js";

const router = express.Router();
const BUCKET = "homepage-banners";
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Object.keys(EXTENSIONS),
  });
  if (error && !/already exists/i.test(error.message || "")) throw new Error(error.message);
}

// A direct Storage upload keeps homepage settings small and lets the image use
// the CDN cache instead of waiting for a large JSON settings response.
router.post("/upload-url", requireAuth, requireAdmin, async (req, res) => {
  try {
    const contentType = String(req.body.contentType || "").toLowerCase();
    const size = Number(req.body.size || 0);
    if (!EXTENSIONS[contentType] || size < 1 || size > MAX_BYTES) {
      return res.status(400).json({ success: false, error: "Upload an image no larger than 5 MB." });
    }

    await ensureBucket();
    const path = `homepage/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${EXTENSIONS[contentType]}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message || "Could not prepare image upload");
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    res.json({ success: true, uploadUrl: data.signedUrl, publicUrl: publicData.publicUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Could not prepare image upload" });
  }
});

export default router;
