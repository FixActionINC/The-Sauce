import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

// All public pages are server-rendered at request time. The database (RDS)
// is not available during Docker image builds, and the Footer fetches social
// links + site settings from the DB. Nginx handles response caching.
export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <CartDrawer />
    </>
  );
}
