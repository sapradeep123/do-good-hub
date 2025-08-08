import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Package, 
  Building, 
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Link,
  Unlink
} from "lucide-react";
import { format } from "date-fns";

interface NGO {
  id: string;
  name: string;
  email: string;
  description?: string;
  location: string;
  category: string;
  is_active: boolean;
}

interface Vendor {
  id: string;
  company_name: string;
  contact_person?: string;
  email: string;
  phone: string;
  description?: string;
  is_active: boolean;
}

interface Package {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: string; // Backend field
  created_at: string;
  // New fields for dynamic relationships
  assigned_ngos?: string[];
  assigned_vendors?: string[];
  ngo_names?: string[];
  vendor_names?: string[];
  assignments?: PackageAssignment[];
  ngo_id?: string; // Added ngo_id to the Package interface
}

interface PackageAssignment {
  id: string;
  assignment_id: string;
  ngo_id: string;
  vendor_id?: string;
  ngo_name: string;
  vendor_name?: string;
  vendor_package_vendors?: string[];
}

interface EnhancedPackageManagementProps {
  packages: Package[];
  ngos: NGO[];
  vendors: Vendor[];
  onPackageCreate: (packageData: any) => Promise<void>;
  onPackageUpdate: (packageId: string, packageData: any) => Promise<void>;
  onPackageDuplicate: (packageId: string, modifications: any) => Promise<void>;
  onPackageAssign: (packageId: string, assignments: { ngo_ids: string[], vendor_ids: string[] }) => Promise<void>;
}

