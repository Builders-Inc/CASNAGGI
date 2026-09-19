import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  CalendarDays,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import api from "../../lib/api";
import useApi from "../../hooks/useApi";
import ErrorState from "../../components/ErrorState";
import ConfirmDialog from "../components/ConfirmDialog";

const TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "drafts", label: "Drafts" },
  { key: "upcoming", label: "Upcoming" },
];

const Badge = ({ tone, children }) => {
  const tones = {
    green: "bg-brand-forest/10 text-brand-forest",
    grey: "bg-brand-clay/30 text-brand-ink/70",
    terracotta: "bg-brand-terracotta/10 text-brand-terracotta",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const EventList = () => {
  const { data, loading, error, refetch } = useApi("/admin/events");
  const [tab, setTab] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const events = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(() => {
    switch (tab) {
      case "published":
        return events.filter((e) => e.published);
      case "drafts":
        return events.filter((e) => !e.published);
      case "upcoming":
        return events.filter((e) => e.status === "upcoming");
      default:
        return events;
    }
  }, [events, tab]);

  const togglePublished = async (event) => {
    setBusyId(event.id);
    try {
      await api.post(`/admin/events/${event.id}/publish`, {
        published: !event.published,
      });
      toast.success(event.published ? "Moved to drafts." : "Event published.");
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setBusyId(pendingDelete.id);
    try {
      await api.delete(`/admin/events/${pendingDelete.id}`, {
        params: deleteImage ? { deleteImage: true } : undefined,
      });
      toast.success(`"${pendingDelete.title}" deleted.`);
      setPendingDelete(null);
      setDeleteImage(false);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="overline">Content</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            Events
          </h1>
        </div>
        <Link to="/admin/events/new" className="btn-primary" data-testid="admin-new-event">
          <Plus className="h-4 w-4" /> New event
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count =
            t.key === "all"
              ? events.length
              : t.key === "published"
              ? events.filter((e) => e.published).length
              : t.key === "drafts"
              ? events.filter((e) => !e.published).length
              : events.filter((e) => e.status === "upcoming").length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                tab === t.key
                  ? "bg-brand-ink text-white"
                  : "border border-brand-rule hover:bg-brand-sand"
              }`}
              data-testid={`admin-events-tab-${t.key}`}
            >
              {t.label} {!loading && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {error ? (
          <ErrorState
            title="We couldn't load your events."
            message="The API didn't respond. Your events are safe."
            onRetry={refetch}
            testId="admin-events-error"
          />
        ) : loading && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-brand-clay/20 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-rule bg-white px-8 py-14 text-center">
            <CalendarDays className="h-8 w-8 text-brand-clay mx-auto" />
            <p className="mt-4 font-display text-xl">
              {events.length === 0 ? "No events yet." : "Nothing in this view."}
            </p>
            {events.length === 0 && (
              <Link to="/admin/events/new" className="btn-primary mt-6">
                <Plus className="h-4 w-4" /> Create the first event
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.15em] text-brand-mute">
                  <th className="px-4 pb-2 font-normal">Event</th>
                  <th className="px-4 pb-2 font-normal">Date</th>
                  <th className="px-4 pb-2 font-normal">Status</th>
                  <th className="px-4 pb-2 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr
                    key={event.id}
                    className="bg-white border border-brand-rule"
                    data-testid={`admin-event-row-${event.slug}`}
                  >
                    <td className="px-4 py-3 rounded-l-xl border-y border-l border-brand-rule">
                      <div className="flex items-center gap-3">
                        <img
                          src={event.image}
                          alt=""
                          className="h-12 w-16 rounded-lg object-cover bg-brand-sand flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <p className="text-xs text-brand-mute truncate">
                            {event.category} · /{event.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm border-y border-brand-rule whitespace-nowrap">
                      {event.dateLabel}
                    </td>
                    <td className="px-4 py-3 border-y border-brand-rule">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={event.published ? "green" : "grey"}>
                          {event.published ? "Published" : "Draft"}
                        </Badge>
                        {event.status === "upcoming" && (
                          <Badge tone="terracotta">Upcoming</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 rounded-r-xl border-y border-r border-brand-rule">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => togglePublished(event)}
                          disabled={busyId === event.id}
                          className="p-2 rounded-lg hover:bg-brand-sand disabled:opacity-40"
                          title={event.published ? "Move to drafts" : "Publish"}
                          aria-label={event.published ? "Move to drafts" : "Publish"}
                        >
                          {busyId === event.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : event.published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          to={`/admin/events/${event.id}/edit`}
                          className="p-2 rounded-lg hover:bg-brand-sand"
                          title="Edit"
                          aria-label={`Edit ${event.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(event)}
                          className="p-2 rounded-lg text-brand-terracotta hover:bg-brand-terracotta/10"
                          title="Delete"
                          aria-label={`Delete ${event.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this event?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed from the website permanently. This cannot be undone.`
            : ""
        }
        busy={busyId === pendingDelete?.id}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteImage(false);
        }}
        onConfirm={confirmDelete}
      >
        {pendingDelete?.imagePublicId && (
          <label className="mt-5 flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={deleteImage}
              onChange={(e) => setDeleteImage(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-brand-ink/70">
              Also delete the image from Cloudinary. Leave this unchecked if the
              image is used anywhere else.
            </span>
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default EventList;
