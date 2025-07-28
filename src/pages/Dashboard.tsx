import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceModal } from "@/components/InvoiceModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Eye, CreditCard, FileText, Truck, Receipt, Settings, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

interface Donation {
  id: string;
  ngo_id: string;
  package_title: string;
  package_amount: number;
  quantity: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  transaction_id: string | null;
  invoice_number: string | null;
  service_status: string;
  service_completed_at: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      // Check if user has NGO role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "ngo")
        .single();

      if (roleData && !roleError) {
        // User is an NGO, redirect to NGO dashboard
        navigate("/ngo-dashboard");
        return;
      }

      // Check if user has vendor role
      const { data: vendorRoleData, error: vendorRoleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "vendor")
        .single();

      if (vendorRoleData && !vendorRoleError) {
        // User is a vendor, redirect to vendor dashboard
        navigate("/vendor-dashboard");
        return;
      }

      // Check if user has admin role
      const { data: adminRoleData, error: adminRoleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .single();

      if (adminRoleData && !adminRoleError) {
        // User is an admin, redirect to admin dashboard
        navigate("/admin");
        return;
      }

      // User is a regular user, fetch their donations
      fetchDonations();
    } catch (error) {
      console.error("Error checking user role:", error);
      // If there's an error, default to regular user behavior
      fetchDonations();
    }
  };

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching donations:", error);
        toast.error("Failed to fetch donations");
        return;
      }

      setDonations(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while fetching donations");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewInvoice = (donationId: string) => {
    setSelectedDonationId(donationId);
    setIsInvoiceModalOpen(true);
  };

  const totalDonated = donations
    .filter(d => d.payment_status === "completed")
    .reduce((sum, d) => sum + Number(d.total_amount), 0);

  const completedDonations = donations.filter(d => d.payment_status === "completed").length;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Track your donations and manage your giving impact
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalDonated.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {completedDonations} successful donations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donations.length}</div>
              <p className="text-xs text-muted-foreground">
                Including pending and failed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Savings</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalDonated * 0.8).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                80G deduction available
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="donations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="services">Service Tracking</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="donations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Donation History</CardTitle>
                <CardDescription>
                  View and manage all your donations, invoices, and certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Donations</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    <DonationTable 
                      donations={donations} 
                      onViewInvoice={handleViewInvoice}
                      getStatusColor={getStatusColor}
                      getServiceStatusColor={getServiceStatusColor}
                      getServiceStatusIcon={getServiceStatusIcon}
                    />
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4">
                    <DonationTable 
                      donations={donations.filter(d => d.payment_status === "completed")} 
                      onViewInvoice={handleViewInvoice}
                      getStatusColor={getStatusColor}
                      getServiceStatusColor={getServiceStatusColor}
                      getServiceStatusIcon={getServiceStatusIcon}
                    />
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4">
                    <DonationTable 
                      donations={donations.filter(d => d.payment_status === "pending")} 
                      onViewInvoice={handleViewInvoice}
                      getStatusColor={getStatusColor}
                      getServiceStatusColor={getServiceStatusColor}
                      getServiceStatusIcon={getServiceStatusIcon}
                    />
                  </TabsContent>

                  <TabsContent value="failed" className="space-y-4">
                    <DonationTable 
                      donations={donations.filter(d => d.payment_status === "failed")} 
                      onViewInvoice={handleViewInvoice}
                      getStatusColor={getStatusColor}
                      getServiceStatusColor={getServiceStatusColor}
                      getServiceStatusIcon={getServiceStatusIcon}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Tracking</CardTitle>
                <CardDescription>
                  Track the delivery and completion status of your donations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceTrackingTable 
                  donations={donations.filter(d => d.payment_status === "completed")}
                  getServiceStatusColor={getServiceStatusColor}
                  getServiceStatusIcon={getServiceStatusIcon}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <ChangePasswordForm />
          </TabsContent>
        </Tabs>
      </div>

      <InvoiceModal
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
        donationId={selectedDonationId}
        ngoName="NGO" // This should ideally come from the NGO data
      />
    </div>
  );
};

interface DonationTableProps {
  donations: Donation[];
  onViewInvoice: (donationId: string) => void;
  getStatusColor: (status: string) => string;
  getServiceStatusColor: (status: string) => string;
  getServiceStatusIcon: (status: string) => JSX.Element;
}

interface ServiceTrackingTableProps {
  donations: Donation[];
  getServiceStatusColor: (status: string) => string;
  getServiceStatusIcon: (status: string) => JSX.Element;
}

const DonationTable = ({ donations, onViewInvoice, getStatusColor, getServiceStatusColor, getServiceStatusIcon }: DonationTableProps) => {
  if (donations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No donations found in this category.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>NGO Package</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell>
                {format(new Date(donation.created_at), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{donation.package_title}</div>
                  <div className="text-sm text-muted-foreground">
                    ₹{donation.package_amount} × {donation.quantity}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                ₹{Number(donation.total_amount).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(donation.payment_status)}>
                  {donation.payment_status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {donation.transaction_id || "N/A"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {donation.payment_status === "completed" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewInvoice(donation.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        80G
                      </Button>
                      <Button variant="outline" size="sm">
                        <Truck className="h-4 w-4 mr-1" />
                        Delivery
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ServiceTrackingTable = ({ donations, getServiceStatusColor, getServiceStatusIcon }: ServiceTrackingTableProps) => {
  if (donations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No completed donations to track.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Service Status</TableHead>
            <TableHead>Completion Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell>
                {format(new Date(donation.created_at), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                <div className="font-medium">{donation.package_title}</div>
              </TableCell>
              <TableCell className="font-medium">
                ₹{Number(donation.total_amount).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge className={getServiceStatusColor(donation.service_status || 'pending')}>
                    <div className="flex items-center gap-1">
                      {getServiceStatusIcon(donation.service_status || 'pending')}
                      {donation.service_status || 'pending'}
                    </div>
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {donation.service_completed_at 
                  ? format(new Date(donation.service_completed_at), "MMM dd, yyyy")
                  : "Not completed"
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Dashboard;