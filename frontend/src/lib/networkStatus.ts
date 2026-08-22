import { useEffect, useState } from "react";

export function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => !isBrowserOffline());

  useEffect(() => {
    function updateStatus() {
      setIsOnline(!isBrowserOffline());
    }

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return isOnline;
}
