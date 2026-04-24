"use client";

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";

let skipWaitingTriggered = false;

export function PWARegister() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Only reload when WE triggered skip waiting, not on every controller change
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (skipWaitingTriggered) window.location.reload();
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
    skipWaitingTriggered = true;
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
        className="update-toast fixed top-[72px] left-1/2 z-50 flex items-center gap-3 rounded-2xl px-3 py-2.5 pr-2"
        style={{
          background: "color-mix(in oklch, var(--popover) 92%, transparent)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          border: "1px solid var(--border)",
          borderLeft: "2px solid var(--primary)",
          boxShadow: "0 8px 32px oklch(0 0 0 / 0.15), 0 0 0 0.5px color-mix(in oklch, var(--primary) 15%, transparent)",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
        }}
      >
        {/* Dot indicator */}
        <span
          className="shrink-0 h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--primary)", boxShadow: "0 0 6px color-mix(in oklch, var(--primary) 80%, transparent)" }}
        />

        <span className="text-[13px] font-medium text-foreground" style={{ letterSpacing: "-0.01em" }}>
          Update ready
        </span>

        {/* Refresh pill */}
        <button
          onClick={applyUpdate}
          className="update-toast-refresh flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            letterSpacing: "-0.01em",
          }}
        >
          <RotateCw className="h-3 w-3" strokeWidth={2.5} />
          Refresh
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="update-toast-dismiss shrink-0 flex items-center justify-center h-6 w-6 rounded-lg text-[16px] leading-none text-muted-foreground"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </>
  );
}
