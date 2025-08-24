import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Users, Target, Award } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About CareFund
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to transform how India gives. By connecting hearts with causes, 
            we make every donation transparent, impactful, and meaningful.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              To create a transparent, efficient, and impactful platform that connects 
              generous hearts with worthy causes across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparency</h3>
              <p className="text-muted-foreground">
                Every donation is tracked from start to finish with complete visibility.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground">
                Building a community of givers and changemakers across India.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Impact</h3>
              <p className="text-muted-foreground">
                Ensuring every rupee donated creates measurable, lasting impact.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust</h3>
              <p className="text-muted-foreground">
                Building trust through verification, transparency, and accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Impact So Far</h2>
            <p className="text-lg text-muted-foreground">
              Together, we're creating positive change across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">₹50L+</h3>
              <p className="text-muted-foreground">Total Donations</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">100+</h3>
              <p className="text-muted-foreground">Verified NGOs</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">10K+</h3>
              <p className="text-muted-foreground">Happy Donors</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">25+</h3>
              <p className="text-muted-foreground">States Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p className="text-center mb-6">
                CareFund was born from a simple belief: that giving should be transparent, 
                impactful, and accessible to everyone. We saw too many donors losing trust 
                in charitable giving due to lack of transparency and accountability.
              </p>
              <p className="text-center mb-6">
                Our founders, passionate about social change, decided to create a platform 
                that would bridge the gap between generous hearts and worthy causes. By 
                leveraging technology and rigorous verification processes, we've built 
                a system that ensures every donation creates real, measurable impact.
              </p>
              <p className="text-center">
                Today, CareFund is proud to be India's most trusted platform for 
                transparent giving, connecting thousands of donors with hundreds of 
                verified NGOs across the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Become part of India's most trusted giving community.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/")}>
              Start Donating
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
              Contact Us
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

export default About;