import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary fill-current" />
          <span className="text-xl font-bold text-foreground">CareFund</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <a href="#" className="text-foreground hover:text-primary transition-colors">NGOs</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">How it Works</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">About</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search NGOs..."
                className="pl-10 w-64"
              />
            </div>
          </div>
          <Button variant="outline" size="sm">Sign In</Button>
          <Button variant="donate" size="sm">Start Donating</Button>
        </div>
      </div>
    </header>
  );
};