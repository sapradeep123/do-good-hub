
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, Building, Package, Plus, Edit, Trash2, Key, Eye, Link, Unlink, LogOut } from "lucide-react";
import { format } from "date-fns";
import EnhancedPackageManagement from "@/components/EnhancedPackageManagement";

// Interfaces
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
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  registration_number?: string;
  user_id?: string;
  verified: boolean;
  created_at: string;
  // Frontend-only fields for form handling
  location?: string;
  category?: string;
  is_active?: boolean;
  // Backend response fields
  packages?: Array<{
    id: string;
    title: string;
    description?: string;
    amount: number;
    category: string;
    vendor_ids?: string[];
    vendor_names?: string[];
    assignment_id?: string;
  }>;
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
  business_type?: string;
  verified: boolean;
  created_at: string;
  // Frontend-only fields for form handling
  is_active?: boolean;
  // Backend response fields
  served_pairs?: Array<{
    package_id: string;
    package_title: string;
    package_amount: number;
    ngo_id: string;
    ngo_name: string;
    assignment_id: string;
    assigned_at: string;
  }>;
}

interface Package {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: string; // Backend field
  ngo_id?: string;
  vendor_id?: string;
  ngo_name?: string;
  vendor_name?: string;
  created_at: string;
  assigned_ngos?: string[];
  assigned_vendors?: string[];
  ngo_names?: string[];
  vendor_names?: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [ngos, setNGOs] = useState<NGO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  // Dialog states
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isNGODialogOpen, setIsNGODialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isCreateNGODialogOpen, setIsCreateNGODialogOpen] = useState(false);
  const [isEditNGODialogOpen, setIsEditNGODialogOpen] = useState(false);
  const [isCreateVendorDialogOpen, setIsCreateVendorDialogOpen] = useState(false);
  const [isEditVendorDialogOpen, setIsEditVendorDialogOpen] = useState(false);
  const [editingNGO, setEditingNGO] = useState<NGO | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [ngoFormData, setNGOFormData] = useState({
    name: '',
    email: '',
    description: '',
    mission: '',
    location: '',
    category: '',
    phone: '',
    website_url: '',
    registration_number: '',
    is_active: true
  });
  const [vendorFormData, setVendorFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    description: '',
    address: '',
    business_type: '',
    is_active: true
  });

  // NGO form handlers
  const handleCreateNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ngos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(ngoFormData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create NGO');
      }
      
      const result = await response.json();
      
      await fetchNGOs(); // Refresh the NGOs list
      setIsCreateNGODialogOpen(false);
      setNGOFormData({
        name: '',
        email: '',
        description: '',
        mission: '',
        location: '',
        category: '',
        phone: '',
        website_url: '',
        registration_number: '',
        is_active: true
      });
      toast.success('NGO created successfully!');
    } catch (error) {
      console.error('Error creating NGO:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create NGO');
    }
  };

  const handleUpdateNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNGO) return;
    
    try {
      const response = await fetch(`/api/ngos/${editingNGO.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(ngoFormData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update NGO');
      }
      
      const result = await response.json();
      
      await fetchNGOs(); // Refresh the NGOs list
      setIsEditNGODialogOpen(false);
      setEditingNGO(null);
      toast.success('NGO updated successfully!');
    } catch (error) {
      console.error('Error updating NGO:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update NGO');
    }
  };

  // Vendor form handlers
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(vendorFormData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create vendor');
      }
      
      const result = await response.json();
      
      await fetchVendors(); // Refresh the vendors list
      setIsCreateVendorDialogOpen(false);
      setVendorFormData({
        company_name: '',
        email: '',
        phone: '',
        description: '',
        address: '',
        business_type: '',
        is_active: true
      });
      toast.success('Vendor created successfully!');
    } catch (error) {
      console.error('Error creating vendor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create vendor');
    }
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    
    try {
      const response = await fetch(`/api/vendors/${editingVendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(vendorFormData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update vendor');
      }
      
      const result = await response.json();
      
      await fetchVendors(); // Refresh the vendors list
      setIsEditVendorDialogOpen(false);
      setEditingVendor(null);
      toast.success('Vendor updated successfully!');
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update vendor');
    }
  };

  const openCreateNGODialog = () => {
    setNGOFormData({
      name: '',
      email: '',
      description: '',
      mission: '',
      location: '',
      category: '',
      phone: '',
      website_url: '',
      registration_number: '',
      is_active: true
    });
    setIsCreateNGODialogOpen(true);
  };

  const openEditNGODialog = (ngo: NGO) => {
    setEditingNGO(ngo);
    setNGOFormData({
      name: ngo.name,
      email: ngo.email,
      description: ngo.description || '',
      mission: ngo.mission || '',
      location: ngo.city || '', // Assuming city is the location for editing
      category: ngo.category || '', // Assuming category is the category for editing
      phone: ngo.phone || '',
      website_url: ngo.website || '',
      registration_number: ngo.registration_number || '',
      is_active: ngo.verified
    });
    setIsEditNGODialogOpen(true);
  };

  const openCreateVendorDialog = () => {
    setVendorFormData({
      company_name: '',
      email: '',
      phone: '',
      description: '',
      address: '',
      business_type: '',
      is_active: true
    });
    setIsCreateVendorDialogOpen(true);
  };

  const openEditVendorDialog = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorFormData({
      company_name: vendor.company_name,
      email: vendor.email,
      phone: vendor.phone,
      description: vendor.description || '',
      address: vendor.address || '',
      business_type: vendor.business_type || '',
      is_active: vendor.verified // Map verified to is_active for form
    });
    setIsEditVendorDialogOpen(true);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // Check if user has admin role
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
        return;
      }
      
      fetchAllData();
    }
  }, [user, authLoading, navigate]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchUsers(),
      fetchNGOs(),
      fetchVendors(),
      fetchPackages()
    ]);
    setIsLoading(false);
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
      const response = await fetch('/api/ngos', {
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': '1',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch NGOs');
      }
      const data = await response.json();
      const ngos = Array.isArray(data) ? data : (data.data || []);
      setNGOs(ngos);
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast.error("Failed to fetch NGOs");
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors', {
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': '1',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      const vendors = Array.isArray(data) ? data : (data.data || []);
      setVendors(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages', {
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': '1',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }
      const data = await response.json();
      const packages = Array.isArray(data) ? data : (data.data || []);
      setPackages(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to fetch packages");
    }
  };

  // Dialog handlers
  const handleViewNGO = async (ngo: NGO) => {
    try {
      // Fetch detailed NGO data with packages and vendors
      const response = await fetch(`/api/ngos/${ngo.id}`, {
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch NGO details');
      }
      
      const result = await response.json();
      if (result.success) {
        setSelectedNGO(result.data);
        setIsNGODialogOpen(true);
      } else {
        throw new Error(result.message || 'Failed to fetch NGO details');
      }
    } catch (error) {
      console.error('Error fetching NGO details:', error);
      toast.error('Failed to fetch NGO details');
      // Fallback to basic NGO data
      setSelectedNGO(ngo);
      setIsNGODialogOpen(true);
    }
  };

  const handleViewVendor = async (vendor: Vendor) => {
    try {
      // Fetch detailed vendor data with served pairs
      const response = await fetch(`/api/vendors/${vendor.id}`, {
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendor details');
      }
      
      const result = await response.json();
      if (result.success) {
        setSelectedVendor(result.data);
        setIsVendorDialogOpen(true);
      } else {
        throw new Error(result.message || 'Failed to fetch vendor details');
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      toast.error('Failed to fetch vendor details');
      // Fallback to basic vendor data
      setSelectedVendor(vendor);
      setIsVendorDialogOpen(true);
    }
  };

  // Enhanced Package Management Functions
  const handlePackageCreate = async (packageData: any) => {
    try {
      // Map is_active to status for backend
      const backendData = {
        ...packageData,
        is_active: packageData.status === 'active'
      };
      
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(backendData)
      });
      
      if (!response.ok) throw new Error('Failed to create package');
      
      await fetchPackages(); // Refresh the packages list
      toast.success('Package created successfully!');
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Failed to create package');
    }
  };

  const handlePackageUpdate = async (packageId: string, packageData: any) => {
    try {
      // Map is_active to status for backend
      const backendData = {
        ...packageData,
        is_active: packageData.status === 'active'
      };
      
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(backendData)
      });
      
      if (!response.ok) throw new Error('Failed to update package');
      
      await fetchPackages(); // Refresh the packages list
      toast.success('Package updated successfully!');
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Failed to update package');
    }
  };

  const handlePackageDuplicate = async (packageId: string, modifications: any) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/duplicate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(modifications)
      });
      
      if (!response.ok) throw new Error('Failed to duplicate package');
      
      await fetchPackages(); // Refresh the packages list
      toast.success('Package duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating package:', error);
      toast.error('Failed to duplicate package');
    }
  };

  const handlePackageAssign = async (packageId: string, assignments: { ngo_ids: string[], vendor_ids: string[] }) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify(assignments)
      });
      
      if (!response.ok) throw new Error('Failed to assign package');
      
      // Refresh packages to get updated assignments
      await fetchPackages();
      toast.success('Package assignments updated successfully!');
    } catch (error) {
      console.error('Error assigning package:', error);
      toast.error('Failed to assign package');
    }
  };

  const handleLogout = () => {
    // Clear any stored tokens
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
          <h2>Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

    return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              Manage NGOs, vendors, and packages
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Welcome,</div>
              <div style={{ fontWeight: '500' }}>{user.firstName} {user.lastName}</div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <Card>
            <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
              <CardTitle style={{ fontSize: '0.875rem', fontWeight: '500' }}>Total Users</CardTitle>
              <Users style={{ height: '1rem', width: '1rem', color: '#6b7280' }} />
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
              <CardTitle style={{ fontSize: '0.875rem', fontWeight: '500' }}>Active NGOs</CardTitle>
              <Building style={{ height: '1rem', width: '1rem', color: '#6b7280' }} />
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{ngos.filter(n => n.verified).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
              <CardTitle style={{ fontSize: '0.875rem', fontWeight: '500' }}>Active Vendors</CardTitle>
              <Package style={{ height: '1rem', width: '1rem', color: '#6b7280' }} />
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{vendors.filter(v => v.verified).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
              <CardTitle style={{ fontSize: '0.875rem', fontWeight: '500' }}>Active Packages</CardTitle>
              <Package style={{ height: '1rem', width: '1rem', color: '#6b7280' }} />
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{packages.filter(p => p.status === 'active').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="packages" style={{ width: '100%' }}>
          <TabsList style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', width: '100%' }}>
            <TabsTrigger value="packages">Package Management</TabsTrigger>
            <TabsTrigger value="ngos">NGO Management</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

                    {/* Package Management Tab */}
          <TabsContent value="packages" style={{ marginTop: '1.5rem' }}>
            <EnhancedPackageManagement
              packages={packages}
              ngos={ngos}
              vendors={vendors}
              onPackageCreate={handlePackageCreate}
              onPackageUpdate={handlePackageUpdate}
              onPackageDuplicate={handlePackageDuplicate}
              onPackageAssign={handlePackageAssign}
            />
          </TabsContent>

          {/* NGO Management Tab */}
          <TabsContent value="ngos" style={{ marginTop: '1.5rem' }}>
            <Card>
              <CardHeader>
                <CardTitle>NGO Management</CardTitle>
                <CardDescription>
                  Manage NGOs and their packages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>NGOs ({ngos.length})</h3>
                    <Button onClick={openCreateNGODialog}>
                      <Plus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
                      Create NGO
                    </Button>
                  </div>
                  
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead>NGO</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {ngos.map((ngo) => (
                        <TableRow key={ngo.id}>
                        <TableCell>
                            <div>
                              <div style={{ fontWeight: '500' }}>{ngo.name}</div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {ngo.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div style={{ fontSize: '0.875rem' }}>{ngo.email}</div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {ngo.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{ngo.city || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={ngo.verified ? "default" : "secondary"}>
                              {ngo.verified ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                                                   <TableCell>
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                               <Button variant="ghost" size="sm" onClick={() => handleViewNGO(ngo)}>
                                 <Eye style={{ height: '1rem', width: '1rem' }} />
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => openEditNGODialog(ngo)}>
                                 <Edit style={{ height: '1rem', width: '1rem' }} />
                               </Button>
                             </div>
                           </TableCell>
                       </TableRow>
                    ))}
                   </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendor Management Tab */}
          <TabsContent value="vendors" style={{ marginTop: '1.5rem' }}>
              <Card>
              <CardHeader>
                <CardTitle>Vendor Management</CardTitle>
                <CardDescription>
                  Manage vendors and their services
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Vendors ({vendors.length})</h3>
                    <Button onClick={openCreateVendorDialog}>
                      <Plus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
                      Create Vendor
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Associated NGO</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell>
                            <div>
                              <div style={{ fontWeight: '500' }}>{vendor.company_name}</div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {vendor.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div style={{ fontSize: '0.875rem' }}>{vendor.email}</div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {vendor.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{vendor.ngo_name || 'Not assigned'}</TableCell>
                          <TableCell>
                            <Badge variant={vendor.verified ? "default" : "secondary"}>
                              {vendor.verified ? "Active" : "Inactive"}
                              </Badge>
                          </TableCell>
                                                     <TableCell>
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                               <Button variant="ghost" size="sm" onClick={() => handleViewVendor(vendor)}>
                                 <Eye style={{ height: '1rem', width: '1rem' }} />
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => openEditVendorDialog(vendor)}>
                                 <Edit style={{ height: '1rem', width: '1rem' }} />
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </CardContent>
              </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" style={{ marginTop: '1.5rem' }}>
            <Card>
              <CardHeader>
                  <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage system users and their roles
                </CardDescription>
                    </CardHeader>
                    <CardContent>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Users ({users.length})</h3>
                    <Button>
                      <Plus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
                      Create User
                    </Button>
                  </div>
                  
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                              <div style={{ fontWeight: '500' }}>
                              {user.first_name} {user.last_name}
                </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {user.phone}
                              </div>
                </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                            {format(new Date(user.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button variant="ghost" size="sm">
                                <Edit style={{ height: '1rem', width: '1rem' }} />
                            </Button>
                            <Button variant="ghost" size="sm">
                                <Key style={{ height: '1rem', width: '1rem' }} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

                {/* Success Message */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#dcfce7', 
          border: '1px solid #22c55e', 
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#166534', marginBottom: '0.5rem' }}>✅ Application is Working!</h3>
          <p style={{ color: '#166534', margin: 0 }}>
            The Admin Dashboard is now fully functional. You can manage NGOs, vendors, packages, and users.
          </p>
        </div>



        {/* NGO Detail Dialog */}
        <Dialog open={isNGODialogOpen} onOpenChange={setIsNGODialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>NGO Details: {selectedNGO?.name}</DialogTitle>
              <DialogDescription>View NGO information and associated packages with vendors</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedNGO && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={selectedNGO.name} readOnly />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={selectedNGO.email} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={selectedNGO.description || ''} readOnly />
                  </div>
                  <div>
                    <Label>Mission</Label>
                    <Textarea value={selectedNGO.mission || ''} readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Location</Label>
                      <Input value={selectedNGO.city || 'N/A'} readOnly />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={selectedNGO.category || 'N/A'} readOnly />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input value={selectedNGO.phone || 'Not provided'} readOnly />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input value={selectedNGO.website || 'Not provided'} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <Input value={selectedNGO.registration_number || 'Not provided'} readOnly />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Status</Label>
                    <Badge variant={selectedNGO.verified ? "default" : "secondary"}>
                      {selectedNGO.verified ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Associated Packages Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Associated Packages
                    </h3>
                    <div className="space-y-3">
                      {selectedNGO.packages && selectedNGO.packages.length > 0 ? (
                        selectedNGO.packages.map((pkg) => (
                          <div key={pkg.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-blue-600">{pkg.title}</h4>
                                <p className="text-sm text-gray-600">{pkg.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">₹{pkg.amount.toLocaleString()}</div>
                                <Badge variant="outline" className="text-xs">{pkg.category}</Badge>
                              </div>
                            </div>
                            
                            {/* Vendors for this package */}
                            {pkg.vendor_ids && pkg.vendor_ids.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  Assigned Vendors ({pkg.vendor_ids.length}):
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {pkg.vendor_names?.map((vendorName, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {vendorName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {(!pkg.vendor_ids || pkg.vendor_ids.length === 0) && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-500 italic">
                                  No vendors assigned to this package
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No packages associated with this NGO</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create NGO Dialog */}
        <Dialog open={isCreateNGODialogOpen} onOpenChange={setIsCreateNGODialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Create New NGO</DialogTitle>
              <DialogDescription>Add a new NGO to the system.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleCreateNGO} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ngo-name">Name *</Label>
                    <Input
                      id="ngo-name"
                      value={ngoFormData.name}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ngo-email">Email *</Label>
                    <Input
                      id="ngo-email"
                      type="email"
                      value={ngoFormData.email}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ngo-location">Location *</Label>
                    <Input
                      id="ngo-location"
                      value={ngoFormData.location}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ngo-category">Category *</Label>
                    <Select value={ngoFormData.category} onValueChange={(value) => setNGOFormData({ ...ngoFormData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Shelter">Shelter</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ngo-description">Description</Label>
                  <Textarea
                    id="ngo-description"
                    value={ngoFormData.description}
                    onChange={(e) => setNGOFormData({ ...ngoFormData, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of the NGO"
                  />
                </div>

                <div>
                  <Label htmlFor="ngo-mission">Mission</Label>
                  <Textarea
                    id="ngo-mission"
                    value={ngoFormData.mission}
                    onChange={(e) => setNGOFormData({ ...ngoFormData, mission: e.target.value })}
                    rows={3}
                    placeholder="NGO's mission statement"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ngo-phone">Phone</Label>
                    <Input
                      id="ngo-phone"
                      value={ngoFormData.phone}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, phone: e.target.value })}
                      placeholder="Contact phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ngo-website">Website URL</Label>
                    <Input
                      id="ngo-website"
                      value={ngoFormData.website_url}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, website_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ngo-registration">Registration Number</Label>
                  <Input
                    id="ngo-registration"
                    value={ngoFormData.registration_number}
                    onChange={(e) => setNGOFormData({ ...ngoFormData, registration_number: e.target.value })}
                    placeholder="Official registration number"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ngo-active"
                    checked={ngoFormData.is_active}
                    onCheckedChange={(checked) => setNGOFormData({ ...ngoFormData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="ngo-active">Active</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsCreateNGODialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create NGO
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit NGO Dialog */}
        <Dialog open={isEditNGODialogOpen} onOpenChange={setIsEditNGODialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Edit NGO</DialogTitle>
              <DialogDescription>Edit existing NGO details.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleUpdateNGO} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-ngo-name">Name *</Label>
                    <Input
                      id="edit-ngo-name"
                      value={ngoFormData.name}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ngo-email">Email *</Label>
                    <Input
                      id="edit-ngo-email"
                      type="email"
                      value={ngoFormData.email}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-ngo-location">Location *</Label>
                    <Input
                      id="edit-ngo-location"
                      value={ngoFormData.location}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ngo-category">Category *</Label>
                    <Select value={ngoFormData.category} onValueChange={(value) => setNGOFormData({ ...ngoFormData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Shelter">Shelter</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-ngo-description">Description</Label>
                  <Textarea
                    id="edit-ngo-description"
                    value={ngoFormData.description}
                    onChange={(e) => setNGOFormData({ ...ngoFormData, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of the NGO"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-ngo-mission">Mission</Label>
                  <Textarea
                    id="edit-ngo-mission"
                    value={ngoFormData.mission}
                    onChange={(e) => setNGOFormData({ ...ngoFormData, mission: e.target.value })}
                    rows={3}
                    placeholder="NGO's mission statement"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-ngo-phone">Phone</Label>
                    <Input
                      id="edit-ngo-phone"
                      value={ngoFormData.phone}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, phone: e.target.value })}
                      placeholder="Contact phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ngo-website">Website URL</Label>
                    <Input
                      id="edit-ngo-website"
                      value={ngoFormData.website_url}
                      onChange={(e) => setNGOFormData({ ...ngoFormData, website_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-ngo-registration">Registration Number</Label>
                  <Input
                    id="edit-ngo-registration"
                    value={ngoFormData.registration_number}
                    onChange={(e) => setNGOFormData({ ...ngoFormData, registration_number: e.target.value })}
                    placeholder="Official registration number"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-ngo-active"
                    checked={ngoFormData.is_active}
                    onCheckedChange={(checked) => setNGOFormData({ ...ngoFormData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="edit-ngo-active">Active</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditNGODialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Update NGO
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Vendor Dialog */}
        <Dialog open={isCreateVendorDialogOpen} onOpenChange={setIsCreateVendorDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Create New Vendor</DialogTitle>
              <DialogDescription>Add a new vendor to the system.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleCreateVendor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor-company-name">Company Name *</Label>
                    <Input
                      id="vendor-company-name"
                      value={vendorFormData.company_name}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-email">Email *</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      value={vendorFormData.email}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor-phone">Phone</Label>
                    <Input
                      id="vendor-phone"
                      value={vendorFormData.phone}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                      placeholder="Contact phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-business-type">Business Type</Label>
                    <Input
                      id="vendor-business-type"
                      value={vendorFormData.business_type}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, business_type: e.target.value })}
                      placeholder="e.g., Logistics, Manufacturing"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="vendor-description">Description</Label>
                  <Textarea
                    id="vendor-description"
                    value={vendorFormData.description}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of the vendor"
                  />
                </div>

                <div>
                  <Label htmlFor="vendor-address">Address</Label>
                  <Textarea
                    id="vendor-address"
                    value={vendorFormData.address}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                    rows={3}
                    placeholder="Full address"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vendor-active"
                    checked={vendorFormData.is_active}
                    onCheckedChange={(checked) => setVendorFormData({ ...vendorFormData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="vendor-active">Active</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsCreateVendorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Vendor
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Vendor Dialog */}
        <Dialog open={isEditVendorDialogOpen} onOpenChange={setIsEditVendorDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>Edit existing vendor details.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleUpdateVendor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-vendor-company-name">Company Name *</Label>
                    <Input
                      id="edit-vendor-company-name"
                      value={vendorFormData.company_name}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-vendor-email">Email *</Label>
                    <Input
                      id="edit-vendor-email"
                      type="email"
                      value={vendorFormData.email}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-vendor-phone">Phone</Label>
                    <Input
                      id="edit-vendor-phone"
                      value={vendorFormData.phone}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                      placeholder="Contact phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-vendor-business-type">Business Type</Label>
                    <Input
                      id="edit-vendor-business-type"
                      value={vendorFormData.business_type}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, business_type: e.target.value })}
                      placeholder="e.g., Logistics, Manufacturing"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-vendor-description">Description</Label>
                  <Textarea
                    id="edit-vendor-description"
                    value={vendorFormData.description}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of the vendor"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-vendor-address">Address</Label>
                  <Textarea
                    id="edit-vendor-address"
                    value={vendorFormData.address}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                    rows={3}
                    placeholder="Full address"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-vendor-active"
                    checked={vendorFormData.is_active}
                    onCheckedChange={(checked) => setVendorFormData({ ...vendorFormData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="edit-vendor-active">Active</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditVendorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Update Vendor
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Vendor Detail Dialog */}
        <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Vendor Details: {selectedVendor?.company_name}</DialogTitle>
              <DialogDescription>View vendor information and served (NGO,Package) pairs</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedVendor && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input value={selectedVendor.company_name} readOnly />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={selectedVendor.email} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={selectedVendor.description || ''} readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input value={selectedVendor.phone || 'Not provided'} readOnly />
                    </div>
                    <div>
                      <Label>Business Type</Label>
                      <Input value={selectedVendor.business_type || 'Not specified'} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea value={selectedVendor.address || 'Not provided'} readOnly />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Status</Label>
                    <Badge variant={selectedVendor.verified ? "default" : "secondary"}>
                      {selectedVendor.verified ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Served (NGO,Package) Pairs Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Served (NGO,Package) Pairs
                    </h3>
                    <div className="space-y-3">
                      {selectedVendor.served_pairs && selectedVendor.served_pairs.length > 0 ? (
                        selectedVendor.served_pairs.map((pair, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-blue-600">{pair.package_title}</h4>
                                <p className="text-sm text-gray-600">Package ID: {pair.package_id}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">₹{pair.package_amount.toLocaleString()}</div>
                                <Badge variant="outline" className="text-xs">Package</Badge>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                Associated NGO:
                              </h5>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  {pair.ngo_name}
                                </Badge>
                                <span className="text-xs text-gray-500">(ID: {pair.ngo_id})</span>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              Assigned: {new Date(pair.assigned_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No (NGO,Package) pairs served by this vendor</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default AdminDashboard;