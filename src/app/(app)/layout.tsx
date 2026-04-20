"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      {(pathname === "/dashboard" || pathname === "/dashboard/") && (
        <Link
          href="/add"
          className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 4px 24px oklch(0.78 0.155 75 / 30%)" }}
          aria-label="Add Entry"
        >
          <Plus className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
