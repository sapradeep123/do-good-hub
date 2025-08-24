import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Community support" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-trust/80" />
      </div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl text-center mx-auto text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Empower Change,
            <span className="text-accent"> One Donation </span>
            at a Time
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
            Connect with verified NGOs across India and make a meaningful impact through transparent, package-based donations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="accent" className="text-lg px-8 py-6">
              Explore NGOs <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20">
              How it Works
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-3">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verified NGOs</h3>
              <p className="text-sm opacity-80">All NGOs are verified with proper documentation</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-3">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">80G Tax Benefits</h3>
              <p className="text-sm opacity-80">Get tax exemption certificates for all donations</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-3">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Transparent Impact</h3>
              <p className="text-sm opacity-80">Track your donation impact with photos and updates</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};