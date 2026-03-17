import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your cart and proceed to checkout.",
};

export default function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
