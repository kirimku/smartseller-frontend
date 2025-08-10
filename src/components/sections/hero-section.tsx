import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="px-6 pt-6">
      <h1 className="text-2xl font-bold mb-1">GameVault</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Your gaming peripheral rewards
      </p>
      <Button className="w-fit">Claim Daily Bonus</Button>
    </section>
  );
};