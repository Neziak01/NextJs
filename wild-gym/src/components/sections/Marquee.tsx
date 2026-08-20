import { marqueeWords } from "@/lib/content";

/** Bandeau défilant en bois clair, entre deux sections. */
export default function Marquee() {
  const words = [...marqueeWords, ...marqueeWords];

  return (
    <div className="texture-wood-light relative overflow-hidden border-y border-wood-900/60 py-4">
      <div className="grain absolute inset-0" />
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="flex items-center gap-10">
            <span className="display text-2xl text-sand-50/95 sm:text-3xl">
              {word}
            </span>
            <span className="h-2 w-2 rotate-45 bg-forest-900/70" />
          </span>
        ))}
      </div>
    </div>
  );
}
