import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Copy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Package,
  Layers,
  Tag,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useCatalog, type CreateProductInput } from "@/services/catalog";
import { images } from "@/data/catalog";
import { formatLKR } from "@/lib/format";
import { StockBadge } from "@/components/admin/shared";
import type { Category, Product } from "@/lib/types";

const ADMIN_SUBCATEGORIES: Record<string, string[]> = {
  lighting: [
    "LED Panel Lights",
    "Strip Lights",
    "Tube Lights",
    "Track Lights",
    "Spot Lights",
    "Indoor & Outdoor Lighting",
    "Solar Lights",
    "LED Modules",
    "Bulbs & Chandeliers",
  ],
  "home-appliances": ["TVs", "Projectors", "Consumer Appliances"],
  "kitchen-appliances": ["Blenders", "Cookers", "Other Kitchen Appliances"],
  "appliance-spare-parts": [
    "Washing Machine Parts",
    "AC Parts",
    "Microwave Oven Parts",
    "Vacuum Cleaner Parts",
    "Blender Parts",
    "Kettle Components",
  ],
  "electronic-components": [
    "ICs & IGBTs",
    "Resistors",
    "Capacitors",
    "Sensors",
    "Arduino & Robotics",
    "Modules",
    "Electronic Tools",
  ],
  "power-solar-batteries": [
    "Solar Panels",
    "Solar Controllers",
    "Inverters",
    "MPPT Controllers",
    "UPS Batteries",
    "Lithium-ion Batteries",
    "Generator Spares",
  ],
  audio: [
    "Bluetooth Speakers",
    "Wall & Ceiling Speakers",
    "Microphones",
    "Mixers",
    "Amplifiers",
    "Bluetooth Modules",
  ],
  mobile: [
    "Mobile Displays",
    "Mobile Repair Parts",
    "Phone Repair Tools",
    "Data Cables",
    "Chargers",
    "Power Banks",
    "Tripods",
  ],
  "tools-installation": ["Installation Tools", "Repair Tools", "Supplies"],
  "laboratory-equipment": [
    "Oscilloscopes",
    "Microscopes",
    "Signal Generators",
    "Multimeters",
    "Soldering Stations",
    "Repair Lamps",
    "Thermal Mats",
    "Transformers",
  ],
  "tv-repair-parts": ["LED Backlights", "TV LCD Panels", "TV Boards"],
  "test-repair-equipment": [
    "Oscilloscopes",
    "Microscopes",
    "Signal Generators",
    "Soldering Stations",
    "Multimeters",
    "Repair Lamps",
    "Thermal Mats",
  ],
  "electrical-control-boxes": [
    "Enclosure Boxes",
    "Distribution Boxes",
    "Electricity Control Boxes",
  ],
  "led-displays-signage": [
    "P10 LED Modules",
    "Indoor LED Displays",
    "Outdoor LED Displays",
    "Name Boards",
  ],
};

