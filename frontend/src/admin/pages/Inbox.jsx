import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Inbox as InboxIcon,
  Loader2,
  Mail,
  MailOpen,
  Phone,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";

import api from "../../lib/api";
import useApi from "../../hooks/useApi";
import ErrorState from "../../components/ErrorState";
import ConfirmDialog from "../components/ConfirmDialog";

const FILTERS = [
  { key: "all", label: "All", params: undefined },
  { key: "unread", label: "Unread", params: { read: false } },
  { key: "read", label: "Read", params: { read: true } },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const Inbox = () => {
  const [filterKey, setFilterKey] = useState("all");
  const filter = FILTERS.find((f) => f.key === filterKey);

  const { data, loading, error, refetch } = useApi("/admin/messages", {
    params: filter.params,
  });

  const [selected, setSelected] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const messages = useMemo(() => data?.items ?? [], [data]);

  const open = async (message) => {
    setSelected(message);
    if (!message.read) {
      try {
        await api.patch(`/admin/messages/${message.id}`, { read: true });
        refetch();
      } catch {
        /* non-critical: the message is still readable */
      }
    }
  };

  const toggleRead = async (message) => {
    try {
      await api.patch(`/admin/messages/${message.id}`, { read: !message.read });
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resend = async (message) => {
    setBusy(true);
    try {
      const { data: updated } = await api.post(
        `/admin/messages/${message.id}/resend`
      );
      if (updated.emailNotified) {
        toast.success("Notification sent.");
      } else {
        toast.error(updated.emailError || "Still couldn't send.");
      }
      setSelected(updated);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/messages/${pendingDelete.id}`);
      toast.success("Message deleted.");
      if (selected?.id === pendingDelete.id) setSelected(null);
      setPendingDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="overline">Messages</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            Inbox
            {data?.unreadCount > 0 && (
              <span className="ml-3 align-middle inline-block px-3 py-1 rounded-full bg-brand-terracotta text-white text-sm">
                {data.unreadCount} new
              </span>
            )}
          </h1>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="btn-ghost"
          data-testid="inbox-refresh"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterKey(f.key)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filterKey === f.key
                ? "bg-brand-ink text-white"
                : "border border-brand-rule hover:bg-brand-sand"
            }`}
            data-testid={`inbox-filter-${f.key}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {error ? (
          <ErrorState
            title="We couldn't load your messages."
            onRetry={refetch}
            testId="inbox-error"
          />
        ) : loading && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-brand-clay/20 animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-rule bg-white px-8 py-14 text-center">
            <InboxIcon className="h-8 w-8 text-brand-clay mx-auto" />
            <p className="mt-4 font-display text-xl">
              {filterKey === "all" ? "No messages yet." : "Nothing here."}
            </p>
            <p className="mt-2 text-sm text-brand-mute">
              Messages sent through the website contact form land here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => open(m)}
                  className={`w-full text-left rounded-2xl border p-4 md:p-5 transition hover:border-brand-clay ${
                    m.read
                      ? "border-brand-rule bg-white"
                      : "border-brand-terracotta/30 bg-brand-terracotta/5"
                  }`}
                  data-testid={`inbox-message-${m.id}`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {!m.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-terracotta flex-shrink-0" />
                    )}
                    <span className="font-medium">
                      {[m.firstName, m.lastName].filter(Boolean).join(" ")}
                    </span>
                    <span className="text-sm text-brand-mute">{m.email}</span>
                    <span className="ml-auto text-xs text-brand-mute whitespace-nowrap">
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-brand-ink/70 line-clamp-2">
                    {m.message}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-brand-sand text-[10px] uppercase tracking-[0.15em] text-brand-ink/70">
                      {m.role}
                    </span>
                    {!m.emailNotified && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-terracotta/10 text-[10px] uppercase tracking-[0.15em] text-brand-terracotta"
                        title={m.emailError || "The notification email was not sent."}
                      >
                        <AlertTriangle className="h-3 w-3" /> Not emailed
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detail */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5 py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Message detail"
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-2xl max-h-full overflow-y-auto rounded-2xl border border-brand-rule bg-brand-bg p-7 md:p-9">
            <p className="overline">{selected.role}</p>
            <h2 className="font-display text-2xl font-medium mt-3">
              {[selected.firstName, selected.lastName].filter(Boolean).join(" ")}
            </h2>
            <p className="mt-1 text-sm text-brand-mute">
              {formatDate(selected.createdAt)}
            </p>

            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <a
                href={`mailto:${selected.email}`}
                className="inline-flex items-center gap-2 text-brand-terracotta hover:underline"
              >
                <Mail className="h-4 w-4" /> {selected.email}
              </a>
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="inline-flex items-center gap-2 text-brand-terracotta hover:underline"
                >
                  <Phone className="h-4 w-4" /> {selected.phone}
                </a>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-brand-sand p-5 text-[15px] leading-relaxed whitespace-pre-wrap">
              {selected.message}
            </div>

            {!selected.emailNotified && (
              <div className="mt-5 rounded-xl border border-brand-terracotta/30 bg-brand-terracotta/5 p-4 text-sm">
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-brand-terracotta flex-shrink-0" />
                  <span>
                    The notification email wasn't sent
                    {selected.emailError ? ` (${selected.emailError})` : ""}. The
                    message itself was saved safely.
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => resend(selected)}
                  disabled={busy}
                  className="btn-outline mt-4 text-xs disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Try sending again
                </button>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(selected)}
                className="btn-ghost text-brand-terracotta"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                type="button"
                onClick={() => toggleRead(selected)}
                className="btn-ghost"
              >
                {selected.read ? (
                  <>
                    <Mail className="h-4 w-4" /> Mark unread
                  </>
                ) : (
                  <>
                    <MailOpen className="h-4 w-4" /> Mark read
                  </>
                )}
              </button>
              <button type="button" onClick={() => setSelected(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this message?"
        description="This permanently removes the message. If you still need to reply, copy the sender's email first."
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Inbox;
