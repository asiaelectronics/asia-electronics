import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { supabase } from "../data/supabase.js";

const router = express.Router();
const BUCKET = "homepage-videos";
const MAX_BYTES = 25 * 1024 * 1024;
const TYPES = new Set(["video/mp4", "video/webm"]);

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true, fileSizeLimit: MAX_BYTES, allowedMimeTypes: [...TYPES],
  });
  if (error && !/already exists/i.test(error.message || "")) throw new Error(error.message);
}

router.post("/upload-url", requireAuth, requireAdmin, async (req, res) => {
  try {
    const fileName = String(req.body.fileName || "").trim();
    const contentType = String(req.body.contentType || "").toLowerCase();
    const size = Number(req.body.size || 0);
    if (!fileName || !TYPES.has(contentType) || size < 1 || size > MAX_BYTES) {
      return res.status(400).json({ success: false, error: "Upload an MP4 or WebM video no larger than 25 MB." });
    }
    await ensureBucket();
    // The homepage supports one active video. Remove every previous upload
    // before issuing the next signed upload URL, keeping Storage tidy.
    const { data: existingFiles, error: listError } = await supabase.storage.from(BUCKET).list("homepage");
    if (listError) throw new Error(listError.message);
    const oldPaths = (existingFiles || [])
      .filter((file) => file.name && file.name !== ".emptyFolderPlaceholder")
      .map((file) => `homepage/${file.name}`);
    if (oldPaths.length) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove(oldPaths);
      if (removeError) throw new Error(removeError.message);
    }
    const extension = contentType === "video/webm" ? "webm" : "mp4";
    const path = `homepage/current.${extension}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message || "Could not prepare video upload");
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    res.json({ success: true, uploadUrl: data.signedUrl, publicUrl: publicData.publicUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Could not prepare video upload" });
  }
});

router.delete("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const publicUrl = String(req.body.url || "");
    const marker = `/object/public/${BUCKET}/`;
    const index = publicUrl.indexOf(marker);
    if (index < 0) return res.status(400).json({ success: false, error: "Invalid homepage video URL" });
    const path = decodeURIComponent(publicUrl.slice(index + marker.length));
    if (!path.startsWith("homepage/")) return res.status(400).json({ success: false, error: "Invalid homepage video path" });
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Could not delete homepage video" });
  }
});

export default router;
