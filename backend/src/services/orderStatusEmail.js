import nodemailer from "nodemailer";

const STATUS_COPY = {
  "Quotation Requested": "We have received your quotation request and our team will review it shortly.",
  "Quotation Sent": "Your quotation is ready. Please check your email or contact us if you need any changes.",
  Processing: "Your order is now being processed by our team.",
  Shipped: "Your order is on the way. Track its progress and contact us if you need help.",
  Delivered: "Your order has been delivered. Thank you for shopping with us.",
  Cancelled: "Your order has been cancelled. Please contact us if you have any questions.",
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function getStoreUrl() {
  if (process.env.STORE_URL) {
    return process.env.STORE_URL.trim().replace(/\/$/, "");
  }

  const configured = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);

  // Prioritize public/production URLs (https or non-localhost) so links in emails work on mobile devices
  const publicUrl = configured.find(
    (url) => !url.includes("localhost") && !url.includes("127.0.0.1") && !url.includes("::1"),
  );
  if (publicUrl) return publicUrl;

  return "https://www.asiaelectronics.lk";
}

function renderItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p style="margin:0;color:#737373;font-size:14px">Your item details are available in your order.</p>';
  }

  return items.map((item) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #ececec;vertical-align:top">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#2a2a2a">${escapeHtml(item.name || "Product")}</p>
        <p style="margin:0;font-size:13px;color:#888">SKU: ${escapeHtml(item.sku || "—")}</p>
      </td>
      <td style="padding:14px 0 14px 12px;border-bottom:1px solid #ececec;vertical-align:top;text-align:right;font-size:14px;color:#555">× ${Math.max(1, Number(item.qty) || 1)}</td>
    </tr>`).join("");
}

export async function sendOrderStatusEmail(order, status) {
  const recipient = String(order?.email || "").trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return { sent: false, reason: "Customer has no valid email address" };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Order status email skipped: SMTP is not configured.");
    return { sent: false, reason: "SMTP is not configured" };
  }

  const customerName = escapeHtml(order.customerName || "Customer");
  const orderId = escapeHtml(order.id);
  const statusText = escapeHtml(status);
  const message = escapeHtml(STATUS_COPY[status] || "Your order status has been updated.");
  const storeUrl = getStoreUrl();
  const orderUrl = `${storeUrl}/order-confirmation?order=${encodeURIComponent(order.id)}`;
  const logoUrl = `${storeUrl}/logo.png`;
  const trackingNumber = escapeHtml(order.trackingNumber || order.id);
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const shipmentTitle = status === "Shipped" ? "Your order is on the way" : `Your order is ${statusText.toLowerCase()}`;

  try {
    await transporter.sendMail({
      from: `Asia Electronics & Cellular <${from}>`,
      to: recipient,
      subject: `Order ${order.id}: ${status}`,
      text: `Hello ${order.customerName || "Customer"},\n\n${shipmentTitle}.\n${STATUS_COPY[status] || "Your order status has been updated."}\n\nOrder: ${order.id}\nTracking reference: ${order.trackingNumber || order.id}\n\nView your order: ${orderUrl}\n\nAsia Electronics & Cellular Pvt Ltd`,
      html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#2a2a2a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5"><tr><td align="center" style="padding:32px 12px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff">
      <tr><td style="padding:38px 42px 24px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
          <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.1;font-weight:800;letter-spacing:-0.4px;color:#e11d48">ASIA ELECTRONICS<br><span style="font-size:11px;letter-spacing:1.8px;color:#3f3f46">&amp; CELLULAR</span></td>
          <td align="right" style="font-size:13px;color:#929292;vertical-align:top;padding-top:6px">ORDER #${orderId}</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:12px 42px 34px">
        <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:500;color:#303030">${shipmentTitle}</h1>
        <p style="margin:0;font-size:15px;line-height:1.65;color:#777">Hello ${customerName}, ${message}</p>
        <p style="margin:26px 0 0"><a href="${orderUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:16px 25px;border-radius:3px;font-size:14px;font-weight:700">View your order</a><span style="display:inline-block;margin-left:16px;font-size:14px;color:#333">or <a href="${storeUrl}" style="color:#333;text-decoration:underline">Visit our store</a></span></p>
        <p style="margin:24px 0 0;font-size:13px;color:#929292">Tracking reference: <span style="color:#333">${trackingNumber}</span></p>
      </td></tr>
      <tr><td style="padding:28px 42px 42px;border-top:1px solid #ececec">
        <h2 style="margin:0 0 14px;font-size:19px;font-weight:500;color:#333">Items in this order</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${renderItems(order.items)}</table>
        <p style="margin:28px 0 0;font-size:13px;color:#929292">Current status: <strong style="color:#333">${statusText}</strong></p>
      </td></tr>
      <tr><td style="padding:20px 42px;background:#fafafa;border-top:1px solid #ececec;font-size:12px;line-height:1.6;color:#8a8a8a">Asia Electronics &amp; Cellular Pvt Ltd<br>Questions about your order? Reply to this email or contact our store.</td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    });
    return { sent: true };
  } catch (error) {
    console.error(`Order status email failed for ${order.id}:`, error.message);
    return { sent: false, reason: "Email delivery failed" };
  }
}