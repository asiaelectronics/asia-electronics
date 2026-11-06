import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { supabase } from "../data/supabase.js";
import { sendWholesaleStatusEmail } from "../services/orderStatusEmail.js";

const router = express.Router();
const BUCKET = "wholesale-request-files";
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const STATUSES = ["New", "Reviewing", "Quote Sent", "Accepted", "Declined"];
const ALLOWED_FILE_TYPES = {
  ".pdf": ["application/pdf"],
  ".xls": ["application/vnd.ms-excel", "application/octet-stream"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ],
  ".csv": ["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"],
  ".br": ["application/octet-stream", "application/pdf", "image/jpeg", "image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
};
const ALLOWED_MIME_TYPES = [...new Set(Object.values(ALLOWED_FILE_TYPES).flat())];

async function ensureBucket() {
  const { data, error: lookupError } = await supabase.storage.getBucket(BUCKET);
  const config = {
    public: false,
    fileSizeLimit: MAX_FILE_BYTES,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  };
  if (data) {
    const { error } = await supabase.storage.updateBucket(BUCKET, config);
    if (error) throw new Error(`Could not update wholesale file storage: ${error.message}`);
    return;
  }
  if (
    lookupError &&
    /row-level security|unauthorized|permission/i.test(
      lookupError.message || "",
    )
  ) {
    throw new Error(
      "Wholesale file storage is not authorized. Configure the backend with the Supabase service-role key.",
    );
  }
  const { error } = await supabase.storage.createBucket(BUCKET, config);
  if (error && !error.message?.toLowerCase().includes("already exists")) {
    throw new Error(
      `Could not create wholesale file storage: ${error.message}`,
    );
  }
}

function decodeFile(dataUrl, originalName) {
  const fileName = safeFileName(originalName);
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const allowedMimes = ALLOWED_FILE_TYPES[extension];
  if (!allowedMimes) {
    throw new Error("Attach a PDF, Excel, BR, JPG or PNG file");
  }
  const match = /^data:([^;,]*);base64,([a-z0-9+/=\r\n]+)$/i.exec(String(dataUrl || ""));
  const contentType = match?.[1].toLowerCase() || allowedMimes[0];
  if (!match || !allowedMimes.includes(contentType)) {
    throw new Error("The selected file type does not match its file extension");
  }
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES)
    throw new Error("Attachment must be smaller than 2 MB");
  return { buffer, fileName, contentType };
}

function safeFileName(value) {
  return String(value || "request.pdf")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-120);
}

function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15)
    throw new Error("Customer phone number is not a valid WhatsApp number");
  return digits;
}

router.post("/", async (req, res) => {
  try {
    const customerName = String(req.body.customerName || "").trim();
    const companyName = String(req.body.companyName || "").trim();
    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || "").trim();
    const requestDetails = String(req.body.requestDetails || "").trim();
    if (!customerName || !phone || !email || !requestDetails) {
      return res.status(400).json({
        success: false,
        error: "Name, phone, email and request details are required",
      });
    }
    if (
      customerName.length > 120 ||
      companyName.length > 160 ||
      phone.length > 40 ||
      email.length > 254 ||
      requestDetails.length > 5000
    ) {
      return res
        .status(400)
        .json({ success: false, error: "One or more fields are too long" });
    }

    let filePath = null;
    let fileName = null;
    if (req.body.fileData || req.body.pdfData) {
      const attachment = decodeFile(req.body.fileData || req.body.pdfData, req.body.fileName || req.body.pdfName);
      await ensureBucket();
      const id = `WR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      fileName = attachment.fileName;
      filePath = `${id}/${fileName}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, attachment.buffer, {
          contentType: attachment.contentType,
          upsert: false,
        });
      if (error) throw new Error(`PDF upload failed: ${error.message}`);
      req.wholesaleId = id;
    }

    const id =
      req.wholesaleId ||
      `WR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await supabase
      .from("wholesale_requests")
      .insert({
        id,
        customer_name: customerName,
        company_name: companyName,
        phone,
        email,
        request_details: requestDetails,
        file_path: filePath,
        file_name: fileName,
        status: "New",
      })
      .select()
      .single();
    if (error) {
      if (filePath) await supabase.storage.from(BUCKET).remove([filePath]);
      throw new Error(error.message);
    }
    let fileUrl = null;
    if (filePath) {
      const { data: signed, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 60 * 60);
      if (signedError)
        throw new Error(
          `Could not prepare the file link: ${signedError.message}`,
        );
      fileUrl = signed?.signedUrl || null;
    }
    const salesNumber = normalizeWhatsAppNumber(
      process.env.WHATSAPP_SALES_NUMBER || "+94741066017",
    );
    const message = `Hello Asia Electronics, I submitted wholesale request ${id}.\n\n${requestDetails}${fileUrl ? `\n\nMy attached file: ${fileUrl}` : ""}`;
    res
      .status(201)
      .json({
        success: true,
        data,
        whatsappUrl: `https://wa.me/${salesNumber}?text=${encodeURIComponent(message)}`,
      });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || "Could not submit wholesale request",
    });
  }
});

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("wholesale_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const requests = await Promise.all(
      data.map(async (request) => {
        if (!request.file_path) return request;
        const { data: signed, error: signedError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(request.file_path, 60 * 10);
        return {
          ...request,
          file_url: signedError ? null : signed?.signedUrl || null,
        };
      }),
    );
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Could not load wholesale requests",
    });
  }
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = String(req.body.status || "");
    if (!STATUSES.includes(status))
      return res
        .status(400)
        .json({ success: false, error: "Invalid wholesale request status" });
    const { data: existing, error: existingError } = await supabase
      .from("wholesale_requests")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Wholesale request not found" });
    }
    let { data, error } = await supabase
      .from("wholesale_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    // Supports installations where the initial wholesale table was created
    // before the optional updated_at column was added.
    if (error && /updated_at|column/i.test(error.message || "")) {
      ({ data, error } = await supabase
        .from("wholesale_requests")
        .update({ status })
        .eq("id", req.params.id)
        .select()
        .single());
    }
    if (error) throw new Error(error.message);
    const notification =
      existing.status === status
        ? { sent: false, reason: "Status was unchanged" }
        : await sendWholesaleStatusEmail(data, status);
    res.json({ success: true, data, notification });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || "Could not update request",
    });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: existing, error: lookupError } = await supabase
      .from("wholesale_requests")
      .select("id, file_path")
      .eq("id", req.params.id)
      .single();
    if (lookupError || !existing) {
      return res
        .status(404)
        .json({ success: false, error: "Wholesale request not found" });
    }
    const { error } = await supabase
      .from("wholesale_requests")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    if (existing.file_path) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([existing.file_path]);
      if (storageError)
        console.warn(
          "Could not remove wholesale request file:",
          storageError.message,
        );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Could not delete wholesale request",
    });
  }
});

export default router;
