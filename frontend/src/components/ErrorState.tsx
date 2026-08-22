import { useOnlineStatus } from "../lib/networkStatus";

type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "The catalogue could not be loaded. Check your connection and try again."
}: ErrorStateProps) {
  const isOnline = useOnlineStatus();
  const displayTitle = isOnline ? title : "You are offline";
  const displayMessage = isOnline ? message : "Check your connection and try again.";

  return (
    <div className="rounded border border-berry/25 bg-white p-6 text-sm">
      <h2 className="text-lg font-semibold text-berry">{displayTitle}</h2>
      <p className="mt-2 text-ink/70">{displayMessage}</p>
    </div>
  );
}
