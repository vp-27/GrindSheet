import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useAuth } from "@/context/AuthContext";

export default function PWAStatus() {
  const { user, isDemo } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const viewport = window.visualViewport;
    const resize = () => {
      const root = document.documentElement;
      root.style.setProperty(
        "--visual-viewport-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      root.style.setProperty(
        "--visual-viewport-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
      root.style.setProperty(
        "--keyboard-inset",
        `${Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0))}px`,
      );
    };
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <>
      {!online && user && (
        <div className="pwa-notice" role="status">
          {isDemo
            ? "Offline · demo changes stay on this device."
            : "You’re offline. Reconnect to load and save workouts."}
        </div>
      )}
      {needRefresh && (
        <div className="pwa-notice" role="status">
          <span>A new version is ready.</span>
          <button type="button" onClick={() => void updateServiceWorker(true)}>
            Update
          </button>
          <button type="button" onClick={() => setNeedRefresh(false)}>
            Later
          </button>
        </div>
      )}
    </>
  );
}
