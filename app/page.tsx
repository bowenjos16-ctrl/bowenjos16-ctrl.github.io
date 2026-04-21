import Embers from "@/components/Embers";
import Hero from "@/components/Hero";
import AboutStrip from "@/components/AboutStrip";
import SectionTabs from "@/components/SectionTabs";
import Footer from "@/components/Footer";
import SplashGate from "@/components/SplashGate";
import SearchBar from "@/components/SearchBar";
import SpinWheel from "@/components/SpinWheel";
import HappyHourBadge from "@/components/HappyHourBadge";
import TopBar from "@/components/TopBar";
import HeroWrapper from "@/components/HeroWrapper";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div id="top" />
      <SplashGate />
      <Embers count={35} />
      <TopBar />
      <SearchBar />
      <HeroWrapper>
        <Hero />
        <AboutStrip />
      </HeroWrapper>
      <SectionTabs />
      <Footer />
      <HappyHourBadge />
      <SpinWheel />
    </main>
  );
}
