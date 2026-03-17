import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section-padding flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-8xl font-bold text-surface-overlay">404</p>
      <h1 className="font-heading mt-4 text-3xl font-bold md:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-text-secondary">
        The page you are looking for does not exist or has been moved. Let us
        get you back on track.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link href="/" className="btn-primary">
          Go Home
        </Link>
        <Link href="/products" className="btn-secondary">
          Browse Products
        </Link>
      </div>
    </main>
  );
}
