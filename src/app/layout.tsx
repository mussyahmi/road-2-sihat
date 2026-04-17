import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Road 2 Sihat",
  description: "Track and visualize your body composition journey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