export const Route = createFileRoute("/admin/products")({
  validateSearch: (search: Record<string, unknown>) => ({
    action:
      search.action === "add" || search.action === "brands"
        ? (search.action as "add" | "brands")
        : undefined,
  }),
  head: () => ({ meta: [{ title: "Products & 800+ SKUs — Admin" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const routeSearch = Route.useSearch();
  const navigate = useNavigate();
  const {
    products,
    categories,
    brands,
    brandLogos,
    saveBrandLogo,
    deleteBrandLogo,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    resetCatalogToDefault,
  } = useCatalog();

  // Search, filter & sorting state
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "sku-asc" | "sku-desc" | "name" | "price-asc" | "price-desc" | "stock" | "newest"
  >("newest");

  // Pagination state (critical for 800+ SKUs)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (routeSearch.action === "add") {
      setBrandModalOpen(false);
      setEditingProduct(null);
      setProductModalOpen(true);
    } else if (routeSearch.action === "brands") {
      setProductModalOpen(false);
      setBrandModalOpen(true);
    } else {
      setBrandModalOpen(false);
    }
  }, [routeSearch.action]);

  // Filtered & sorted products
  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      const matchCat = catFilter === "all" || p.category === catFilter;
      const productSubcategory = p.subcategory || p.attributes?.["Subcategory"] || "";
      const matchSubcategory =
        subcategoryFilter === "all" || productSubcategory === subcategoryFilter;
      const matchBrand = brandFilter === "all" || p.brand === brandFilter;

      let matchStock = true;
      if (stockFilter === "in") matchStock = p.stock > 5;
      else if (stockFilter === "low") matchStock = p.stock > 0 && p.stock <= 5;
      else if (stockFilter === "out") matchStock = p.stock === 0;

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q);

      return matchCat && matchSubcategory && matchBrand && matchStock && matchSearch;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "sku-asc":
          return a.sku.localeCompare(b.sku);
        case "sku-desc":
          return b.sku.localeCompare(a.sku);
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
          return a.priceCents - b.priceCents;
        case "price-desc":
          return b.priceCents - a.priceCents;
        case "stock":
          return b.stock - a.stock;
        case "newest":
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

    return result;
  }, [products, search, catFilter, subcategoryFilter, brandFilter, stockFilter, sortBy]);

  const availableSubcategories = useMemo(() => {
    if (catFilter === "all") return [];
    const savedSubcategories = categories.find(
      (category) => category.slug === catFilter,
    )?.subcategories;
    if (savedSubcategories?.length)
      return [...savedSubcategories].sort((a, b) => a.localeCompare(b));

    // Existing product values remain available until subcategories are configured on the category.
    return Array.from(
      new Set(
        products
          .filter((product) => product.category === catFilter)
          .map((product) => product.subcategory || product.attributes?.["Subcategory"] || "")
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [categories, products, catFilter]);

  // Pagination calculation
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);
  const allPageProductsSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((product) => selectedProductIds.has(product.id));

  // Handlers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setProductModalOpen(false);
    if (routeSearch.action === "add") {
      void navigate({ to: "/admin/products", search: {}, replace: true });
    }
  };

  const handleCloseBrandModal = () => {
    setBrandModalOpen(false);
    if (routeSearch.action === "brands") {
      void navigate({ to: "/admin/products", search: {}, replace: true });
    }
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProductModalOpen(true);
  };

  const handleDuplicate = (p: Product) => {
    const duplicateSku = `${p.sku}-CP${Math.floor(Math.random() * 900 + 100)}`;
    createProduct({
      name: `${p.name} (Copy)`,
      sku: duplicateSku,
      brand: p.brand,
      model: p.model,
      category: p.category,
      priceLKR: p.priceCents / 100,
      compareAtLKR: p.compareAtCents ? p.compareAtCents / 100 : undefined,
      stock: p.stock,
      description: p.description,
      image: p.images[0] ?? images.catComponents,
      featured: false,
      isNew: true,
      specs: p.specs,
      attributes: p.attributes,
    });
    toast.success(`Duplicated ${p.name} as ${duplicateSku}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProduct(id);
      setSelectedProductIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      toast.success(`Deleted "${name}"`);
    }
  };

  const handleToggleProductSelection = (id: string) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTogglePageSelection = () => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      paginatedProducts.forEach((product) => {
        if (allPageProductsSelected) next.delete(product.id);
        else next.add(product.id);
      });
      return next;
    });
  };

  const handleRemoveSelectedProducts = () => {
    const selectedCount = selectedProductIds.size;
    if (
      selectedCount === 0 ||
      !confirm(
        `Remove ${selectedCount} selected ${selectedCount === 1 ? "product" : "products"}? This cannot be undone.`,
      )
    ) {
      return;
    }

    selectedProductIds.forEach((id) => deleteProduct(id));
    setSelectedProductIds(new Set());
    setPage(1);
    toast.success(
      `${selectedCount} ${selectedCount === 1 ? "product" : "products"} removed successfully.`,
    );
  };

  const handleResetCatalog = () => {
    if (confirm("Reset catalog back to initial demonstration products?")) {
      resetCatalogToDefault();
      setPage(1);
      toast.success("Catalog reset to initial sample items.");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "SKU",
      "Name",
      "Brand",
      "Model",
      "Category",
      "PriceLKR",
      "CompareAtLKR",
      "Stock",
      "Featured",
      "IsNew",
      "Description",
    ];
    const rows = filtered.map((p) => [
      p.id,
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand.replace(/"/g, '""')}"`,
      `"${p.model.replace(/"/g, '""')}"`,
      p.category,
      (p.priceCents / 100).toFixed(2),
      p.compareAtCents ? (p.compareAtCents / 100).toFixed(2) : "",
      p.stock,
      p.featured ? "1" : "0",
      p.isNew ? "1" : "0",
      `"${p.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filtered.length} products to CSV`);
  };

  // Stock summary counts
  const inStockCount = products.filter((p) => p.stock > 5).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Stat summary */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Product & SKU Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
              <Package className="h-3.5 w-3.5" />
              {products.length} {products.length >= 800 ? "800+ SKUs" : "SKUs"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Easily add products, create categories, and manage large-scale 800+ component inventory.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="admin-btn-ghost flex items-center gap-1.5 text-xs font-bold"
            title="Manage and create categories"
          >
            <Layers className="h-3.5 w-3.5 text-orange-400" />
            Categories ({categories.length})
          </button>

          <button
            onClick={() => setBrandModalOpen(true)}
            className="admin-btn-ghost flex items-center gap-1.5 text-xs font-bold"
            title="Manage brand logos and brands"
          >
            <Tag className="h-3.5 w-3.5 text-orange-400" />
            Brands & Logos ({brands.length})
          </button>

          <button
            onClick={() => setCsvModalOpen(true)}
            className="admin-btn-ghost flex items-center gap-1.5 text-xs font-bold"
            title="Import products via CSV"
          >
            <Upload className="h-3.5 w-3.5 text-zinc-400" />
            Import CSV
          </button>

          <button
            onClick={handleExportCSV}
            className="admin-btn-ghost flex items-center gap-1.5 text-xs font-bold"
            title="Export products to CSV"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            Export CSV
          </button>

          <button
            id="products-add-btn"
            onClick={handleOpenAdd}
            className="admin-btn-primary flex items-center gap-2 shrink-0 text-xs font-bold shadow-lg"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Quick Stock Status Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => {
            setStockFilter("all");
            setPage(1);
          }}
          className={`px-3 py-1 rounded-full font-bold transition-all ${
            stockFilter === "all"
              ? "bg-zinc-100 text-zinc-950 font-black shadow-sm"
              : "bg-zinc-800/60 text-zinc-400 hover:text-white"
          }`}
        >
          All Items ({products.length})
        </button>
        <button
          onClick={() => {
            setStockFilter("in");
            setPage(1);
          }}
          className={`px-3 py-1 rounded-full font-bold transition-all ${
            stockFilter === "in"
              ? "bg-emerald-500 text-white font-black shadow-sm"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
          }`}
        >
          In Stock ({inStockCount})
        </button>
        <button
          onClick={() => {
            setStockFilter("low");
            setPage(1);
          }}
          className={`px-3 py-1 rounded-full font-bold transition-all ${
            stockFilter === "low"
              ? "bg-amber-500 text-white font-black shadow-sm"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
          }`}
        >
          Low Stock ≤5 ({lowStockCount})
        </button>
        <button
          onClick={() => {
            setStockFilter("out");
            setPage(1);
          }}
          className={`px-3 py-1 rounded-full font-bold transition-all ${
            stockFilter === "out"
              ? "bg-red-500 text-white font-black shadow-sm"
              : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
          }`}
        >
          Out of Stock ({outOfStockCount})
        </button>

        <button
          type="button"
          disabled={selectedProductIds.size === 0}
          onClick={handleRemoveSelectedProducts}
          className="ml-auto text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-md border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 font-bold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-500/10"
          title="Remove the selected products"
        >
          <Trash2 className="h-3 w-3" /> Remove Selected ({selectedProductIds.size})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card p-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            id="products-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Instant search by product name, SKU, brand, model..."
            className="admin-input w-full pl-9 text-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <select
            id="products-category-filter"
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value);
              setSubcategoryFilter("all");
              setPage(1);
            }}
            className="admin-input text-xs min-w-[150px]"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => {
              const count = products.filter((p) => p.category === c.slug).length;
              return (
                <option key={c.slug} value={c.slug}>
                  {c.short} ({count})
                </option>
              );
            })}
          </select>

          <select
            id="products-subcategory-filter"
            value={subcategoryFilter}
            disabled={catFilter === "all" || availableSubcategories.length === 0}
            onChange={(e) => {
              setSubcategoryFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input text-xs min-w-[150px] disabled:cursor-not-allowed disabled:opacity-50"
            title={catFilter === "all" ? "Select a category first" : "Filter by subcategory"}
          >
            <option value="all">
              {catFilter === "all" ? "Select category first" : "All Subcategories"}
            </option>
            {availableSubcategories.map((subcategory) => {
              const count = products.filter(
                (product) =>
                  product.category === catFilter &&
                  (product.subcategory || product.attributes?.["Subcategory"]) === subcategory,
              ).length;
              return (
                <option key={subcategory} value={subcategory}>
                  {subcategory} ({count})
                </option>
              );
            })}
          </select>

          {/* Brand filter */}
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input text-xs min-w-[130px]"
          >
            <option value="all">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="admin-input text-xs min-w-[140px]"
          >
            <option value="newest">Newest First</option>
            <option value="name">Name A–Z</option>
            <option value="sku-asc">SKU (Ascending)</option>
            <option value="sku-desc">SKU (Descending)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="stock">Stock (High to Low)</option>
          </select>

          {/* Per Page Selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="admin-input text-xs"
            title="Rows per page"
          >
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left bg-zinc-900/60">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageProductsSelected}
                    onChange={handleTogglePageSelection}
                    disabled={paginatedProducts.length === 0}
                    aria-label="Select all products on this page"
                    className="h-4 w-4 cursor-pointer accent-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </th>
                <th className="px-5 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Price (LKR)
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Store Visibility & Badges
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedProducts.map((p) => {
                const cat = categories.find((c) => c.slug === p.category);
                return (
                  <tr
                    key={p.id}
                    className={`group transition-colors ${
                      selectedProductIds.has(p.id)
                        ? "bg-orange-500/5 hover:bg-orange-500/10"
                        : "hover:bg-zinc-800/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(p.id)}
                        onChange={() => handleToggleProductSelection(p.id)}
                        aria-label={`Select ${p.name}`}
                        className="h-4 w-4 cursor-pointer accent-orange-500"
                      />
                    </td>
                    {/* Product Image & Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700/50">
                          <img
                            src={p.images[0] || images.catComponents}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = images.catComponents;
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-xs font-semibold text-white truncate max-w-[220px]"
                            title={p.name}
                          >
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                            {brandLogos[p.brand] ? (
                              <img
                                src={brandLogos[p.brand]}
                                alt={p.brand}
                                className="h-3.5 w-3.5 object-contain rounded bg-white/10 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="h-3.5 w-3.5 rounded bg-zinc-800 text-[8px] font-bold text-zinc-400 inline-flex items-center justify-center shrink-0">
                                {p.brand?.charAt(0) || "B"}
                              </span>
                            )}
                            <span className="font-semibold text-zinc-300">{p.brand}</span>
                            {p.model && <span className="text-zinc-500">· {p.model}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(p.sku);
                          toast.success(`Copied SKU: ${p.sku}`);
                        }}
                        className="group/sku inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 px-2 py-0.5 rounded transition-colors"
                        title="Click to copy SKU"
                      >
                        <span>{p.sku}</span>
                        <Copy className="h-2.5 w-2.5 opacity-0 group-hover/sku:opacity-100 text-zinc-400" />
                      </button>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-300 font-medium bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-700/30">
                        {cat?.short || p.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-white">{formatLKR(p.priceCents)}</p>
                      {p.compareAtCents && (
                        <p className="text-[10px] text-zinc-500 line-through">
                          {formatLKR(p.compareAtCents)}
                        </p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <StockBadge stock={p.stock} />
                    </td>

                    {/* Store Visibility & Badges */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap items-center">
                        {p.showPrice === false && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-bold border border-red-500/30"
                            title="Price is hidden from customers"
                          >
                            Hidden Price
                          </span>
                        )}
                        {p.showQuantity === false && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30"
                            title="Quantity is hidden from customers"
                          >
                            Hidden Qty
                          </span>
                        )}
                        {p.showAvailability === false && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30"
                            title="Availability is hidden from customers"
                          >
                            Hidden Avail
                          </span>
                        )}
                        {p.showPrice !== false &&
                          p.showQuantity !== false &&
                          p.showAvailability !== false && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20"
                              title="Price, Quantity, and Availability are visible"
                            >
                              All Visible
                            </span>
                          )}
                        {p.featured && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30">
                            Hot Selling
                          </span>
                        )}
                        {p.isNew && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold border border-blue-500/30">
                            New
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/product/$slug"
                          params={{ slug: p.slug }}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="View on storefront"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Duplicate SKU"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-zinc-500 text-sm space-y-2">
              <Package className="h-8 w-8 mx-auto text-zinc-600" />
              <p className="font-semibold text-zinc-300">
                {products.length === 0
                  ? "No Products in Database"
                  : "No products match your filters"}
              </p>
              <p className="text-xs text-zinc-500">
                {products.length === 0
                  ? "Your Supabase products table is currently empty. Click '+ Add Product' to add one."
                  : "Try adjusting your search query or reset filters."}
              </p>
              {products.length === 0 ? (
                <button
                  onClick={handleOpenAdd}
                  className="admin-btn-primary text-xs mt-3 inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add First Product
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSearch("");
                    setCatFilter("all");
                    setBrandFilter("all");
                    setStockFilter("all");
                  }}
                  className="admin-btn-ghost text-xs mt-2"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination & Footer Controls */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            Showing{" "}
            <span className="font-bold text-white">
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-white">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            of <span className="font-bold text-white">{totalItems}</span> products
            {totalItems !== products.length && ` (filtered from ${products.length} total)`}
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs font-bold text-white">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add / Edit Product Modal ─── */}
      {productModalOpen && (
        <ProductFormModal
          isOpen={productModalOpen}
          onClose={handleCloseProductModal}
          editingProduct={editingProduct}
          categories={categories}
          products={products}
          brands={brands}
          brandLogos={brandLogos}
          onSave={(data) => {
            if (editingProduct) {
              updateProduct(editingProduct.id, data);
              toast.success(`Updated "${data.name}" successfully!`);
            } else {
              createProduct(data as CreateProductInput);
              toast.success(`Created product "${data.name}" (${data.sku})!`);
            }
            handleCloseProductModal();
          }}
          onOpenCategories={() => setCategoryModalOpen(true)}
          onOpenBrands={() => setBrandModalOpen(true)}
        />
      )}

      {/* ─── Category Manager Modal ─── */}
      {categoryModalOpen && (
        <CategoryManagerModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          categories={categories}
          productsCount={products}
          onCreate={(cat) => {
            createCategory(cat);
            toast.success(`Category "${cat.name}" created!`);
          }}
          onUpdate={(slug, updates) => {
            updateCategory(slug, updates);
            toast.success(`Category "${updates.name || slug}" updated!`);
          }}
          onDelete={(slug) => {
            const count = products.filter((p) => p.category === slug).length;
            if (
              count > 0 &&
              !confirm(`Category "${slug}" has ${count} product(s) assigned. Delete anyway?`)
            ) {
              return;
            }
            deleteCategory(slug);
            toast.success("Category deleted.");
          }}
        />
      )}

      {/* ─── Brand & Logo Manager Modal ─── */}
      {brandModalOpen && (
        <BrandManagerModal
          isOpen={brandModalOpen}
          onClose={handleCloseBrandModal}
          brands={brands}
          brandLogos={brandLogos}
          products={products}
          onSaveLogo={async (brandName, logoUrl, imageData) => {
            try {
              const saved = await saveBrandLogo(brandName, logoUrl, imageData);
              if (saved) toast.success(`Brand "${brandName}" saved to Supabase!`);
              return saved;
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save brand.");
              return false;
            }
          }}
          onDeleteLogo={async (brandName) => {
            try {
              const removed = await deleteBrandLogo(brandName);
              if (removed) toast.success(`Logo removed for "${brandName}".`);
              return removed;
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not remove brand logo.");
              return false;
            }
          }}
        />
      )}

      {/* ─── CSV Import Modal ─── */}
      {csvModalOpen && (
        <CsvImportModal
          isOpen={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          categories={categories}
          onImport={(items) => {
            let count = 0;
            items.forEach((item) => {
              createProduct(item);
              count++;
            });
            toast.success(`Successfully imported ${count} SKUs!`);
            setCsvModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Modal 1: Product Add / Edit Form Modal ──────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  categories,
  products,
  brands,
  brandLogos,
  onSave,
  onOpenCategories,
  onOpenBrands,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  categories: Category[];
  products: Product[];
  brands: string[];
  brandLogos?: Record<string, string>;
  onSave: (
    data: Partial<CreateProductInput> & {
      name: string;
      sku: string;
      category: string;
      priceLKR: number;
      stock: number;
    },
  ) => void;
  onOpenCategories: () => void;
  onOpenBrands?: () => void;
}) {
  const isEditing = !!editingProduct;

  const [name, setName] = useState(editingProduct?.name || "");
  const [sku, setSku] = useState(editingProduct?.sku || "");
  const [brand, setBrand] = useState(editingProduct?.brand || "");
  const [model, setModel] = useState(editingProduct?.model || "");
  const [category, setCategory] = useState(
    editingProduct?.category || categories[0]?.slug || "lighting",
  );
  const [subcategory, setSubcategory] = useState(editingProduct?.attributes?.Subcategory || "");
  const subcategoryOptions = Array.from(
    new Set([
      ...(categories.find((item) => item.slug === category)?.subcategories ?? []),
      ...(ADMIN_SUBCATEGORIES[category] ?? []),
      ...products
        .filter((product) => product.category === category && product.subcategory)
        .map((product) => product.subcategory as string),
    ]),
  ).sort((a, b) => a.localeCompare(b));
  const [priceLKR, setPriceLKR] = useState(
    editingProduct ? String(editingProduct.priceCents / 100) : "2500",
  );
  const [compareAtLKR, setCompareAtLKR] = useState(
    editingProduct?.compareAtCents ? String(editingProduct.compareAtCents / 100) : "",
  );
  const [stock] = useState(editingProduct ? String(editingProduct.stock) : "100");
  const [description, setDescription] = useState(editingProduct?.description || "");
  const [imagesList, setImagesList] = useState<string[]>(() => {
    if (
      editingProduct?.images &&
      Array.isArray(editingProduct.images) &&
      editingProduct.images.length > 0
    ) {
      return editingProduct.images.filter(Boolean);
    }
    return [];
  });
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("upload");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImageFile = (
    file: File,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
  ): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type === "image/svg+xml" || file.size < 50 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please select valid image files (PNG, JPG, WebP, SVG)");
      return;
    }

    const validFiles = imageFiles.filter((f) => {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds 20MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const results = await Promise.all(validFiles.map((file) => compressImageFile(file)));
      const newUrls = results.filter(Boolean);
      if (newUrls.length > 0) {
        setImagesList((prev) => {
          const nextList = [...prev, ...newUrls];
          setActivePreviewIndex(nextList.length - 1);
          return nextList;
        });
        toast.success(`Added ${newUrls.length} image(s)`);
      }
    } catch {
      toast.error("Failed to process uploaded images");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    processFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    processFiles(files);
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error("Please enter an image URL");
      return;
    }
    setImagesList((prev) => {
      const nextList = [...prev, trimmed];
      setActivePreviewIndex(nextList.length - 1);
      return nextList;
    });
    setUrlInput("");
    toast.success("Image URL added to product gallery");
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setImagesList((prev) => {
      const updated = prev.filter((_, idx) => idx !== idxToRemove);
      if (activePreviewIndex >= updated.length) {
        setActivePreviewIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleSetPrimary = (idxToPrimary: number) => {
    if (idxToPrimary === 0) return;
    setImagesList((prev) => {
      const target = prev[idxToPrimary];
      const rest = prev.filter((_, idx) => idx !== idxToPrimary);
      return [target, ...rest];
    });
    setActivePreviewIndex(0);
    toast.success("Set as primary cover image");
  };

  const [featured, setFeatured] = useState(!!editingProduct?.featured);
  const [isNew, setIsNew] = useState(
    editingProduct?.isNew !== undefined ? editingProduct.isNew : true,
  );
  const [showPrice, setShowPrice] = useState(editingProduct?.showPrice !== false);
  const [showQuantity, setShowQuantity] = useState(editingProduct?.showQuantity !== false);
  const [showAvailability, setShowAvailability] = useState(
    editingProduct?.showAvailability !== false,
  );

  if (!isOpen) return null;

  // SKU generator helper
  const handleAutoGenerateSku = () => {
    const catCode = category.slice(0, 3).toUpperCase();
    const rnd = Math.floor(Math.random() * 8999 + 1000);
    setSku(`AE-${catCode}-${rnd}`);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    if (!sku.trim()) {
      toast.error("Please enter or generate a SKU");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    const numPrice = Number(priceLKR);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Please enter a valid price in LKR");
      return;
    }

    const finalImages = imagesList.length > 0 ? imagesList : [images.catComponents];

    onSave({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      brand: brand.trim() || "Generic",
      model: model.trim() || "Standard",
      category,
      subcategory: subcategory || undefined,
      priceLKR: numPrice,
      attributes: {
        ...(editingProduct?.attributes ?? {}),
        ...(subcategory ? { Subcategory: subcategory } : {}),
      },
      compareAtLKR: compareAtLKR ? Number(compareAtLKR) : undefined,
      stock: Math.max(0, parseInt(stock, 10) || 0),
      description: description.trim() || undefined,
      image: finalImages[0],
      images: finalImages,
      featured,
      isNew,
      showPrice,
      showQuantity,
      showAvailability,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-extrabold text-white">
              {isEditing ? `Edit Product: ${editingProduct?.sku}` : "Add New Product / SKU"}
            </h2>
            <p className="text-xs text-zinc-400">
              {isEditing
                ? "Update product specifications and live storefront inventory"
                : "Fill details below to publish to the store catalog immediately"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Row 1: Name */}
          <div>
            <label className="block font-bold text-zinc-300 mb-1">
              Product Name <span className="text-orange-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ESP32-WROOM-32D Development Board or 100uF 50V Capacitor"
              className="admin-input w-full text-xs"
            />
          </div>

          {/* Row 2: SKU with Auto-generate + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-300">
                  SKU Code <span className="text-orange-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateSku}
                  className="text-[10px] text-orange-400 hover:text-orange-300 font-bold underline"
                >
                  Generate SKU
                </button>
              </div>
              <input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. AE-CMP-1049"
                className="admin-input w-full font-mono text-xs uppercase"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-300">
                  Category <span className="text-orange-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenCategories}
                  className="text-[10px] text-orange-400 hover:text-orange-300 font-bold underline"
                >
                  + Add Category
                </button>
              </div>
              <select
                required
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory("");
                }}
                className="admin-input w-full text-xs"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} ({c.short})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-300 mb-1">Subcategory</label>
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              list="subcategory-suggestions"
              placeholder={
                subcategoryOptions.length
                  ? "Select or type a new subcategory"
                  : "Type a new subcategory"
              }
              className="admin-input w-full text-xs"
            />
            <datalist id="subcategory-suggestions">
              {subcategoryOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <p className="mt-1 text-[10px] text-zinc-500">
              Choose a suggestion or type a new subcategory. It will be saved for this product.
            </p>
          </div>

          {/* Row 3: Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-zinc-300">Brand Name</label>
                <div className="flex items-center gap-2">
                  {brand && brandLogos?.[brand.trim()] && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <img
                        src={brandLogos[brand.trim()]}
                        alt={brand}
                        className="h-3.5 w-3.5 object-contain rounded bg-white/10"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <span className="text-[10px]">Logo active</span>
                    </span>
                  )}
                  {onOpenBrands && (
                    <button
                      type="button"
                      onClick={onOpenBrands}
                      className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-0.5"
                    >
                      Manage Logos
                    </button>
                  )}
                </div>
              </div>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Texas Instruments, Nichicon, Hakko"
                className="admin-input w-full text-xs"
                list="brand-suggestions"
              />
              <datalist id="brand-suggestions">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">Model / Spec Code</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. FX-888D, UNO R3, LM358"
                className="admin-input w-full text-xs"
              />
            </div>
          </div>

          {/* Row 4: Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                Price in LKR <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="number"
                min="0"
                step="any"
                value={priceLKR}
                onChange={(e) => setPriceLKR(e.target.value)}
                placeholder="e.g. 2450"
                className="admin-input w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                Original Price (Discount)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={compareAtLKR}
                onChange={(e) => setCompareAtLKR(e.target.value)}
                placeholder="e.g. 2900 (optional)"
                className="admin-input w-full text-xs"
              />
            </div>
          </div>

          {/* Image Upload & URL Section (Multiple Images) */}
          <div className="rounded-xl p-4 bg-zinc-950/60 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="block font-bold text-zinc-300">
                  Product Images <span className="text-orange-500">*</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {imagesList.length} image{imagesList.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Mode Switch Tabs */}
              <div className="flex items-center gap-1 bg-zinc-800/90 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageInputMode("upload")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    imageInputMode === "upload"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Upload Local
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode("url")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    imageInputMode === "url"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Web URL
                </button>
              </div>
            </div>

            {/* Sub-view: Local File Upload (Multiple Files) */}
            {imageInputMode === "upload" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 text-zinc-400"
                  }`}
                >
                  <Upload className="h-6 w-6 mx-auto mb-1.5 text-zinc-400" />
                  <p className="font-bold text-xs text-zinc-200">
                    Click to browse or drag & drop multiple images
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Select multiple files at once · Supports PNG, JPG, JPEG, WEBP, SVG (max 5MB
                    each)
                  </p>
                </div>
              </div>
            )}

            {/* Sub-view: Web Image URL */}
            {imageInputMode === "url" && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddUrl();
                      }
                    }}
                    placeholder="Paste image URL (e.g. https://example.com/product.jpg) and click Add"
                    className="admin-input flex-1 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="admin-btn-primary text-xs px-3 py-1.5 shrink-0"
                  >
                    + Add URL
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  You can add multiple web URLs one by one.
                </p>
              </div>
            )}

            {/* Gallery Viewer and Thumbnails */}
            {imagesList.length > 0 ? (
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                {/* Main Hero Preview Box */}
                <div className="relative h-52 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 flex items-center justify-center p-4 overflow-hidden group">
                  <img
                    src={imagesList[activePreviewIndex] || imagesList[0]}
                    alt="Active Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = images.catComponents;
                    }}
                  />

                  {/* Left / Right Arrow Navigation */}
                  {imagesList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreviewIndex(
                            (prev) => (prev - 1 + imagesList.length) % imagesList.length,
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        title="Previous preview"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreviewIndex((prev) => (prev + 1) % imagesList.length)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        title="Next preview"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {/* Badges on main image */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {activePreviewIndex === 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-xs">
                        ★ Cover Image
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-zinc-300 text-[10px] font-mono">
                    {activePreviewIndex + 1} / {imagesList.length}
                  </div>
                </div>

                {/* Thumbnails Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Thumbnails gallery (drag or click to preview):</span>
                    {activePreviewIndex !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(activePreviewIndex)}
                        className="text-orange-400 hover:underline font-bold text-[10px]"
                      >
                        Set selected as Cover Photo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {imagesList.map((imgSrc, idx) => (
                      <div
                        key={`${imgSrc}-${idx}`}
                        className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 p-1 bg-zinc-900 shrink-0 group transition-all cursor-pointer ${
                          activePreviewIndex === idx
                            ? "border-orange-500 ring-2 ring-orange-500/20"
                            : "border-zinc-700/80 hover:border-zinc-500 opacity-80 hover:opacity-100"
                        }`}
                        onClick={() => setActivePreviewIndex(idx)}
                      >
                        <img
                          src={imgSrc}
                          alt={`Thumbnail ${idx + 1}`}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = images.catComponents;
                          }}
                        />

                        {/* Cover Badge on first thumbnail */}
                        {idx === 0 && (
                          <div className="absolute top-0.5 left-0.5 bg-orange-500 text-white text-[8px] font-extrabold px-1 rounded-sm leading-tight">
                            Cover
                          </div>
                        )}

                        {/* Remove Button on hover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110 transition-opacity"
                          title="Remove image"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 text-center py-2">
                No images added yet. Upload files or paste URLs above to build the product gallery.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-zinc-300 mb-1">Description & Specs</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description, technical details, pinout or compatibility..."
              className="admin-input w-full text-xs"
            />
          </div>

          {/* ─── Customer Storefront Visibility Controls ─── */}
          <div className="rounded-xl p-4 bg-zinc-950/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Storefront Visibility Controls
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">Independent Controls</span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Price, quantity, and availability can be displayed or hidden independently. Even if
              all three are hidden, the product remains published and visible in the store for
              quotation requests.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Show Price */}
              <label
                className={`p-3 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${showPrice ? "bg-zinc-900/80 border-orange-500/40" : "bg-zinc-900/30 border-zinc-800"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">Show Price</span>
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="accent-orange-500 h-4 w-4 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {showPrice ? "ON: Visible to customers" : "OFF: Hidden ('Price on Request')"}
                </p>
              </label>

              {/* Show Quantity */}
              <label
                className={`p-3 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${showQuantity ? "bg-zinc-900/80 border-orange-500/40" : "bg-zinc-900/30 border-zinc-800"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">Show Quantity</span>
                  <input
                    type="checkbox"
                    checked={showQuantity}
                    onChange={(e) => setShowQuantity(e.target.checked)}
                    className="accent-orange-500 h-4 w-4 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {showQuantity ? "ON: Stock count shown" : "OFF: Stock count hidden"}
                </p>
              </label>

              {/* Show Availability */}
              <label
                className={`p-3 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${showAvailability ? "bg-zinc-900/80 border-orange-500/40" : "bg-zinc-900/30 border-zinc-800"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">Show Availability</span>
                  <input
                    type="checkbox"
                    checked={showAvailability}
                    onChange={(e) => setShowAvailability(e.target.checked)}
                    className="accent-orange-500 h-4 w-4 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {showAvailability ? "ON: In/Out Stock badge" : "OFF: Availability hidden"}
                </p>
              </label>
            </div>
          </div>

          {/* Checkboxes: Featured & New */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded accent-orange-500 h-4 w-4"
              />
              Hot Selling / Feature on Homepage
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="rounded accent-orange-500 h-4 w-4"
              />
              Mark as New Arrival
            </label>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="admin-btn-ghost text-xs">
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary flex items-center gap-2 text-xs">
              <Check className="h-4 w-4" />
              {isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Modal 2: Category Manager Modal ─────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  productsCount,
  onCreate,
  onUpdate,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  productsCount: Product[];
  onCreate: (cat: {
    name: string;
    short: string;
    slug?: string;
    filterKey?: string;
    image?: string;
    subcategories?: string[];
  }) => void;
  onUpdate?: (
    slug: string,
    updates: {
      name?: string;
      short?: string;
      filterKey?: string;
      image?: string;
      subcategories?: string[];
    },
  ) => void;
  onDelete: (slug: string) => void;
}) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [slug, setSlug] = useState("");
  const [filterKey, setFilterKey] = useState("Type");
  const [subcategories, setSubcategories] = useState("");
  const [image, setImage] = useState(images.catComponents);
  const [customImage, setCustomImage] = useState("");
  const [search, setSearch] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  if (!isOpen) return null;

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/["']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingCategory && autoSlug) {
      setSlug(slugify(val));
      if (!short || short === name) {
        setShort(val.split(" ")[0] || val);
      }
    }
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setShort(cat.short);
    setSlug(cat.slug);
    setFilterKey(cat.filterKey || "Type");
    setSubcategories((cat.subcategories ?? []).join(", "));
    setImage(cat.image || images.catComponents);
    setAutoSlug(false);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setName("");
    setShort("");
    setSlug("");
    setFilterKey("Type");
    setSubcategories("");
    setImage(images.catComponents);
    setCustomImage("");
    setAutoSlug(true);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const finalSlug = slug.trim() ? slugify(slug) : slugify(name);
    const finalShort = short.trim() || name.trim();
    const finalImage = customImage.trim() || image;
    const finalSubcategories = [
      ...new Set(
        subcategories
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];

    if (editingCategory) {
      if (onUpdate) {
        onUpdate(editingCategory.slug, {
          name: name.trim(),
          short: finalShort,
          filterKey: filterKey.trim() || "Type",
          image: finalImage,
          subcategories: finalSubcategories,
        });
      }
      resetForm();
    } else {
      onCreate({
        name: name.trim(),
        short: finalShort,
        slug: finalSlug,
        filterKey: filterKey.trim() || "Type",
        image: finalImage,
        subcategories: finalSubcategories,
      });
      resetForm();
    }
  };

  const imagePresets = [
    { label: "Components", src: images.catComponents },
    { label: "Lighting", src: images.catLighting },
    { label: "Appliances", src: images.catTv },
    { label: "Kitchen", src: images.catKitchen },
    { label: "Spare Parts", src: images.catSpares },
    { label: "Power & Solar", src: images.catPower },
    { label: "Audio", src: images.catAudio },
    { label: "Mobile", src: images.catMobile },
    { label: "Laboratory", src: images.catLab },
    { label: "Tools", src: images.catTools },
    { label: "Name Boards", src: images.catNameBoards },
    { label: "Magnet Bars", src: images.catMagnetBars },
    { label: "Equipment", src: images.catOtherEquipment },
  ];

  const filterKeyPresets = ["Type", "Sub-type", "Compatible with", "Wattage", "Specification"];

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.short.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.filterKey && c.filterKey.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                Category & Department Management
              </h2>
              <p className="text-xs text-zinc-400">
                Organize store departments, customize URL slugs, and configure faceted filter
                dimensions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: Form + Category List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Form Card */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  {editingCategory
                    ? `Edit Department: ${editingCategory.name}`
                    : "Create New Category"}
                </p>
              </div>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 underline"
                >
                  Cancel editing
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Name and Short */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">
                    Category Name <span className="text-orange-400">*</span>
                  </label>
                  <input
                    required
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Computer Accessories"
                    className="admin-input text-xs w-full"
                  />
                  <p className="text-[10px] text-zinc-500">
                    The full public name displayed across the website.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">
                    Short Label <span className="text-orange-400">*</span>
                  </label>
                  <input
                    required
                    value={short}
                    onChange={(e) => setShort(e.target.value)}
                    placeholder="e.g. Accessories"
                    className="admin-input text-xs w-full"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Compact name for navigation tabs and product badges.
                  </p>
                </div>
              </div>

              {/* Row 2: Slug and Filter Dimension */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-300">
                      URL Slug <span className="text-orange-400">*</span>
                    </label>
                    {!editingCategory && (
                      <button
                        type="button"
                        onClick={() => setAutoSlug(!autoSlug)}
                        className="text-[10px] text-orange-400 hover:underline"
                      >
                        {autoSlug ? "Auto-generating" : "Manual"}
                      </button>
                    )}
                  </div>
                  <input
                    required
                    disabled={!!editingCategory}
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. computer-accessories"
                    className="admin-input text-xs w-full font-mono text-zinc-300 disabled:opacity-50"
                  />
                  <p className="text-[10px] text-zinc-400 truncate">
                    Store URL:{" "}
                    <code className="text-orange-400">/shop?category={slug || "..."}</code>
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">
                    Filter Dimension Key
                  </label>
                  <input
                    value={filterKey}
                    onChange={(e) => setFilterKey(e.target.value)}
                    placeholder="e.g. Type, Sub-type, Compatible with"
                    className="admin-input text-xs w-full"
                  />
                  {/* Quick Preset Chips for Filter Key */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-zinc-500">Presets:</span>
                    {filterKeyPresets.map((pk) => (
                      <button
                        key={pk}
                        type="button"
                        onClick={() => setFilterKey(pk)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors ${
                          filterKey === pk
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white"
                        }`}
                      >
                        {pk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">Subcategories</label>
                <input
                  value={subcategories}
                  onChange={(e) => setSubcategories(e.target.value)}
                  placeholder="e.g. LED Panels, Strip Lights, Solar Lights"
                  className="admin-input text-xs w-full"
                />
                <p className="text-[10px] text-zinc-500">
                  Separate subcategories with commas. These appear in the shop filter.
                </p>
              </div>

              {/* Row 3: Category Thumbnail Selection */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                <label className="text-[11px] font-bold text-zinc-300">
                  Department Cover Image
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {imagePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setImage(preset.src);
                        setCustomImage("");
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        image === preset.src && !customImage
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-xs"
                          : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-white"
                      }`}
                    >
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="h-5 w-5 rounded object-cover border border-zinc-700"
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {editingCategory && (
                  <button type="button" onClick={resetForm} className="admin-btn-ghost text-xs">
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm flex items-center gap-1.5 transition-all"
                >
                  {editingCategory ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Save Category Changes
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Create Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Directory Section: Search + List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Departments ({categories.length})
                </p>
                <p className="text-[11px] text-zinc-500">
                  Select any category to edit its details or check products.
                </p>
              </div>

              {/* Search in categories */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, slug, key..."
                  className="admin-input text-xs w-full pl-8 py-1.5"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 gap-2">
              {filteredCategories.map((c) => {
                const count = productsCount.filter((p) => p.category === c.slug).length;
                const isSelected = editingCategory?.slug === c.slug;

                return (
                  <div
                    key={c.slug}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? "bg-orange-500/10 border-orange-500/40 shadow-xs"
                        : "bg-zinc-800/40 border-zinc-800/80 hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/60 shrink-0">
                        <img
                          src={c.image || images.catComponents}
                          alt={c.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-white">{c.name}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {c.short}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-0.5">
                          <span>
                            Slug: <code className="text-zinc-300">{c.slug}</code>
                          </span>
                          <span>•</span>
                          <span>
                            Filter: <span className="text-zinc-300">{c.filterKey || "Type"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full -mt-2 pl-13">
                      {c.subcategories?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {c.subcategories.map((subcategory) => (
                            <span
                              key={subcategory}
                              className="rounded border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-300"
                            >
                              {subcategory}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500">No subcategories configured</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Link
                        to="/shop"
                        search={{ category: c.slug }}
                        target="_blank"
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 transition-colors"
                        title="View products in shop"
                      >
                        <span className={count > 0 ? "text-emerald-400" : "text-zinc-400"}>
                          {count} {count === 1 ? "product" : "products"}
                        </span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </Link>

                      <button
                        onClick={() => startEdit(c)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isSelected
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                        }`}
                        title="Edit category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-[11px]">Edit</span>
                      </button>

                      <button
                        onClick={() => onDelete(c.slug)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  No departments match "<span className="text-white">{search}</span>"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
          <p className="text-[11px] text-zinc-500">
            Total {categories.length} departments registered in catalog
          </p>
          <button onClick={onClose} className="admin-btn-ghost text-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Modal 2B: Brand & Logo Manager Modal ────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function BrandManagerModal({
  isOpen,
  onClose,
  brands,
  brandLogos,
  products,
  onSaveLogo,
  onDeleteLogo,
}: {
  isOpen: boolean;
  onClose: () => void;
  brands: string[];
  brandLogos: Record<string, string>;
  products: Product[];
  onSaveLogo: (brand: string, logoUrl: string, imageData?: string) => Promise<boolean>;
  onDeleteLogo: (brand: string) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [logoInput, setLogoInput] = useState("");
  const [logoImageData, setLogoImageData] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const [newBrandImageData, setNewBrandImageData] = useState("");
  const [saving, setSaving] = useState(false);
  const [newLogoDropActive, setNewLogoDropActive] = useState(false);
  const [editingLogoDropActive, setEditingLogoDropActive] = useState(false);

  if (!isOpen) return null;

  // Filtered brands
  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const handleStartEdit = (b: string) => {
    setEditingBrand(b);
    setLogoInput(brandLogos[b] || "");
    setLogoImageData("");
  };

  const handleSaveEdit = async (b: string) => {
    setSaving(true);
    const saved = await onSaveLogo(b, logoInput, logoImageData || undefined);
    setSaving(false);
    if (saved) {
      setEditingBrand(null);
      setLogoImageData("");
    }
  };

  const handleCreateNewBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setSaving(true);
    const saved = await onSaveLogo(
      newBrandName.trim(),
      newBrandLogo.trim(),
      newBrandImageData || undefined,
    );
    setSaving(false);
    if (saved) {
      setNewBrandName("");
      setNewBrandLogo("");
      setNewBrandImageData("");
    }
  };

  const loadImageFile = (
    file: File | undefined,
    setImageData: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Brand images must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result || ""));
    reader.onerror = () => toast.error("Could not read the selected image.");
    reader.readAsDataURL(file);
  };

  const LogoDropZone = ({
    imageData,
    onImageData,
    isActive,
    setIsActive,
    compact = false,
  }: {
    imageData: string;
    onImageData: React.Dispatch<React.SetStateAction<string>>;
    isActive: boolean;
    setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
    compact?: boolean;
  }) => (
    <label
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 text-center transition-colors ${compact ? "min-h-8 py-1.5" : "min-h-24 py-3"} ${isActive ? "border-orange-400 bg-orange-500/10 text-orange-300" : "border-zinc-700 bg-zinc-950/30 text-zinc-400 hover:border-orange-500/70 hover:bg-orange-500/5"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsActive(false);
        loadImageFile(event.dataTransfer.files?.[0], onImageData);
      }}
    >
      <Upload className={`${compact ? "h-3.5 w-3.5" : "h-5 w-5"} shrink-0 text-orange-400`} />
      <span className={compact ? "text-[11px] font-semibold" : "text-xs"}>
        <strong className="text-zinc-200">Drop logo here</strong> or click to browse
        {!compact && (
          <span className="mt-0.5 block text-[10px] text-zinc-500">
            PNG, JPEG, or WebP � max 2 MB
          </span>
        )}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          loadImageFile(event.target.files?.[0], onImageData);
          event.target.value = "";
        }}
      />
      {imageData && <span className="text-[10px] font-bold text-emerald-400">Ready</span>}
    </label>
  );
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-orange-400" />
              Manage Brands & Logos
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Brands and uploaded images are stored in Supabase and displayed across the storefront.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Add Brand Logo */}
          <form
            onSubmit={handleCreateNewBrand}
            className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-3"
          >
            <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-orange-400" /> Add or Update Brand Logo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                  Brand Name *
                </label>
                <input
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Sony, Samsung, Apple"
                  className="admin-input w-full text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                  Brand Logo
                </label>
                <LogoDropZone
                  imageData={newBrandImageData}
                  onImageData={setNewBrandImageData}
                  isActive={newLogoDropActive}
                  setIsActive={setNewLogoDropActive}
                />
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-300">
                    Use an image URL instead
                  </summary>
                  <input
                    value={newBrandLogo}
                    onChange={(e) => setNewBrandLogo(e.target.value)}
                    placeholder="https://... or /assets/imgs/..."
                    className="admin-input mt-2 w-full text-xs"
                  />
                </details>
                {newBrandImageData && (
                  <img
                    src={newBrandImageData}
                    alt="New brand logo preview"
                    className="mt-2 h-14 max-w-40 rounded border border-zinc-700 bg-white object-contain p-1"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="admin-btn-primary text-xs font-bold px-3 py-1.5"
              >
                {saving ? "Saving…" : "Save Brand & Logo"}
              </button>
            </div>
          </form>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search existing brands..."
              className="admin-input w-full pl-9 text-xs"
            />
          </div>

          {/* Existing Brands List */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Brands Detected in Store Catalog ({filteredBrands.length})
            </p>

            {filteredBrands.length === 0 ? (
              <div className="p-8 text-center border border-zinc-800 rounded-lg bg-zinc-900/30 text-xs text-zinc-500">
                No brands found matching your search.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40">
                {filteredBrands.map((b) => {
                  const count = products.filter((p) => p.brand === b).length;
                  const logo = brandLogos[b];
                  const isEditingThis = editingBrand === b;

                  return (
                    <div
                      key={b}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {logo ? (
                          <div className="h-9 w-9 rounded-md bg-white/10 p-1 flex items-center justify-center shrink-0 border border-zinc-700/50">
                            <img
                              src={logo}
                              alt={b}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-md bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 shrink-0 border border-zinc-700/30">
                            {b.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{b}</p>
                          <p className="text-[11px] text-zinc-500">
                            {count} {count === 1 ? "product in store" : "products in store"} ·{" "}
                            {logo ? "Custom logo active" : "No logo set"}
                          </p>
                        </div>
                      </div>

                      {isEditingThis ? (
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                          <input
                            type="text"
                            value={logoInput}
                            onChange={(e) => setLogoInput(e.target.value)}
                            placeholder="Paste logo image URL..."
                            className="admin-input flex-1 sm:w-60 text-xs py-1"
                            autoFocus
                          />
                          <div className="w-full sm:w-48">
                            <LogoDropZone
                              imageData={logoImageData}
                              onImageData={setLogoImageData}
                              isActive={editingLogoDropActive}
                              setIsActive={setEditingLogoDropActive}
                              compact
                            />
                          </div>{" "}
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleSaveEdit(b)}
                            className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingBrand(null)}
                            className="px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleStartEdit(b)}
                            className="px-2.5 py-1 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs flex items-center gap-1 font-semibold"
                          >
                            <Edit2 className="h-3 w-3" />
                            {logo ? "Change Logo" : "Add Logo"}
                          </button>
                          {logo && (
                            <button
                              onClick={() => void onDeleteLogo(b)}
                              className="px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs flex items-center gap-1"
                              title="Remove brand logo"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>{brands.length} unique brands registered</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Modal 3: CSV Import Modal ───────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function CsvImportModal({
  isOpen,
  onClose,
  categories,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onImport: (items: CreateProductInput[]) => void;
}) {
  const sampleTemplate = `sku,name,brand,model,category,price,stock,description
AE-CMP-2001,High Voltage Ceramic Cap 10nF 1kV,Murata,CAP-10N,electronic-components,45,200,High voltage ceramic capacitor for repair
AE-AUD-3001,Dual Balanced Armature Driver,Knowles,BA-300,audio,4800,15,Precision in-ear earphone audio driver
AE-LGT-4001,SMD 5050 LED Module 12V Warm,Orange Electric,SMD-5050,lighting,180,95,High output LED module for signage
AE-APP-5001,Smart Android LED TV 43 Inch,TCL,43P635,home-appliances,129900,5,4K HDR Smart TV with Google TV`;

  const [csvText, setCsvText] = useState(sampleTemplate);

  if (!isOpen) return null;

  const handleParseAndImport = (): void => {
    try {
      const lines = csvText.trim().split("\n");
      const headerLine = lines[0];
      if (!headerLine || lines.length <= 1) {
        toast.error("CSV text is empty or missing headers");
        return;
      }

      const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
      const skuIdx = headers.indexOf("sku");
      const nameIdx = headers.indexOf("name");
      const brandIdx = headers.indexOf("brand");
      const modelIdx = headers.indexOf("model");
      const catIdx = headers.indexOf("category");
      const priceIdx = headers.indexOf("price");
      const stockIdx = headers.indexOf("stock");
      const descIdx = headers.indexOf("description");

      if (skuIdx === -1 || nameIdx === -1 || priceIdx === -1) {
        toast.error("CSV must contain at least 'sku', 'name', and 'price' columns");
        return;
      }

      const parsed: CreateProductInput[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

        const colSku = cols[skuIdx];
        const colName = cols[nameIdx];
        if (!colName) continue;

        const sku = colSku || `AE-IMP-${1000 + i}`;
        const name = colName;
        const brand = brandIdx !== -1 && cols[brandIdx] ? (cols[brandIdx] ?? "Generic") : "Generic";
        const model =
          modelIdx !== -1 && cols[modelIdx] ? (cols[modelIdx] ?? "Standard") : "Standard";
        const cat =
          catIdx !== -1 && cols[catIdx]
            ? (cols[catIdx] ?? categories[0]?.slug ?? "lighting")
            : (categories[0]?.slug ?? "lighting");
        const price =
          (priceIdx !== -1 && cols[priceIdx] ? parseFloat(cols[priceIdx] ?? "100") : 100) || 100;
        const stock =
          stockIdx !== -1 && cols[stockIdx] ? parseInt(cols[stockIdx] ?? "10", 10) || 10 : 10;
        const desc =
          descIdx !== -1 && cols[descIdx]
            ? (cols[descIdx] ?? "Imported product item")
            : "Imported product item";

        parsed.push({
          sku,
          name,
          brand,
          model,
          category: cat,
          priceLKR: price,
          stock,
          description: desc,
          featured: false,
          isNew: true,
        });
      }

      if (parsed.length === 0) {
        toast.error("No valid products found in CSV");
        return;
      }
      onImport(parsed);
    } catch (e) {
      console.error(e);
      toast.error("Failed to parse CSV. Please check formatting.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-orange-400" /> Bulk Import Products / SKUs
            </h2>
            <p className="text-xs text-zinc-400">
              Paste CSV text to quickly add tens or hundreds of SKUs to your catalog.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-xs">
          <p className="text-zinc-300 font-semibold">
            CSV Format:{" "}
            <code className="text-orange-400 font-mono">
              sku,name,brand,model,category,price,stock,description
            </code>
          </p>
          <textarea
            rows={10}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="admin-input w-full font-mono text-[11px]"
            placeholder="Paste your CSV data here..."
          />
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="admin-btn-ghost text-xs">
            Cancel
          </button>
          <button
            onClick={handleParseAndImport}
            className="admin-btn-primary text-xs flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" /> Parse & Import
          </button>
        </div>
      </div>
    </div>
  );
}
