import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImageIcon, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/context/settings";
import { useCatalog } from "@/services/catalog";
import { uploadHomepageBannerImageApi, type HomepageBanner } from "@/services/api";

function optimizeHeroImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml") return resolve(file);
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 1920;
      const maxHeight = 800;
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return resolve(file);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], "homepage-banner.webp", { type: "image/webp" }) : file),
        "image/webp",
        0.8,
      );
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not load image")); };
    image.src = objectUrl;
  });
}

export const Route = createFileRoute("/admin/homepage-banner")({
  head: () => ({ meta: [{ title: "Homepage Banner — Admin" }] }),
  component: HomepageBannerPage,
});

function HomepageBannerPage() {
  const { settings, updateSettings } = useSettings();
  const { categories } = useCatalog();
  const [banners, setBanners] = useState<HomepageBanner[]>(settings.homepageBanners ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => setBanners(settings.homepageBanners ?? []), [settings.homepageBanners]);

  const addBanner = () => setBanners((items) => [...items, {
    id: `home_${Date.now()}`, image: "", badge: "NEW ARRIVALS", title: "Your headline",
    description: "Describe this homepage banner.", buttonText: "Shop now", category: categories[0]?.slug ?? "",
    secondaryButtonText: "", secondaryButtonUrl: "",
  }]);
  const update = (id: string, changes: Partial<HomepageBanner>) =>
    setBanners((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  const upload = async (id: string, file?: File) => {
    if (!file?.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Images must be 5 MB or smaller.");
    try {
      const optimized = await optimizeHeroImage(file);
      const result = await uploadHomepageBannerImageApi(optimized);
      if (!result.url) throw new Error(result.error);
      update(id, { image: result.url });
      toast.success("Image optimized for faster loading.");
    } catch { toast.error("Could not process image."); }
  };
  const save = async () => {
    if (banners.some((item) => !item.image || !item.title.trim() || !item.category)) {
      toast.error("Each homepage banner needs an image, title, and category."); return;
    }
    setSaving(true);
    const saved = await updateSettings({ homepageBanners: banners });
    setSaving(false);
    saved ? toast.success("Homepage banners saved.") : toast.error("Could not save homepage banners.");
  };

  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex items-start justify-between gap-4">
      <div><h1 className="text-xl font-extrabold text-white">Homepage Banner</h1><p className="mt-1 text-xs text-zinc-400">Manage the large homepage hero images, text, and destination category.</p></div>
      <button onClick={addBanner} className="admin-btn-ghost text-xs"><Plus className="mr-1 inline h-4 w-4"/>Add banner</button>
    </div>
    {banners.length === 0 && <div className="admin-card p-10 text-center text-sm text-zinc-400">No homepage banners yet. Add your first hero banner.</div>}
    {banners.map((banner, index) => <section key={banner.id} className="admin-card overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-white">Banner {index + 1}</p><button onClick={() => setBanners((items) => items.filter((item) => item.id !== banner.id))} className="admin-btn-ghost text-xs text-red-300"><Trash2 className="mr-1 inline h-3.5 w-3.5"/>Remove</button></div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]"><label className="flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950/50 text-center hover:border-orange-500/70">
        {banner.image ? <img src={banner.image} alt="" className="h-40 w-full object-cover"/> : <><Upload className="h-5 w-5 text-orange-400"/><span className="mt-2 text-xs font-semibold">Drop or select image</span><span className="mt-1 text-[10px] text-zinc-500">PNG, JPEG, WebP, SVG · max 5 MB</span></>}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(banner.id, e.target.files?.[0]); e.target.value = ""; }} onDrop={(e) => { e.preventDefault(); upload(banner.id, e.dataTransfer.files?.[0]); }} onDragOver={(e) => e.preventDefault()}/>
      </label><div className="grid gap-3 sm:grid-cols-2">
        <Field label="Badge" value={banner.badge} onChange={(badge) => update(banner.id, { badge })}/><Field label="Category button text" value={banner.buttonText} onChange={(buttonText) => update(banner.id, { buttonText })}/>
        <label className="sm:col-span-2 text-xs font-bold text-zinc-300">Heading<input value={banner.title} onChange={(e) => update(banner.id, { title: e.target.value })} className="admin-input mt-1 w-full"/></label>
        <label className="sm:col-span-2 text-xs font-bold text-zinc-300">Description<textarea value={banner.description} onChange={(e) => update(banner.id, { description: e.target.value })} className="admin-input mt-1 min-h-20 w-full"/></label>
        <label className="sm:col-span-2 text-xs font-bold text-zinc-300">Navigation category<select value={banner.category} onChange={(e) => update(banner.id, { category: e.target.value })} className="admin-input mt-1 w-full"><option value="">Select category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
        <Field label="Secondary button text (optional)" value={banner.secondaryButtonText ?? ""} onChange={(secondaryButtonText) => update(banner.id, { secondaryButtonText })}/><Field label="Secondary button URL (optional)" value={banner.secondaryButtonUrl ?? ""} onChange={(secondaryButtonUrl) => update(banner.id, { secondaryButtonUrl })}/>
      </div></div>
    </section>)}
    {banners.length > 0 && <div className="flex justify-end"><button onClick={save} disabled={saving} className="admin-btn-primary text-xs"><Save className="mr-1 inline h-4 w-4"/>{saving ? "Saving…" : "Save homepage banners"}</button></div>}
  </div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-bold text-zinc-300">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="admin-input mt-1 w-full"/></label>; }
