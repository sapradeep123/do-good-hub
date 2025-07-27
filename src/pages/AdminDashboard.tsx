import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Building, Package, ShoppingCart, Plus, Edit, Eye, Trash2, Key } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

// Security: Input validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Password must contain uppercase, lowercase, number, and special character");
const phoneSchema = z.string().optional();
const urlSchema = z.string().url("Please enter a valid URL").optional().or(z.literal(""));
const requiredStringSchema = z.string().min(1, "This field is required");
const optionalStringSchema = z.string().optional();
const amountSchema = z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number");

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
  const [isEditNGOOpen, setIsEditNGOOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingNGO, setEditingNGO] = useState<NGO | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      checkAdminRole();
    }
  }, [user, loading, navigate]);

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking admin role:", error);
        toast.error("Access denied: Admin role required");
        navigate("/dashboard");
        return;
      }

      if (!data) {
        toast.error("Access denied: Admin role required");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await fetchAllData();
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
      fetchPackages()
    ]);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name, phone, created_at");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        created_at: profile.created_at || '',
        role: roles?.find(r => r.user_id === profile.user_id)?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const fetchNGOs = async () => {
    try {
      const { data, error } = await supabase
        .from("ngos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNGOs(data || []);
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast.error("Failed to fetch NGOs");
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select(`
          *,
          ngos!inner(name),
          vendors(company_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const packagesWithNames = data?.map(pkg => ({
        ...pkg,
        ngo_name: pkg.ngos?.name,
        vendor_name: pkg.vendors?.company_name
      })) || [];

      setPackages(packagesWithNames);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to fetch packages");
    }
  };

  // Security: Use secure role update function with audit logging
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Input validation
      const roleSchema = z.enum(['admin', 'ngo', 'vendor', 'user']);
      const uuidSchema = z.string().uuid();
      
      const roleValidation = roleSchema.safeParse(newRole);
      const userIdValidation = uuidSchema.safeParse(userId);
      
      if (!roleValidation.success) {
        toast.error("Invalid role selected");
        return;
      }
      
      if (!userIdValidation.success) {
        toast.error("Invalid user ID");
        return;
      }

      // Security: Use secure function that prevents privilege escalation
      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole as any // Type assertion needed for RPC call
      });

      if (error) {
        if (error.message.includes('cannot remove their own admin privileges')) {
          toast.error("You cannot remove your own admin privileges");
        } else if (error.message.includes('Only admins can modify user roles')) {
          toast.error("Access denied: Only admins can modify user roles");
        } else {
          throw error;
        }
        return;
      }

      toast.success("User role updated successfully (audit logged)");
      await fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  // Admin password reset function
  const adminPasswordReset = async (email: string) => {
    try {
      // Get the user from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        toast.error("User not found");
        return;
      }

      // Generate cryptographically secure token
      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
      
      // Store the reset request
      const { error } = await supabase
        .from("password_reset_requests")
        .insert({
          email: email.trim().toLowerCase(),
          token,
          expires_at: new Date(Date.now() + 900000).toISOString(), // 15 minutes
          used: false
        });

      if (error) {
        toast.error("Failed to generate reset token");
        return;
      }

      // Show token to admin (development mode)
      toast.success(`Password reset token generated for ${email}`, {
        description: `Token: ${token}`,
        duration: 10000
      });
      
      console.log(`Password reset token for ${email}:`, token);
    } catch (error) {
      console.error("Error generating password reset token:", error);
      toast.error("Failed to generate password reset token");
    }
  };

  // Create sample data function
  const createSampleData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-sample-data');

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success("Sample data created successfully!", {
          description: `Created ${data.created_users?.length || 0} sample users with associated NGOs and vendors`
        });
        
        // Refresh all data
        await Promise.all([
          fetchUsers(),
          fetchNGOs(), 
          fetchVendors(),
          fetchPackages()
        ]);
      } else {
        throw new Error("Failed to create sample data");
      }
    } catch (error) {
      console.error("Error creating sample data:", error);
      toast.error("Failed to create sample data");
    }
  };

  const editNGO = (ngo: NGO) => {
    setEditingNGO(ngo);
    setIsEditNGOOpen(true);
  };

  const editVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsEditVendorOpen(true);
  };

  const deleteNGO = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete NGO "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("ngos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("NGO deleted successfully");
      await fetchNGOs();
    } catch (error) {
      console.error("Error deleting NGO:", error);
      toast.error("Failed to delete NGO");
    }
  };

  const deleteVendor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Vendor deleted successfully");
      await fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor");
    }
  };

  const toggleNGOVerification = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("ngos")
        .update({ is_verified: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`NGO ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      await fetchNGOs();
    } catch (error) {
      console.error("Error updating NGO verification:", error);
      toast.error("Failed to update NGO verification");
    }
  };

  const toggleNGOStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("ngos")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`NGO ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchNGOs();
    } catch (error) {
      console.error("Error updating NGO status:", error);
      toast.error("Failed to update NGO status");
    }
  };

  const toggleVendorStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Vendor ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchVendors();
    } catch (error) {
      console.error("Error updating vendor status:", error);
      toast.error("Failed to update vendor status");
    }
  };

  const editPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsEditPackageOpen(true);
  };

  const editUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const generatePasswordResetToken = async (email: string, userType: 'NGO' | 'Vendor') => {
    try {
      // Generate a simple token for development
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Store the reset request
      const { error } = await supabase
        .from("password_reset_requests")
        .insert({
          email,
          token,
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          used: false
        });

      if (error) throw error;

      toast.success(`Password reset token generated for ${userType}. Token: ${token}`);
      console.log(`Password reset token for ${email}:`, token);
    } catch (error) {
      console.error("Error generating reset token:", error);
      toast.error("Failed to generate reset token");
    }
  };

  const deletePackage = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete package "${title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Package deleted successfully");
      await fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    }
  };

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user "${email}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // Delete user roles first
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", id);

      // Delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", id);

      if (error) throw error;

      toast.success("User deleted successfully");
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const togglePackageStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("packages")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Package ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchPackages();
    } catch (error) {
      console.error("Error updating package status:", error);
      toast.error("Failed to update package status");
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
            Manage users, NGOs, vendors, and packages
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
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.filter(v => v.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ngos">NGOs</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </div>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={createSampleData}
                      className="bg-blue-50 hover:bg-blue-100"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Create Sample Data
                    </Button>
                  </div>
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
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name || user.last_name 
                            ? `${user.first_name} ${user.last_name}`.trim()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="ngo">NGO</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => adminPasswordReset(user.email)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Generate password reset token"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUser(user.id, user.email)}
                              className="text-destructive hover:text-destructive"
                            >
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
                    onSuccess={() => {
                      setIsEditUserOpen(false);
                      setEditingUser(null);
                      fetchUsers();
                    }}
                    onCancel={() => {
                      setIsEditUserOpen(false);
                      setEditingUser(null);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="ngos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>NGO Management</CardTitle>
                  <CardDescription>Manage NGOs and their verification status</CardDescription>
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
                    <CreateNGOForm 
                      onSuccess={() => {
                        setIsCreateNGOOpen(false);
                        fetchNGOs();
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
                        <TableCell className="font-medium">{ngo.name}</TableCell>
                        <TableCell>{ngo.email}</TableCell>
                        <TableCell>{ngo.location}</TableCell>
                        <TableCell>{ngo.category}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleNGOStatus(ngo.id, ngo.is_active)}
                          >
                            <Badge variant={ngo.is_active ? 'default' : 'destructive'}>
                              {ngo.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleNGOVerification(ngo.id, ngo.is_verified)}
                          >
                            <Badge variant={ngo.is_verified ? 'default' : 'secondary'}>
                              {ngo.is_verified ? 'Verified' : 'Pending'}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell>{format(new Date(ngo.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editNGO(ngo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNGO(ngo.id, ngo.name)}
                              className="text-destructive hover:text-destructive"
                            >
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

            <Dialog open={isEditNGOOpen} onOpenChange={setIsEditNGOOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">{/*Fixed: Added scrolling*/}
                <DialogHeader>
                  <DialogTitle>Edit NGO</DialogTitle>
                  <DialogDescription>Update NGO information</DialogDescription>
                </DialogHeader>
                {editingNGO && (
                  <EditNGOForm 
                    ngo={editingNGO}
                    onSuccess={() => {
                      setIsEditNGOOpen(false);
                      setEditingNGO(null);
                      fetchNGOs();
                    }}
                    onCancel={() => {
                      setIsEditNGOOpen(false);
                      setEditingNGO(null);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vendor Management</CardTitle>
                  <CardDescription>Manage vendors and their services</CardDescription>
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
                    <CreateVendorForm 
                      onSuccess={() => {
                        setIsCreateVendorOpen(false);
                        fetchVendors();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
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
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.phone}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleVendorStatus(vendor.id, vendor.is_active)}
                          >
                            <Badge variant={vendor.is_active ? 'default' : 'destructive'}>
                              {vendor.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell>{format(new Date(vendor.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editVendor(vendor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteVendor(vendor.id, vendor.company_name)}
                              className="text-destructive hover:text-destructive"
                            >
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

            {/* Edit Vendor Dialog */}
            <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">{/*Fixed: Added scrolling*/}
                <DialogHeader>
                  <DialogTitle>Edit Vendor</DialogTitle>
                  <DialogDescription>Update vendor information</DialogDescription>
                </DialogHeader>
                {editingVendor && (
                  <EditVendorForm 
                    vendor={editingVendor}
                    onSuccess={() => {
                      setIsEditVendorOpen(false);
                      setEditingVendor(null);
                      fetchVendors();
                    }}
                    onCancel={() => {
                      setIsEditVendorOpen(false);
                      setEditingVendor(null);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Package Management</CardTitle>
                  <CardDescription>Manage donation packages</CardDescription>
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
                      <DialogDescription>Add a new donation package</DialogDescription>
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
                        <TableCell className="font-medium">{pkg.title}</TableCell>
                        <TableCell>{pkg.ngo_name}</TableCell>
                        <TableCell>{pkg.vendor_name || 'N/A'}</TableCell>
                        <TableCell>₹{Number(pkg.amount).toLocaleString()}</TableCell>
                        <TableCell>{pkg.category}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePackageStatus(pkg.id, pkg.is_active)}
                          >
                            <Badge variant={pkg.is_active ? 'default' : 'destructive'}>
                              {pkg.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell>{format(new Date(pkg.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editPackage(pkg)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePackage(pkg.id, pkg.title)}
                              className="text-destructive hover:text-destructive"
                            >
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
                    onSuccess={() => {
                      setIsEditPackageOpen(false);
                      setEditingPackage(null);
                      fetchPackages();
                    }}
                    onCancel={() => {
                      setIsEditPackageOpen(false);
                      setEditingPackage(null);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Create NGO Form Component
const CreateNGOForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    mission: '',
    location: '',
    category: '',
    phone: '',
    website_url: '',
    registration_number: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("ngos")
        .insert([formData]);

      if (error) throw error;

      toast.success("NGO created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating NGO:", error);
      toast.error("Failed to create NGO");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({...formData, category: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Environment">Environment</SelectItem>
              <SelectItem value="Nutrition">Nutrition</SelectItem>
              <SelectItem value="Women Empowerment">Women Empowerment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="registration_number">Registration Number</Label>
          <Input
            id="registration_number"
            value={formData.registration_number}
            onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">Create NGO</Button>
    </form>
  );
};

// Create Vendor Form Component
const CreateVendorForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("vendors")
        .insert([formData]);

      if (error) throw error;

      toast.success("Vendor created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast.error("Failed to create vendor");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
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
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <Button type="submit" className="w-full">Create Vendor</Button>
    </form>
  );
};

// Create Package Form Component
const CreatePackageForm = ({ 
  ngos, 
  vendors, 
  onSuccess 
}: { 
  ngos: NGO[]; 
  vendors: Vendor[]; 
  onSuccess: () => void; 
}) => {
  const [formData, setFormData] = useState({
    ngo_id: '',
    vendor_id: '',
    title: '',
    description: '',
    amount: '',
    category: '',
    delivery_timeline: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("packages")
        .insert([{
          ...formData,
          amount: parseFloat(formData.amount),
          vendor_id: formData.vendor_id || null
        }]);

      if (error) throw error;

      toast.success("Package created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating package:", error);
      toast.error("Failed to create package");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ngo_id">NGO *</Label>
          <Select 
            value={formData.ngo_id} 
            onValueChange={(value) => setFormData({...formData, ngo_id: value})}
          >
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
          <Label htmlFor="vendor_id">Vendor (Optional)</Label>
          <Select 
            value={formData.vendor_id} 
            onValueChange={(value) => setFormData({...formData, vendor_id: value})}
          >
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({...formData, category: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Food">Food</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Shelter">Shelter</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="delivery_timeline">Delivery Timeline</Label>
        <Input
          id="delivery_timeline"
          value={formData.delivery_timeline}
          onChange={(e) => setFormData({...formData, delivery_timeline: e.target.value})}
          placeholder="e.g., 7-10 days"
        />
      </div>

      <Button type="submit" className="w-full">Create Package</Button>
    </form>
  );
};

// Edit NGO Form Component
const EditNGOForm = ({ ngo, onSuccess, onCancel }: { 
  ngo: NGO; 
  onSuccess: () => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    name: ngo.name || '',
    email: ngo.email || '',
    description: ngo.description || '',
    mission: ngo.mission || '',
    location: ngo.location || '',
    category: ngo.category || '',
    phone: ngo.phone || '',
    website_url: ngo.website_url || '',
    registration_number: ngo.registration_number || ''
  });

  const [associatedUser, setAssociatedUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(ngo.user_id || '');

  useEffect(() => {
    fetchAssociatedUser();
    fetchAvailableNGOUsers();
  }, []);

  const fetchAssociatedUser = async () => {
    if (!ngo.user_id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name, phone")
        .eq("user_id", ngo.user_id)
        .single();

      if (error || !profile) return;

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", ngo.user_id)
        .single();

      setAssociatedUser({
        id: profile.user_id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        created_at: '',
        role: role?.role || 'ngo'
      });
    } catch (error) {
      console.error("Error fetching associated user:", error);
    }
  };

  const fetchAvailableNGOUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name");

      if (error) throw error;

      const { data: ngoRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "ngo");

      if (rolesError) throw rolesError;

      // Get all NGOs to find which users are already assigned
      const { data: allNGOs, error: ngosError } = await supabase
        .from("ngos")
        .select("user_id");

      if (ngosError) throw ngosError;

      const assignedUserIds = allNGOs?.map(ngo => ngo.user_id).filter(Boolean) || [];
      const ngoUserIds = ngoRoles?.map(role => role.user_id) || [];
      
      // Only show unassigned NGO users (excluding current NGO's user)
      const users = profiles?.filter(profile => 
        ngoUserIds.includes(profile.user_id) && 
        (!assignedUserIds.includes(profile.user_id) || profile.user_id === ngo.user_id)
      ).map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: '',
        created_at: '',
        role: 'ngo'
      })) || [];

      setAvailableUsers(users);
    } catch (error) {
      console.error("Error fetching NGO users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("ngos")
        .update({
          ...formData,
        user_id: selectedUserId === "none" ? null : selectedUserId || null
        })
        .eq("id", ngo.id);

      if (error) throw error;

      toast.success("NGO updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating NGO:", error);
      toast.error("Failed to update NGO");
    }
  };

  const handlePasswordReset = () => {
    const email = associatedUser?.email || formData.email;
    if (email) {
      // Generate a simple token for development
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      toast.success(`Password reset token generated for NGO. Token: ${token}`);
      console.log(`Password reset token for ${email}:`, token);
    }
  };

  return (
    <div className="space-y-6 max-h-full">
      <form onSubmit={handleSubmit} className="space-y-4">{/*Fixed: Added proper container*/}
      {/* Associated User Info */}
      {associatedUser && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950">
          <h4 className="font-semibold mb-2 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Associated User Account
          </h4>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {associatedUser.first_name} {associatedUser.last_name}</p>
            <p><strong>Email:</strong> {associatedUser.email}</p>
            <p><strong>Role:</strong> {associatedUser.role}</p>
            {associatedUser.phone && <p><strong>Phone:</strong> {associatedUser.phone}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              className="mt-2"
            >
              <Key className="h-4 w-4 mr-2" />
              Generate Password Reset Token
            </Button>
          </div>
        </Card>
      )}

      {/* User Assignment */}
      <div>
        <Label htmlFor="user_assignment">Assign NGO User Account</Label>
        <Select 
          value={selectedUserId || "none"} 
          onValueChange={(value) => setSelectedUserId(value === "none" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select user account" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60 overflow-auto">
            <SelectItem value="none">No user assigned</SelectItem>
            {availableUsers.length === 0 ? (
              <SelectItem value="no-users" disabled>No NGO users available</SelectItem>
            ) : (
              availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="mission">Mission</Label>
        <Textarea
          id="mission"
          value={formData.mission}
          onChange={(e) => setFormData({...formData, mission: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({...formData, category: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Environment">Environment</SelectItem>
              <SelectItem value="Nutrition">Nutrition</SelectItem>
              <SelectItem value="Women Empowerment">Women Empowerment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="registration_number">Registration Number</Label>
          <Input
            id="registration_number"
            value={formData.registration_number}
            onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="website_url">Website URL</Label>
        <Input
          id="website_url"
          value={formData.website_url}
          onChange={(e) => setFormData({...formData, website_url: e.target.value})}
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">Update NGO</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      </form>
    </div>
  );
};

// Edit Vendor Form Component
const EditVendorForm = ({ vendor, onSuccess, onCancel }: { 
  vendor: Vendor; 
  onSuccess: () => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    company_name: vendor.company_name || '',
    contact_person: vendor.contact_person || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    address: vendor.address || '',
    description: vendor.description || ''
  });

  const [associatedUser, setAssociatedUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(vendor.user_id || '');

  useEffect(() => {
    fetchAssociatedUser();
    fetchAvailableVendorUsers();
  }, []);

  const fetchAssociatedUser = async () => {
    if (!vendor.user_id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name, phone")
        .eq("user_id", vendor.user_id)
        .single();

      if (error || !profile) return;

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", vendor.user_id)
        .single();

      setAssociatedUser({
        id: profile.user_id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        created_at: '',
        role: role?.role || 'vendor'
      });
    } catch (error) {
      console.error("Error fetching associated user:", error);
    }
  };

  const fetchAvailableVendorUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name");

      if (error) throw error;

      const { data: vendorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "vendor");

      if (rolesError) throw rolesError;

      // Get all vendors to find which users are already assigned
      const { data: allVendors, error: vendorsError } = await supabase
        .from("vendors")
        .select("user_id");

      if (vendorsError) throw vendorsError;

      const assignedUserIds = allVendors?.map(vendor => vendor.user_id).filter(Boolean) || [];
      const vendorUserIds = vendorRoles?.map(role => role.user_id) || [];
      
      // Only show unassigned vendor users (excluding current vendor's user)
      const users = profiles?.filter(profile => 
        vendorUserIds.includes(profile.user_id) && 
        (!assignedUserIds.includes(profile.user_id) || profile.user_id === vendor.user_id)
      ).map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: '',
        created_at: '',
        role: 'vendor'
      })) || [];

      setAvailableUsers(users);
    } catch (error) {
      console.error("Error fetching vendor users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("vendors")
        .update({
          ...formData,
          user_id: selectedUserId === "none" ? null : selectedUserId || null
        })
        .eq("id", vendor.id);

      if (error) throw error;

      toast.success("Vendor updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error("Failed to update vendor");
    }
  };

  const handlePasswordReset = () => {
    const email = associatedUser?.email || formData.email;
    if (email) {
      // Generate a simple token for development
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      toast.success(`Password reset token generated for Vendor. Token: ${token}`);
      console.log(`Password reset token for ${email}:`, token);
    }
  };

  return (
    <div className="space-y-6 max-h-full">
      <form onSubmit={handleSubmit} className="space-y-4">{/*Fixed: Added proper container*/}
      {/* Associated User Info */}
      {associatedUser && (
        <Card className="p-4 bg-green-50 dark:bg-green-950">
          <h4 className="font-semibold mb-2 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Associated User Account
          </h4>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {associatedUser.first_name} {associatedUser.last_name}</p>
            <p><strong>Email:</strong> {associatedUser.email}</p>
            <p><strong>Role:</strong> {associatedUser.role}</p>
            {associatedUser.phone && <p><strong>Phone:</strong> {associatedUser.phone}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              className="mt-2"
            >
              <Key className="h-4 w-4 mr-2" />
              Generate Password Reset Token
            </Button>
          </div>
        </Card>
      )}

      {/* User Assignment */}
      <div>
        <Label htmlFor="user_assignment">Assign Vendor User Account</Label>
        <Select 
          value={selectedUserId || "none"} 
          onValueChange={(value) => setSelectedUserId(value === "none" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select user account" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60 overflow-auto">
            <SelectItem value="none">No user assigned</SelectItem>
            {availableUsers.length === 0 ? (
              <SelectItem value="no-users" disabled>No vendor users available</SelectItem>
            ) : (
              availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
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
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">Update Vendor</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      </form>
    </div>
  );
};

// Create User Form Component
const CreateUserForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name
        }
      });

      if (authError) throw authError;

      // Update profile with phone
      if (authData.user) {
        await supabase
          .from("profiles")
          .update({ phone: formData.phone })
          .eq("user_id", authData.user.id);

        // Set user role
        await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: formData.role as 'admin' | 'ngo' | 'vendor' | 'user'
          });
      }

      toast.success("User created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => setFormData({...formData, role: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ngo">NGO</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">Create User</Button>
    </form>
  );
};

// Edit User Form Component
const EditUserForm = ({ user, onSuccess, onCancel }: { 
  user: User; 
  onSuccess: () => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
    role: user.role || 'user'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: formData.role as 'admin' | 'ngo' | 'vendor' | 'user'
        });

      if (roleError) throw roleError;

      toast.success("User updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => setFormData({...formData, role: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ngo">NGO</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">Update User</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

// Edit Package Form Component
const EditPackageForm = ({ 
  package: pkg,
  ngos, 
  vendors, 
  onSuccess,
  onCancel
}: { 
  package: Package;
  ngos: NGO[]; 
  vendors: Vendor[]; 
  onSuccess: () => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    ngo_id: pkg.ngo_id || '',
    vendor_id: pkg.vendor_id || '',
    title: pkg.title || '',
    description: pkg.description || '',
    amount: pkg.amount.toString(),
    category: pkg.category || '',
    delivery_timeline: pkg.delivery_timeline || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("packages")
        .update({
          ...formData,
          amount: parseFloat(formData.amount),
          vendor_id: formData.vendor_id === "none" ? null : formData.vendor_id || null
        })
        .eq("id", pkg.id);

      if (error) throw error;

      toast.success("Package updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating package:", error);
      toast.error("Failed to update package");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ngo_id">NGO *</Label>
          <Select 
            value={formData.ngo_id} 
            onValueChange={(value) => setFormData({...formData, ngo_id: value})}
          >
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
          <Label htmlFor="vendor_id">Vendor (Optional)</Label>
          <Select 
            value={formData.vendor_id || "none"} 
            onValueChange={(value) => setFormData({...formData, vendor_id: value === "none" ? "" : value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No vendor assigned</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({...formData, category: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Food">Food</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Shelter">Shelter</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="delivery_timeline">Delivery Timeline</Label>
        <Input
          id="delivery_timeline"
          value={formData.delivery_timeline}
          onChange={(e) => setFormData({...formData, delivery_timeline: e.target.value})}
          placeholder="e.g., 7-10 days"
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">Update Package</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

export default AdminDashboard;