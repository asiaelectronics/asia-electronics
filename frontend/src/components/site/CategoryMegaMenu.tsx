import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Cpu,
  Headphones,
  Lightbulb,
  Smartphone,
  Tv,
  Package,
  Sparkles,
  Home,
  UtensilsCrossed,
  Wrench,
  Zap,
  Music,
  FlaskConical,
  HardHat,
} from "lucide-react";
import type { Category } from "@/lib/types";

interface SubcategoryGroup {
  title: string;
  items: {
    label: string;
    searchParam?: string;
    query?: string;
  }[];
}

const CATEGORY_GROUPS: Record<string, SubcategoryGroup[]> = {
  // ── 1. Lighting ──────────────────────────────────────────────────────────
  lighting: [
    {
      title: "Decorative Lighting",
      items: [
        { label: "Chandeliers", query: "chandelier" },
        { label: "Wall Lamps", query: "wall lamp" },
        { label: "Mirror Lights", query: "mirror light" },
        { label: "Stage Lights", query: "stage light" },
      ],
    },
    {
      title: "Ceiling & Panel",
      items: [
        { label: "Panel Lights", query: "panel light" },
        { label: "Tube Lights", query: "tube light" },
        { label: "Track Lights", query: "track light" },
        { label: "Step Lights", query: "step light" },
      ],
    },
    {
      title: "Bulbs",
      items: [
        { label: "LED Bulbs", query: "led bulb" },
        { label: "Rechargeable LED Bulbs", query: "rechargeable bulb" },
        { label: "Edison Bulbs", query: "edison bulb" },
      ],
    },
    {
      title: "Outdoor & Specialty",
      items: [
        { label: "Flashlights", query: "flashlight" },
        { label: "Christmas Lights", query: "christmas light" },
        { label: "Street Lights", query: "street light" },
        { label: "Garden Lights", query: "garden light" },
        { label: "Underwater Lights", query: "underwater light" },
        { label: "Rope Lights", query: "rope light" },
      ],
    },
    {
      title: "Lighting Accessories",
      items: [
        { label: "Drivers", query: "driver" },
        { label: "Holders", query: "holder" },
      ],
    },
  ],

  // ── 2. Home Appliances ───────────────────────────────────────────────────
  "home-appliances": [
    {
      title: "Entertainment",
      items: [{ label: "Televisions", query: "television" }],
    },
    {
      title: "Laundry & Cooling",
      items: [
        { label: "Washing Machines", query: "washing machine" },
        { label: "Air Conditioners", query: "air conditioner" },
      ],
    },
    {
      title: "Kitchen & Comfort",
      items: [
        { label: "Refrigerators", query: "refrigerator" },
        { label: "Fans", query: "fan" },
      ],
    },
  ],

  // ── 3. Kitchen Appliances ────────────────────────────────────────────────
  "kitchen-appliances": [
    {
      title: "Food Preparation",
      items: [
        { label: "Blenders", query: "blender" },
        { label: "Cookers", query: "cooker" },
      ],
    },
  ],

  // ── 4. Appliance Spare Parts ─────────────────────────────────────────────
  "appliance-spare-parts": [
    {
      title: "TV Spares",
      items: [{ label: "TV Spares", query: "tv spare" }],
    },
    {
      title: "Washing Machine Parts",
      items: [
        { label: "Washing Machine PCBs", query: "washing machine pcb" },
        { label: "Pulsator Plates", query: "pulsator plate" },
        { label: "Other Washing Machine Parts", query: "washing machine part" },
      ],
    },
    {
      title: "Blender Parts",
      items: [
        { label: "Blender Motors", query: "blender motor" },
        { label: "Other Blender Parts", query: "blender part" },
      ],
    },
  ],

  // ── 5. Electronic Components ─────────────────────────────────────────────
  "electronic-components": [
    {
      title: "Active & Passive",
      items: [
        { label: "Integrated Circuits", query: "integrated circuit" },
        { label: "Resistors", query: "resistor" },
        { label: "Capacitors", query: "capacitor" },
      ],
    },
    {
      title: "Switches & Controls",
      items: [
        { label: "Microswitches", query: "microswitch" },
        { label: "Potentiometers", query: "potentiometer" },
      ],
    },
  ],

  // ── 6. Power, Solar & Batteries ──────────────────────────────────────────
  "power-solar-batteries": [
    {
      title: "Power Supply",
      items: [
        { label: "Power Supplies", query: "power supply" },
        { label: "Adapters", query: "adapter" },
        { label: "Solar & Inverters", query: "solar inverter" },
      ],
    },
    {
      title: "Batteries",
      items: [
        { label: "Rechargeable Batteries", query: "rechargeable battery" },
        { label: "Lithium-ion Batteries", query: "lithium ion battery" },
      ],
    },
    {
      title: "Generator Spares",
      items: [
        { label: "AVRs", query: "avr" },
        { label: "Relays", query: "relay" },
        { label: "Other Generator Spares", query: "generator spare" },
      ],
    },
  ],

  // ── 7. Audio & Music ──────────────────────────────────────────────────────
  audio: [
    {
      title: "Speakers",
      items: [
        { label: "Bluetooth Speakers", query: "bluetooth speaker" },
        { label: "Waterproof Outdoor Speakers", query: "waterproof speaker" },
        { label: "Powered Bookshelf Speakers", query: "bookshelf speaker" },
        { label: "2.1 Soundbars", query: "soundbar" },
      ],
    },
    {
      title: "Music Equipment",
      items: [
        { label: "Wireless ANC Earbuds", query: "earbuds" },
        { label: "Over-Ear Studio Headphones", query: "headphones" },
        { label: "Home Audio Amplifiers", query: "amplifier" },
      ],
    },
  ],

  // ── 8. Mobile Parts & Accessories ────────────────────────────────────────
  mobile: [
    {
      title: "Mobile Displays",
      items: [
        { label: "OLED Display Assemblies", query: "oled" },
        { label: "Touch Screen Digitizers", query: "screen" },
        { label: "Samsung Galaxy Assemblies", query: "galaxy" },
      ],
    },
    {
      title: "Mobile Cables",
      items: [
        { label: "USB-C to Lightning Cables", query: "lightning" },
        { label: "USB-C Fast Charging Cables", query: "usb-c" },
        { label: "Braided Data Cables", query: "braided" },
      ],
    },
    {
      title: "Tools & Accessories",
      items: [
        { label: "Replacement Batteries", query: "battery" },
        { label: "Charging Port Flex Cables", query: "flex" },
        { label: "Camera Glass Replacements", query: "camera" },
      ],
    },
  ],

  // ── 9. Tools & Installation Supplies ─────────────────────────────────────
  "tools-installation": [
    {
      title: "Fixings & Cable Management",
      items: [
        { label: "Brackets", query: "bracket" },
        { label: "Cable Ties", query: "cable tie" },
        { label: "Sleeving", query: "sleeving" },
      ],
    },
    {
      title: "Maintenance",
      items: [{ label: "Contact Cleaners", query: "contact cleaner" }],
    },
  ],

  // ── 10. Laboratory Equipment ──────────────────────────────────────────────
  "laboratory-equipment": [
    {
      title: "Lab Equipment",
      items: [{ label: "Browse All Lab Equipment", query: "lab" }],
    },
  ],

  "tv-repair-parts": [
    {
      title: "TV Parts",
      items: [
        { label: "LED Backlights", query: "led backlight" },
        { label: "TV LCD Panels", query: "tv lcd" },
        { label: "TV Boards", query: "tv board" },
      ],
    },
  ],
  "test-repair-equipment": [
    {
      title: "Testing & Repair",
      items: [
        { label: "Oscilloscopes", query: "oscilloscope" },
        { label: "Microscopes", query: "microscope" },
        { label: "Signal Generators", query: "signal generator" },
        { label: "Multimeters", query: "multimeter" },
        { label: "Soldering Stations", query: "solder station" },
      ],
    },
  ],
  "electrical-control-boxes": [
    {
      title: "Electrical Boxes",
      items: [
        { label: "Enclosure Boxes", query: "enclosure box" },
        { label: "Distribution Boxes", query: "distribution box" },
        { label: "Electricity Control Boxes", query: "control box" },
      ],
    },
  ],
  "led-displays-signage": [
    {
      title: "LED Signage",
      items: [
        { label: "P10 LED Modules", query: "p10 led module" },
        { label: "Indoor LED Displays", query: "indoor led display" },
        { label: "Outdoor LED Displays", query: "outdoor led display" },
        { label: "Name Boards", query: "name board" },
      ],
    },
  ],
};

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lighting: Lightbulb,
  "home-appliances": Home,
  "kitchen-appliances": UtensilsCrossed,
  "appliance-spare-parts": Wrench,
  "electronic-components": Cpu,
  "power-solar-batteries": Zap,
  audio: Music,
  mobile: Smartphone,
  "tools-installation": HardHat,
  "laboratory-equipment": FlaskConical,
  "tv-repair-parts": Tv,
  "test-repair-equipment": FlaskConical,
  "electrical-control-boxes": Zap,
  "led-displays-signage": Package,
  "name-boards": Package,
  "magnet-bars": Package,
  equipment: Package,
};

