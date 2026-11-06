import { supabase } from "../data/supabase.js";
import { generate850Products, writeProducts, writeCategories } from "../data/db.js";

const defaultCategories = [
  // Active categories (10)
  { slug: "lighting",              name: "Lighting",                       short: "Lighting",          image: "/assets/imgs/lighting.png",                 filterKey: "Sub-type" },
  { slug: "home-appliances",       name: "Home Appliances",                short: "Home Appliances",   image: "/assets/imgs/home-appliances.png",          filterKey: "Type" },
  { slug: "kitchen-appliances",    name: "Kitchen Appliances",             short: "Kitchen Appliances",image: "/assets/imgs/kitchen-appliances.png",       filterKey: "Type" },
  { slug: "appliance-spare-parts", name: "Appliance Spare Parts",          short: "Spare Parts",       image: "/assets/imgs/appliance-spare-parts.png",    filterKey: "Compatible with" },
  { slug: "electronic-components", name: "Electronic Components",          short: "Components",        image: "/assets/imgs/electronic-components.png",    filterKey: "Type" },
  { slug: "power-solar-batteries", name: "Power, Solar & Batteries",       short: "Power & Solar",     image: "/assets/imgs/power-solar-batteries.png",    filterKey: "Type" },
  { slug: "audio",                 name: "Audio & Music",                  short: "Audio & Music",     image: "/assets/imgs/audio-music.png",              filterKey: "Type" },
  { slug: "mobile",                name: "Mobile Parts & Accessories",     short: "Mobile Parts",      image: "/assets/imgs/mobile-parts-accessories.png", filterKey: "Compatible with" },
  { slug: "car-bike-holders",      name: "Car & Bike Holders",              short: "Car & Bike Holders", image: "/assets/imgs/mobile-parts-accessories.png", filterKey: "Type" },
  { slug: "computer-gaming-accessories", name: "Computer & Gaming Accessories", short: "Computer & Gaming", image: "/assets/imgs/mobile-parts-accessories.png", filterKey: "Type" },
  { slug: "tools-installation",    name: "Tools & Installation Supplies",  short: "Tools & Supplies",  image: "/assets/imgs/tools-installation-supplies.png", filterKey: "Type" },
  { slug: "laboratory-equipment",  name: "Laboratory Equipment",           short: "Lab Equipment",     image: "/assets/imgs/laboratory-equipment.png",     filterKey: "Type" },
  // Inactive / pending admin classification (3)
  { slug: "name-boards",           name: "Name Boards",                    short: "Name Boards",       image: "/assets/imgs/name-boards.png",              filterKey: "Type" },
  { slug: "magnet-bars",           name: "Magnet Bars",                    short: "Magnet Bars",       image: "/assets/imgs/magnet-bars.png",              filterKey: "Type" },
  { slug: "equipment",             name: "Equipment",                      short: "Equipment",         image: "/assets/imgs/other-equipment.png",          filterKey: "Type" },
];

async function seed() {
  console.log("🌱 Checking Supabase connection and tables...");

  const { error: testError } = await supabase.from("products").select("id").limit(1);
  if (testError) {
    console.error("❌ Table check failed:", testError.message);
    console.log("\n========================================================");
    console.log("⚠️  The tables do not exist in your Supabase project yet!");
    console.log("👉 1. Open: https://supabase.com/dashboard/project/btikfhdgjhppabhbvaeo/sql/new");
    console.log("👉 2. Paste the SQL from 'src/data/migration.sql'");
    console.log("👉 3. Click 'Run' (green button)");
    console.log("👉 4. Run 'npm run seed' again");
    console.log("========================================================\n");
    process.exitCode = 1;
    return;
  }

  console.log("✅ Tables verified! Seeding categories...");
  await writeCategories(defaultCategories);
  console.log("✅ Categories seeded successfully.");

  console.log("📦 Generating 850 realistic electronics products...");
  const products = generate850Products();
  console.log(`📦 Seeding ${products.length} products to Supabase (batching in chunks of 500)...`);
  await writeProducts(products);
  console.log("🎉 Seeding complete! 850 products now live in Supabase.");
}

seed().catch((err) => {
  console.error("Error during seeding:", err);
  process.exitCode = 1;
});
