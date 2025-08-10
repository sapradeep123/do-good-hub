import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonationModal } from "@/components/DonationModal";
import { InvoiceModal } from "@/components/InvoiceModal";
import { mockNGOs, DonationPackage } from "@/data/ngos";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Users, CheckCircle, Heart, Info, Contact } from "lucide-react";

const NGODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedPackage, setSelectedPackage] = useState<DonationPackage | null>(null);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [donationId, setDonationId] = useState<string | null>(null);
  
  const ngo = mockNGOs.find(n => n.id === id);

  const handlePackageClick = (pkg: DonationPackage) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to make a donation.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setSelectedPackage(pkg);
    setDonationModalOpen(true);
  };

  const handleDonateClick = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to make a donation.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (ngo && ngo.packages.length > 0) {
      setSelectedPackage(ngo.packages[0]);
      setDonationModalOpen(true);
    }
  };

  const handlePaymentSuccess = (newDonationId: string) => {
    setDonationId(newDonationId);
    setInvoiceModalOpen(true);
  };
  
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

      {/* Main Content with Tabs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Tabbed Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="story" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="story" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Our Story
                  </TabsTrigger>
                  <TabsTrigger value="about" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    About Us
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-2">
                    <Contact className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="story" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        Our Story
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-muted-foreground leading-relaxed text-base">
                          {ngo.story}
                        </p>
                        <div className="mt-6 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                          <p className="text-sm text-muted-foreground italic">
                            "Every donation creates a ripple effect of positive change in our community. 
                            Join us in making a lasting impact on the lives we touch."
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="about" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        About Our Organization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <p className="text-muted-foreground leading-relaxed text-base">
                          {ngo.aboutUs}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 text-primary">Our Mission</h4>
                            <p className="text-sm text-muted-foreground">
                              To create sustainable positive change in communities through transparent and impactful programs.
                            </p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 text-primary">Our Vision</h4>
                            <p className="text-sm text-muted-foreground">
                              A world where every individual has access to basic necessities and opportunities for growth.
                            </p>
                          </div>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-primary">Key Focus Areas</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Badge variant="secondary" className="justify-center py-2">{ngo.category}</Badge>
                            <Badge variant="secondary" className="justify-center py-2">Community Development</Badge>
                            <Badge variant="secondary" className="justify-center py-2">Capacity Building</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contact" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Contact className="h-5 w-5 text-primary" />
                        Get in Touch
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg">Contact Information</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p className="font-medium">{ngo.contact.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Phone</p>
                                  <p className="font-medium">{ngo.contact.phone}</p>
                                </div>
                              </div>
                              {ngo.contact.website && (
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                  <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Website</p>
                                    <a 
                                      href={ngo.contact.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary hover:underline"
                                    >
                                      Visit Website
                                    </a>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Location</p>
                                  <p className="font-medium">{ngo.location}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg">Office Hours</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Monday - Friday</span>
                                <span className="font-medium">9:00 AM - 6:00 PM</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Saturday</span>
                                <span className="font-medium">10:00 AM - 4:00 PM</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Sunday</span>
                                <span className="font-medium">Closed</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
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
                        onClick={() => handlePackageClick(pkg)}
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
                    
                    <Button 
                      className="w-full mt-6" 
                      variant="donate" 
                      size="lg"
                      onClick={handleDonateClick}
                    >
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

      {/* Modals */}
      <DonationModal
        open={donationModalOpen}
        onOpenChange={setDonationModalOpen}
        package={selectedPackage}
        ngoId={id || ""}
        ngoName={ngo?.name || ""}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        donationId={donationId}
        ngoName={ngo?.name || ""}
      />
    </div>
  );
};

export default NGODetail;