import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../lib/networkStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="border-b border-berry/25 bg-berry/10 px-4 py-3 text-sm font-medium text-berry" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-7xl items-center gap-2 sm:px-2 lg:px-4">
        <WifiOff size={18} aria-hidden="true" />
        <span>You are offline. Check your connection and try again.</span>
      </div>
    </div>
  );
}
