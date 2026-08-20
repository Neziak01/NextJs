"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Reveal from "./Reveal";
import { gallery } from "@/lib/content";

export default function Gallery() {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const move = useCallback(
    (step: number) =>
      setActive((current) =>
        current === null
          ? current
          : (current + step + gallery.length) % gallery.length,
      ),
    [],
  );

  useEffect(() => {
    if (active === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, move]);

  const shot = active === null ? null : gallery[active];

  return (
    <section
      id="espace"
      className="grain relative overflow-hidden bg-forest-950 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-moss-300">
              <span className="h-px w-10 bg-moss-400/70" />
              L&apos;espace
            </p>
            <h2 className="display mt-6 text-[clamp(2.4rem,6.4vw,5rem)] text-sand-50">
              1 400 <span className="normal-case">m²</span>
              <br />
              <span className="text-moss-400">sans toit</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="max-w-sm text-base leading-relaxed text-sand-200/70">
              Six plateaux reliés par des sentiers de pierre, du bassin froid
              jusqu&apos;au deck perché. Fais glisser, ou clique pour agrandir.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid auto-rows-[105px] grid-cols-2 gap-3 sm:auto-rows-[88px] sm:grid-cols-6 sm:gap-4 lg:auto-rows-[108px]">
          {gallery.map((shot, i) => (
            <Reveal
              key={shot.src}
              delay={i * 80}
              className={`${shot.span} group relative`}
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                className="absolute inset-0 h-full w-full overflow-hidden rounded-[1.75rem_0.5rem_1.75rem_0.5rem] border border-sand-200/10 transition-all duration-500 hover:border-moss-400/50"
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 46vw, 32vw"
                  className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.09]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />

                <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-left">
                  <span className="text-[0.72rem] font-medium uppercase leading-snug tracking-[0.12em] text-sand-100/90">
                    {shot.caption}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 translate-y-2 items-center justify-center rounded-full border border-sand-200/40 text-sand-100 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path
                        d="M9 3H3v6M15 21h6v-6M3 3l7.5 7.5M21 21l-7.5-7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Visionneuse */}
      {shot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={shot.caption}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-forest-950/96 p-4 backdrop-blur-sm sm:p-10"
          onClick={close}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[2rem_0.5rem_2rem_0.5rem] border border-sand-200/15">
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="90vw"
                className="object-cover"
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm uppercase tracking-[0.16em] text-sand-200/85">
                {shot.caption}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Photo précédente"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-200/25 text-sand-100 transition-colors hover:border-moss-400 hover:text-moss-300"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Photo suivante"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-200/25 text-sand-100 transition-colors hover:border-moss-400 hover:text-moss-300"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-sand-200/25 text-lg text-sand-100 transition-colors hover:border-clay-400 hover:text-clay-400"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
