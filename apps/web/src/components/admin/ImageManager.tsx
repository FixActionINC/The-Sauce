"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface ProductImageData {
  id: number;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface ImageManagerProps {
  productId: number;
  initialImages: ProductImageData[];
}

export default function ImageManager({
  productId,
  initialImages,
}: ImageManagerProps) {
  const [images, setImages] = useState<ProductImageData[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      setUploading(true);

      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", String(productId));

        try {
          const res = await fetch("/api/admin/images", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Upload failed.");
            continue;
          }

          setImages((prev) => [...prev, data as ProductImageData]);
        } catch {
          setError("Network error. Please try again.");
        }
      }

      setUploading(false);
    },
    [productId],
  );

  const handleDelete = useCallback(async (imageId: number) => {
    setError(null);

    try {
      const res = await fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed.");
        return;
      }

      setImages((prev) => {
        const filtered = prev.filter((img) => img.id !== imageId);
        // If we deleted the primary and there are remaining images, first becomes primary
        const hadPrimary = prev.find((img) => img.id === imageId)?.isPrimary;
        if (hadPrimary && filtered.length > 0) {
          filtered[0] = { ...filtered[0], isPrimary: true };
        }
        return filtered;
      });
    } catch {
      setError("Network error. Please try again.");
    }
  }, []);

  const handleSetPrimary = useCallback(async (imageId: number) => {
    setError(null);

    try {
      const res = await fetch("/api/admin/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Update failed.");
        return;
      }

      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        })),
      );
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
              className="group relative rounded-lg border border-surface-overlay bg-surface overflow-hidden"
            >
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.alt || "Product image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>

              {/* Primary badge */}
              {image.isPrimary && (
                <span className="absolute left-2 top-2 rounded bg-brand-orange px-2 py-0.5 text-xs font-semibold text-white">
                  Primary
                </span>
              )}

              {/* Action buttons overlay */}
              <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image.id)}
                    className="rounded bg-surface-elevated/90 px-2 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-brand-orange hover:text-white"
                  >
                    Set Primary
                  </button>
                )}
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
