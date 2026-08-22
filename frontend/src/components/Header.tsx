import { Menu, ShoppingBag, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUiStore } from "../app/uiStore";
import { BrandLockup } from "./BrandLockup";
import { useCurrentCustomer } from "../features/auth/api/authApi";
import { useCart } from "../features/cart/api/cartApi";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "New In", to: "/search?sort=newest" },
  { label: "Women", to: "/departments/women", department: "women" },
  { label: "Men", to: "/departments/men", department: "men" },
  { label: "Accessories", to: "/departments/accessories", department: "accessories" }
];

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobileNavOpen = useUiStore((state) => state.isMobileNavOpen);
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);
  const closeMobileNav = useUiStore((state) => state.closeMobileNav);
  const customerQuery = useCurrentCustomer();
  const cartQuery = useCart();
  const basketCount = cartQuery.data?.cart.summary.itemCount ?? 0;
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isTransparent = isHome && !isScrolled && !isMobileNavOpen;

  useEffect(() => {
    function updateScrolled() {
      setIsScrolled(window.scrollY > 40);
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    closeMobileNav();
  }, [closeMobileNav, location.pathname, location.search]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileNavOpen]);

  function isActiveLink(link: (typeof navLinks)[number]) {
    if (link.to === "/") {
      return location.pathname === "/";
    }

    if (link.department) {
      return location.pathname === `/departments/${link.department}` || location.pathname.startsWith(`/departments/${link.department}/`);
    }

    return location.pathname === "/search" && !searchParams.get("department");
  }

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200",
        isTransparent
          ? "border-transparent bg-transparent text-white"
          : "border-ink/10 bg-paper/95 text-ink shadow-[0_1px_0_rgba(21,21,21,0.02)] backdrop-blur"
      ].join(" ")}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
        <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <HeaderLink key={link.label} to={link.to} isActive={isActiveLink(link)}>
              {link.label}
            </HeaderLink>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded border border-current/20 md:hidden"
          aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileNavOpen}
          onClick={toggleMobileNav}
        >
          {isMobileNavOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </button>

        <Link to="/" className="justify-self-center" aria-label="AVE home">
          <BrandLockup
            imageClassName="h-8 w-16"
            textClassName={isTransparent ? "text-lg text-white" : "text-lg text-ink"}
          />
        </Link>

        <div className="hidden items-center justify-end gap-6 md:flex">
          <HeaderLink to="/search" isActive={location.pathname === "/search"}>
            Search
          </HeaderLink>
          <BagLink basketCount={basketCount} />
          {customerQuery.data ? (
            <details className="group relative">
              <summary className="cursor-pointer list-none text-sm font-medium outline-none transition hover:opacity-75 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-current/40">
                Profile
              </summary>
              <div className="absolute right-0 top-8 w-40 rounded border border-ink/10 bg-paper p-2 text-ink shadow-soft">
                <Link to="/account" className="block rounded px-3 py-2 text-sm font-medium hover:bg-mist">
                  Account
                </Link>
              </div>
            </details>
          ) : (
            <HeaderLink to="/login" isActive={location.pathname === "/login"}>
              Sign in
            </HeaderLink>
          )}
        </div>

        <div className="flex items-center justify-end md:hidden">
          <BagLink basketCount={basketCount} compact />
        </div>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-x-0 top-16 h-[calc(100vh-4rem)] overflow-auto bg-paper px-4 py-6 text-ink md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2" aria-label="Mobile primary">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded border border-ink/10 bg-white px-4 py-4 text-lg font-semibold"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/search" className="rounded border border-ink/10 bg-white px-4 py-4 text-lg font-semibold">
              Search
            </Link>
            <Link
              to={customerQuery.data ? "/account" : "/login"}
              className="rounded border border-ink/10 bg-white px-4 py-4 text-lg font-semibold"
            >
              {customerQuery.data ? "Profile" : "Sign in"}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function HeaderLink({ to, isActive, children }: { to: string; isActive: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={[
        "rounded text-sm font-medium transition hover:opacity-75 focus-visible:ring-2 focus-visible:ring-current/40",
        isActive ? "underline underline-offset-4" : ""
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function BagLink({ basketCount, compact = false }: { basketCount: number; compact?: boolean }) {
  return (
    <Link
      to="/basket"
      className={[
        "inline-flex items-center gap-2 rounded font-medium transition hover:opacity-75 focus-visible:ring-2 focus-visible:ring-current/40",
        compact ? "h-10 px-2" : "text-sm"
      ].join(" ")}
      aria-label={basketCount > 0 ? `Bag, ${basketCount} items` : "Bag"}
    >
      <ShoppingBag aria-hidden="true" size={compact ? 20 : 17} />
      {!compact ? <span>Bag</span> : null}
      {basketCount > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-xs font-semibold text-paper">
          {basketCount}
        </span>
      ) : null}
    </Link>
  );
}
