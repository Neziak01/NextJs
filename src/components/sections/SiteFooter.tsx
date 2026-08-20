import { navLinks, shop, socials } from "@/lib/content";
import Wordmark from "@/components/ui/Wordmark";

export default function SiteFooter() {
  return (
    <footer className="texture-kraft grain relative border-t border-paper-50/10">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Wordmark className="h-10 w-10 text-sage-300" />
              <span className="display text-2xl text-paper-50">
                Brin <span className="italic text-bloom-400">Sauvage</span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper-300/75">
              Fleuriste artisan à la Croix-Rousse depuis 1998. Bouquets de
              saison, abonnements, mariages et plantes d’intérieur.
            </p>
            <p className="eyebrow mt-6 text-sage-300">{shop.metro}</p>
          </div>

          <nav>
            <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-paper-300/55">
              Naviguer
            </h2>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-paper-200/85 transition-colors hover:text-clay-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-paper-300/55">
              Horaires
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-paper-200/85">
              {shop.hours.map((slot) => (
                <li key={slot.days} className="flex flex-col">
                  <span className="text-paper-300/60">{slot.days}</span>
                  <span className="font-semibold">{slot.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-paper-300/55">
              Nous trouver
            </h2>
            <address className="mt-5 space-y-3 text-sm not-italic text-paper-200/85">
              <p>{shop.location}</p>
              <p>
                <a
                  href={`tel:+33${shop.phone.replace(/\D/g, "").slice(1)}`}
                  className="transition-colors hover:text-clay-400"
                >
                  {shop.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${shop.email}`}
                  className="transition-colors hover:text-clay-400"
                >
                  {shop.email}
                </a>
              </p>
            </address>
            <ul className="mt-6 flex gap-4">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className="text-[0.68rem] uppercase tracking-[0.14em] text-paper-300/70 transition-colors hover:text-sage-300"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-paper-50/10 pt-7 text-[0.7rem] uppercase tracking-[0.14em] text-paper-300/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Brin Sauvage — Site de démonstration
          </p>
          <p>Photos placeholder générées localement</p>
        </div>
      </div>
    </footer>
  );
}
