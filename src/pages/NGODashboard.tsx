import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Users, TrendingUp, Plus, Edit, Eye, Building2 } from "lucide-react";
import { format } from "date-fns";

interface NGO {
  id: string;
  name: string;
  description: string;
  mission: string;
  location: string;
  category: string;
  image_url: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  registration_number: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface Package {
  id: string;
  ngo_id: string;
  vendor_id: string | null;
  title: string;
  description: string;
  amount: number;
  category: string;
  items_included: string[];
  delivery_timeline: string;
  is_active: boolean;
  created_at: string;
  vendors?: {
    company_name: string;
  };
}

interface Donation {
  id: string;
  package_id: string;
  package_title: string;
  package_amount: number;
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  user_id: string;
}

const NGODashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ngoData, setNgoData] = useState<NGO[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkNGORole();
    }
  }, [user]);

  const checkNGORole = async () => {
    try {
      // Check if user has NGO role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "ngo")
        .single();

      if (roleError || !roleData) {
        console.log("User is not an NGO, redirecting to regular dashboard");
        navigate("/dashboard");
        return;
      }

      // Fetch NGO data for this user
      await fetchNGOData();
    } catch (error) {
      console.error("Error checking NGO role:", error);
      navigate("/dashboard");
    }
  };

  const fetchNGOData = async () => {
    try {
      setIsLoading(true);

      // Fetch NGOs managed by this user
      const { data: ngoData, error: ngoError } = await supabase
        .from("ngos")
        .select("*")
        .eq("user_id", user?.id);

      if (ngoError) {
        console.error("Error fetching NGO data:", ngoError);
        toast.error("Failed to fetch NGO data");
        return;
      }

      setNgoData(ngoData || []);

      if (ngoData && ngoData.length > 0) {
        const ngoIds = ngoData.map(ngo => ngo.id);
        
        // Fetch packages for these NGOs
        const { data: packagesData, error: packagesError } = await supabase
          .from("packages")
          .select(`
            *,
            vendors (
              company_name
            )
          `)
          .in("ngo_id", ngoIds)
          .order("created_at", { ascending: false });

        if (packagesError) {
          console.error("Error fetching packages:", packagesError);
          toast.error("Failed to fetch packages");
        } else {
          setPackages(packagesData || []);
        }

        // Fetch donations for these packages
        if (packagesData && packagesData.length > 0) {
          const packageIds = packagesData.map(pkg => pkg.id);
          
          const { data: donationsData, error: donationsError } = await supabase
            .from("donations")
            .select("*")
            .in("package_id", packageIds)
            .order("created_at", { ascending: false });

          if (donationsError) {
            console.error("Error fetching donations:", donationsError);
            toast.error("Failed to fetch donations");
          } else {
            setDonations(donationsData || []);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while fetching data");
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

  const totalRaised = donations
    .filter(d => d.payment_status === "completed")
    .reduce((sum, d) => sum + Number(d.total_amount), 0);

  const completedDonations = donations.filter(d => d.payment_status === "completed").length;
  const activePackages = packages.filter(p => p.is_active).length;

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

  if (ngoData.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No NGO Assigned</h2>
            <p className="text-muted-foreground">
              You don't have any NGO organizations assigned to your account. 
              Please contact an administrator to assign you to an NGO.
            </p>
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
          <h1 className="text-3xl font-bold mb-2">NGO Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your organization's packages and track donations
          </p>
        </div>

        {/* NGO Information */}
        <div className="mb-8">
          {ngoData.map((ngo) => (
            <Card key={ngo.id} className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {ngo.name}
                      {ngo.is_verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{ngo.description}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Location:</strong> {ngo.location}
                  </div>
                  <div>
                    <strong>Category:</strong> {ngo.category}
                  </div>
                  <div>
                    <strong>Phone:</strong> {ngo.phone || "Not provided"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRaised.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {completedDonations} successful donations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePackages}</div>
              <p className="text-xs text-muted-foreground">
                Out of {packages.length} total packages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(donations.map(d => d.user_id)).size}</div>
              <p className="text-xs text-muted-foreground">
                Unique supporters
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Your NGO</CardTitle>
                <CardDescription>
                  View packages, donations, and manage your organization
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Package
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="packages" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="packages">Packages</TabsTrigger>
                <TabsTrigger value="donations">Donations Received</TabsTrigger>
              </TabsList>

              <TabsContent value="packages" className="space-y-4">
                <PackagesTable packages={packages} />
              </TabsContent>

              <TabsContent value="donations" className="space-y-4">
                <DonationsTable donations={donations} getStatusColor={getStatusColor} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface PackagesTableProps {
  packages: Package[];
}

const PackagesTable = ({ packages }: PackagesTableProps) => {
  if (packages.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No packages found. Create your first package to start receiving donations.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Vendor</TableHead>
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
                    {pkg.description.length > 50 
                      ? `${pkg.description.substring(0, 50)}...` 
                      : pkg.description}
                  </div>
                </div>
              </TableCell>
              <TableCell>{pkg.category}</TableCell>
              <TableCell className="font-medium">
                ₹{Number(pkg.amount).toLocaleString()}
              </TableCell>
              <TableCell>
                {pkg.vendors?.company_name || "No vendor assigned"}
              </TableCell>
              <TableCell>
                <Badge variant={pkg.is_active ? "default" : "secondary"}>
                  {pkg.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface DonationsTableProps {
  donations: Donation[];
  getStatusColor: (status: string) => string;
}

const DonationsTable = ({ donations, getStatusColor }: DonationsTableProps) => {
  if (donations.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No donations received yet.</p>
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
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Donor</TableHead>
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
              <TableCell>{donation.quantity}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(donation.payment_status)}>
                  {donation.payment_status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {donation.user_id.substring(0, 8)}...
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NGODashboard;