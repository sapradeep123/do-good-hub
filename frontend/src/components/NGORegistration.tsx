import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NGOFormData {
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  registrationNumber: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  focusAreas: string;
  establishedYear: string;
  mission: string;
  vision: string;
  bankAccountNumber: string;
  ifscCode: string;
  panNumber: string;
  fcraNumber?: string;
  website?: string;
  socialMediaLinks?: string;
}

const NGORegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<NGOFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    registrationNumber: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    focusAreas: "",
    establishedYear: "",
    mission: "",
    vision: "",
    bankAccountNumber: "",
    ifscCode: "",
    panNumber: "",
    fcraNumber: "",
    website: "",
    socialMediaLinks: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Call API to register NGO
      const response = await fetch('/api/auth/register/ngo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          organization_name: formData.organizationName,
          registration_number: formData.registrationNumber,
          contact_person_name: formData.contactPersonName,
          contact_person_designation: formData.contactPersonDesignation,
          phone_number: formData.phoneNumber,
          alternate_phone_number: formData.alternatePhoneNumber || null,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          focus_areas: formData.focusAreas,
          established_year: parseInt(formData.establishedYear),
          mission: formData.mission,
          vision: formData.vision,
          bank_account_number: formData.bankAccountNumber,
          ifsc_code: formData.ifscCode,
          pan_number: formData.panNumber,
          fcra_number: formData.fcraNumber || null,
          website: formData.website || null,
          social_media_links: formData.socialMediaLinks || null
        }),
      });

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: "Your NGO registration has been submitted for approval. You will receive an email once approved.",
        });
        navigate("/auth");
      } else {
        const errorData = await response.json();
        toast({
          title: "Registration Failed",
          description: errorData.detail || "An error occurred during registration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Button 
          onClick={() => navigate("/auth")} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">NGO Registration</CardTitle>
            <CardDescription>
              Register your organization to join our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contact@ngo.org"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name *</Label>
                    <Input
                      id="organizationName"
                      name="organizationName"
                      placeholder="Your NGO Name"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number *</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      placeholder="NGO Registration Number"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">Established Year *</Label>
                    <Input
                      id="establishedYear"
                      name="establishedYear"
                      type="number"
                      placeholder="2010"
                      value={formData.establishedYear}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="focusAreas">Focus Areas *</Label>
                    <Select onValueChange={(value) => handleSelectChange('focusAreas', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="environment">Environment</SelectItem>
                        <SelectItem value="poverty_alleviation">Poverty Alleviation</SelectItem>
                        <SelectItem value="women_empowerment">Women Empowerment</SelectItem>
                        <SelectItem value="child_welfare">Child Welfare</SelectItem>
                        <SelectItem value="disaster_relief">Disaster Relief</SelectItem>
                        <SelectItem value="rural_development">Rural Development</SelectItem>
                        <SelectItem value="animal_welfare">Animal Welfare</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://www.yourngo.org"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialMediaLinks">Social Media Links (Optional)</Label>
                    <Input
                      id="socialMediaLinks"
                      name="socialMediaLinks"
                      placeholder="Facebook, Twitter, Instagram links"
                      value={formData.socialMediaLinks}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mission">Mission Statement *</Label>
                    <Textarea
                      id="mission"
                      name="mission"
                      placeholder="Describe your organization's mission..."
                      value={formData.mission}
                      onChange={handleInputChange}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vision">Vision Statement *</Label>
                    <Textarea
                      id="vision"
                      name="vision"
                      placeholder="Describe your organization's vision..."
                      value={formData.vision}
                      onChange={handleInputChange}
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                    <Input
                      id="contactPersonName"
                      name="contactPersonName"
                      placeholder="Full Name"
                      value={formData.contactPersonName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonDesignation">Designation *</Label>
                    <Input
                      id="contactPersonDesignation"
                      name="contactPersonDesignation"
                      placeholder="President, Secretary, etc."
                      value={formData.contactPersonDesignation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="+91 9876543210"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alternatePhoneNumber">Alternate Phone (Optional)</Label>
                    <Input
                      id="alternatePhoneNumber"
                      name="alternatePhoneNumber"
                      placeholder="+91 9876543210"
                      value={formData.alternatePhoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Complete organization address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      placeholder="123456"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number *</Label>
                    <Input
                      id="panNumber"
                      name="panNumber"
                      placeholder="AAAAA0000A"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fcraNumber">FCRA Number (Optional)</Label>
                    <Input
                      id="fcraNumber"
                      name="fcraNumber"
                      placeholder="FCRA Registration Number"
                      value={formData.fcraNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                    <Input
                      id="bankAccountNumber"
                      name="bankAccountNumber"
                      placeholder="1234567890"
                      value={formData.bankAccountNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      name="ifscCode"
                      placeholder="SBIN0001234"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting Registration..." : "Submit Registration"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                By registering, you agree to our terms and conditions. Your registration will be reviewed by our admin team.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NGORegistration;