import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../data/supabase.js";
import {
  ensureProductImageBucket,
  uploadProductImagesIfNeeded,
} from "../data/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_FILE = path.join(
  __dirname,
  "../../data/products-backup-before-img-migration.json",
);

const args = process.argv.slice(2);
const isOneOnly = args.includes("--one");
const isDryRun = args.includes("--dry-run");

function hasDataUrl(arr) {
  return (
    Array.isArray(arr) &&
    arr.some((item) => typeof item === "string" && item.startsWith("data:image/"))
  );
}

async function run() {
  console.log("🔍 Fetching products from Supabase...");
  const { data: rows, error } = await supabase
    .from("products")
    .select("id, sku, name, images, attributes")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const candidates = (rows || []).filter(
    (r) => hasDataUrl(r.images) || hasDataUrl(r.attributes?.originalImages),
  );

  console.log(
    `📦 Found ${candidates.length} product(s) with embedded Base64 data:image strings (out of ${rows.length} total products).`,
  );

  if (candidates.length === 0) {
    console.log("✅ All product images are already migrated to URLs!");
    return;
  }

  // 1. Save full backup before modifying anything (if not already backed up)
  const backupDir = path.dirname(BACKUP_FILE);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_FILE)) {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(candidates, null, 2), "utf8");
    console.log(`💾 Saved backup of ${candidates.length} products to: ${BACKUP_FILE}`);
  } else {
    console.log(`💾 Existing backup preserved at: ${BACKUP_FILE}`);
  }

  if (isDryRun) {
    console.log("🧪 Dry run complete. No database changes made.");
    return;
  }

  await ensureProductImageBucket();

  const targets = isOneOnly ? candidates.slice(0, 1) : candidates;
  let migratedCount = 0;
  const CONCURRENCY = 8;

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (row) => {
        const folderKey = row.sku || row.id;
        const newImages = hasDataUrl(row.images)
          ? await uploadProductImagesIfNeeded(folderKey, row.images, "img")
          : row.images;

        const attrs = { ...(row.attributes || {}) };
        if (hasDataUrl(attrs.originalImages)) {
          attrs.originalImages = await uploadProductImagesIfNeeded(
            folderKey,
            attrs.originalImages,
            "orig",
          );
        }

        const { error: updateErr } = await supabase
          .from("products")
          .update({
            images: newImages,
            attributes: attrs,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        if (updateErr) {
          console.error(`❌ Failed to update product ${row.sku} (${row.id}):`, updateErr.message);
          return;
        }

        migratedCount++;
        console.log(
          `✅ [${migratedCount}/${targets.length}] Migrated ${row.sku} -> ${newImages?.[0] || "no-img"}`,
        );
      }),
    );
  }

  console.log(`\n🎉 Successfully migrated ${migratedCount}/${targets.length} product(s)!`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration error:", err);
    process.exit(1);
  });
