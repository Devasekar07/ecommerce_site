import { Outlet, useLocation } from "react-router-dom";
import { BrandLockup } from "../components/BrandLockup";
import { Header } from "../components/Header";
import { OfflineBanner } from "../components/OfflineBanner";
import { UpdateNotice } from "../components/UpdateNotice";

export function AppShell() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <OfflineBanner />
      <main className={isHome ? "" : "pt-16"}>
        <Outlet />
      </main>
      <footer className="border-t border-ink/10 px-4 py-8 text-sm text-ink/70 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <BrandLockup imageClassName="h-8 w-16" textClassName="text-base" />
          <span>Modern, premium, accessible fashion in GBP.</span>
        </div>
      </footer>
      <UpdateNotice />
    </div>
  );
}
