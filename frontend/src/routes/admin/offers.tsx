import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import {
  ImageIcon,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  ArrowUpDown,
  Link2,
  FileImage,
  Eye,
  Loader2,
  X,
  Upload,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { bannerSchema } from "@/lib/bannerTypes";
import type { Banner, BannerFormValues, BannerSize } from "@/lib/bannerTypes";
import {
  bannersQuery,
  uploadBannerImage,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from "@/services/banners";

export const Route = createFileRoute("/admin/offers")({
  head: () => ({ meta: [{ title: "Homepage Offers — Admin" }] }),
  component: OffersPage,
  head: () => ({ meta: [{ title: "Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
});

// ─── Image uploader sub-component ────────────────────────────────────────────

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  id: string;
  hint?: string;
}

function ImageUploader({ label, value, onChange, error, id, hint }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 300 * 1024) {
      toast.error("Image must be smaller than 300 KB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadBannerImage(file);
      onChange(url);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
        {label}
      </label>
      {hint && <p className="text-[10px] text-zinc-500">{hint}</p>}

      <div
        className="relative rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-zinc-600 cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {value ? (
          <div className="relative">
            <img src={value} alt="Preview" className="w-full max-h-36 object-cover rounded-lg" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-zinc-500">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
            <p className="text-xs font-semibold">
              {uploading ? "Uploading…" : "Click or drag & drop"}
            </p>
            <p className="text-[10px]">PNG, JPG, WebP up to 300 KB</p>
          </div>
        )}
      </div>

      {/* Or paste a URL */}
      <div className="flex gap-2 mt-1.5">
        <div className="relative flex-1">
          <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <input
            placeholder="Or paste image URL…"
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="admin-input w-full pl-7 text-[11px]"
          />
        </div>
      </div>

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ─── Banner form ──────────────────────────────────────────────────────────────

interface BannerFormProps {
  defaultValues?: Partial<BannerFormValues>;
  onSubmit: (values: BannerFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

const DEFAULT_FORM: BannerFormValues = {
  title: "",
  subtitle: "",
  imageUrl: "",
  mobileImageUrl: "",
  ctaText: "",
  ctaLink: "",
  altText: "",
  startDate: "",
  endDate: "",
  active: true,
  displayOrder: 0,
  size: "medium",
};

function BannerForm({ defaultValues, onSubmit, onCancel, isLoading, mode }: BannerFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { ...DEFAULT_FORM, ...defaultValues },
  });

  const imageUrl = watch("imageUrl");
  const mobileImageUrl = watch("mobileImageUrl");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title & Subtitle */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            {...register("title")}
            placeholder="e.g. Mega Sale — Up to 40% Off"
            className="admin-input w-full"
          />
          {errors.title && <p className="text-[11px] text-red-400">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Subtitle / Badge Text
          </label>
          <input
            {...register("subtitle")}
            placeholder="e.g. LIMITED TIME OFFER"
            className="admin-input w-full"
          />
        </div>
      </div>

      {/* Images */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploader
          id="desktop-image"
          label="Desktop Banner Image *"
          hint="Recommended: 1440×480 px"
          value={imageUrl}
          onChange={(url) => setValue("imageUrl", url, { shouldValidate: true })}
          error={errors.imageUrl?.message}
        />
        <ImageUploader
          id="mobile-image"
          label="Mobile Banner Image"
          hint="Recommended: 640×360 px (optional)"
          value={mobileImageUrl ?? ""}
          onChange={(url) => setValue("mobileImageUrl", url)}
          error={errors.mobileImageUrl?.message}
        />
      </div>

      {/* Banner Size Selection */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5 text-orange-400" /> Banner Display Size
          </span>
          <span className="text-[10px] text-zinc-500 font-normal lowercase">adjusts height & layout</span>
        </label>
        <Controller
          name="size"
          control={control}
          render={({ field }) => {
            const currentSize: BannerSize = (field.value as BannerSize) || "medium";
            const SIZES: Array<{
              id: BannerSize;
              label: string;
              height: string;
              desc: string;
            }> = [
              { id: "compact", label: "Compact", height: "260px", desc: "Slim bar / subtle notice" },
              { id: "medium", label: "Medium", height: "380px", desc: "Standard balanced banner" },
              { id: "large", label: "Large", height: "480px", desc: "Prominent high impact" },
              { id: "hero", label: "Hero", height: "580px", desc: "Full cinematic showcase" },
            ];

            return (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {SIZES.map((s) => {
                  const isSelected = currentSize === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => field.onChange(s.id)}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50"
                          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${isSelected ? "text-orange-400" : "text-zinc-200"}`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                          {s.height}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 leading-tight">{s.desc}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          }}
        />
      </div>

      {/* Alt text */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Alt Text (Accessibility)
        </label>
        <input
          {...register("altText")}
          placeholder="Describe the banner image for screen readers"
          className="admin-input w-full"
        />
      </div>

      {/* CTA */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            CTA Button Text
          </label>
          <input
            {...register("ctaText")}
            placeholder="e.g. Shop Now"
            className="admin-input w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            CTA Link
          </label>
          <input
            {...register("ctaLink")}
            placeholder="e.g. /shop or https://…"
            className="admin-input w-full"
          />
        </div>
      </div>

      {/* Dates + Display Order */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Start Date
          </label>
          <input type="date" {...register("startDate")} className="admin-input w-full" />
          <p className="text-[10px] text-zinc-600">Asia/Colombo timezone</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" /> End Date
          </label>
          <input type="date" {...register("endDate")} className="admin-input w-full" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Display Order
          </label>
          <input
            type="number"
            min={0}
            {...register("displayOrder", { valueAsNumber: true })}
            className="admin-input w-full"
          />
          <p className="text-[10px] text-zinc-600">Lower = shown first</p>
        </div>
      </div>

      {/* Active toggle */}
      <Controller
        name="active"
        control={control}
        render={({ field }) => (
          <label className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3.5 cursor-pointer hover:border-zinc-700 transition-colors">
            <div>
              <p className="text-xs font-bold text-white">Active / Published</p>
              <p className="text-[10px] text-zinc-500">
                Only active banners with valid dates appear on the homepage
              </p>
            </div>
            <button
              type="button"
              onClick={() => field.onChange(!field.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                field.value ? "bg-orange-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  field.value ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        )}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
        <button type="button" onClick={onCancel} className="admin-btn-ghost">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="admin-btn-primary inline-flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {mode === "create" ? "Create Banner" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ─── Banner row card ──────────────────────────────────────────────────────────

interface BannerRowProps {
  banner: Banner;
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
  onToggle: (b: Banner) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

function BannerRow({ banner, onEdit, onDelete, onToggle, isDeleting, isToggling }: BannerRowProps) {
  const isActive = banner.active;
  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 rounded-xl border p-4 transition-all ${
        isActive ? "border-zinc-700 bg-zinc-900/40" : "border-zinc-800/60 bg-zinc-900/20 opacity-60"
      }`}
    >
      {/* Thumbnail */}
      <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center">
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileImage className="h-8 w-8 text-zinc-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm font-bold text-white truncate">{banner.title}</p>
          {banner.subtitle && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">
              {banner.subtitle}
            </span>
          )}
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
              isActive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-700/30 text-zinc-500 border-zinc-700"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500">
          {banner.ctaText && (
            <span>
              CTA: <span className="text-zinc-300">{banner.ctaText}</span>
            </span>
          )}
          {banner.startDate && (
            <span>
              From: <span className="text-zinc-300">{banner.startDate}</span>
            </span>
          )}
          {banner.endDate && (
            <span>
              To: <span className="text-zinc-300">{banner.endDate}</span>
            </span>
          )}
          <span>
            Order: <span className="text-zinc-300">#{banner.displayOrder}</span>
          </span>
          <span className="capitalize">
            Size: <span className="text-zinc-300 font-semibold">{banner.size || "medium"}</span>
          </span>
        </div>
        <p className="text-[10px] text-zinc-600">
          {banner.mobileImageUrl ? "✓ Mobile image" : "No mobile image"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col items-center gap-2 shrink-0">
        <button
          onClick={() => onToggle(banner)}
          disabled={isToggling}
          title={isActive ? "Deactivate" : "Activate"}
          className={`p-1.5 rounded-lg transition-colors ${
            isActive
              ? "text-emerald-400 hover:bg-emerald-500/10"
              : "text-zinc-500 hover:bg-zinc-700"
          }`}
        >
          {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onEdit(banner)}
          title="Edit"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(banner.id)}
          disabled={isDeleting}
          title="Delete"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function OffersPage() {
  const { data: banners, isLoading } = useQuery(bannersQuery);
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();

  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleCreate = async (values: BannerFormValues) => {
    await createMutation.mutateAsync(values);
    setMode("idle");
  };

  const handleUpdate = async (values: BannerFormValues) => {
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing.id, values });
    setMode("idle");
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    setDeletingId(id);
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
  };

  const handleToggle = async (banner: Banner) => {
    setTogglingId(banner.id);
    await updateMutation.mutateAsync({
      id: banner.id,
      values: { ...banner, active: !banner.active },
    });
    setTogglingId(null);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setMode("edit");
  };

  const cancelForm = () => {
    setMode("idle");
    setEditing(null);
  };

  const activeCount = banners?.filter((b) => b.active).length ?? 0;
  const totalCount = banners?.length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Homepage Special Offers
            </h2>
          </div>
          <p className="text-[11px] text-zinc-500">
            {totalCount === 0
              ? "No banners yet — create your first offer below."
              : `${activeCount} active · ${totalCount} total`}
          </p>
        </div>
        {mode === "idle" && (
          <button
            id="create-banner-btn"
            onClick={() => setMode("create")}
            className="admin-btn-primary flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" /> New Offer Banner
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3.5 text-[11px] text-zinc-400 space-y-1">
        <p>
          <span className="font-bold text-white">How it works:</span> Active banners with matching
          dates appear at the very top of the homepage. Lower display-order number = shown first.
          Dates use the <span className="font-semibold text-orange-400">Asia/Colombo</span>{" "}
          timezone.
        </p>
        <p>
          <span className="font-bold text-white">Images:</span> Upload a file (stored in Supabase
          Storage in production) or paste a public URL. Provide a mobile image for smaller screens.
        </p>
      </div>

      {/* Create / Edit form */}
      {mode !== "idle" && (
        <div className="admin-card">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-5">
            <ImageIcon className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">
              {mode === "create" ? "Create New Banner" : `Editing: ${editing?.title}`}
            </h3>
          </div>
          <BannerForm
            mode={mode}
            defaultValues={editing ?? undefined}
            onSubmit={mode === "create" ? handleCreate : handleUpdate}
            onCancel={cancelForm}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}

      {/* Banner list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading banners…</span>
          </div>
        ) : banners && banners.length > 0 ? (
          banners.map((b) => (
            <BannerRow
              key={b.id}
              banner={b}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              isDeleting={deletingId === b.id}
              isToggling={togglingId === b.id}
            />
          ))
        ) : mode === "idle" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            <ImageIcon className="h-10 w-10 text-zinc-700" />
            <p className="text-sm font-semibold">No offer banners yet</p>
            <button
              onClick={() => setMode("create")}
              className="admin-btn-primary flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" /> Create your first banner
            </button>
          </div>
        ) : null}
      </div>

      {/* Preview link */}
      {totalCount > 0 && (
        <div className="flex justify-end">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-orange-400" />
            Preview homepage
          </a>
        </div>
      )}
    </div>
  );
}
