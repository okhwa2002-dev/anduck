"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "click",
  "keydown",
  "mousemove",
  "mousedown",
  "scroll",
  "touchstart",
  "wheel",
] as const;

export function IdleSessionGuard({
  timeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
}: {
  timeoutMs?: number;
}) {
  const router = useRouter();
  const lastActivityAt = useRef(Date.now());
  const loggingOut = useRef(false);

  useEffect(() => {
    const markActivity = () => {
      lastActivityAt.current = Date.now();
    };

    const logoutByIdle = async () => {
      if (loggingOut.current) return;
      loggingOut.current = true;

      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        router.replace("/auth/login?reason=idle");
      }
    };

    const checkIdle = () => {
      if (Date.now() - lastActivityAt.current >= timeoutMs) {
        void logoutByIdle();
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", checkIdle);

    const intervalId = window.setInterval(checkIdle, 30 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      document.removeEventListener("visibilitychange", checkIdle);
      window.clearInterval(intervalId);
    };
  }, [router, timeoutMs]);

  return null;
}
