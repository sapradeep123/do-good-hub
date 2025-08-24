
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, Building, Package, Plus, Edit, Trash2, Key, Eye, Settings } from "lucide-react";
import { format } from "date-fns";
import AdminPasswordReset from "@/components/AdminPasswordReset";
import NGODetailView from "@/components/NGODetailView";
import AdminVendorRegistrationForm from "@/components/AdminVendorRegistrationForm";
import AdminNGORegistrationForm from "@/components/AdminNGORegistrationForm";

// Simple interfaces
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  role?: string;
}

interface NGO {
  id: string;
  name: string;
  email: string;
  description?: string;
  mission?: string;
  location: string;
  category: string;
  phone?: string;
  website_url?: string;
  registration_number?: string;
  user_id?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface Vendor {
  id: string;
  company_name: string;
  contact_person?: string;
  email: string;
  phone: string;
  address?: string;
  description?: string;
  user_id?: string;
  ngo_id?: string;
  ngo_name?: string;
  is_active: boolean;
  created_at: string;
}

interface Package {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  items_included?: string[];
  delivery_timeline?: string;
  is_active: boolean;
  ngo_id: string;
  vendor_id?: string;
  ngo_name?: string;
  vendor_name?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [ngos, setNGOs] = useState<NGO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  
  // Modal states
  const [isCreateNGOOpen, setIsCreateNGOOpen] = useState(false);
  const [isCreateVendorOpen, setIsCreateVendorOpen] = useState(false);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  
  // Edit states
  const [isEditNGOOpen, setIsEditNGOOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  
  // Password reset states
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [resetToken, setResetToken] = useState("");
  
  // NGO detail view states
  const [isNGODetailOpen, setIsNGODetailOpen] = useState(false);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  
  const [editingNGO, setEditingNGO] = useState<NGO | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Settings states
  const [settings, setSettings] = useState({
    appName: "DoGood Hub",
    appDescription: "Connecting NGOs with vendors for better community impact",
    logoUrl: "",
    primaryColor: "#3b82f6",
    allowPublicRegistration: true,
    requireAdminApproval: true,
    maxFileUploadSize: 10,
    supportEmail: "support@dogoodhub.com",
    maintenanceMode: false
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      checkAdminRole();
    }
  }, [user, loading, navigate]);

  const checkAdminRole = async () => {
    try {
      // Check if user has admin role from the user object
      if (user?.role === 'admin') {
        setIsAdmin(true);
        await fetchAllData();
      } else {
        toast.error("Access denied: Admin role required");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Access denied");
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchUsers(),
      fetchNGOs(),
      fetchVendors(),
      fetchPackages(),
      fetchSettings()
    ]);
  };

