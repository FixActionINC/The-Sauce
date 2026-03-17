"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface GalleryImageData {
  id: number;
  url: string;
  alt: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface GalleryManagerProps {
  images: GalleryImageData[];
}

export function GalleryManager({ images: initialImages }: GalleryManagerProps) {
  const [images, setImages] = useState<GalleryImageData[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [alt, setAlt] = useState("");

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      setUploading(true);

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        if (alt.trim()) formData.append("alt", alt.trim());

        try {
          const res = await fetch("/api/admin/gallery", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Upload failed.");
            continue;
          }

          setImages((prev) => [...prev, data as GalleryImageData]);
        } catch {
          setError("Network error. Please try again.");
        }
      }

      setUploading(false);
      setAlt("");
    },
    [alt],
  );

  const handleDelete = useCallback(async (imageId: number) => {
    setError(null);

    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed.");
        return;
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Network error. Please try again.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        uploadFiles(e.target.files);
        e.target.value = "";
      }
    },
    [uploadFiles],
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {error}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-lg border border-surface-overlay bg-surface"
            >
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.alt || "Gallery image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>

              {/* Delete overlay */}
              <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  className="rounded bg-surface-elevated/90 px-2 py-1 text-xs font-medium text-brand-red transition-colors hover:bg-brand-red hover:text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-sm text-text-secondary">
          No gallery images yet. Upload lifestyle photos to display on the homepage.
        </p>
      )}

      {/* Alt text input */}
      <div>
        <label htmlFor="gallery-alt" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Alt text (optional, applies to next upload)
        </label>
        <input
          id="gallery-alt"
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="e.g. Grilled chicken with The Sauce"
          className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
        />
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-brand-orange bg-brand-orange/5"
            : "border-surface-overlay hover:border-brand-orange/50"
        }`}
      >
        {uploading ? (
          <p className="text-sm text-text-secondary">Uploading...</p>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              Drag & drop images here, or{" "}
              <label className="cursor-pointer font-medium text-brand-orange hover:underline">
                browse
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-text-secondary/60">
              JPEG, PNG, WebP, or AVIF. Max 5 MB each.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
