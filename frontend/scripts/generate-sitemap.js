import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSitemap() {
  const { supabase } = await import("../../backend/src/data/supabase.js");

  console.log("Fetching products and categories from Supabase...");

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("slug, name")
      .order("name", { ascending: true }),
  ]);

  if (productsRes.error) {
    console.error("Failed to fetch products:", productsRes.error);
    process.exit(1);
  }

  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];

  console.log(`Found ${products.length} products and ${categories.length} categories.`);

  const today = new Date().toISOString().split("T")[0];
  const baseUrl = "https://www.asiaelectronics.lk";

  const staticRoutes = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily", lastmod: today },
    { loc: `${baseUrl}/shop`, priority: "0.9", changefreq: "daily", lastmod: today },
    { loc: `${baseUrl}/wholesale`, priority: "0.8", changefreq: "weekly", lastmod: today },
    { loc: `${baseUrl}/blog`, priority: "0.8", changefreq: "weekly", lastmod: today },
    { loc: `${baseUrl}/about`, priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/contact`, priority: "0.7", changefreq: "monthly", lastmod: today },
  ];

  const policyRoutes = [
    { loc: `${baseUrl}/policy/delivery`, priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/policy/returns`, priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/policy/warranty`, priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/policy/privacy`, priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/policy/terms`, priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/policy/cookies`, priority: "0.5", changefreq: "monthly", lastmod: today },
  ];

  const categoryRoutes = categories.map((cat) => ({
    loc: `${baseUrl}/shop?category=${encodeURIComponent(cat.slug)}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: today,
  }));

  const productRoutes = products.map((prod) => {
    const rawDate = prod.updated_at || prod.created_at;
    const lastmod = rawDate ? new Date(rawDate).toISOString().split("T")[0] : today;
    return {
      loc: `${baseUrl}/product/${prod.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod,
    };
  });

  const allUrls = [
    ...staticRoutes,
    ...categoryRoutes,
    ...policyRoutes,
    ...productRoutes,
  ];

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allUrls.map(
      (u) =>
        `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    ),
    "</urlset>",
  ];

  const sitemapXml = xmlLines.join("\n");

  const targetPaths = [
    path.resolve(__dirname, "../public/sitemap.xml"),
    path.resolve(__dirname, "../.output/public/sitemap.xml"),
  ];

  for (const targetPath of targetPaths) {
    const targetDir = path.dirname(targetPath);
    if (fs.existsSync(targetDir)) {
      fs.writeFileSync(targetPath, sitemapXml, "utf8");
      console.log(`Saved sitemap (${allUrls.length} URLs) -> ${targetPath}`);
    }
  }

  console.log("Sitemap generation completed successfully!");
}

generateSitemap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error generating sitemap:", err);
    process.exit(1);
  });

