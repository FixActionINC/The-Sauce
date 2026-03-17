import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text font-heading text-3xl font-bold tracking-tight text-transparent">
            THE SAUCE
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Admin Panel
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
          <h2 className="mb-6 text-lg font-semibold text-text-primary">
            Sign in
          </h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
