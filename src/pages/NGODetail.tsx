import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockNGOs } from "@/data/ngos";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Users, CheckCircle } from "lucide-react";

const NGODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const ngo = mockNGOs.find(n => n.id === id);
  
  if (!ngo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">NGO Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-r from-primary/10 to-trust/10">
        <div className="container mx-auto px-4">
          <Button 
            onClick={() => navigate("/")} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to NGOs
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4 mb-6">
                <img 
                  src={ngo.imageUrl} 
                  alt={ngo.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{ngo.name}</h1>
                    {ngo.isVerified && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{ngo.location}</span>
                    </div>
                    <Badge variant="secondary">{ngo.category}</Badge>
                  </div>
                  <p className="text-lg">{ngo.description}</p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Impact Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Donors</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{ngo.donorsCount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Our Story */}
              <Card>
                <CardHeader>
                  <CardTitle>Our Story</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{ngo.story}</p>
                </CardContent>
              </Card>

              {/* About Us */}
              <Card>
                <CardHeader>
                  <CardTitle>About Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{ngo.aboutUs}</p>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{ngo.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <span>{ngo.contact.phone}</span>
                    </div>
                    {ngo.contact.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <a 
                          href={ngo.contact.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {ngo.contact.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Donation Packages */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Donation Packages</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose a package that resonates with you
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ngo.packages.map((pkg) => (
                      <div 
                        key={pkg.id}
                        className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">
                            {pkg.title}
                          </h4>
                          <span className="font-bold text-primary">₹{pkg.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                        <p className="text-xs text-accent font-medium">{pkg.impact}</p>
                      </div>
                    ))}
                    
                    <Button className="w-full mt-6" variant="donate" size="lg">
                      Select Package & Donate
                    </Button>
                    
                    <div className="text-center mt-4">
                      <p className="text-xs text-muted-foreground">
                        ✓ 80G Tax Benefits • ✓ Secure Payments • ✓ Impact Updates
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NGODetail;