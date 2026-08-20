import Gallery from "@/components/sections/Gallery";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Marquee from "@/components/sections/Marquee";
import Offers from "@/components/sections/Offers";
import Order from "@/components/sections/Order";
import SiteFooter from "@/components/sections/SiteFooter";
import SiteHeader from "@/components/sections/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Manifesto />
        <Marquee />
        <Offers />
        <Gallery />
        <Order />
      </main>
      <SiteFooter />
    </>
  );
}
