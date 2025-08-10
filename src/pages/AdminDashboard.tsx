import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Users, Building, Package, LogOut, Plus, Edit, Eye, Key, Trash } from 'lucide-react';

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
}

interface Vendor {
  id: string;
  company_name: string;
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
}

interface Package {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: string;
  ngo_id?: string;
  vendor_id?: string;
  ngo_name?: string;
  vendor_name?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [ngos, setNGOs] = useState<NGO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  // Dialog states
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetToken, setResetToken] = useState('');

  // NGO states
  const [isCreateNGODialogOpen, setIsCreateNGODialogOpen] = useState(false);
  const [isEditNGODialogOpen, setIsEditNGODialogOpen] = useState(false);
  const [isViewNGODialogOpen, setIsViewNGODialogOpen] = useState(false);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [ngoForm, setNGOForm] = useState({
    name: '',
    email: '',
    description: '',
    mission: '',
    location: '',
    phone: '',
    website_url: '',
    registration_number: '',
    is_active: true,
  });

  // Vendor states
  const [isCreateVendorDialogOpen, setIsCreateVendorDialogOpen] = useState(false);
  const [isEditVendorDialogOpen, setIsEditVendorDialogOpen] = useState(false);
  const [isViewVendorDialogOpen, setIsViewVendorDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    business_type: '',
  });

  // Package states
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);
  const [isEditPackageDialogOpen, setIsEditPackageDialogOpen] = useState(false);
  const [isViewPackageDialogOpen, setIsViewPackageDialogOpen] = useState(false);
  const [selectedPackageRow, setSelectedPackageRow] = useState<Package | null>(null);
  const [packageAssignments, setPackageAssignments] = useState<any[]>([]);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editAssignmentNGOId, setEditAssignmentNGOId] = useState<string>('');
  const [editAssignmentVendorId, setEditAssignmentVendorId] = useState<string>('');
  const [packageForm, setPackageForm] = useState({
    title: '',
        description: '',
    amount: 0,
        category: '',
    ngo_id: '',
  });

  // Helper: vendor select that filters already-assigned vendors for selected NGO+package
  const VendorSelect = ({ ngoId, packageId, value, onChange }: { ngoId: string; packageId: string; value: string; onChange: (v: string) => void }) => {
    const [opts, setOpts] = useState<{ id: string; company_name: string }[]>([]);
    useEffect(() => {
      const load = async () => {
        if (!ngoId || !packageId) { setOpts([]); return; }
        try {
          const r = await apiClient.get(`/api/packages/${packageId}/available-vendors?ngo_id=${encodeURIComponent(ngoId)}`) as any;
          const list = (r.data || r || []) as any[];
          // Deduplicate by id just in case
          const dedup = Array.from(new Map(list.map((v: any) => [v.id, v])).values());
          setOpts(dedup);
        } catch {
          setOpts([]);
        }
      };
      load();
    }, [ngoId, packageId]);
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} required style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
        <option value="" disabled>Select Vendor</option>
        {opts.map((v) => (
          <option key={v.id} value={v.id}>{v.company_name}</option>
        ))}
      </select>
    );
  };

  // Package interlocks: assign NGO/Vendor & copy
  const [isAssignNGODialogOpen, setIsAssignNGODialogOpen] = useState(false);
  const [isAssignVendorDialogOpen, setIsAssignVendorDialogOpen] = useState(false);
  const [selectedPackageForAssign, setSelectedPackageForAssign] = useState<Package | null>(null);
  const [assignNGOId, setAssignNGOId] = useState('');
  const [assignVendorId, setAssignVendorId] = useState('');
  const [assignVendorNGOId, setAssignVendorNGOId] = useState('');

  // NGO view details: packages under NGO
  const [ngoPackages, setNgoPackages] = useState<Package[]>([]);

  // Form states
  const [createUserForm, setCreateUserForm] = useState({
      email: '',
    first_name: '',
    last_name: '',
      phone: '',
    role: 'user'
  });

  const [editUserForm, setEditUserForm] = useState({
      email: '',
    first_name: '',
    last_name: '',
      phone: '',
    role: 'user'
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      window.location.href = '/auth';
        return;
      }
      fetchAllData();
  }, [authLoading, user]);

  const fetchAllData = async () => {
    try {
    await Promise.all([
      fetchUsers(),
      fetchNGOs(),
      fetchVendors(),
      fetchPackages()
    ]);
    setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users') as any;
      setUsers(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchNGOs = async () => {
    try {
      const response = await apiClient.get('/api/ngos') as any;
      setNGOs(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch NGOs:', error);
      toast.error('Failed to fetch NGOs');
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await apiClient.get('/api/vendors') as any;
      setVendors(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to fetch vendors');
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await apiClient.get('/api/packages') as any;
      setPackages(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Failed to fetch packages');
    }
  };

  // NGO handlers
  const openCreateNGO = () => {
    setNGOForm({ name: '', email: '', description: '', mission: '', location: '', phone: '', website_url: '', registration_number: '', is_active: true });
    setIsCreateNGODialogOpen(true);
  };
  const openViewNGO = async (ngo: NGO) => {
    setSelectedNGO(ngo);
    try {
      const resp = await apiClient.get(`/api/ngos/${ngo.id}/packages`) as any;
      setNgoPackages(resp.data || resp || []);
    } catch (e) {
      setNgoPackages([]);
    }
    setIsViewNGODialogOpen(true);
  };
  const openEditNGO = (ngo: NGO) => {
    setSelectedNGO(ngo);
    setNGOForm({
      name: ngo.name || '',
      email: ngo.email || '',
      description: ngo.description || '',
      mission: ngo.mission || '',
      location: [ngo.city, ngo.state].filter(Boolean).join(', '),
      phone: ngo.phone || '',
      website_url: ngo.website || '',
      registration_number: ngo.registration_number || '',
      is_active: !!ngo.verified,
    });
    setIsEditNGODialogOpen(true);
  };
  const handleCreateNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/ngos', ngoForm);
      toast.success('NGO created');
      setIsCreateNGODialogOpen(false);
      fetchNGOs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create NGO');
    }
  };
  const handleUpdateNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNGO) return;
    try {
      await apiClient.put(`/api/ngos/${selectedNGO.id}`, ngoForm);
      toast.success('NGO updated');
      setIsEditNGODialogOpen(false);
      setSelectedNGO(null);
      fetchNGOs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update NGO');
    }
  };
  const handleDeleteNGO = async (ngo: NGO) => {
    if (!confirm(`Delete NGO ${ngo.name}?`)) return;
    try {
      await apiClient.delete(`/api/ngos/${ngo.id}`);
      toast.success('NGO deleted');
      fetchNGOs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete NGO');
    }
  };

  // Vendor handlers
  const openCreateVendor = () => {
    setVendorForm({ company_name: '', email: '', phone: '', address: '', description: '', business_type: '' });
    setIsCreateVendorDialogOpen(true);
  };
  const openViewVendor = (vendor: Vendor) => { setSelectedVendor(vendor); setIsViewVendorDialogOpen(true); };
  const openEditVendor = (vendor: Vendor) => { setSelectedVendor(vendor); setVendorForm({
    company_name: vendor.company_name || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    address: vendor.address || '',
    description: vendor.description || '',
    business_type: vendor.business_type || '',
  }); setIsEditVendorDialogOpen(true); };
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/vendors', vendorForm);
      toast.success('Vendor created');
      setIsCreateVendorDialogOpen(false);
      fetchVendors();
    } catch (err) { console.error(err); toast.error('Failed to create vendor'); }
  };
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    try {
      await apiClient.put(`/api/vendors/${selectedVendor.id}`, vendorForm);
      toast.success('Vendor updated');
      setIsEditVendorDialogOpen(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (err) { console.error(err); toast.error('Failed to update vendor'); }
  };
  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Delete Vendor ${vendor.company_name}?`)) return;
    try {
      await apiClient.delete(`/api/vendors/${vendor.id}`);
      toast.success('Vendor deleted');
      fetchVendors();
    } catch (err) { console.error(err); toast.error('Failed to delete vendor'); }
  };

  // Package handlers
  const openCreatePackage = () => { setPackageForm({ title: '', description: '', amount: 0, category: '', ngo_id: '' }); setIsCreatePackageDialogOpen(true); };
  const openViewPackage = async (pkg: Package) => {
    setSelectedPackageRow(pkg);
    setIsViewPackageDialogOpen(true);
    try {
      const resp = await apiClient.get(`/api/packages/${pkg.id}/assignments`) as any;
      setPackageAssignments(resp.data || resp || []);
    } catch (e) {
      setPackageAssignments([]);
    }
  };
  const openEditPackage = (pkg: Package) => {
    setSelectedPackageRow(pkg);
    setPackageForm({ title: pkg.title || '', description: pkg.description || '', amount: pkg.amount || 0, category: pkg.category || '', ngo_id: pkg.ngo_id || '' });
    setIsEditPackageDialogOpen(true);
  };
  const handleCopyPackage = (pkg: Package) => {
    setPackageForm({
      title: `${pkg.title} (Copy)`,
      description: pkg.description || '',
      amount: pkg.amount || 0,
      category: pkg.category || '',
      ngo_id: pkg.ngo_id || '',
    });
    setIsCreatePackageDialogOpen(true);
  };
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/packages', packageForm);
      toast.success('Package created');
      setIsCreatePackageDialogOpen(false);
      fetchPackages();
    } catch (err) { console.error(err); toast.error('Failed to create package'); }
  };
  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageRow) return;
    try {
      await apiClient.put(`/api/packages/${selectedPackageRow.id}`, packageForm);
      toast.success('Package updated');
      setIsEditPackageDialogOpen(false);
      setSelectedPackageRow(null);
      fetchPackages();
    } catch (err) { console.error(err); toast.error('Failed to update package'); }
  };
  const handleDeletePackage = async (pkg: Package) => {
    if (!confirm(`Delete Package ${pkg.title}?`)) return;
    try {
      await apiClient.delete(`/api/packages/${pkg.id}`);
      toast.success('Package deleted');
      fetchPackages();
    } catch (err) { console.error(err); toast.error('Failed to delete package'); }
  };

  // Assignment edit/delete helpers
  const refreshAssignments = async () => {
    if (!selectedPackageRow) return;
    try {
      const resp = await apiClient.get(`/api/packages/${selectedPackageRow.id}/assignments`) as any;
      setPackageAssignments(resp.data || resp || []);
    } catch (e) { setPackageAssignments([]); }
  };

  const openEditAssignment = async (assignment: any) => {
    setEditingAssignment(assignment);
    setEditAssignmentNGOId(assignment.ngo_id);
    setEditAssignmentVendorId(assignment.vendor_id || '');
    setIsEditAssignmentDialogOpen(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    if (!editAssignmentNGOId || !editAssignmentVendorId) {
      toast.error('Both NGO and Vendor are required');
      return;
    }
    try {
      await apiClient.put(`/api/packages/assignments/${editingAssignment.assignment_id}`, {
        ngo_id: editAssignmentNGOId,
        vendor_id: editAssignmentVendorId,
      });
      toast.success('Assignment updated');
      setIsEditAssignmentDialogOpen(false);
      setEditingAssignment(null);
      await refreshAssignments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (assignment: any) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await apiClient.delete(`/api/packages/assignments/${assignment.assignment_id}`);
      toast.success('Assignment deleted');
      await refreshAssignments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete assignment');
    }
  };

  // Assign NGO & Vendor handlers
  const openAssignNGO = async (pkg: Package) => {
    setSelectedPackageForAssign(pkg);
    setAssignNGOId('');
    try {
      // Only NGOs not yet assigned to this package
      const r = await apiClient.get(`/api/packages/${pkg.id}/available-ngos`) as any;
      if (Array.isArray(r.data)) setNGOs(r.data);
    } catch {}
    setIsAssignNGODialogOpen(true);
  };
  const openAssignVendor = async (pkg: Package) => {
    setSelectedPackageForAssign(pkg);
    setAssignVendorNGOId('');
    setAssignVendorId('');
    try {
      // NGOs available for this package
      const r1 = await apiClient.get(`/api/packages/${pkg.id}/available-ngos`) as any;
      if (Array.isArray(r1.data)) setNGOs(r1.data);
    } catch {}
    setIsAssignVendorDialogOpen(true);
  };
  const handleAssignNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageForAssign || !assignNGOId) return;
    try {
      await apiClient.post(`/api/packages/${selectedPackageForAssign.id}/assign-ngo`, { ngo_id: assignNGOId });
      toast.success('Assigned NGO to package');
      setIsAssignNGODialogOpen(false);
    } catch (err) { console.error(err); toast.error('Failed to assign NGO'); }
  };
  const handleAssignVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageForAssign || !assignVendorNGOId || !assignVendorId) {
      toast.error('NGO and Vendor are required');
      return;
    }
    try {
      // Unified endpoint: NGO required; Vendor optional
      await apiClient.post(`/api/packages/${selectedPackageForAssign.id}/assign`, { ngo_id: assignVendorNGOId, vendor_id: assignVendorId });
      toast.success('Assigned NGO & Vendor');
      setIsAssignVendorDialogOpen(false);
    } catch (err) { console.error(err); toast.error('Failed to assign vendor'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate a temporary password for the new user
      const tempPassword = `Temp@${Math.random().toString(36).slice(2, 8)}1!`;
      // Use the typed register helper to ensure token handling is correct
      await apiClient.register({
        email: createUserForm.email,
        password: tempPassword,
        firstName: createUserForm.first_name,
        lastName: createUserForm.last_name,
        phone: createUserForm.phone,
        role: createUserForm.role,
      } as any);
      toast.success(`User created successfully. Temp password: ${tempPassword}`);
      setIsCreateUserDialogOpen(false);
      setCreateUserForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'user'
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      // Map form keys to backend expectations
      const payload = {
        email: editUserForm.email,
        firstName: editUserForm.first_name,
        lastName: editUserForm.last_name,
        phone: editUserForm.phone,
        role: editUserForm.role,
      };
      await apiClient.put(`/api/users/${selectedUser.id}`, payload);
      toast.success('User updated successfully');
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleResetUserPassword = async (userId: string) => {
    try {
      const response = await apiClient.post(`/api/users/${userId}/reset-password`, {}) as any;
      const token = response?.data?.token || (response as any)?.token;
      setResetToken(token || '');
      setIsResetPasswordDialogOpen(true);
      toast.success('Password reset token generated successfully!');
    } catch (error) {
      console.error('Failed to generate reset token:', error);
      toast.error('Failed to generate reset token');
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await apiClient.post(`/api/users/${selectedUser?.id}/confirm-reset`, {
        token: resetToken,
        newPassword: resetPasswordForm.newPassword
      });
      toast.success('Password reset successfully');
      setIsResetPasswordDialogOpen(false);
      setResetToken('');
      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to reset password');
    }
  };

  const openCreateUserDialog = () => {
    setIsCreateUserDialogOpen(true);
  };

  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || 'user'
    });
    setIsEditUserDialogOpen(true);
  };

  const handleLogout = () => {
    signOut();
    window.location.href = '/login';
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
    return null;
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
        <Tabs defaultValue="users" style={{ width: '100%' }}>
          <TabsList style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', width: '100%' }}>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="ngos">NGO Management</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
            <TabsTrigger value="packages">Package Management</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" style={{ marginTop: '1.5rem' }}>
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardTitle>User Management</CardTitle>
                  <Button onClick={openCreateUserDialog}>
                    <Plus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
                    Create User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Role</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Phone</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem' }}>
                            {user.first_name} {user.last_name}
                          </td>
                          <td style={{ padding: '0.75rem' }}>{user.email}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <Badge variant="outline">{user.role || 'user'}</Badge>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{user.phone || '-'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditUserDialog(user)}
                              >
                                <Edit style={{ height: '0.875rem', width: '0.875rem' }} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetUserPassword(user.id)}
                              >
                                <Key style={{ height: '0.875rem', width: '0.875rem' }} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NGO Management Tab */}
          <TabsContent value="ngos" style={{ marginTop: '1.5rem' }}>
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>NGO Management</CardTitle>
                  <Button onClick={openCreateNGO}>
                      <Plus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
                      Create NGO
                    </Button>
                  </div>
              </CardHeader>
              <CardContent>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ngos.map((ngo) => (
                        <tr key={ngo.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem' }}>{ngo.name}</td>
                          <td style={{ padding: '0.75rem' }}>{ngo.email}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <Badge variant={ngo.verified ? 'default' : 'secondary'}>
                              {ngo.verified ? 'Verified' : 'Pending'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button variant="outline" size="sm" onClick={() => openViewNGO(ngo)}>
                                <Eye style={{ height: '0.875rem', width: '0.875rem' }} />
                               </Button>
                              {/* NGO editable only from NGO Management, but requirement says no edit here after assignment; keeping only view and delete */}
                              <Button variant="outline" size="sm" onClick={() => handleDeleteNGO(ngo)}>
                                <Trash style={{ height: '0.875rem', width: '0.875rem' }} />
                               </Button>
                             </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendor Management Tab */}
          <TabsContent value="vendors" style={{ marginTop: '1.5rem' }}>
              <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Vendor Management</CardTitle>
                  <Button onClick={openCreateVendor}>
                      <Plus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
                      Create Vendor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Company</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map((vendor) => (
                        <tr key={vendor.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem' }}>{vendor.company_name}</td>
                          <td style={{ padding: '0.75rem' }}>{vendor.email}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <Badge variant={vendor.verified ? 'default' : 'secondary'}>
                              {vendor.verified ? 'Verified' : 'Pending'}
                              </Badge>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button variant="outline" size="sm" onClick={() => openViewVendor(vendor)}>
                                <Eye style={{ height: '0.875rem', width: '0.875rem' }} />
                               </Button>
                              <Button variant="outline" size="sm" onClick={() => openEditVendor(vendor)}>
                                <Edit style={{ height: '0.875rem', width: '0.875rem' }} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteVendor(vendor)}>
                                <Trash style={{ height: '0.875rem', width: '0.875rem' }} />
                               </Button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </CardContent>
              </Card>
          </TabsContent>

          {/* Package Management Tab */}
          <TabsContent value="packages" style={{ marginTop: '1.5rem' }}>
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardTitle>Package Management</CardTitle>
                  <Button onClick={openCreatePackage}>
                      <Plus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
                    Create Package
                    </Button>
                  </div>
                    </CardHeader>
                    <CardContent>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Amount</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Category</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '500' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg) => (
                        <tr key={pkg.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem' }}>{pkg.title}</td>
                          <td style={{ padding: '0.75rem' }}>₹{pkg.amount}</td>
                          <td style={{ padding: '0.75rem' }}>{pkg.category}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                              {pkg.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <Button variant="outline" size="sm" onClick={() => openViewPackage(pkg)}>
                                <Eye style={{ height: '0.875rem', width: '0.875rem' }} />
                            </Button>
                              <Button variant="outline" size="sm" onClick={() => openEditPackage(pkg)}>
                                <Edit style={{ height: '0.875rem', width: '0.875rem' }} />
                            </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg)}>
                                <Trash style={{ height: '0.875rem', width: '0.875rem' }} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleCopyPackage(pkg)}>Copy</Button>
                              <Button variant="outline" size="sm" onClick={() => openAssignVendor(pkg)}>Assign NGO & Vendor</Button>
                          </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                <Label htmlFor="email">Email</Label>
                    <Input
                  id="email"
                      type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                      required
                    />
                    </div>
                    <div>
                <Label htmlFor="first_name">First Name</Label>
                    <Input
                  id="first_name"
                  value={createUserForm.first_name}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                <Label htmlFor="last_name">Last Name</Label>
                    <Input
                  id="last_name"
                  value={createUserForm.last_name}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, last_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                <Label htmlFor="phone">Phone</Label>
                    <Input
                  id="phone"
                  value={createUserForm.phone}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                    />
                  </div>
                    <div>
                <Label htmlFor="role">Role</Label>
                <Select value={createUserForm.role} onValueChange={(value) => setCreateUserForm({ ...createUserForm, role: value })}>
                      <SelectTrigger>
                    <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                    Cancel
                  </Button>
                <Button type="submit">Create User</Button>
                    </div>
              </form>
          </DialogContent>
        </Dialog>

        {/* NGO View Dialog */}
        <Dialog open={isViewNGODialogOpen} onOpenChange={setIsViewNGODialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>NGO Details</DialogTitle>
            </DialogHeader>
            {selectedNGO && (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div><strong>Name:</strong> {selectedNGO.name}</div>
                <div><strong>Email:</strong> {selectedNGO.email}</div>
                <div><strong>Verified:</strong> {selectedNGO.verified ? 'Yes' : 'No'}</div>
                <div><strong>City/State:</strong> {[selectedNGO.city, selectedNGO.state].filter(Boolean).join(', ')}</div>
                <div><strong>Mission:</strong> {selectedNGO.mission || '-'}</div>
                <div><strong>Description:</strong> {selectedNGO.description || '-'}</div>
                              <div>
                  <strong>Assigned Packages:</strong>
                  <ul style={{ marginTop: 6 }}>
                    {ngoPackages.map((p) => (
                      <li key={p.id}>- {p.title} (₹{p.amount})</li>
                    ))}
                    {ngoPackages.length === 0 && <div style={{ color: '#6b7280' }}>No packages assigned</div>}
                  </ul>
                                </div>
                              </div>
                            )}
          </DialogContent>
        </Dialog>

        {/* NGO Create/Edit Dialogs */}
        <Dialog open={isCreateNGODialogOpen} onOpenChange={setIsCreateNGODialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create NGO</DialogTitle>
              <DialogDescription>Add a new NGO</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateNGO} style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                <Label>Name</Label>
                <Input value={ngoForm.name} onChange={(e) => setNGOForm({ ...ngoForm, name: e.target.value })} required />
                  </div>
                  <div>
                <Label>Email</Label>
                <Input type="email" value={ngoForm.email} onChange={(e) => setNGOForm({ ...ngoForm, email: e.target.value })} required />
                  </div>
                  <div>
                <Label>Mission</Label>
                <Input value={ngoForm.mission} onChange={(e) => setNGOForm({ ...ngoForm, mission: e.target.value })} />
                  </div>
                  <div>
                <Label>Description</Label>
                <Input value={ngoForm.description} onChange={(e) => setNGOForm({ ...ngoForm, description: e.target.value })} />
                  </div>
                <div>
                <Label>Location (City, State)</Label>
                <Input value={ngoForm.location} onChange={(e) => setNGOForm({ ...ngoForm, location: e.target.value })} />
                </div>
                <div>
                <Label>Phone</Label>
                <Input value={ngoForm.phone} onChange={(e) => setNGOForm({ ...ngoForm, phone: e.target.value })} />
                </div>
                  <div>
                <Label>Website URL</Label>
                <Input value={ngoForm.website_url} onChange={(e) => setNGOForm({ ...ngoForm, website_url: e.target.value })} />
                  </div>
                  <div>
                <Label>Registration Number</Label>
                <Input value={ngoForm.registration_number} onChange={(e) => setNGOForm({ ...ngoForm, registration_number: e.target.value })} />
                  </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsCreateNGODialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
                </div>
              </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditNGODialogOpen} onOpenChange={setIsEditNGODialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit NGO</DialogTitle>
              <DialogDescription>Update NGO details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateNGO} style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                <Label>Name</Label>
                <Input value={ngoForm.name} onChange={(e) => setNGOForm({ ...ngoForm, name: e.target.value })} required />
                  </div>
                  <div>
                <Label>Email</Label>
                <Input type="email" value={ngoForm.email} onChange={(e) => setNGOForm({ ...ngoForm, email: e.target.value })} required />
                  </div>
                  <div>
                <Label>Mission</Label>
                <Input value={ngoForm.mission} onChange={(e) => setNGOForm({ ...ngoForm, mission: e.target.value })} />
                  </div>
                  <div>
                <Label>Description</Label>
                <Input value={ngoForm.description} onChange={(e) => setNGOForm({ ...ngoForm, description: e.target.value })} />
                  </div>
                <div>
                <Label>Location (City, State)</Label>
                <Input value={ngoForm.location} onChange={(e) => setNGOForm({ ...ngoForm, location: e.target.value })} />
                </div>
                <div>
                <Label>Phone</Label>
                <Input value={ngoForm.phone} onChange={(e) => setNGOForm({ ...ngoForm, phone: e.target.value })} />
                </div>
                  <div>
                <Label>Website URL</Label>
                <Input value={ngoForm.website_url} onChange={(e) => setNGOForm({ ...ngoForm, website_url: e.target.value })} />
                  </div>
                  <div>
                <Label>Registration Number</Label>
                <Input value={ngoForm.registration_number} onChange={(e) => setNGOForm({ ...ngoForm, registration_number: e.target.value })} />
                  </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsEditNGODialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
                </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Vendor View Dialog */}
        <Dialog open={isViewVendorDialogOpen} onOpenChange={setIsViewVendorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vendor Details</DialogTitle>
            </DialogHeader>
            {selectedVendor && (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div><strong>Company:</strong> {selectedVendor.company_name}</div>
                <div><strong>Email:</strong> {selectedVendor.email}</div>
                <div><strong>Phone:</strong> {selectedVendor.phone}</div>
                <div><strong>Address:</strong> {selectedVendor.address || '-'}</div>
                <div><strong>Type:</strong> {selectedVendor.business_type || '-'}</div>
                <div><strong>Verified:</strong> {selectedVendor.verified ? 'Yes' : 'No'}</div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Vendor Create/Edit Dialogs */}
        <Dialog open={isCreateVendorDialogOpen} onOpenChange={setIsCreateVendorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Vendor</DialogTitle>
              <DialogDescription>Add a new vendor</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVendor} style={{ display: 'grid', gap: '0.75rem' }}>
              <div><Label>Company Name</Label><Input value={vendorForm.company_name} onChange={(e) => setVendorForm({ ...vendorForm, company_name: e.target.value })} required /></div>
              <div><Label>Email</Label><Input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} required /></div>
              <div><Label>Phone</Label><Input value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={vendorForm.description} onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })} /></div>
              <div><Label>Business Type</Label><Input value={vendorForm.business_type} onChange={(e) => setVendorForm({ ...vendorForm, business_type: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsCreateVendorDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
                </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditVendorDialogOpen} onOpenChange={setIsEditVendorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>Update vendor details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateVendor} style={{ display: 'grid', gap: '0.75rem' }}>
              <div><Label>Company Name</Label><Input value={vendorForm.company_name} onChange={(e) => setVendorForm({ ...vendorForm, company_name: e.target.value })} required /></div>
              <div><Label>Email</Label><Input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} required /></div>
              <div><Label>Phone</Label><Input value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={vendorForm.description} onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })} /></div>
              <div><Label>Business Type</Label><Input value={vendorForm.business_type} onChange={(e) => setVendorForm({ ...vendorForm, business_type: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsEditVendorDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
                </div>
              </form>
          </DialogContent>
        </Dialog>

        {/* Package View Dialog */}
        <Dialog open={isViewPackageDialogOpen} onOpenChange={setIsViewPackageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Package Details</DialogTitle>
            </DialogHeader>
            {selectedPackageRow && (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div><strong>Title:</strong> {selectedPackageRow.title}</div>
                <div><strong>Amount:</strong> ₹{selectedPackageRow.amount}</div>
                <div><strong>Category:</strong> {selectedPackageRow.category}</div>
                <div><strong>Status:</strong> {selectedPackageRow.status}</div>
                <div><strong>Description:</strong> {selectedPackageRow.description || '-'}</div>
                <div style={{ marginTop: '1rem' }}>
                  <strong>Assignments</strong>
                  <div style={{ marginTop: 8, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>NGO</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Vendor</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Delivery Date</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packageAssignments.map((a) => (
                          <tr key={a.assignment_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.5rem' }}>{a.ngo_name || a.ngo_id}</td>
                            <td style={{ padding: '0.5rem' }}>{a.vendor_name || a.vendor_id || '-'}</td>
                            <td style={{ padding: '0.5rem' }}>{a.status || '-'}</td>
                            <td style={{ padding: '0.5rem' }}>{a.delivery_date ? String(a.delivery_date).slice(0, 10) : '-'}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="outline" size="sm" onClick={() => openEditAssignment(a)}>Edit</Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteAssignment(a)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {packageAssignments.length === 0 && (
                          <tr><td colSpan={5} style={{ padding: '0.75rem', color: '#6b7280' }}>No assignments</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={isEditAssignmentDialogOpen} onOpenChange={setIsEditAssignmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
              <DialogDescription>Update NGO and Vendor for this assignment</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAssignment} style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <Label>NGO</Label>
                <select value={editAssignmentNGOId} onChange={(e) => setEditAssignmentNGOId(e.target.value)} required style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
                  {editingAssignment && (
                    <option value={editingAssignment.ngo_id}>{editingAssignment.ngo_name || editingAssignment.ngo_id}</option>
                  )}
                  {ngos
                    .filter((n) => !editingAssignment || n.id !== editingAssignment.ngo_id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Vendor</Label>
                <VendorSelect
                  ngoId={editAssignmentNGOId}
                  packageId={selectedPackageRow?.id || ''}
                  value={editAssignmentVendorId}
                  onChange={setEditAssignmentVendorId}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsEditAssignmentDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Package Create/Edit Dialogs */}
        <Dialog open={isCreatePackageDialogOpen} onOpenChange={setIsCreatePackageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Package</DialogTitle>
              <DialogDescription>Add a new package</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePackage} style={{ display: 'grid', gap: '0.75rem' }}>
              <div><Label>Title</Label><Input value={packageForm.title} onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Input value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} /></div>
              <div><Label>Amount</Label><Input type="number" min={0} value={packageForm.amount} onChange={(e) => setPackageForm({ ...packageForm, amount: Number(e.target.value) })} required /></div>
              <div><Label>Category</Label><Input value={packageForm.category} onChange={(e) => setPackageForm({ ...packageForm, category: e.target.value })} /></div>
                  <div>
                <Label>NGO</Label>
                <select value={packageForm.ngo_id} onChange={(e) => setPackageForm({ ...packageForm, ngo_id: e.target.value })} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }} required>
                  <option value="" disabled>Select NGO</option>
                  {ngos.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                  </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsCreatePackageDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
                  </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Unified Assign NGO & Vendor Dialog */}
        <Dialog open={isAssignVendorDialogOpen} onOpenChange={setIsAssignVendorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign NGO & Vendor</DialogTitle>
              <DialogDescription>Both NGO and Vendor are required.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignVendor} style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                <Label>NGO</Label>
                <select value={assignVendorNGOId} onChange={(e) => setAssignVendorNGOId(e.target.value)} required style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
                  <option value="" disabled>Select NGO</option>
                  {ngos.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                  </div>
                  <div>
                <Label>Vendor</Label>
                <VendorSelect
                  ngoId={assignVendorNGOId}
                  packageId={selectedPackageForAssign?.id || ''}
                  value={assignVendorId}
                  onChange={setAssignVendorId}
                    />
                  </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsAssignVendorDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Assign</Button>
                </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditPackageDialogOpen} onOpenChange={setIsEditPackageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Package</DialogTitle>
              <DialogDescription>Update package details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdatePackage} style={{ display: 'grid', gap: '0.75rem' }}>
              <div><Label>Title</Label><Input value={packageForm.title} onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Input value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} /></div>
              <div><Label>Amount</Label><Input type="number" min={0} value={packageForm.amount} onChange={(e) => setPackageForm({ ...packageForm, amount: Number(e.target.value) })} required /></div>
              <div><Label>Category</Label><Input value={packageForm.category} onChange={(e) => setPackageForm({ ...packageForm, category: e.target.value })} /></div>
                <div>
                <Label>NGO</Label>
                <select value={packageForm.ngo_id} onChange={(e) => setPackageForm({ ...packageForm, ngo_id: e.target.value })} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }} required>
                  <option value="" disabled>Select NGO</option>
                  {ngos.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsEditPackageDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
                </div>
              </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                <Label htmlFor="edit_email">Email</Label>
                    <Input
                  id="edit_email"
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                <Label htmlFor="edit_first_name">First Name</Label>
                    <Input
                  id="edit_first_name"
                  value={editUserForm.first_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                <Label htmlFor="edit_last_name">Last Name</Label>
                    <Input
                  id="edit_last_name"
                  value={editUserForm.last_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })}
                  required
                    />
                  </div>
                  <div>
                <Label htmlFor="edit_phone">Phone</Label>
                    <Input
                  id="edit_phone"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                    />
                  </div>
                <div>
                <Label htmlFor="edit_role">Role</Label>
                <Select value={editUserForm.role} onValueChange={(value) => setEditUserForm({ ...editUserForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                    Cancel
                  </Button>
                <Button type="submit">Update User</Button>
                </div>
              </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>Enter new password for the user</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConfirmPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                <Label htmlFor="new_password">New Password</Label>
                    <Input
                  id="new_password"
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                      required
                    />
                    </div>
                    <div>
                <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                  id="confirm_password"
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                      required
                    />
                    </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                <Button type="submit">Reset Password</Button>
                  </div>
              </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
