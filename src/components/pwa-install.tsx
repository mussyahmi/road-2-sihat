"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState =
  | { type: "android"; promptEvent: BeforeInstallPromptEvent }
  | { type: "ios" }
  | { type: "hidden" };

export function PWAInstallButton() {
  const [state, setState] = useState<InstallState>({ type: "hidden" });
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return;

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;

    if (isIOS) {
      setState({ type: "ios" });
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setState({ type: "android", promptEvent: e as BeforeInstallPromptEvent });
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (state.type === "hidden") return null;

  if (state.type === "android") {
    return (
      <button
        onClick={async () => {
          if (state.type !== "android") return;
          await state.promptEvent.prompt();
          const { outcome } = await state.promptEvent.userChoice;
          if (outcome === "accepted") setState({ type: "hidden" });
        }}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install</span>
      </button>
    );
  }

  // iOS
  return (
    <>
      <button
        onClick={() => setShowIOSModal(true)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install</span>
      </button>

      {showIOSModal && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
          onClick={() => setShowIOSModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Install Road2Sihat</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Add to your home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold mt-0.5">
                  1
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tap the{" "}
                  <span className="inline-flex items-center gap-1 text-foreground font-medium">
                    <Share className="h-3.5 w-3.5 inline" /> Share
                  </span>{" "}
                  button in Safari&apos;s toolbar at the bottom of the screen
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold mt-0.5">
                  2
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scroll down and tap{" "}
                  <strong className="text-foreground font-medium">Add to Home Screen</strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold mt-0.5">
                  3
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tap <strong className="text-foreground font-medium">Add</strong> to confirm
                </p>
              </li>
            </ol>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
