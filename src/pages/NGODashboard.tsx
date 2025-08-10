import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Package, Users, Building2, Phone, Mail, MapPin, Edit, Eye, Calendar } from 'lucide-react';

interface NGO {
  id: string;
  name: string;
  email: string;
  description?: string;
  mission?: string;
  our_story?: string;
  about_us?: string;
  contact_info?: string;
  photo_url?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  registration_number?: string;
  verified: boolean;
  created_at: string;
}

interface Vendor {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  address?: string;
  description?: string;
  business_type?: string;
  verified: boolean;
  created_at: string;
}

interface Package {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: string;
  donor_name?: string;
  donor_email?: string;
  occasion?: string;
  delivery_date?: string;
  received_date?: string;
  notes?: string;
  created_at: string;
}

interface NGODashboardData {
  ngo: NGO;
  vendors: Vendor[];
  packages: Package[];
  totalPackages: number;
  totalVendors: number;
  pendingDeliveries: number;
}

const NGODashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<NGODashboardData | null>(null);
  
  // Dialog states
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPackageDetailsDialogOpen, setIsPackageDetailsDialogOpen] = useState(false);
  const [isDeliveryDateDialogOpen, setIsDeliveryDateDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  
  // Form states
  const [profileFormData, setProfileFormData] = useState({
    our_story: '',
    about_us: '',
    contact_info: '',
    photo_url: ''
  });
  
  const [deliveryDateForm, setDeliveryDateForm] = useState({
    delivery_date: '',
    reason: ''
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (user.role !== 'ngo') {
        toast.error('Access denied. NGO privileges required.');
        navigate('/dashboard');
        return;
      }

      fetchDashboardData();
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/api/ngos/dashboard') as any;
      setDashboardData(response);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put(`/api/ngos/${dashboardData?.ngo.id}/profile`, profileFormData);
      toast.success('Profile updated successfully!');
      setIsProfileDialogOpen(false);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleDeliveryDateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    try {
      await apiClient.put(`/api/packages/${selectedPackage.id}/delivery-date`, {
        delivery_date: deliveryDateForm.delivery_date,
        reason: deliveryDateForm.reason
      });
      toast.success('Delivery date updated successfully!');
      setIsDeliveryDateDialogOpen(false);
      setSelectedPackage(null);
      setDeliveryDateForm({ delivery_date: '', reason: '' });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating delivery date:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update delivery date');
    }
  };

  const openProfileDialog = () => {
    if (dashboardData?.ngo) {
      setProfileFormData({
        our_story: dashboardData.ngo.our_story || '',
        about_us: dashboardData.ngo.about_us || '',
        contact_info: dashboardData.ngo.contact_info || '',
        photo_url: dashboardData.ngo.photo_url || ''
      });
      setIsProfileDialogOpen(true);
    }
  };

  const openPackageDetails = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsPackageDetailsDialogOpen(true);
  };

  const openDeliveryDateDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setDeliveryDateForm({
      delivery_date: pkg.delivery_date || '',
      reason: ''
    });
    setIsDeliveryDateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'in_progress': { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      'delivered': { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      'received': { color: 'bg-purple-100 text-purple-800', label: 'Received' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NGO Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
                  <div>
          <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="text-gray-600">Welcome back, {dashboardData.ngo.name}</p>
                  </div>
        <Button onClick={openProfileDialog} className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit Profile
                  </Button>
                </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalPackages}</div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalVendors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pendingDeliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge className={dashboardData.ngo.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {dashboardData.ngo.verified ? 'Verified' : 'Pending Verification'}
            </Badge>
            </CardHeader>
            <CardContent>
            <div className="text-sm text-muted-foreground">
              {dashboardData.ngo.city}, {dashboardData.ngo.state}
            </div>
            </CardContent>
          </Card>
        </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="vendors">Partner Vendors</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
        <Card>
          <CardHeader>
              <CardTitle>Package Deliveries</CardTitle>
              <CardDescription>Track all packages and their delivery status</CardDescription>
          </CardHeader>
          <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Occasion</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
                    <TableHead>Delivery Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
                  {dashboardData.packages.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{pkg.title}</div>
                          <div className="text-sm text-gray-500">{pkg.description}</div>
                </div>
              </TableCell>
              <TableCell>
                        <div className="text-sm">
                          <div>Anonymous Donor</div>
                          <div className="text-gray-500">Donor details hidden</div>
                        </div>
              </TableCell>
                      <TableCell>{pkg.occasion || 'General Donation'}</TableCell>
                      <TableCell>₹{pkg.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(pkg.status)}</TableCell>
              <TableCell>
                        <div className="text-sm">
                          {pkg.delivery_date ? new Date(pkg.delivery_date).toLocaleDateString() : 'Not scheduled'}
                        </div>
              </TableCell>
              <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPackageDetails(pkg)}
                          >
                            <Eye className="w-4 h-4" />
                  </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeliveryDateDialog(pkg)}
                          >
                            <Calendar className="w-4 h-4" />
                      </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Vendors</CardTitle>
              <CardDescription>Vendors associated with your NGO</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.vendors.map((vendor) => (
                  <Card key={vendor.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{vendor.company_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{vendor.company_name}</h3>
                        <p className="text-sm text-gray-600">{vendor.business_type}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Phone className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-600">{vendor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-600">{vendor.email}</span>
    </div>
                        {vendor.address && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-600">{vendor.address}</span>
      </div>
                        )}
                        <Badge className={vendor.verified ? 'bg-green-100 text-green-800 mt-2' : 'bg-yellow-100 text-yellow-800 mt-2'}>
                          {vendor.verified ? 'Verified' : 'Pending'}
                </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
    </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NGO Profile</CardTitle>
              <CardDescription>Your organization's public information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Organization Details</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.city}, {dashboardData.ngo.state}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Registration Number</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.registration_number || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Public Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Our Story</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.our_story || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">About Us</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.about_us || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contact Information</Label>
                      <p className="text-sm text-gray-600">{dashboardData.ngo.contact_info || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile Edit Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit NGO Profile</DialogTitle>
            <DialogDescription>
              Update your organization's public information. Name and heading details can only be edited by Admin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
        <div>
              <Label htmlFor="photo_url">Profile Photo URL</Label>
          <Input
                id="photo_url"
                value={profileFormData.photo_url}
                onChange={(e) => setProfileFormData({ ...profileFormData, photo_url: e.target.value })}
                placeholder="https://example.com/photo.jpg"
          />
        </div>
        <div>
              <Label htmlFor="our_story">Our Story</Label>
              <Textarea
                id="our_story"
                value={profileFormData.our_story}
                onChange={(e) => setProfileFormData({ ...profileFormData, our_story: e.target.value })}
                placeholder="Tell your organization's story..."
                rows={4}
          />
        </div>
            <div>
              <Label htmlFor="about_us">About Us</Label>
              <Textarea
                id="about_us"
                value={profileFormData.about_us}
                onChange={(e) => setProfileFormData({ ...profileFormData, about_us: e.target.value })}
                placeholder="Describe your organization's mission and work..."
                rows={4}
              />
      </div>
      <div>
              <Label htmlFor="contact_info">Contact Information</Label>
        <Textarea
                id="contact_info"
                value={profileFormData.contact_info}
                onChange={(e) => setProfileFormData({ ...profileFormData, contact_info: e.target.value })}
                placeholder="Additional contact information..."
          rows={3}
        />
      </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Profile
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Package Details Dialog */}
      <Dialog open={isPackageDetailsDialogOpen} onOpenChange={setIsPackageDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Package Details</DialogTitle>
            <DialogDescription>Detailed information about the package</DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Package Title</Label>
                <p className="text-sm text-gray-600">{selectedPackage.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">{selectedPackage.description || 'No description'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <p className="text-sm text-gray-600">₹{selectedPackage.amount.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <p className="text-sm text-gray-600">{selectedPackage.category}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Occasion</Label>
                <p className="text-sm text-gray-600">{selectedPackage.occasion || 'General Donation'}</p>
              </div>
        <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedPackage.status)}</div>
        </div>
        <div>
                <Label className="text-sm font-medium">Delivery Date</Label>
                <p className="text-sm text-gray-600">
                  {selectedPackage.delivery_date ? new Date(selectedPackage.delivery_date).toLocaleDateString() : 'Not scheduled'}
                </p>
              </div>
              {selectedPackage.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-gray-600">{selectedPackage.notes}</p>
        </div>
              )}
      </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Date Update Dialog */}
      <Dialog open={isDeliveryDateDialogOpen} onOpenChange={setIsDeliveryDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Date</DialogTitle>
            <DialogDescription>
              Change the delivery date for this package. This is useful when you already have enough supplies.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeliveryDateUpdate} className="space-y-4">
      <div>
              <Label htmlFor="delivery_date">New Delivery Date</Label>
        <Input
                id="delivery_date"
                type="date"
                value={deliveryDateForm.delivery_date}
                onChange={(e) => setDeliveryDateForm({ ...deliveryDateForm, delivery_date: e.target.value })}
                required
        />
      </div>
      <div>
              <Label htmlFor="reason">Reason for Date Change</Label>
        <Textarea
                id="reason"
                value={deliveryDateForm.reason}
                onChange={(e) => setDeliveryDateForm({ ...deliveryDateForm, reason: e.target.value })}
                placeholder="Explain why you need to change the delivery date..."
                rows={3}
        />
      </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDeliveryDateDialogOpen(false)}>
            Cancel
          </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Date
          </Button>
        </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
  );
};

export default NGODashboard;