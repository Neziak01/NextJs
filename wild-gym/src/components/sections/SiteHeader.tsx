"use client";

import { useEffect, useState } from "react";
import { navLinks } from "@/lib/content";
import Wordmark from "@/components/ui/Wordmark";

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-forest-950/92 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md"
          : "bg-gradient-to-b from-forest-950/70 to-transparent"
      }`}
    >
      <div
        className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-moss-500/50 to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <a href="#top" className="group flex items-center gap-3">
          <Wordmark className="h-9 w-9 text-moss-400 transition-transform duration-500 group-hover:rotate-[14deg]" />
          <span className="display text-xl leading-none text-sand-50 sm:text-2xl">
            Wild<span className="text-moss-400">Gym</span>
          </span>
        </a>

        <nav className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-sm font-medium uppercase tracking-[0.16em] text-sand-200/85 transition-colors hover:text-sand-50"
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-clay-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#rejoindre"
            className="hidden rounded-full bg-clay-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-sand-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-clay-400 hover:shadow-[0_14px_30px_-12px_rgba(197,107,57,0.9)] sm:block"
          >
            Essai gratuit
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border border-sand-200/25 text-sand-100 transition-colors hover:border-moss-400/70 lg:hidden"
          >
            <span
              className={`h-[2px] w-5 bg-current transition-transform duration-300 ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-[2px] w-5 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-[2px] w-5 bg-current transition-transform duration-300 ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`grid overflow-hidden transition-all duration-500 lg:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <nav className="texture-wood flex flex-col gap-1 border-t border-sand-200/10 px-5 pb-8 pt-4 sm:px-8">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="display border-b border-sand-200/10 py-4 text-3xl text-sand-100 transition-colors hover:text-clay-400"
              >
                <span className="mr-4 font-body text-xs font-semibold tracking-[0.3em] text-moss-400">
                  0{i + 1}
                </span>
                {link.label}
              </a>
            ))}
            <a
              href="#rejoindre"
              onClick={() => setOpen(false)}
              className="mt-6 rounded-full bg-clay-500 px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-sand-50"
            >
              Réserver mon essai gratuit
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
