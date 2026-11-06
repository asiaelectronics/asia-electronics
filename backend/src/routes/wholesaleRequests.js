import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { supabase } from "../data/supabase.js";
import { sendWholesaleStatusEmail } from "../services/orderStatusEmail.js";

const router = express.Router();
const BUCKET = "wholesale-request-files";
const MAX_PDF_BYTES = 2 * 1024 * 1024;
const STATUSES = ["New", "Reviewing", "Quote Sent", "Accepted", "Declined"];

async function ensureBucket() {
  const { data, error: lookupError } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
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
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_PDF_BYTES,
    allowedMimeTypes: ["application/pdf"],
  });
  if (error && !error.message?.toLowerCase().includes("already exists")) {
    throw new Error(
      `Could not create wholesale file storage: ${error.message}`,
    );
  }
}

function decodePdf(dataUrl) {
  const match = /^data:application\/pdf;base64,([a-z0-9+/=\r\n]+)$/i.exec(
    String(dataUrl || ""),
  );
  if (!match) throw new Error("Attachment must be a PDF file");
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length || buffer.length > MAX_PDF_BYTES)
    throw new Error("PDF must be smaller than 2 MB");
  return buffer;
}

function safeFileName(value) {
  return String(value || "request.pdf")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-120);
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
    if (req.body.pdfData) {
      const buffer = decodePdf(req.body.pdfData);
      await ensureBucket();
      const id = `WR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      fileName = safeFileName(req.body.pdfName);
      filePath = `${id}/${fileName}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: "application/pdf",
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
    res.status(201).json({ success: true, data });
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
          "Could not remove wholesale request PDF:",
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
