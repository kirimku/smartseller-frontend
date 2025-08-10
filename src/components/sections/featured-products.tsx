import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import gamingMouse from "@/assets/gaming-mouse.jpg";
import gamingKeyboard from "@/assets/gaming-keyboard.jpg";
import gamingHeadset from "@/assets/gaming-headset.jpg";
import { ShoppingCart, Star } from "lucide-react";

const products = [
  {
    id: 1,
    name: "ProGamer X1 Mouse",
    image: gamingMouse,
    originalPrice: "$89.99",
    pointsPrice: "4,500",
    discount: "15% OFF",
    rating: 4.8,
  },
  {
    id: 2,
    name: "MechWarrior Keyboard",
    image: gamingKeyboard,
    originalPrice: "$149.99",
    pointsPrice: "7,200",
    discount: "20% OFF",
    rating: 4.9,
  },
  {
    id: 3,
    name: "SoundStorm Headset",
    image: gamingHeadset,
    originalPrice: "$199.99",
    pointsPrice: "9,800",
    discount: "25% OFF",
    rating: 4.7,
  },
];

export const FeaturedProducts = () => {
  return (
    <div className="px-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Featured Products</h2>
        <Button variant="ghost" size="sm" className="text-gaming-cyan">
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="bg-gradient-card border-gaming-card shadow-card">
            <div className="p-4">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gaming-dark">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-1 right-1 text-xs bg-gaming-green/20 text-gaming-green border-gaming-green/30"
                  >
                    {product.discount}
                  </Badge>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground line-through">{product.originalPrice}</p>
                      <p className="text-sm font-bold text-gaming-cyan">{product.pointsPrice} pts</p>
                    </div>
                    
                    <Button size="sm" className="bg-gradient-primary text-gaming-dark hover:opacity-90">
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Redeem
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};