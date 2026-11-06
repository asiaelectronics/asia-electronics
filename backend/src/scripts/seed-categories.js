import { supabase } from "../data/supabase.js";
import { writeCategories, readCategories } from "../data/db.js";

const categoriesToSeed = [
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

async function run() {
  console.log("🌱 Seeding updated categories into Supabase database...");
  await writeCategories(categoriesToSeed);
  console.log("✅ Categories written to Supabase! Verifying...");
  const verify = await readCategories();
  console.log(`✅ Loaded ${verify.length} categories from Supabase:`);
  verify.forEach((c) => console.log(`   - ${c.slug}: ${c.image}`));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
