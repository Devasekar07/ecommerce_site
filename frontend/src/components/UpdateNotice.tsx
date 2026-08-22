import { RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useVersionMetadata } from "../features/catalog/api/catalogApi";

export function UpdateNotice() {
  const [dismissed, setDismissed] = useState(false);
  const versionQuery = useVersionMetadata();

  if (dismissed || !versionQuery.data) {
    return null;
  }

  const { currentVersion, latest } = versionQuery.data;

  if (!isNewerVersion(latest.version, currentVersion)) {
    return null;
  }

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded border border-ink/15 bg-white px-4 py-3 text-sm shadow-soft">
      <div>
        <p className="font-medium text-ink">A newer version is available.</p>
        <p className="text-ink/70">{latest.message}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded bg-ink text-paper"
          aria-label="Refresh to update"
          onClick={() => window.location.reload()}
        >
          <RefreshCw aria-hidden="true" size={16} />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded border border-ink/15 text-ink"
          aria-label="Dismiss update notice"
          onClick={() => setDismissed(true)}
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
    </aside>
  );
}

function isNewerVersion(latest: string, current: string) {
  const latestParts = parseVersion(latest);
  const currentParts = parseVersion(current);

  for (let index = 0; index < 3; index += 1) {
    const latestPart = latestParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;

    if (latestPart > currentPart) {
      return true;
    }

    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

function parseVersion(version: string) {
  return version
    .replace(/[^0-9.].*$/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}
