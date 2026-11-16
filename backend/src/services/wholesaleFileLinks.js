import { createHmac, timingSafeEqual } from "node:crypto";

export function fileLinkToken(id, filePath, secret) {
  if (!secret) throw new Error("Wholesale file link secret is missing");
  return createHmac("sha256", secret)
    .update(JSON.stringify(["wholesale-file-v1", id, filePath]))
    .digest("hex");
}

export function verifyFileLinkToken(token, id, filePath, secret) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return false;
  return timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(fileLinkToken(id, filePath, secret), "hex"),
  );
}
