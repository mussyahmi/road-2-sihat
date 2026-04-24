"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Activity, ExternalLink, Copy, Check } from "lucide-react";
import { isInAppBrowser } from "@/lib/is-in-app-browser";

function InAppBrowserBanner() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "https://road2sihat.web.app";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl p-4 space-y-3.5"
      style={{
        border: "1px solid oklch(0.62 0.155 75 / 25%)",
        background: "oklch(0.62 0.155 75 / 8%)",
      }}
    >
      <div className="flex gap-3 items-start">
        <div
          className="shrink-0 mt-0.5 flex items-center justify-center rounded-lg h-8 w-8"
          style={{ background: "oklch(0.62 0.155 75 / 15%)" }}
        >
          <ExternalLink className="h-3.5 w-3.5" style={{ color: "oklch(0.62 0.155 75)" }} />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold" style={{ color: "oklch(0.55 0.155 75)" }}>
            Open in your browser to sign in
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Google sign-in is blocked inside this in-app browser. Open Road2Sihat in Safari or Chrome to continue.
          </p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.98]"
        style={{
          background: copied
            ? "oklch(0.55 0.14 145)"
            : "oklch(0.62 0.155 75)",
          color: "oklch(0.99 0 0)",
        }}
      >
        {copied
          ? <><Check className="h-3.5 w-3.5" /> Copied!</>
          : <><Copy className="h-3.5 w-3.5" /> Copy link</>}
      </button>
    </div>
  );
}

export default function SignInPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Ambient glow layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 65% 55% at 50% 38%, oklch(0.78 0.155 75 / 8%) 0%, transparent 70%),
            radial-gradient(ellipse 45% 35% at 72% 70%, oklch(0.75 0.15 185 / 5%) 0%, transparent 60%),
            radial-gradient(ellipse 35% 30% at 20% 60%, oklch(0.72 0.15 250 / 4%) 0%, transparent 55%)
          `,
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(oklch(0.95 0 0 / 3%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.95 0 0 / 3%) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Theme toggle */}
      <div className="relative flex justify-end p-5">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[340px] space-y-7">

          {/* Brand mark */}
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div
                  className="absolute -inset-3 rounded-3xl pointer-events-none"
                  style={{ background: "radial-gradient(circle, oklch(0.78 0.155 75 / 15%) 0%, transparent 70%)" }}
                />
              </div>
            </div>
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight leading-none">Road2Sihat</h1>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Precision body composition tracking.<br />
                Your data, your progress.
              </p>
            </div>
          </div>

          {/* Sign-in card or in-app banner */}
          {inApp ? (
            <InAppBrowserBanner />
          ) : (
            <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 space-y-5">
              <div>
                <p className="text-sm font-semibold tracking-tight">Sign in to continue</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Track weight, body fat, muscle mass, and 15+ metrics over time.
                </p>
              </div>

              <Button
                className="w-full h-11 text-sm font-medium gap-2.5"
                onClick={signInWithGoogle}
                disabled={loading}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <p className="text-center text-[11px] text-muted-foreground/70">
                Data stored securely · only accessible to you
              </p>
            </div>
          )}

          {/* Stats teasers */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Metrics", value: "18" },
              { label: "Charts", value: "17+" },
              { label: "History", value: "∞" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border/40 bg-card/40 p-3 text-center"
              >
                <p className="font-data text-base font-bold text-primary">{item.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
