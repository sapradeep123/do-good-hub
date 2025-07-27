import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { NGOCard } from "@/components/NGOCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockNGOs } from "@/data/ngos";
import { Search, Filter } from "lucide-react";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Education", "Healthcare", "Environment", "Nutrition", "Women Empowerment"];

  const filteredNGOs = mockNGOs.filter(ngo => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ngo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || ngo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      
      {/* NGO Listing Section */}
      <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Discover Verified NGOs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Support causes you care about through our verified NGO partners. Every donation creates real impact.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search NGOs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-muted-foreground" />
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* NGO Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNGOs.map(ngo => (
              <NGOCard
                key={ngo.id}
                id={ngo.id}
                name={ngo.name}
                description={ngo.description}
                location={ngo.location}
                category={ngo.category}
                imageUrl={ngo.imageUrl}
                donorsCount={ngo.donorsCount}
                isVerified={ngo.isVerified}
              />
            ))}
          </div>

          {filteredNGOs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No NGOs found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">₹50L+</h3>
              <p className="text-muted-foreground">Total Donations</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">100+</h3>
              <p className="text-muted-foreground">Verified NGOs</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">10K+</h3>
              <p className="text-muted-foreground">Happy Donors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">CareFund</h3>
              <p className="text-sm opacity-80">
                Connecting hearts with causes across India. Making donation transparent and impactful.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Donors</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>How it Works</li>
                <li>Tax Benefits</li>
                <li>Impact Stories</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For NGOs</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Partner with Us</li>
                <li>Verification Process</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Contact Us</li>
                <li>Help Center</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-60">
            © 2024 CareFund. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
