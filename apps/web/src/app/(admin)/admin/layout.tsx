import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin | The Sauce",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  // If no session (login page), render children without the admin shell
  if (!session) {
    return <>{children}</>;
  }

  return <AdminShell user={session}>{children}</AdminShell>;
}
