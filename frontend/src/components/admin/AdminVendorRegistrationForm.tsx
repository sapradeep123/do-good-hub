import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface VendorFormData {
  email: string;
  password: string;
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

interface AdminVendorRegistrationFormProps {
  onSuccess: () => void;
}

const AdminVendorRegistrationForm = ({ onSuccess }: AdminVendorRegistrationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    account: true,
    business: false,
    address: false,
    financial: false
  });
  const [formData, setFormData] = useState<VendorFormData>({
    email: "",
    password: "",
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

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
        toast.success("Vendor registered successfully!");
        onSuccess();
        // Reset form
        setFormData({
          email: "",
          password: "",
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
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "An error occurred during registration.");
      }
    } catch (error) {
      toast.error("Unable to connect to the server. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Information */}
      <Collapsible open={openSections.account} onOpenChange={() => toggleSection('account')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <h3 className="text-lg font-semibold">Account Information</h3>
          {openSections.account ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
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
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Business Information */}
      <Collapsible open={openSections.business} onOpenChange={() => toggleSection('business')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <h3 className="text-lg font-semibold">Business Information</h3>
          {openSections.business ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Address Information */}
      <Collapsible open={openSections.address} onOpenChange={() => toggleSection('address')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <h3 className="text-lg font-semibold">Address Information</h3>
          {openSections.address ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Financial Information */}
      <Collapsible open={openSections.financial} onOpenChange={() => toggleSection('financial')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <h3 className="text-lg font-semibold">Financial Information</h3>
          {openSections.financial ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
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
        </CollapsibleContent>
      </Collapsible>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registering Vendor..." : "Register Vendor"}
      </Button>
    </form>
  );
};

export default AdminVendorRegistrationForm;