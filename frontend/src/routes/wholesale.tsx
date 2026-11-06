import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, FileText, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/site/PageHeading";
import { submitWholesaleRequestApi } from "@/services/api";

export const Route = createFileRoute("/wholesale")({
  head: () => ({ meta: [{ title: "Wholesale & Bulk Orders — Asiaelectronics" }] }),
  component: WholesalePage,
});

const initialForm = { customerName: "", companyName: "", phone: "", email: "", requestDetails: "" };

function WholesalePage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function selectPdf(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) return setFile(null);
    if (nextFile.type !== "application/pdf" || nextFile.size > 2 * 1024 * 1024) {
      event.target.value = "";
      toast.error("Upload a PDF no larger than 2 MB.");
      return;
    }
    setFile(nextFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const pdfData = file ? await readPdf(file) : undefined;
      const result = await submitWholesaleRequestApi({ ...form, pdfData, pdfName: file?.name });
      if (!result.success) return toast.error(result.error || "Could not submit your request");
      setSubmitted(true);
      setForm(initialForm);
      setFile(null);
      if (result.whatsappUrl) window.location.assign(result.whatsappUrl);
    } catch {
      toast.error("Could not read the attached PDF.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeading title="Wholesale & Bulk Orders" />
      <main className="container-shop pb-16 sm:pb-20">
        <section className="bg-ink px-6 py-10 text-ink-foreground sm:px-10 sm:py-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">
            Business supply solutions
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Request a wholesale quotation
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-foreground/75 sm:text-base">
            Tell us the products, quantities and specifications you need. You can attach a PDF item
            list or specification sheet and our team will prepare a quotation.
          </p>
        </section>
        {submitted ? (
          <section className="mt-8 border border-green-500/40 bg-green-50 p-7 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <h2 className="mt-3 font-display text-xl font-black uppercase">Request received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team will review your request and contact you with a quotation.
            </p>
            <button
              type="button"
              className="mt-5 text-sm font-bold text-primary underline"
              onClick={() => setSubmitted(false)}
            >
              Submit another request
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 border border-border bg-card p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Your name"
                value={form.customerName}
                onChange={(customerName) => setForm({ ...form, customerName })}
                required
              />
              <Input
                label="Company name"
                value={form.companyName}
                onChange={(companyName) => setForm({ ...form, companyName })}
              />
              <Input
                label="Phone number"
                type="tel"
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone })}
                required
              />
              <Input
                label="Email address"
                type="email"
                value={form.email}
                onChange={(email) => setForm({ ...form, email })}
                required
              />
            </div>
            <label className="mt-5 block text-sm font-bold">
              Products, quantities and requirements <span className="text-primary">*</span>
              <textarea
                required
                rows={6}
                value={form.requestDetails}
                onChange={(event) => setForm({ ...form, requestDetails: event.target.value })}
                placeholder="Example: 50 LED drivers, 100W, 220V; preferred brand; delivery location…"
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="mt-5 flex cursor-pointer items-center gap-3 border border-dashed border-border p-4 hover:border-primary">
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-sm">
                <b>Attach a PDF</b>{" "}
                <span className="text-muted-foreground">(optional, max 2 MB)</span>
                <br />
                {file ? file.name : "Item list, specification sheet or purchase requirement"}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={selectPdf}
              />
            </label>
            <button
              disabled={submitting}
              className="mt-6 inline-flex h-11 items-center gap-2 bg-primary px-5 text-xs font-extrabold uppercase text-primary-foreground disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {submitting ? "Sending request" : "Request quotation"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}

function readPdf(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      {required && <span className="text-primary"> *</span>}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
