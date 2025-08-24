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

interface VendorFormData {
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  contactPersonName: string;
  phoneNumber: string;
  businessAddress: string;
  city: string;
  state: string;
  pincode: string;
  businessType: string;
  gstNumber: string;
  panNumber: string;
  bankAccountNumber: string;
  ifscCode: string;
  businessDescription: string;
  yearsInBusiness: string;
  website?: string;
}

const VendorRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    contactPersonName: "",
    phoneNumber: "",
    businessAddress: "",
    city: "",
    state: "",
    pincode: "",
    businessType: "",
    gstNumber: "",
    panNumber: "",
    bankAccountNumber: "",
    ifscCode: "",
    businessDescription: "",
    yearsInBusiness: "",
    website: ""
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
      // Call API to register vendor
      const response = await fetch('/api/auth/register/vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          business_name: formData.businessName,
          contact_person_name: formData.contactPersonName,
          phone_number: formData.phoneNumber,
          business_address: formData.businessAddress,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          business_type: formData.businessType,
          gst_number: formData.gstNumber,
          pan_number: formData.panNumber,
          bank_account_number: formData.bankAccountNumber,
          ifsc_code: formData.ifscCode,
          business_description: formData.businessDescription,
          years_in_business: parseInt(formData.yearsInBusiness),
          website: formData.website || null
        }),
      });

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: "Your vendor registration has been submitted for approval. You will receive an email once approved.",
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
            <CardTitle className="text-2xl">Vendor Registration</CardTitle>
            <CardDescription>
              Register your business to become a vendor partner
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
                      placeholder="business@example.com"
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

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Your Business Name"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
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
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select onValueChange={(value) => handleSelectChange('businessType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsInBusiness">Years in Business *</Label>
                    <Input
                      id="yearsInBusiness"
                      name="yearsInBusiness"
                      type="number"
                      placeholder="5"
                      value={formData.yearsInBusiness}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://www.yourbusiness.com"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description *</Label>
                  <Textarea
                    id="businessDescription"
                    name="businessDescription"
                    placeholder="Describe your business, products, and services..."
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Textarea
                    id="businessAddress"
                    name="businessAddress"
                    placeholder="Complete business address"
                    value={formData.businessAddress}
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
                    <Label htmlFor="gstNumber">GST Number *</Label>
                    <Input
                      id="gstNumber"
                      name="gstNumber"
                      placeholder="22AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
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
                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      name="bankAccountNumber"
                      placeholder="1234567890 (Optional)"
                      value={formData.bankAccountNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      name="ifscCode"
                      placeholder="SBIN0001234 (Optional)"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
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

export default VendorRegistration;