const EnhancedPackageManagement = ({
  packages,
  ngos,
  vendors,
  onPackageCreate,
  onPackageUpdate,
  onPackageDuplicate,
  onPackageAssign
}: EnhancedPackageManagementProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [duplicatingPackage, setDuplicatingPackage] = useState<Package | null>(null);
  const [assigningPackage, setAssigningPackage] = useState<Package | null>(null);
  const [viewingPackage, setViewingPackage] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New state for assignment management
  const [selectedNGOs, setSelectedNGOs] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<{[key: string]: string[]}>({});
  const [includeVendors, setIncludeVendors] = useState(false);

  const handleCreatePackage = async (packageData: any) => {
    try {
      setIsLoading(true);
      await onPackageCreate(packageData);
      setIsCreateDialogOpen(false);
      toast.success('Package created successfully!');
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Failed to create package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePackage = async (packageData: any) => {
    try {
      setIsLoading(true);
      if (editingPackage) {
        await onPackageUpdate(editingPackage.id, packageData);
        setIsEditDialogOpen(false);
        setEditingPackage(null);
        toast.success('Package updated successfully!');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Failed to update package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicatePackage = async (packageData: any) => {
    try {
      setIsLoading(true);
      if (duplicatingPackage) {
        await onPackageDuplicate(duplicatingPackage.id, { ...packageData, includeVendors });
        setIsDuplicateDialogOpen(false);
        setDuplicatingPackage(null);
        setIncludeVendors(false);
        toast.success('Package duplicated successfully!');
      }
    } catch (error) {
      console.error('Error duplicating package:', error);
      toast.error('Failed to duplicate package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPackage = async (assignments: { ngo_ids: string[], vendor_ids: string[] }) => {
    try {
      setIsLoading(true);
      if (assigningPackage) {
        // Assign NGOs first
        for (const ngoId of assignments.ngo_ids) {
          try {
            await assignNGO(assigningPackage.id, ngoId);
          } catch (error) {
            console.error(`Failed to assign NGO ${ngoId}:`, error);
          }
        }
        
        // Then assign vendors to their respective NGOs
        // Note: This is a simplified implementation
        // In a full implementation, you'd need to track which vendor belongs to which NGO
        for (const vendorId of assignments.vendor_ids) {
          try {
            // For now, assign vendor to the first NGO
            // In a more complex implementation, you'd need to specify which NGO each vendor belongs to
            if (assignments.ngo_ids.length > 0) {
              await assignVendor(assigningPackage.id, assignments.ngo_ids[0], vendorId);
            }
          } catch (error) {
            console.error(`Failed to assign vendor ${vendorId}:`, error);
          }
        }
        
        setIsAssignDialogOpen(false);
        setAssigningPackage(null);
        setSelectedNGOs([]);
        setSelectedVendors({});
        toast.success('Package assignments updated successfully!');
      }
    } catch (error) {
      console.error('Error assigning package:', error);
      toast.error('Failed to assign package');
    } finally {
      setIsLoading(false);
    }
  };

  const openDuplicateDialog = (pkg: Package) => {
    setDuplicatingPackage(pkg);
    setIsDuplicateDialogOpen(true);
  };

  const openAssignDialog = (pkg: Package) => {
    setAssigningPackage(pkg);
    // Pre-populate with existing assignments
    setSelectedNGOs(pkg.assigned_ngos || []);
    setSelectedVendors({});
    setIsAssignDialogOpen(true);
  };

  const openDetailDialog = (pkg: Package) => {
    setViewingPackage(pkg);
    setIsDetailDialogOpen(true);
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsEditDialogOpen(true);
  };

  // New assignment management functions
  const assignNGO = async (packageId: string, ngoId: string) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/assign-ngo`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify({ ngoId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast.error('NGO already assigned to this package');
        } else {
          throw new Error(error.error || 'Failed to assign NGO');
        }
        return;
      }
      
      toast.success('NGO assigned successfully!');
      // Refresh packages
      window.location.reload();
    } catch (error) {
      console.error('Error assigning NGO:', error);
      toast.error('Failed to assign NGO');
    }
  };

  const unassignNGO = async (packageId: string, ngoId: string) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/unassign-ngo/${ngoId}`, {
        method: 'DELETE',
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to unassign NGO');
      }
      
      toast.success('NGO unassigned successfully!');
      // Refresh packages
      window.location.reload();
    } catch (error) {
      console.error('Error unassigning NGO:', error);
      toast.error('Failed to unassign NGO');
    }
  };

  const assignVendor = async (packageId: string, ngoId: string, vendorId: string) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/assign-vendor`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify({ ngoId, vendorId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast.error('Vendor already assigned to this NGO-Package combination');
        } else {
          throw new Error(error.error || 'Failed to assign vendor');
        }
        return;
      }
      
      toast.success('Vendor assigned successfully!');
      // Refresh packages
      window.location.reload();
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    }
  };

  const unassignVendor = async (packageId: string, ngoId: string, vendorId: string) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/unassign-vendor`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify({ ngoId, vendorId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to unassign vendor');
      }
      
      toast.success('Vendor unassigned successfully!');
      // Refresh packages
      window.location.reload();
    } catch (error) {
      console.error('Error unassigning vendor:', error);
      toast.error('Failed to unassign vendor');
    }
  };

  const copyPackage = async (packageId: string, includeVendors: boolean) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/copy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
          'x-dev-user-id': '1'
        },
        body: JSON.stringify({ includeVendors })
      });
      
      if (!response.ok) {
        throw new Error('Failed to copy package');
      }
      
      toast.success(`Package copied successfully${includeVendors ? ' with vendor assignments' : ''}!`);
      // Refresh packages
      window.location.reload();
    } catch (error) {
      console.error('Error copying package:', error);
      toast.error('Failed to copy package');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Package Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and assign packages to NGOs and vendors
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
          <CardDescription>
            Manage packages and their assignments to NGOs and vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Assigned NGOs</TableHead>
                <TableHead>Assigned Vendors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pkg.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {pkg.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>₹{pkg.amount}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {pkg.ngo_names?.map((name, index) => (
                        <Badge key={index} variant="secondary">
                          {name}
                        </Badge>
                      )) || <span className="text-muted-foreground">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {pkg.vendor_names?.map((name, index) => (
                        <Badge key={index} variant="outline">
                          {name}
                        </Badge>
                      )) || <span className="text-muted-foreground">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pkg.status === 'active' ? "default" : "secondary"}>
                      {pkg.status === 'active' ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailDialog(pkg)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(pkg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDuplicateDialog(pkg)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignDialog(pkg)}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Package Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Package</DialogTitle>
            <DialogDescription>
              Add a new donation package
            </DialogDescription>
          </DialogHeader>
          <PackageForm
            initialData={undefined}
            onSubmit={handleCreatePackage}
            onCancel={() => setIsCreateDialogOpen(false)}
            categories={['Education', 'Healthcare', 'Food', 'Shelter', 'Other']}
            ngos={ngos}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>
              Update package information
            </DialogDescription>
          </DialogHeader>
          {editingPackage && (
            <PackageForm
              initialData={editingPackage}
              onSubmit={handleUpdatePackage}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingPackage(null);
              }}
              categories={['Education', 'Healthcare', 'Food', 'Shelter', 'Other']}
              ngos={ngos}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate Package Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duplicate Package</DialogTitle>
            <DialogDescription>
              Create a copy of this package
            </DialogDescription>
          </DialogHeader>
          {duplicatingPackage && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeVendors"
                  checked={includeVendors}
                  onCheckedChange={(checked) => setIncludeVendors(checked as boolean)}
                />
                <Label htmlFor="includeVendors">
                  Include vendor assignments in the copy
                </Label>
              </div>
              <PackageForm
                initialData={{
                  ...duplicatingPackage,
                  title: `${duplicatingPackage.title} (Copy)`
                }}
                onSubmit={handleDuplicatePackage}
                onCancel={() => {
                  setIsDuplicateDialogOpen(false);
                  setDuplicatingPackage(null);
                  setIncludeVendors(false);
                }}
                categories={['Education', 'Healthcare', 'Food', 'Shelter', 'Other']}
                isDuplicate={true}
                ngos={ngos}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Package Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Assign Package: {assigningPackage?.title}</DialogTitle>
            <DialogDescription>
              Assign NGOs and vendors to this package. Select NGOs first, then assign vendors to each NGO.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {assigningPackage && (
              <PackageAssignmentForm
                package={assigningPackage}
                ngos={ngos}
                vendors={vendors}
                onSubmit={handleAssignPackage}
                onCancel={() => {
                  setIsAssignDialogOpen(false);
                  setAssigningPackage(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Package Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Package Details</DialogTitle>
            <DialogDescription>
              View detailed package information and assignments
            </DialogDescription>
          </DialogHeader>
          {viewingPackage && (
            <PackageDetailView
              package={viewingPackage}
              ngos={ngos}
              vendors={vendors}
              onClose={() => {
                setIsDetailDialogOpen(false);
                setViewingPackage(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Package Form Component
interface PackageFormProps {
  initialData?: Package;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  categories: string[];
  isDuplicate?: boolean;
  ngos: NGO[]; // Added ngos prop
}

const PackageForm = ({ initialData, onSubmit, onCancel, categories, isDuplicate = false, ngos }: PackageFormProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
    category: initialData?.category || '',
    status: initialData?.status || 'inactive', // Changed from is_active to status
    ngo_id: initialData?.ngo_id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'amount' ? Number(value) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
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
            value={formData.amount.toString()}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ngo_id">NGO</Label>
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
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="status" // Changed from is_active to status
          checked={formData.status === 'active'}
          onCheckedChange={(checked) => handleInputChange('status', checked ? 'active' : 'inactive')}
        />
        <Label htmlFor="status">Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isDuplicate ? 'Duplicate' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

// Package Assignment Form Component
interface PackageAssignmentFormProps {
  package: Package;
  ngos: NGO[];
  vendors: Vendor[];
  onSubmit: (assignments: { ngo_ids: string[], vendor_ids: string[] }) => Promise<void>;
  onCancel: () => void;
}

const PackageAssignmentForm = ({ package: pkg, ngos, vendors, onSubmit, onCancel }: PackageAssignmentFormProps) => {
  const [selectedNGOs, setSelectedNGOs] = useState<string[]>(pkg.assigned_ngos || []);
  const [selectedVendors, setSelectedVendors] = useState<{[key: string]: string[]}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorIds = Object.values(selectedVendors).flat();
    await onSubmit({ ngo_ids: selectedNGOs, vendor_ids: vendorIds });
  };

  const toggleNGO = (ngoId: string) => {
    setSelectedNGOs(prev => 
      prev.includes(ngoId) 
        ? prev.filter(id => id !== ngoId)
        : [...prev, ngoId]
    );
  };

  const toggleVendor = (ngoId: string, vendorId: string) => {
    setSelectedVendors(prev => {
      const currentVendors = prev[ngoId] || [];
      const newVendors = currentVendors.includes(vendorId)
        ? currentVendors.filter(id => id !== vendorId)
        : [...currentVendors, vendorId];
      
      return {
        ...prev,
        [ngoId]: newVendors
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-lg font-semibold">Select NGOs to Assign</Label>
        <div className="mt-3 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
          <div className="grid grid-cols-1 gap-2">
            {ngos.map((ngo) => (
              <div key={ngo.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                <Checkbox
                  id={`ngo-${ngo.id}`}
                  checked={selectedNGOs.includes(ngo.id)}
                  onCheckedChange={() => toggleNGO(ngo.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={`ngo-${ngo.id}`} className="font-medium cursor-pointer">
                    {ngo.name}
                  </Label>
                  <div className="text-sm text-gray-600">{ngo.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedNGOs.length > 0 && (
        <div>
          <Label className="text-lg font-semibold">Assign Vendors to Selected NGOs</Label>
          <div className="mt-3 space-y-4">
            {selectedNGOs.map((ngoId) => {
              const ngo = ngos.find(n => n.id === ngoId);
              return (
                <div key={ngoId} className="border rounded-lg p-4 bg-white">
                  <div className="font-semibold text-blue-600 mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {ngo?.name}
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {vendors.map((vendor) => (
                        <div key={vendor.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`vendor-${ngoId}-${vendor.id}`}
                            checked={selectedVendors[ngoId]?.includes(vendor.id) || false}
                            onCheckedChange={() => toggleVendor(ngoId, vendor.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`vendor-${ngoId}-${vendor.id}`} className="font-medium cursor-pointer">
                              {vendor.company_name}
                            </Label>
                            <div className="text-sm text-gray-600">{vendor.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Assign Package
        </Button>
      </div>
    </form>
  );
};

// Package Detail View Component
interface PackageDetailViewProps {
  package: Package;
  ngos: NGO[];
  vendors: Vendor[];
  onClose: () => void;
}

const PackageDetailView = ({ package: pkg, ngos, vendors, onClose }: PackageDetailViewProps) => {
  return (
    <div className="space-y-6">
      {/* Package Info */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Package Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            <div className="text-sm">{pkg.title}</div>
          </div>
          <div>
            <Label>Amount</Label>
            <div className="text-sm">₹{pkg.amount}</div>
          </div>
          <div>
            <Label>Category</Label>
            <div className="text-sm">{pkg.category}</div>
          </div>
          <div>
            <Label>Status</Label>
            <Badge variant={pkg.status === 'active' ? "default" : "secondary"}>
              {pkg.status === 'active' ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        {pkg.description && (
          <div className="mt-4">
            <Label>Description</Label>
            <div className="text-sm">{pkg.description}</div>
          </div>
        )}
      </div>

      {/* Assignments */}
      {pkg.assignments && pkg.assignments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Assignments</h3>
          <div className="space-y-4">
            {pkg.assignments.map((assignment) => (
              <div key={assignment.assignment_id} className="border p-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{assignment.ngo_name}</div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => assignNGO(pkg.id, assignment.ngo_id)}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Assign NGO
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unassignNGO(pkg.id, assignment.ngo_id)}
                    >
                      <Unlink className="h-3 w-3 mr-1" />
                      Unassign NGO
                    </Button>
                  </div>
                </div>
                
                {/* Vendors for this NGO */}
                {assignment.vendor_package_vendors && assignment.vendor_package_vendors.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-sm">Vendors:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assignment.vendor_package_vendors.map((vendorId) => {
                        const vendor = vendors.find(v => v.id === vendorId);
                        return (
                          <Badge key={vendorId} variant="outline">
                            {vendor?.company_name || vendorId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Vendor to this NGO */}
                <div className="mt-2">
                  <Label className="text-sm">Add Vendor:</Label>
                  <Select onValueChange={(vendorId) => assignVendor(pkg.id, assignment.ngo_id, vendorId)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select vendor" />
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
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default EnhancedPackageManagement; 