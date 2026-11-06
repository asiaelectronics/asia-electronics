import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  type ApiWholesaleRequest,
  type WholesaleRequestStatus,
  fetchWholesaleRequestsApi,
  updateWholesaleRequestStatusApi,
} from "@/services/api";

export const Route = createFileRoute("/admin/wholesale")({ component: WholesaleRequestsPage });

const statuses: WholesaleRequestStatus[] = [
  "New",
  "Reviewing",
  "Quote Sent",
  "Accepted",
  "Declined",
];

function WholesaleRequestsPage() {
  const [requests, setRequests] = useState<ApiWholesaleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    const data = await fetchWholesaleRequestsApi();
    setLoading(false);
    if (!data)
      return toast.error(
        "Could not load wholesale requests. Apply the database migration if this is a new setup.",
      );
    setRequests(data);
  };
  useEffect(() => {
    void load();
  }, []);
  const updateStatus = async (id: string, status: WholesaleRequestStatus) => {
    setUpdatingId(id);
    const result = await updateWholesaleRequestStatusApi(id, status);
    setUpdatingId(null);
    if (!result.success) return toast.error(result.error || "Could not update status");
    setRequests((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    if (result.emailSent) toast.success("Status updated and customer email sent.");
    else if (result.emailReason !== "Status was unchanged") {
      toast.warning(
        `Status updated, but email was not sent: ${result.emailReason || "unknown reason"}`,
      );
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Orders</p>
          <h2 className="mt-1 text-xl font-black text-white">Wholesale Requests</h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-6 w-6 animate-spin text-orange-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-sm text-zinc-500">
          No wholesale quotation requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{request.customer_name}</h3>
                    {request.company_name && (
                      <span className="text-sm text-zinc-400">· {request.company_name}</span>
                    )}
                    <span className="rounded bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                      {request.id}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {request.phone} · {request.email}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                    {request.request_details}
                  </p>
                  {request.file_url && (
                    <a
                      href={request.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300"
                    >
                      <FileText className="h-4 w-4" />{" "}
                      {request.file_name || "Download attached PDF"}{" "}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <p className="mt-4 text-xs text-zinc-600">
                    Received {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                <label className="shrink-0 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Status
                  <select
                    disabled={updatingId === request.id}
                    value={request.status}
                    onChange={(event) =>
                      void updateStatus(request.id, event.target.value as WholesaleRequestStatus)
                    }
                    className="mt-2 block w-36 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm font-semibold text-white outline-none disabled:opacity-50"
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
