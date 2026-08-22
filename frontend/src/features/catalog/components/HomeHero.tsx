import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProductFilterOptions } from "../api/catalogApi";
import { HeroDiscoveryBar, type DiscoveryValues } from "./HeroDiscoveryBar";
import { MobileDiscoverySheet } from "./MobileDiscoverySheet";

const initialDiscoveryValues: DiscoveryValues = {
  q: "",
  usage: "",
  colour: "",
  size: ""
};

export function HomeHero() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const filterOptionsQuery = useProductFilterOptions({});
  const [values, setValues] = useState<DiscoveryValues>(initialDiscoveryValues);
  const [shouldUseVideo, setShouldUseVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateVideoPreference() {
      setShouldUseVideo(!motionQuery.matches && !prefersStaticHero());
    }

    updateVideoPreference();
    motionQuery.addEventListener("change", updateVideoPreference);
    return () => motionQuery.removeEventListener("change", updateVideoPreference);
  }, []);

  useEffect(() => {
    if (!shouldUseVideo || videoFailed || !heroRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;

        if (!video) {
          return;
        }

        if (entry?.isIntersecting) {
          void video.play().catch(() => {
            setVideoFailed(true);
            setIsVideoPlaying(false);
          });
          return;
        }

        video.pause();
      },
      { threshold: 0.18 }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [shouldUseVideo, videoFailed]);

  function updateDiscovery(patch: Partial<DiscoveryValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  function submitDiscovery() {
    const params = new URLSearchParams();
    const query = values.q.trim();

    if (query) params.set("q", query);
    if (values.usage) params.append("usage", values.usage);
    if (values.colour) params.append("colour", values.colour);
    if (values.size) params.append("size", values.size);
    params.set("sort", query ? "relevance" : "newest");

    navigate(`/search?${params.toString()}`);
  }

  return (
    <section ref={heroRef} className="relative flex min-h-screen items-end justify-center overflow-hidden bg-ink text-white">
      <img
        src="/videos/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {shouldUseVideo && !videoFailed ? (
        <video
          ref={videoRef}
          className={[
            "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300",
            isVideoPlaying ? "opacity-100" : ""
          ].join(" ")}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/hero-poster.jpg"
          autoPlay
          onPlaying={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
          onError={() => {
            setVideoFailed(true);
            setIsVideoPlaying(false);
          }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
      ) : null}

      <div className="absolute inset-0 bg-ink/30" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-end px-4 pb-8 pt-28 text-center sm:px-6 lg:px-8">
        <div className="mb-[14vh] max-w-4xl">
          <p className="text-sm font-semibold uppercase text-white/80">AVE</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[0.95] tracking-normal text-white sm:text-7xl lg:text-8xl">
            Style that moves
            <br />
            with you.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            Modern fashion for every version of your day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <HeroButton to="/departments/women">Shop Women</HeroButton>
            <HeroButton to="/departments/men">Shop Men</HeroButton>
            <HeroButton to="/departments/accessories">Accessories</HeroButton>
          </div>
        </div>

        <div className="mb-2 flex w-full justify-center">
          <HeroDiscoveryBar
            values={values}
            options={filterOptionsQuery.data}
            isLoading={filterOptionsQuery.isLoading}
            onChange={updateDiscovery}
            onSubmit={submitDiscovery}
          />
          <MobileDiscoverySheet
            values={values}
            options={filterOptionsQuery.data}
            isLoading={filterOptionsQuery.isLoading}
            onChange={updateDiscovery}
            onSubmit={submitDiscovery}
          />
        </div>
      </div>
    </section>
  );
}

function HeroButton({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-white/70 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-ink focus-visible:ring-2 focus-visible:ring-white/80"
    >
      {children}
    </Link>
  );
}

function prefersStaticHero() {
  const connection = (
    window.navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  const effectiveType = connection?.effectiveType?.toLowerCase() ?? "";

  return Boolean(connection?.saveData || effectiveType.includes("2g") || effectiveType === "slow-2g");
}
