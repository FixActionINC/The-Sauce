import { GalleryManager } from "@/components/admin/GalleryManager";
import { getGalleryImages } from "@/lib/services/gallery.service";

export default async function AdminGalleryPage() {
  const images = await getGalleryImages();

  return (
    <div>
      <h1 className="text-2xl font-bold">Photo Gallery</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Upload lifestyle photos for the homepage Instagram-style grid.
      </p>

      <div className="mt-6">
        <GalleryManager images={images} />
      </div>
    </div>
  );
}
