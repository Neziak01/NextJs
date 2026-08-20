import Gallery from "@/components/sections/Gallery";
import Hero from "@/components/sections/Hero";
import Join from "@/components/sections/Join";
import Manifesto from "@/components/sections/Manifesto";
import Marquee from "@/components/sections/Marquee";
import SiteFooter from "@/components/sections/SiteFooter";
import SiteHeader from "@/components/sections/SiteHeader";
import Trainings from "@/components/sections/Trainings";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Manifesto />
        <Marquee />
        <Trainings />
        <Gallery />
        <Join />
      </main>
      <SiteFooter />
    </>
  );
}
