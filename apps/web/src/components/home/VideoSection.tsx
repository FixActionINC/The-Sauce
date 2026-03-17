"use client";

import { FadeIn } from "@/components/motion";

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/
  );
  return match?.[1] ?? null;
}

export function VideoSection({ videoUrl }: { videoUrl: string | null }) {
  if (!videoUrl) return null;

  const youtubeId = getYouTubeId(videoUrl);

  return (
    <section className="bg-surface-elevated py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <FadeIn>
          <h2 className="mb-10 text-center font-heading text-3xl font-bold uppercase tracking-wider md:text-4xl">
            See The Sauce
          </h2>

          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-surface-overlay shadow-2xl">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                title="The Sauce video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="absolute inset-0 h-full w-full object-cover"
              >
                <track kind="captions" />
              </video>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
