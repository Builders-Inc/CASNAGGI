import React, { useRef, useState } from "react";
import axios from "axios";
import { AlertCircle, ImageIcon, Link2, Loader2, Upload } from "lucide-react";

import api from "../../lib/api";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Image picker for the event editor.
 *
 * Uploads go straight from the browser to Cloudinary using a short-lived
 * signature issued by our API, so no image bytes pass through the VPS.
 *
 * A pasted URL is a first-class alternative, not a fallback: the seeded events
 * already reference external images, and it keeps the editor usable before a
 * Cloudinary account exists.
 */
const ImageField = ({ value, publicId, onChange, error }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [urlDraft, setUrlDraft] = useState("");

  const upload = async (file) => {
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("That file isn't an image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(
        `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please use one under 8 MB.`
      );
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const { data: signature } = await api.post("/admin/uploads/signature");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signature.apiKey);
      form.append("timestamp", signature.timestamp);
      form.append("folder", signature.folder);
      form.append("signature", signature.signature);

      // A bare axios call on purpose: the shared `api` instance attaches our
      // Authorization header, which must never be sent to a third-party host.
      const { data } = await axios.post(signature.uploadUrl, form, {
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });

      onChange({ image: data.secure_url, imagePublicId: data.public_id });
    } catch (err) {
      setUploadError(
        err.status === 503
          ? "Image uploads aren't configured yet. Paste an image URL instead."
          : "The upload failed. Please try again, or paste an image URL."
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div data-testid="image-field">
      <label className="overline text-brand-mute">Event image</label>

      <div className="mt-3 grid sm:grid-cols-[200px_1fr] gap-5 items-start">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-brand-rule bg-brand-sand flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-brand-clay" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-brand-ink/70 flex flex-col items-center justify-center text-white text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {progress}%
            </div>
          )}
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-outline disabled:opacity-60"
            data-testid="image-upload-btn"
          >
            <Upload className="h-4 w-4" /> Upload an image
          </button>
          <p className="mt-2 text-xs text-brand-mute">
            JPG, PNG or WebP, up to 8 MB. Landscape works best.
          </p>

          <div className="mt-5 pt-5 border-t border-brand-rule">
            <label className="text-xs text-brand-mute" htmlFor="image-url">
              …or paste an image URL
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="image-url"
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://…"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-brand-rule bg-white text-sm focus:outline-none focus:border-brand-terracotta transition"
                data-testid="image-url-input"
              />
              <button
                type="button"
                onClick={() => {
                  if (!urlDraft.trim()) return;
                  onChange({ image: urlDraft.trim(), imagePublicId: null });
                  setUrlDraft("");
                  setUploadError(null);
                }}
                className="btn-ghost flex-shrink-0"
              >
                <Link2 className="h-4 w-4" /> Use
              </button>
            </div>
          </div>

          {(uploadError || error) && (
            <p className="mt-3 text-sm text-brand-terracotta flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              {uploadError || error}
            </p>
          )}

          {publicId && (
            <p className="mt-3 text-xs text-brand-mute break-all">
              Stored in Cloudinary as {publicId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageField;
