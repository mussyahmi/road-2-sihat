"use client";

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";

export function PWARegister() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      const onUpdateFound = () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingSW(newWorker);
            setDismissed(false);
          }
        });
      };

      reg.addEventListener("updatefound", onUpdateFound);

      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingSW(reg.waiting);
      }
    }).catch(console.error);
  }, []);

  function applyUpdate() {
    if (!waitingSW) return;
    waitingSW.postMessage("SKIP_WAITING");
    setWaitingSW(null);
  }

  if (!waitingSW || dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes slide-down-toast {
          from { transform: translateX(-50%) translateY(-120%); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);     opacity: 1; }
        }
        .update-toast {
          animation: slide-down-toast 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .update-toast-refresh {
          transition: background 0.15s, transform 0.1s;
        }
        .update-toast-refresh:active {
          transform: scale(0.95);
          background: oklch(0.68 0.155 75);
        }
        .update-toast-dismiss:active {
          opacity: 0.5;
        }
      `}</style>

      <div
        className="update-toast fixed top-4 left-1/2 z-50 flex items-center gap-3 rounded-2xl px-3 py-2.5 pr-2"
        style={{
          background: "oklch(0.18 0.01 250 / 0.92)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          border: "1px solid oklch(0.32 0.01 250 / 0.6)",
          borderLeft: "2px solid oklch(0.78 0.155 75 / 0.9)",
          boxShadow: "0 8px 32px oklch(0 0 0 / 0.5), 0 0 0 0.5px oklch(0.78 0.155 75 / 0.15)",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
        }}
      >
        {/* Orange dot indicator */}
        <span
          className="shrink-0 h-1.5 w-1.5 rounded-full"
          style={{ background: "oklch(0.78 0.155 75)", boxShadow: "0 0 6px oklch(0.78 0.155 75 / 0.8)" }}
        />

        <span className="text-[13px] font-medium" style={{ color: "oklch(0.88 0.008 250)", letterSpacing: "-0.01em" }}>
          Update ready
        </span>

        {/* Refresh pill */}
        <button
          onClick={applyUpdate}
          className="update-toast-refresh flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
          style={{
            background: "oklch(0.78 0.155 75)",
            color: "oklch(0.10 0.008 250)",
            letterSpacing: "-0.01em",
          }}
        >
          <RotateCw className="h-3 w-3" strokeWidth={2.5} />
          Refresh
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="update-toast-dismiss shrink-0 flex items-center justify-center h-6 w-6 rounded-lg text-[16px] leading-none"
          style={{ color: "oklch(0.50 0.01 250)" }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </>
  );
}
