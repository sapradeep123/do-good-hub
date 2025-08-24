import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NGOFormData {
  email: string;
  password: string;
  organizationName: string;
  registrationNumber: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  organizationAddress: string;
  city: string;
  state: string;
  pincode: string;
  organizationType: string;
  focusAreas: string;
  establishedYear: string;
  panNumber: string;
  fcraNumber?: string;
  bankAccountNumber: string;
  ifscCode: string;
  organizationDescription: string;
  missionStatement: string;
  website?: string;
  socialMediaLinks?: string;
}

interface AdminNGORegistrationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const AdminNGORegistrationForm = ({ onSuccess, onCancel }: AdminNGORegistrationFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    account: true,
    organization: false,
    contact: false,
    address: false,
    financial: false
  });
  const [formData, setFormData] = useState<NGOFormData>({
    email: "",
    password: "",
    organizationName: "",
    registrationNumber: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    organizationAddress: "",
    city: "",
    state: "",
    pincode: "",
    organizationType: "",
    focusAreas: "",
    establishedYear: "",
    panNumber: "",
    fcraNumber: "",
    bankAccountNumber: "",
    ifscCode: "",
    organizationDescription: "",
    missionStatement: "",
    website: "",
    socialMediaLinks: ""
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    try {
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
          organization_address: formData.organizationAddress,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          organization_type: formData.organizationType,
          focus_areas: formData.focusAreas,
          established_year: parseInt(formData.establishedYear),
          pan_number: formData.panNumber,
          fcra_number: formData.fcraNumber || null,
          bank_account_number: formData.bankAccountNumber,
          ifsc_code: formData.ifscCode,
          organization_description: formData.organizationDescription,
          mission_statement: formData.missionStatement,
          website: formData.website || null,
          social_media_links: formData.socialMediaLinks || null
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "NGO registered successfully!",
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.detail || "Failed to register NGO",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New NGO</CardTitle>
        <CardDescription>
          Register a new NGO in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <Collapsible open={openSections.account} onOpenChange={() => toggleSection('account')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
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
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Organization Information */}
          <Collapsible open={openSections.organization} onOpenChange={() => toggleSection('organization')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold">Organization Information</h3>
              {openSections.organization ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 p-4">
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
                  <Label htmlFor="organizationType">Organization Type *</Label>
                  <Select onValueChange={(value) => handleSelectChange('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trust">Trust</SelectItem>
                      <SelectItem value="society">Society</SelectItem>
                      <SelectItem value="section8">Section 8 Company</SelectItem>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year *</Label>
                  <Input
                    id="establishedYear"
                    name="establishedYear"
                    type="number"
                    placeholder="2020"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    required
                  />
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
                    placeholder="Facebook, Twitter, LinkedIn URLs"
                    value={formData.socialMediaLinks}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="focusAreas">Focus Areas *</Label>
                <Input
                  id="focusAreas"
                  name="focusAreas"
                  placeholder="Education, Health, Environment, etc."
                  value={formData.focusAreas}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationDescription">Organization Description *</Label>
                <Textarea
                  id="organizationDescription"
                  name="organizationDescription"
                  placeholder="Describe your organization's work and impact..."
                  value={formData.organizationDescription}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="missionStatement">Mission Statement *</Label>
                <Textarea
                  id="missionStatement"
                  name="missionStatement"
                  placeholder="Your organization's mission and vision..."
                  value={formData.missionStatement}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Contact Information */}
          <Collapsible open={openSections.contact} onOpenChange={() => toggleSection('contact')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              {openSections.contact ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 p-4">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Address Information */}
          <Collapsible open={openSections.address} onOpenChange={() => toggleSection('address')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold">Address Information</h3>
              {openSections.address ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="organizationAddress">Organization Address *</Label>
                <Textarea
                  id="organizationAddress"
                  name="organizationAddress"
                  placeholder="Complete organization address"
                  value={formData.organizationAddress}
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
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold">Financial Information</h3>
              {openSections.financial ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    name="panNumber"
                    placeholder="ABCDE1234F"
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
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating NGO..." : "Create NGO"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminNGORegistrationForm;