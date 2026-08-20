"use client";

import { useState, type ReactNode } from "react";
import {
  FaCampground,
  FaFire,
  FaHiking,
  FaHotTub,
  FaTint,
} from "react-icons/fa";
import { cn } from "@/lib/utils";

export type SelectorOption = {
  title: string;
  description: string;
  /** URL d'image : distante, ou fichier de `public/`. */
  image: string;
  icon: ReactNode;
};

export type InteractiveSelectorProps = {
  options?: SelectorOption[];
  title?: string;
  subtitle?: string;
  /** Masque le bandeau titre/sous-titre pour poser le sélecteur dans une section existante. */
  showHeader?: boolean;
  /** Panneau ouvert au premier rendu. */
  defaultIndex?: number;
  activeBorderColor?: string;
  idleBorderColor?: string;
  /** Fusionné avec les classes du conteneur (tailwind-merge : la classe passée gagne). */
  className?: string;
};

const defaultOptions: SelectorOption[] = [
  {
    title: "Luxury Tent",
    description: "Cozy glamping under the stars",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    icon: <FaCampground size={24} className="text-white" />,
  },
  {
    title: "Campfire Feast",
    description: "Gourmet s'mores & stories",
    image:
      "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80",
    icon: <FaFire size={24} className="text-white" />,
  },
  {
    title: "Lakeside Retreat",
    description: "Private dock & canoe rides",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    icon: <FaTint size={24} className="text-white" />,
  },
  {
    title: "Mountain Spa",
    description: "Outdoor sauna & hot tub",
    image:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
    icon: <FaHotTub size={24} className="text-white" />,
  },
  {
    title: "Guided Adventure",
    description: "Expert-led nature tours",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
    icon: <FaHiking size={24} className="text-white" />,
  },
];

/**
 * Panneaux d'images qui se déplient à la sélection : le panneau actif prend
 * sept fois la place des autres et révèle son titre.
 *
 * Empilés verticalement sous `sm`, en bande horizontale au-dessus.
 */
export default function InteractiveSelector({
  options = defaultOptions,
  title = "Escape in Style",
  subtitle = "Discover luxurious camping experiences in nature's most breathtaking spots.",
  showHeader = true,
  defaultIndex = 0,
  activeBorderColor = "#fff",
  idleBorderColor = "#292929",
  className,
}: InteractiveSelectorProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center bg-[#222] text-white",
        className,
      )}
    >
      {showHeader && (
        <>
          <div className="mb-2 mt-8 w-full max-w-2xl px-6 text-center">
            <h2 className="animate-fadeInTop delay-300 mb-3 text-4xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-5xl">
              {title}
            </h2>
            <p className="animate-fadeInTop delay-600 mx-auto max-w-xl text-lg font-medium text-gray-300 md:text-xl">
              {subtitle}
            </p>
          </div>
          <div className="h-12" />
        </>
      )}

      <div className="options relative mx-0 flex h-[520px] w-full max-w-[900px] flex-col items-stretch overflow-hidden sm:h-[400px] sm:flex-row">
        {options.map((option, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={option.title}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "option animate-slideFadeIn relative flex min-h-[56px] w-full min-w-0 cursor-pointer flex-col justify-end overflow-hidden bg-center bg-no-repeat text-left transition-all duration-700 ease-in-out",
                "sm:min-h-[100px] sm:w-auto sm:min-w-[60px]",
                // Actif : `cover`, pour remplir le panneau quel que soit le
                // ratio de l'image. Inactif : la tranche centrale, zoomée.
                isActive ? "bg-cover" : "bg-cover sm:bg-[length:auto_120%]",
              )}
              style={{
                backgroundImage: `url('${option.image}')`,
                backgroundColor: "#18181b",
                backfaceVisibility: "hidden",
                animationDelay: `${180 * index}ms`,
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: isActive ? activeBorderColor : idleBorderColor,
                boxShadow: isActive
                  ? "0 20px 60px rgba(0,0,0,0.50)"
                  : "0 10px 30px rgba(0,0,0,0.30)",
                flex: isActive ? "7 1 0%" : "1 1 0%",
                zIndex: isActive ? 10 : 1,
                willChange: "flex-grow, box-shadow, background-size",
              }}
            >
              {/* Voile sombre sous le libellé */}
              <span
                className="shadow pointer-events-none absolute inset-x-0 h-[120px] transition-all duration-700 ease-in-out"
                style={{
                  bottom: isActive ? "0" : "-40px",
                  boxShadow: isActive
                    ? "inset 0 -120px 120px -120px #000, inset 0 -120px 120px -80px #000"
                    : "inset 0 -120px 0px -120px #000, inset 0 -120px 0px -80px #000",
                }}
              />

              {/* Pastille + libellé */}
              <span className="label pointer-events-none absolute inset-x-0 bottom-2 z-[2] flex h-12 w-full items-center justify-start gap-3 px-3 sm:bottom-5 sm:px-4">
                <span className="icon flex h-9 w-9 min-w-9 flex-shrink-0 flex-grow-0 items-center justify-center rounded-full border-2 border-[#444] bg-[rgba(32,32,32,0.85)] shadow-[0_1px_4px_rgba(0,0,0,0.18)] backdrop-blur-[10px] transition-all duration-200 sm:h-[44px] sm:w-[44px] sm:min-w-[44px]">
                  {option.icon}
                </span>
                <span className="info relative block whitespace-pre text-white">
                  <span
                    className="main block text-base font-bold transition-all duration-700 ease-in-out sm:text-lg"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive
                        ? "translateX(0)"
                        : "translateX(25px)",
                    }}
                  >
                    {option.title}
                  </span>
                  <span
                    className="sub block text-sm text-gray-300 transition-all duration-700 ease-in-out sm:text-base"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive
                        ? "translateX(0)"
                        : "translateX(25px)",
                    }}
                  >
                    {option.description}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes slideFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-60px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideFadeIn {
          opacity: 0;
          animation: slideFadeIn 0.7s ease-in-out forwards;
        }

        @keyframes fadeInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInTop {
          opacity: 0;
          transform: translateY(-20px);
          animation: fadeInFromTop 0.8s ease-in-out forwards;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-600 {
          animation-delay: 0.6s;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fadeInTop,
          .animate-slideFadeIn {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
