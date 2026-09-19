import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Loader2, Save, Wand2 } from "lucide-react";

import api from "../../lib/api";
import useApi from "../../hooks/useApi";
import ErrorState from "../../components/ErrorState";
import ImageField from "../components/ImageField";
import RepeatableList from "../components/RepeatableList";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Mirrors the server's fallback so the editor can preview what it would store. */
function deriveLabel(iso) {
  if (!iso) return "";
  const [year, month] = iso.split("-");
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : "";
}

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

const EMPTY = {
  title: "",
  slug: "",
  date: "",
  dateLabel: "",
  category: "",
  location: "",
  excerpt: "",
  image: "",
  imagePublicId: null,
  tags: [],
  story: [""],
  stats: [{ value: "", label: "" }],
  published: false,
};

const input =
  "mt-2 w-full px-4 py-3 rounded-xl border bg-white text-sm focus:outline-none transition";
const border = (bad) =>
  bad ? "border-brand-terracotta" : "border-brand-rule focus:border-brand-terracotta";

const Field = ({ label, hint, error, children }) => (
  <div>
    <label className="overline text-brand-mute">{label}</label>
    {children}
    {hint && !error && <p className="mt-1.5 text-xs text-brand-mute">{hint}</p>}
    {error && (
      <p className="mt-1.5 text-xs text-brand-terracotta flex items-center gap-1.5">
        <AlertCircle className="h-3 w-3 flex-shrink-0" /> {error}
      </p>
    )}
  </div>
);

const EventEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, loading, error: loadError, refetch } = useApi(
    isEdit ? `/admin/events/${id}` : null,
    { skip: !isEdit }
  );
  const { data: allEvents } = useApi("/admin/events");

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // A published slug is a live URL; changing it breaks every existing link.
  const [slugUnlocked, setSlugUnlocked] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        ...EMPTY,
        ...existing,
        story: existing.story?.length ? existing.story : [""],
        stats: existing.stats?.length ? existing.stats : [{ value: "", label: "" }],
      });
      setDirty(false);
    }
  }, [existing]);

  // Browser-level guard; React Router v7 blockers are overkill for one form.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const categories = useMemo(() => {
    const set = new Set((allEvents?.items ?? []).map((e) => e.category));
    return Array.from(set).sort();
  }, [allEvents]);

  const set = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const onTitleChange = (title) => {
    // Only auto-fill the slug while it's still untouched and unpublished.
    const shouldSync = !isEdit && (!form.slug || form.slug === slugify(form.title));
    set(shouldSync ? { title, slug: slugify(title) } : { title });
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "A title is required.";
    if (!form.date) next.date = "Pick the date this happened (or will happen).";
    if (!form.category.trim()) next.category = "A category is required.";
    if (!form.location.trim()) next.location = "A location is required.";
    if (!form.excerpt.trim()) next.excerpt = "A short summary is required.";
    if (!form.image.trim()) next.image = "Upload an image or paste an image URL.";
    // The public pages map and join tags without guarding, so an untagged
    // event would break them.
    if (form.tags.filter((t) => t.trim()).length === 0)
      next.tags = "Add at least one tag.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (publishOverride) => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        published: publishOverride ?? form.published,
        tags: form.tags.map((t) => t.trim()).filter(Boolean),
        story: form.story.map((p) => p.trim()).filter(Boolean),
        stats: form.stats.filter((s) => s.value.trim() && s.label.trim()),
      };
      if (!isEdit) delete payload.id;

      const { data } = isEdit
        ? await api.patch(`/admin/events/${id}`, payload)
        : await api.post("/admin/events", payload);

      setDirty(false);
      toast.success(
        payload.published ? `"${data.title}" is live.` : "Saved as a draft."
      );
      navigate("/admin/events");
    } catch (err) {
      if (err.status === 409) {
        setErrors({ slug: "That URL is already taken by another event." });
      } else if (Object.keys(err.fieldErrors || {}).length) {
        setErrors(err.fieldErrors);
      }
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loadError) {
    return (
      <ErrorState
        title="We couldn't load this event."
        onRetry={refetch}
        testId="admin-editor-error"
      />
    );
  }
  if (isEdit && loading) {
    return (
      <div className="flex items-center gap-3 text-brand-mute">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading event…
      </div>
    );
  }

  const derived = deriveLabel(form.date);
  const slugLocked = isEdit && form.published && !slugUnlocked;

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-2 text-sm text-brand-mute hover:text-brand-ink transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <h1 className="font-display text-3xl md:text-4xl font-semibold mt-5">
        {isEdit ? "Edit event" : "New event"}
      </h1>

      <div className="mt-10 space-y-10">
        {/* Details */}
        <section className="rounded-2xl border border-brand-rule bg-white p-6 md:p-8 space-y-5">
          <h2 className="font-display text-xl font-medium">Details</h2>

          <Field label="Title" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className={`${input} ${border(errors.title)}`}
              data-testid="event-title"
            />
          </Field>

          <Field
            label="Web address"
            hint={`This event will live at /events/${form.slug || "…"}`}
            error={errors.slug}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={form.slug}
                disabled={slugLocked}
                onChange={(e) => set({ slug: slugify(e.target.value) })}
                className={`${input} ${border(errors.slug)} flex-1 disabled:bg-brand-sand/50 disabled:text-brand-mute`}
                data-testid="event-slug"
              />
              {slugLocked && (
                <button
                  type="button"
                  onClick={() => setSlugUnlocked(true)}
                  className="btn-ghost mt-2 flex-shrink-0 text-xs"
                >
                  Change
                </button>
              )}
            </div>
            {slugLocked && (
              <p className="mt-1.5 text-xs text-brand-mute">
                Locked because this event is published — changing it breaks any
                existing links to it.
              </p>
            )}
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Date" error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                className={`${input} ${border(errors.date)}`}
                data-testid="event-date"
              />
            </Field>

            <Field
              label="Date label"
              hint={derived ? `Leave blank to use "${derived}"` : "Shown on the site"}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.dateLabel}
                  placeholder={derived}
                  onChange={(e) => set({ dateLabel: e.target.value })}
                  className={`${input} ${border(false)} flex-1`}
                  data-testid="event-date-label"
                />
                {form.dateLabel && (
                  <button
                    type="button"
                    onClick={() => set({ dateLabel: "" })}
                    className="btn-ghost mt-2 flex-shrink-0 text-xs"
                    title="Reset to the automatic label"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field
              label="Category"
              hint="Becomes a filter button on the public events page."
              error={errors.category}
            >
              <input
                type="text"
                list="event-categories"
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
                className={`${input} ${border(errors.category)}`}
                data-testid="event-category"
              />
              <datalist id="event-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            <Field label="Location" error={errors.location}>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set({ location: e.target.value })}
                className={`${input} ${border(errors.location)}`}
                data-testid="event-location"
              />
            </Field>
          </div>

          <Field
            label="Short summary"
            hint="Shown on cards and used for search and social previews."
            error={errors.excerpt}
          >
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => set({ excerpt: e.target.value })}
              className={`${input} ${border(errors.excerpt)} resize-none`}
              data-testid="event-excerpt"
            />
          </Field>
        </section>

        {/* Image */}
        <section className="rounded-2xl border border-brand-rule bg-white p-6 md:p-8">
          <ImageField
            value={form.image}
            publicId={form.imagePublicId}
            error={errors.image}
            onChange={(patch) => set(patch)}
          />
        </section>

        {/* Story + stats */}
        <section className="rounded-2xl border border-brand-rule bg-white p-6 md:p-8 space-y-8">
          <h2 className="font-display text-xl font-medium">The story</h2>

          <RepeatableList
            label="Paragraphs"
            hint="Each one becomes a paragraph on the event page."
            items={form.story}
            onChange={(story) => set({ story })}
            emptyItem=""
            addLabel="Add a paragraph"
            testId="event-story"
            renderRow={(value, onRowChange) => (
              <textarea
                rows={4}
                value={value}
                onChange={(e) => onRowChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-rule text-sm focus:outline-none focus:border-brand-terracotta resize-y"
              />
            )}
          />

          <RepeatableList
            label="Key numbers"
            hint="Displayed beside the story. Two to four works best."
            items={form.stats}
            onChange={(stats) => set({ stats })}
            emptyItem={{ value: "", label: "" }}
            addLabel="Add a number"
            max={6}
            testId="event-stats"
            renderRow={(value, onRowChange) => (
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <input
                  type="text"
                  value={value.value}
                  placeholder="500+"
                  onChange={(e) => onRowChange({ ...value, value: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-brand-rule text-sm focus:outline-none focus:border-brand-terracotta"
                />
                <input
                  type="text"
                  value={value.label}
                  placeholder="Families supported"
                  onChange={(e) => onRowChange({ ...value, label: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-brand-rule text-sm focus:outline-none focus:border-brand-terracotta"
                />
              </div>
            )}
          />

          <RepeatableList
            label="Tags"
            hint="At least one is required."
            items={form.tags}
            onChange={(tags) => set({ tags })}
            emptyItem=""
            addLabel="Add a tag"
            max={12}
            testId="event-tags"
            renderRow={(value, onRowChange) => (
              <input
                type="text"
                value={value}
                onChange={(e) => onRowChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-rule text-sm focus:outline-none focus:border-brand-terracotta"
              />
            )}
          />
          {errors.tags && (
            <p className="text-xs text-brand-terracotta flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> {errors.tags}
            </p>
          )}
        </section>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 mt-8 -mx-5 md:-mx-10 px-5 md:px-10 py-4 bg-brand-bg/95 backdrop-blur border-t border-brand-rule flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={saving}
          className="btn-outline disabled:opacity-60"
          data-testid="event-save-draft"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save as draft
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving}
          className="btn-primary disabled:opacity-60"
          data-testid="event-save-publish"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {form.published ? "Save changes" : "Publish"}
        </button>
        {dirty && (
          <span className="text-xs text-brand-mute">Unsaved changes</span>
        )}
      </div>
    </div>
  );
};

export default EventEditor;
