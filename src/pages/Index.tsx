import { useState } from "react";
import { MobileNav } from "@/components/ui/mobile-nav";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsSection } from "@/components/sections/stats-section";
import { MenuSection } from "@/components/sections/menu-section";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { RewardsSection } from "@/components/sections/rewards-section";
import { TopBanner } from "@/components/common/TopBanner";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <>
            <HeroSection />
            <StatsSection />
            <MenuSection />
            <FeaturedProducts />
          </>
        );
      case "rewards":
        return (
          <div className="pt-6">
            <RewardsSection />
          </div>
        );
      case "shop":
        return (
          <div className="pt-6">
            <FeaturedProducts />
          </div>
        );
      case "profile":
        return (
          <div className="pt-6 px-6 pb-24">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <p className="text-muted-foreground">Profile section coming soon...</p>
          </div>
        );
      default:
        return (
          <>
            <HeroSection />
            <StatsSection />
            <MenuSection />
            <FeaturedProducts />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBanner />
      {renderContent()}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
