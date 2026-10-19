import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/admin-app";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header admin />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        <AdminApp />
      </main>
    </div>
  );
}
