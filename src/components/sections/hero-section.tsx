import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/gaming-hero.jpg";
import { Zap, Star } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Background */}
      <div className="relative h-64 bg-gradient-hero">
        <img 
          src={heroImage} 
          alt="Gaming Setup" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />
        
        {/* Hero Content */}
        <div className="relative h-full flex flex-col justify-center px-6">
          <Badge variant="secondary" className="w-fit mb-3 bg-gaming-cyan/20 text-gaming-cyan border-gaming-cyan/30">
            <Zap className="w-3 h-3 mr-1" />
            Elite Member
          </Badge>
          
          <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            GameVault
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Your ultimate gaming peripheral rewards
          </p>
          
          <Button className="w-fit bg-gradient-primary text-gaming-dark hover:opacity-90 transition-smooth">
            <Star className="w-4 h-4 mr-2" />
            Claim Daily Bonus
          </Button>
        </div>
      </div>
    </div>
  );
};