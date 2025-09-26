import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "@shared/components/ui/mobile-nav";
import { HeroSection } from "@shared/components/sections/hero-section";
import { StatsSection } from "@shared/components/sections/stats-section";
import { MenuSection } from "@shared/components/sections/menu-section";
import { FlashDeals } from "@shared/components/sections/flash-deals";
import { FeaturedProducts } from "@shared/components/sections/featured-products";
import { RewardsSection } from "@shared/components/sections/rewards-section";
import { TopBanner } from "@shared/components/common/TopBanner";
import { Header } from "@shared/components/common/Header";

const StorefrontHome = () => {
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    if (tab === "profile") {
      navigate("/profile");
    } else {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="pb-24">
            <HeroSection />
            <StatsSection />
            <MenuSection />
            <FlashDeals />
            <FeaturedProducts />
          </div>
        );
      case "rewards":
        return (
          <div className="pt-6 pb-24">
            <RewardsSection />
          </div>
        );
      case "shop":
        return (
          <div className="pt-6 pb-24">
            <FlashDeals />
            <FeaturedProducts />
          </div>
        );
      default:
        return (
          <div className="pb-24">
            <HeroSection />
            <StatsSection />
            <MenuSection />
            <FlashDeals />
            <FeaturedProducts />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TopBanner />
      {renderContent()}
      <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default StorefrontHome;