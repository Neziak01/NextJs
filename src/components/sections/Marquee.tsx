import { marqueeWords } from "@/lib/content";

/** Bandeau défilant en toile de lin, entre deux sections. */
export default function Marquee() {
  const words = [...marqueeWords, ...marqueeWords];

  return (
    <div className="texture-linen relative overflow-hidden border-y border-sage-950/40 py-4">
      <div className="grain absolute inset-0" />
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="flex items-center gap-10">
            <span className="display text-2xl text-paper-50/95 sm:text-3xl">
              {word}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-bloom-400/80" />
          </span>
        ))}
      </div>
    </div>
  );
}
