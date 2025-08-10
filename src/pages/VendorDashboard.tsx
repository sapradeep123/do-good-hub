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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Package, FileText, Plus, Eye, Upload, Calendar, DollarSign, Truck } from "lucide-react";
import { format } from "date-fns";

interface VendorAssignment {
  id: string;
  vendor_id: string;
  package_id: string;
  ngo_id: string;
  assigned_at: string;
  delivery_date?: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'overdue';
  package_title: string;
  package_amount: number;
  ngo_name: string;
  ngo_contact?: string;
  ngo_address?: string;
  notes?: string;
}

interface VendorPackage {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: string;
  created_at: string;
  assignments?: VendorAssignment[];
}

interface VendorNGO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  assignments?: VendorAssignment[];
}

const VendorDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [ngos, setNGOs] = useState<VendorNGO[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<VendorAssignment | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    delivery_date: '',
    notes: ''
  });

  useEffect(() => {
    if (!loading) {
      checkVendorRole();
    }
  }, [user, loading]);

  const checkVendorRole = async () => {
    try {
      if (!user) {
        navigate("/auth");
        return;
      }

      if (user.role !== "vendor") {
        toast.error("Access denied. Vendor privileges required.");
        navigate("/dashboard");
        return;
      }

      await fetchVendorData();
    } catch (error) {
      console.error("Error checking vendor role:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendorData = async () => {
    try {
      await Promise.all([
        fetchAssignments(),
        fetchPackages(),
        fetchNGOs()
      ]);
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to fetch vendor data");
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await apiClient.get('/api/vendors/assignments') as any;
      const assignments = Array.isArray(response) ? response : (response.data || []);
      setAssignments(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to fetch assignments");
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await apiClient.get('/api/vendors/packages') as any;
      const packages = Array.isArray(response) ? response : (response.data || []);
      setPackages(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to fetch packages");
    }
  };

  const fetchNGOs = async () => {
    try {
      const response = await apiClient.get('/api/vendors/ngos') as any;
      const ngos = Array.isArray(response) ? response : (response.data || []);
      setNGOs(ngos);
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast.error("Failed to fetch NGOs");
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      const response = await apiClient.put(`/api/vendors/assignments/${selectedAssignment.id}`, updateForm) as any;
      
      if (response.success) {
        await fetchAssignments();
        setIsUpdateDialogOpen(false);
        setSelectedAssignment(null);
        toast.success('Assignment updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update assignment');
    }
  };

  const openUpdateDialog = (assignment: VendorAssignment) => {
    setSelectedAssignment(assignment);
    setUpdateForm({
      status: assignment.status,
      delivery_date: assignment.delivery_date || '',
      notes: assignment.notes || ''
    });
    setIsUpdateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your package deliveries and track payment status
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partner NGOs</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ngos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.filter(a => a.payment_status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assignments">Package Assignments</TabsTrigger>
            <TabsTrigger value="packages">My Packages</TabsTrigger>
            <TabsTrigger value="ngos">Partner NGOs</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Package Assignments</CardTitle>
                <CardDescription>
                  Track your package deliveries and update status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>NGO</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.package_title}</div>
                            <div className="text-sm text-muted-foreground">
                              Assigned: {format(new Date(assignment.assigned_at), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.ngo_name}</div>
                            {assignment.ngo_contact && (
                              <div className="text-sm text-muted-foreground">{assignment.ngo_contact}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>₹{assignment.package_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {assignment.delivery_date ? (
                            format(new Date(assignment.delivery_date), 'MMM dd, yyyy')
                          ) : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(assignment.payment_status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(assignment)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Packages</CardTitle>
                <CardDescription>
                  Packages assigned to your vendor account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{pkg.title}</div>
                            {pkg.description && (
                              <div className="text-sm text-muted-foreground">{pkg.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{pkg.category}</TableCell>
                        <TableCell>₹{pkg.amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                        <TableCell>{format(new Date(pkg.created_at), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ngos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner NGOs</CardTitle>
                <CardDescription>
                  NGOs you're delivering packages to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NGO Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Active Assignments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ngos.map((ngo) => (
                      <TableRow key={ngo.id}>
                        <TableCell>
                          <div className="font-medium">{ngo.name}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{ngo.email}</div>
                            {ngo.phone && <div className="text-sm text-muted-foreground">{ngo.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ngo.city && ngo.state ? `${ngo.city}, ${ngo.state}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {assignments.filter(a => a.ngo_id === ngo.id && (a.status === 'pending' || a.status === 'in_progress')).length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Assignment Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Assignment</DialogTitle>
              <DialogDescription>
                Update the delivery status and information for this package assignment.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Delivery Status</Label>
                <Select
                  value={updateForm.status}
                  onValueChange={(value) => setUpdateForm({ ...updateForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={updateForm.delivery_date}
                  onChange={(e) => setUpdateForm({ ...updateForm, delivery_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  placeholder="Add any delivery notes..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Assignment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorDashboard;