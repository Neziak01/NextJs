import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import Join from "@/components/Join";
import Manifesto from "@/components/Manifesto";
import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Trainings from "@/components/Trainings";

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
