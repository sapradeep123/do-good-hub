import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Users, Shield, Heart } from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            How It Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn how CareFund makes donating simple, transparent, and impactful. 
            From selecting verified NGOs to tracking your donation's journey.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. Choose a Verified NGO</h3>
              <p className="text-muted-foreground">
                Browse through our carefully verified NGOs and select a cause that resonates with you. 
                All NGOs are verified with proper documentation and registration.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. Select a Package</h3>
              <p className="text-muted-foreground">
                Choose from pre-defined donation packages that clearly outline what your contribution will provide. 
                Each package shows exactly what items or services will be delivered.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. Track Your Impact</h3>
              <p className="text-muted-foreground">
                Follow your donation's journey from payment to delivery. Receive updates with photos 
                and reports showing the real impact of your contribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose CareFund?</h2>
            <p className="text-lg text-muted-foreground">
              We've built a transparent, secure, and efficient platform for meaningful giving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2">100% Verified NGOs</h4>
                <p className="text-muted-foreground">
                  Every NGO on our platform goes through rigorous verification including 
                  documentation checks, field visits, and ongoing monitoring.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2">Transparent Tracking</h4>
                <p className="text-muted-foreground">
                  Track every step of your donation from payment to final delivery with 
                  real-time updates and photographic evidence.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2">80G Tax Benefits</h4>
                <p className="text-muted-foreground">
                  Get instant 80G tax exemption certificates for all your donations, 
                  making your giving both impactful and tax-efficient.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2">Secure Payments</h4>
                <p className="text-muted-foreground">
                  All payments are processed through secure, encrypted channels with 
                  multiple payment options for your convenience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your journey of meaningful giving today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/")}>
              Explore NGOs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-60">
            © 2024 CareFund. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;