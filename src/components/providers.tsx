"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