interface CategoryMegaMenuProps {
  categories: Category[];
  onClose: () => void;
}

export function CategoryMegaMenu({ categories, onClose }: CategoryMegaMenuProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    () => categories[0]?.slug ?? "components",
  );

  const activeCategory = categories.find((c) => c.slug === selectedSlug) ?? categories[0];
  // Subcategories are configured by the admin for each predefined main category.
  // Do not display the legacy hard-coded menu entries here.
  const subcategories = activeCategory?.subcategories ?? [];
  const ActiveIcon = activeCategory ? (CATEGORY_ICONS[activeCategory.slug] ?? Package) : Package;

  return (
    <div
      role="region"
      aria-label="Category navigation menu"
      className="flex shadow-2xl rounded-b-md border border-zinc-200/90 bg-white overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 w-[880px] xl:w-[960px] max-w-[calc(100vw-3.5rem)]"
    >
      {/* Left Column: Light-gray vertical panel */}
      <div className="w-64 shrink-0 bg-[#f8f8fa] border-r border-zinc-200 py-3 flex flex-col">
        {categories.map((c) => {
          const IconComponent = CATEGORY_ICONS[c.slug] ?? Package;
          const isSelected = c.slug === selectedSlug;
          return (
            <button
              key={c.slug}
              type="button"
              onMouseEnter={() => setSelectedSlug(c.slug)}
              onClick={() => setSelectedSlug(c.slug)}
              className={`flex items-center justify-between w-full px-4 py-3 text-xs font-semibold tracking-tight transition-colors text-left cursor-pointer ${
                isSelected
                  ? "bg-white text-primary shadow-xs font-bold border-l-4 border-primary"
                  : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 border-l-4 border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-zinc-500"}`}
                />
                <span className="truncate">{c.short || c.name}</span>
              </div>
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-primary" : "text-zinc-400"}`}
              />
            </button>
          );
        })}

        <div className="mt-auto pt-3 px-4 border-t border-zinc-200/60">
          <Link
            to="/shop"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-bold text-primary hover:underline py-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>View All Products →</span>
          </Link>
        </div>
      </div>

      {/* Right Column: Multi-column subcategories panel */}
      <div className="flex-1 bg-white p-6 min-w-[580px] max-w-4xl flex flex-col">
        {activeCategory && (
          <>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ActiveIcon className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm tracking-tight text-zinc-900">
                  {activeCategory.name}
                </h3>
              </div>
              <Link
                to="/shop"
                search={{ category: activeCategory.slug }}
                onClick={onClose}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Explore all {activeCategory.short} →
              </Link>
            </div>

            {subcategories.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
                {subcategories.map((subcategory) => (
                  <Link
                    key={subcategory}
                    to="/shop"
                    search={{
                      category: activeCategory.slug,
                      subcategory,
                    }}
                    onClick={onClose}
                    className="rounded px-2 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-primary"
                  >
                    {subcategory}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">
                No subcategories have been added to this category yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
