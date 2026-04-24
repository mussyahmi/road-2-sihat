"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWARegister() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Reload this tab (and all other open tabs) when a new SW takes control
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
          }
        });
      };

      reg.addEventListener("updatefound", onUpdateFound);

      // Also catch an already-waiting worker (e.g. user navigated back)
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingSW(reg.waiting);
      }
    }).catch(console.error);
  }, []);

  function applyUpdate() {
    if (!waitingSW) return;
    waitingSW.postMessage("SKIP_WAITING");
    setWaitingSW(null);
    // window.location.reload() is NOT called here —
    // the controllerchange listener above handles it in every open tab
  }

  if (!waitingSW) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg text-sm">
      <span>A new version is available.</span>
      <Button size="sm" onClick={applyUpdate} className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </Button>
    </div>
  );
}