  const fetchUsers = async () => {
    try {
      // Mock data for users
      const mockUsers = [
        {
          id: '1',
          email: 'admin@dogoodhub.com',
          first_name: 'Admin',
          last_name: 'User',
          phone: '+1234567890',
          created_at: '2024-01-01T00:00:00Z',
          role: 'admin'
        },
        {
          id: '2',
          email: 'testuser2@gmail.com',
          first_name: 'Test',
          last_name: 'User',
          phone: '+1234567891',
          created_at: '2024-01-02T00:00:00Z',
          role: 'user'
        },
        {
          id: '3',
          email: 'ngo@hopefoundation.org',
          first_name: 'Hope',
          last_name: 'Foundation',
          phone: '+1234567892',
          created_at: '2024-01-03T00:00:00Z',
          role: 'ngo'
        },
        {
          id: '4',
          email: 'vendor@supplies.com',
          first_name: 'Supply',
          last_name: 'Vendor',
          phone: '+1234567893',
          created_at: '2024-01-04T00:00:00Z',
          role: 'vendor'
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const fetchNGOs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/ngos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NGOs');
      }

      const ngoData = await response.json();
      
      // Transform the API response to match the frontend interface
      const transformedNGOs = ngoData.map((ngo: any) => ({
        id: ngo.id,
        name: ngo.name,
        email: ngo.email,
        description: ngo.description,
        mission: ngo.mission,
        location: `${ngo.city}, ${ngo.state}`,
        category: 'General', // Default category since it's not in the API response
        phone: ngo.phone,
        website_url: ngo.website,
        registration_number: ngo.registration_number,
        user_id: ngo.user_id,
        is_verified: ngo.verified,
        is_active: true, // Default to true since it's not in the API response
        created_at: ngo.created_at
      }));

      setNGOs(transformedNGOs);
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast.error("Failed to fetch NGOs");
    }
  };

  const fetchVendors = async () => {
    try {
      // Mock data for vendors
      const mockVendors = [
        {
          id: '1',
          company_name: 'Supply Chain Solutions',
          contact_person: 'John Smith',
          email: 'john@supplychain.com',
          phone: '+1234567890',
          address: '123 Business St, City, State',
          description: 'Leading supplier of educational materials and supplies',
          user_id: '4',
          ngo_id: '1',
          ngo_name: 'Hope Foundation',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          company_name: 'Medical Supplies Co',
          contact_person: 'Sarah Johnson',
          email: 'sarah@medsupplies.com',
          phone: '+1234567891',
          address: '456 Health Ave, City, State',
          description: 'Specialized medical equipment and supplies',
          user_id: '5',
          ngo_id: '2',
          ngo_name: 'Health First NGO',
          is_active: true,
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      setVendors(mockVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    }
  };

  const fetchPackages = async () => {
    try {
      // Mock data for packages
      const mockPackages = [
        {
          id: '1',
          title: 'Educational Kit',
          description: 'Complete educational materials for 50 students',
          amount: 5000,
          category: 'Education',
          items_included: ['Books', 'Stationery', 'Art supplies'],
          delivery_timeline: '2 weeks',
          is_active: true,
          ngo_id: '1',
          vendor_id: '1',
          ngo_name: 'Hope Foundation',
          vendor_name: 'Supply Chain Solutions',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Medical Equipment Package',
          description: 'Essential medical equipment for rural clinic',
          amount: 15000,
          category: 'Healthcare',
          items_included: ['Stethoscopes', 'Blood pressure monitors', 'First aid kits'],
          delivery_timeline: '3 weeks',
          is_active: true,
          ngo_id: '2',
          vendor_id: '2',
          ngo_name: 'Health First NGO',
          vendor_name: 'Medical Supplies Co',
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      setPackages(mockPackages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to fetch packages");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const settingsData = await response.json();
      
      // Update settings state with backend data
      setSettings(prev => ({
        ...prev,
        appName: settingsData.app_name || prev.appName,
        appDescription: settingsData.app_description || prev.appDescription,
        supportEmail: settingsData.admin_email || prev.supportEmail,
        // Map other fields as needed
      }));
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          app_name: settings.appName,
          app_description: settings.appDescription,
          admin_email: settings.supportEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  // Edit functions
  const viewNGODetails = (ngo: NGO) => {
    setSelectedNGO(ngo);
    setIsNGODetailOpen(true);
  };

  const editNGO = (ngo: NGO) => {
    setEditingNGO(ngo);
    setIsEditNGOOpen(true);
  };

  const editVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsEditVendorOpen(true);
  };

  const editPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsEditPackageOpen(true);
  };

  // Update functions that actually modify the state
  const updateNGO = (updatedNGO: NGO) => {
    setNGOs(prev => prev.map(ngo => 
      ngo.id === updatedNGO.id ? updatedNGO : ngo
    ));
  };

  const updateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(vendor => {
      if (vendor.id === updatedVendor.id) {
        // Find the NGO name for the updated ngo_id
        const associatedNGO = ngos.find(ngo => ngo.id === updatedVendor.ngo_id);
        return {
          ...vendor,
          ...updatedVendor,
          ngo_name: associatedNGO?.name || ''
        };
      }
      return vendor;
    }));
  };

  const updatePackage = (updatedPackage: Package) => {
    setPackages(prev => prev.map(pkg => {
      if (pkg.id === updatedPackage.id) {
        // Find the NGO and Vendor names for the updated IDs
        const associatedNGO = ngos.find(ngo => ngo.id === updatedPackage.ngo_id);
        const associatedVendor = vendors.find(vendor => vendor.id === updatedPackage.vendor_id);
        return {
          ...pkg,
          ...updatedPackage,
          ngo_name: associatedNGO?.name || '',
          vendor_name: associatedVendor?.company_name || ''
        };
      }
      return pkg;
    }));
  };

  // User management functions
  const editUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const resetPassword = async (user: User) => {
    try {
      // Generate a secure reset token (compatible with backend)
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15) +
                   Date.now().toString(36);
      
      // Store the reset request in the database
      const { error } = await supabase
        .from("password_reset_requests")
        .insert({
          email: user.email.trim().toLowerCase(),
          token,
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          used: false
        });

      if (error) {
        console.error("Error storing reset token:", error);
        toast.error("Failed to generate reset token");
        return;
      }

      // Set up the password reset modal
      setPasswordResetUser(user);
      setResetToken(token);
      setIsPasswordResetOpen(true);
      
      console.log(`Password reset token for ${user.email}:`, token);
    } catch (error) {
      console.error("Error generating password reset token:", error);
      toast.error("Failed to generate password reset token");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p>You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage NGOs, vendors, and packages
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active NGOs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ngos.filter(n => n.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.filter(v => v.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.filter(p => p.is_active).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="ngos" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ngos">NGO Management</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
            <TabsTrigger value="packages">Package Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* NGO Management Tab */}
          <TabsContent value="ngos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>NGO Management</CardTitle>
                  <CardDescription>Create and manage NGOs (Admin-only registration)</CardDescription>
                </div>
                <Dialog open={isCreateNGOOpen} onOpenChange={setIsCreateNGOOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add NGO
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New NGO</DialogTitle>
                      <DialogDescription>Add a new NGO to the platform</DialogDescription>
                    </DialogHeader>
                    <AdminNGORegistrationForm 
                      onSuccess={() => {
                        setIsCreateNGOOpen(false);
                        fetchNGOs();
                      }}
                      onCancel={() => setIsCreateNGOOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                       <TableHead>Location</TableHead>
                       <TableHead>Category</TableHead>
                       <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ngos.map((ngo) => (
                         <TableRow key={ngo.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ngo.name}</div>
                            <div className="text-sm text-muted-foreground">{ngo.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>{ngo.email}</TableCell>
                          <TableCell>{ngo.location}</TableCell>
                          <TableCell>{ngo.category}</TableCell>
                           <TableCell>
                          <Badge variant={ngo.is_active ? "default" : "secondary"}>
                            {ngo.is_active ? "Active" : "Inactive"}
                             </Badge>
                           </TableCell>
                           <TableCell>
                          <Badge variant={ngo.is_verified ? "default" : "secondary"}>
                            {ngo.is_verified ? "Verified" : "Pending"}
                                   </Badge>
                           </TableCell>
                          <TableCell>
                          {format(new Date(ngo.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                             <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => viewNGODetails(ngo)}>
                                 <Eye className="h-4 w-4" />
                               </Button>
                            <Button variant="ghost" size="sm" onClick={() => editNGO(ngo)}>
                                 <Edit className="h-4 w-4" />
                               </Button>
                            <Button variant="ghost" size="sm">
                                 <Trash2 className="h-4 w-4" />
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

          {/* Vendor Management Tab */}
          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vendor Management</CardTitle>
                  <CardDescription>Create and manage vendors (Service providers)</CardDescription>
                </div>
                <Dialog open={isCreateVendorOpen} onOpenChange={setIsCreateVendorOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Vendor</DialogTitle>
                      <DialogDescription>Add a new vendor to the platform</DialogDescription>
                    </DialogHeader>
                     <AdminVendorRegistrationForm 
                      onSuccess={() => {
                        setIsCreateVendorOpen(false);
                        fetchVendors();
                      }}
                      onCancel={() => setIsCreateVendorOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Associated NGO</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                         <TableRow key={vendor.id}>
                           <TableCell className="font-medium">{vendor.company_name}</TableCell>
                        <TableCell>{vendor.ngo_name || 'No NGO assigned'}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.phone}</TableCell>
                        <TableCell>
                          <Badge variant={vendor.is_active ? "default" : "secondary"}>
                            {vendor.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(vendor.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editVendor(vendor)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
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

          {/* Package Management Tab */}
          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Package Management</CardTitle>
                  <CardDescription>Create and manage packages (Admin-only creation)</CardDescription>
                </div>
                <Dialog open={isCreatePackageOpen} onOpenChange={setIsCreatePackageOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Package</DialogTitle>
                      <DialogDescription>Add a new package to the platform</DialogDescription>
                    </DialogHeader>
                    <CreatePackageForm 
                      ngos={ngos}
                      vendors={vendors}
                      onSuccess={() => {
                        setIsCreatePackageOpen(false);
                        fetchPackages();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>NGO</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{pkg.title}</div>
                            <div className="text-sm text-muted-foreground">{pkg.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{pkg.ngo_name}</TableCell>
                        <TableCell>{pkg.vendor_name || 'No vendor assigned'}</TableCell>
                        <TableCell>₹{pkg.amount.toLocaleString()}</TableCell>
                        <TableCell>{pkg.category}</TableCell>
                        <TableCell>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(pkg.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editPackage(pkg)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
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

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts, roles, and password resets</CardDescription>
                </div>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>Add a new user to the platform</DialogDescription>
                    </DialogHeader>
                    <CreateUserForm 
                      onSuccess={() => {
                        setIsCreateUserOpen(false);
                        fetchUsers();
                      }}
                    />
                  </DialogContent>
                </Dialog>
                    </CardHeader>
                    <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(user.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => resetPassword(user)}>
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
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

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>Manage application configuration and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appName">Application Name</Label>
                      <Input
                        id="appName"
                        value={settings.appName}
                        onChange={(e) => setSettings({...settings, appName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="appDescription">Application Description</Label>
                    <Textarea
                      id="appDescription"
                      value={settings.appDescription}
                      onChange={(e) => setSettings({...settings, appDescription: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Branding */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Branding</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        value={settings.logoUrl}
                        onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
                      <Input
                        id="maxFileUploadSize"
                        type="number"
                        value={settings.maxFileUploadSize}
                        onChange={(e) => setSettings({...settings, maxFileUploadSize: parseInt(e.target.value)})}
                        min="1"
                        max="100"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={settings.maintenanceMode}
                        onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    </div>
                  </div>
                </div>

                {/* Registration Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Registration Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowPublicRegistration"
                        checked={settings.allowPublicRegistration}
                        onChange={(e) => setSettings({...settings, allowPublicRegistration: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="allowPublicRegistration">Allow Public Registration</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requireAdminApproval"
                        checked={settings.requireAdminApproval}
                        onChange={(e) => setSettings({...settings, requireAdminApproval: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="requireAdminApproval">Require Admin Approval for New Registrations</Label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSettings({
                        appName: "DoGood Hub",
                        appDescription: "Connecting NGOs with vendors for better community impact",
                        logoUrl: "",
                        primaryColor: "#3b82f6",
                        allowPublicRegistration: true,
                        requireAdminApproval: true,
                        maxFileUploadSize: 10,
                        supportEmail: "support@dogoodhub.com",
                        maintenanceMode: false
                      });
                      toast.success("Settings reset to defaults");
                    }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={saveSettings}
                  >
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialogs */}
        {/* Edit NGO Dialog */}
        <Dialog open={isEditNGOOpen} onOpenChange={setIsEditNGOOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit NGO</DialogTitle>
              <DialogDescription>Update NGO information</DialogDescription>
            </DialogHeader>
            {editingNGO && (
              <EditNGOForm 
                ngo={editingNGO}
                onSuccess={(updatedData) => {
                  updateNGO({ ...editingNGO, ...updatedData });
                  setIsEditNGOOpen(false);
                  setEditingNGO(null);
                }}
                onCancel={() => {
                  setIsEditNGOOpen(false);
                  setEditingNGO(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Vendor Dialog */}
        <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>Update vendor information</DialogDescription>
            </DialogHeader>
            {editingVendor && (
              <EditVendorForm 
                vendor={editingVendor}
                ngos={ngos}
                onSuccess={(updatedData) => {
                  updateVendor({ ...editingVendor, ...updatedData });
                  setIsEditVendorOpen(false);
                  setEditingVendor(null);
                }}
                onCancel={() => {
                  setIsEditVendorOpen(false);
                  setEditingVendor(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Package Dialog */}
        <Dialog open={isEditPackageOpen} onOpenChange={setIsEditPackageOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Package</DialogTitle>
              <DialogDescription>Update package information</DialogDescription>
            </DialogHeader>
            {editingPackage && (
              <EditPackageForm 
                package={editingPackage}
                ngos={ngos}
                vendors={vendors}
                onSuccess={(updatedData) => {
                  updatePackage({ ...editingPackage, ...updatedData });
                  setIsEditPackageOpen(false);
                  setEditingPackage(null);
                }}
                onCancel={() => {
                  setIsEditPackageOpen(false);
                  setEditingPackage(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <EditUserForm 
                user={editingUser}
                onSuccess={(updatedData) => {
                  updateUser({ ...editingUser, ...updatedData });
                  setIsEditUserOpen(false);
                  setEditingUser(null);
              }}
              onCancel={() => {
                  setIsEditUserOpen(false);
                  setEditingUser(null);
              }}
            />
            )}
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
          <DialogContent className="max-w-md">
            {passwordResetUser && resetToken && (
              <AdminPasswordReset
                userEmail={passwordResetUser.email}
                resetToken={resetToken}
                onSuccess={() => {
                  setIsPasswordResetOpen(false);
                  setPasswordResetUser(null);
                  setResetToken("");
                  toast.success("Password reset completed successfully!");
                }}
                onCancel={() => {
                  setIsPasswordResetOpen(false);
                  setPasswordResetUser(null);
                  setResetToken("");
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* NGO Detail View Dialog */}
        {selectedNGO && (
          <NGODetailView
            ngo={selectedNGO}
            vendors={vendors}
            packages={packages}
            users={users}
            onEdit={(ngo) => {
              setIsNGODetailOpen(false);
              setSelectedNGO(null);
              editNGO(ngo);
            }}
            onClose={() => {
              setIsNGODetailOpen(false);
              setSelectedNGO(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Form components

const CreatePackageForm = ({ ngos, vendors, onSuccess }: { 
  ngos: NGO[]; 
  vendors: Vendor[];
  onSuccess: () => void; 
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Package created successfully!");
      onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
      <div>
          <Label htmlFor="title">Package Title</Label>
          <Input id="title" required />
      </div>
        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" type="number" required />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="ngo">NGO</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select NGO" />
            </SelectTrigger>
            <SelectContent>
              {ngos.map((ngo) => (
                <SelectItem key={ngo.id} value={ngo.id}>
                  {ngo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="vendor">Vendor</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select Vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="poverty">Poverty Alleviation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">Create Package</Button>
      </div>
    </form>
  );
};

// Edit Form Components
const EditNGOForm = ({ ngo, onSuccess, onCancel }: { 
  ngo: NGO; 
  onSuccess: (updatedData: Partial<NGO>) => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    name: ngo.name,
    email: ngo.email,
    description: ngo.description || '',
    mission: ngo.mission || '',
    phone: ngo.phone || '',
    website: ngo.website_url || '',
    registration_number: ngo.registration_number || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Map frontend data to backend schema
      const backendData = {
        name: formData.name,
        email: formData.email,
        description: formData.description,
        mission: formData.mission,
        phone: formData.phone,
        website: formData.website,
        registration_number: formData.registration_number
      };

      const response = await fetch(`http://localhost:8000/api/admin/ngos/${ngo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update NGO');
      }

      const result = await response.json();
      toast.success(result.message || "NGO updated successfully!");
      
      // Update the local state with the new data
      const updatedNGO = {
        ...ngo,
        name: formData.name,
        email: formData.email,
        description: formData.description,
        mission: formData.mission,
        phone: formData.phone,
        website_url: formData.website,
        registration_number: formData.registration_number
      };
      onSuccess(updatedNGO);
    } catch (error) {
      console.error('Error updating NGO:', error);
      toast.error("Failed to update NGO. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">NGO Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="mission">Mission</Label>
        <Textarea
          id="mission"
          value={formData.mission}
          onChange={(e) => handleInputChange('mission', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="registration_number">Registration Number</Label>
        <Input
          id="registration_number"
          value={formData.registration_number}
          onChange={(e) => handleInputChange('registration_number', e.target.value)}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update NGO</Button>
      </div>
      </form>
  );
};

const EditVendorForm = ({ vendor, ngos, onSuccess, onCancel }: { 
  vendor: Vendor; 
  ngos: NGO[];
  onSuccess: (updatedData: Partial<Vendor>) => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    company_name: vendor.company_name,
    email: vendor.email,
    contact_person: vendor.contact_person || '',
    phone: vendor.phone,
    address: vendor.address || '',
    ngo_id: vendor.ngo_id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://localhost:8000/api/admin/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor');
      }

      const updatedVendor = await response.json();
      toast.success("Vendor updated successfully!");
      onSuccess(updatedVendor);
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error("Failed to update vendor. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company Name</Label>
          <Input
            id="company" 
            value={formData.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email" 
            type="email" 
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required 
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact">Contact Person</Label>
          <Input
            id="contact" 
            value={formData.contact_person}
            onChange={(e) => handleInputChange('contact_person', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            required 
          />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea 
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="ngo">Associated NGO</Label>
        <Select value={formData.ngo_id} onValueChange={(value) => handleInputChange('ngo_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select NGO" />
          </SelectTrigger>
          <SelectContent>
            {ngos.map((ngo) => (
              <SelectItem key={ngo.id} value={ngo.id}>
                {ngo.name}
              </SelectItem>
          ))}
          </SelectContent>
        </Select>
        </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Vendor</Button>
      </div>
      </form>
  );
};

const EditPackageForm = ({ package: pkg, ngos, vendors, onSuccess, onCancel }: { 
  package: Package;
  ngos: NGO[]; 
  vendors: Vendor[];
  onSuccess: (updatedData: Partial<Package>) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: pkg.title,
    amount: pkg.amount,
    description: pkg.description || '',
    ngo_id: pkg.ngo_id,
    vendor_id: pkg.vendor_id || '',
    category: pkg.category
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Package updated successfully!");
    onSuccess(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Package Title</Label>
          <Input
            id="title" 
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required 
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount" 
            type="number" 
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', Number(e.target.value))}
            required 
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
      <div>
          <Label htmlFor="ngo">NGO</Label>
          <Select value={formData.ngo_id} onValueChange={(value) => handleInputChange('ngo_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select NGO" />
            </SelectTrigger>
            <SelectContent>
              {ngos.map((ngo) => (
                <SelectItem key={ngo.id} value={ngo.id}>
                  {ngo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>
        <div>
          <Label htmlFor="vendor">Vendor</Label>
          <Select value={formData.vendor_id} onValueChange={(value) => handleInputChange('vendor_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="poverty">Poverty Alleviation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Package</Button>
      </div>
    </form>
  );
};

const CreateUserForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("User created successfully!");
      onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" required />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
      <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required />
      </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" />
        </div>
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
        <Select defaultValue="user">
            <SelectTrigger>
            <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ngo">NGO</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">Create User</Button>
      </div>
    </form>
  );
};

const EditUserForm = ({ user, onSuccess, onCancel }: { 
  user: User; 
  onSuccess: (updatedData: Partial<User>) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email,
    phone: user.phone || '',
    role: user.role || 'user'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("User updated successfully!");
    onSuccess(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
      <div>
          <Label htmlFor="first_name">First Name</Label>
        <Input
            id="first_name" 
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
          required
        />
      </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name" 
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            required
          />
        </div>
        </div>
      <div className="grid grid-cols-2 gap-4">
      <div>
          <Label htmlFor="email">Email</Label>
        <Input
            id="email" 
            type="email" 
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required 
        />
      </div>
      <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone" 
            type="tel" 
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
                        </div>
                <div>
        <Label htmlFor="role">Role</Label>
        <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="ngo">NGO</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update User</Button>
    </div>
    </form>
  );
};

export default AdminDashboard;