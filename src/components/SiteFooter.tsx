import { gym, navLinks } from "@/lib/content";
import Wordmark from "./Wordmark";

const socials = [
  { label: "Instagram", href: "#" },
  { label: "Strava", href: "#" },
  { label: "YouTube", href: "#" },
];

export default function SiteFooter() {
  return (
    <footer className="texture-wood grain relative border-t border-sand-200/10">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Wordmark className="h-10 w-10 text-moss-400" />
              <span className="display text-2xl text-sand-50">
                Wild<span className="text-moss-400">Gym</span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-sand-300/70">
              Salle de sport à ciel ouvert au cœur de la vallée d&apos;Ubud.
              Ouvert à la mousson comme à la saison sèche.
            </p>
            <p className="eyebrow mt-6 text-moss-400">{gym.coordinates}</p>
          </div>

          <nav>
            <h2 className="text-[0.68rem] uppercase tracking-[0.22em] text-sand-300/55">
              Naviguer
            </h2>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-sand-200/85 transition-colors hover:text-clay-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.68rem] uppercase tracking-[0.22em] text-sand-300/55">
              Horaires
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-sand-200/85">
              {gym.hours.map((slot) => (
                <li key={slot.days} className="flex flex-col">
                  <span className="text-sand-300/60">{slot.days}</span>
                  <span className="font-semibold">{slot.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[0.68rem] uppercase tracking-[0.22em] text-sand-300/55">
              Nous trouver
            </h2>
            <address className="mt-5 space-y-3 text-sm not-italic text-sand-200/85">
              <p>{gym.location}</p>
              <p>
                <a
                  href={`tel:${gym.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-clay-400"
                >
                  {gym.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${gym.email}`}
                  className="transition-colors hover:text-clay-400"
                >
                  {gym.email}
                </a>
              </p>
            </address>
            <ul className="mt-6 flex gap-4">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className="text-[0.68rem] uppercase tracking-[0.16em] text-sand-300/70 transition-colors hover:text-moss-300"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-sand-200/10 pt-7 text-[0.7rem] uppercase tracking-[0.16em] text-sand-300/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Wild Gym Bali — Site de démonstration</p>
          <p>Photos placeholder générées localement</p>
        </div>
      </div>
    </footer>
  );
}
