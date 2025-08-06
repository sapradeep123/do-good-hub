import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Eye, Package, Users, Building, Globe, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

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

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  role?: string;
}

interface NGODetailViewProps {
  ngo: NGO;
  vendors: Vendor[];
  packages: Package[];
  users: User[];
  onEdit: (ngo: NGO) => void;
  onClose: () => void;
}

const NGODetailView = ({ ngo, vendors, packages, users, onEdit, onClose }: NGODetailViewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Filter associated data
  const associatedVendors = vendors.filter(vendor => vendor.ngo_id === ngo.id);
  const associatedPackages = packages.filter(pkg => pkg.ngo_id === ngo.id);
  const associatedUsers = users.filter(user => user.role === 'ngo' || user.email.includes(ngo.name.toLowerCase()));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {ngo.name} - NGO Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of NGO information, associated vendors, packages, and users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* NGO Basic Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>NGO Information</CardTitle>
                <CardDescription>Basic details and contact information</CardDescription>
              </div>
              <Button onClick={() => onEdit(ngo)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit NGO
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{ngo.name}</h3>
                    <p className="text-muted-foreground">{ngo.description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{ngo.email}</span>
                    </div>
                    {ngo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{ngo.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{ngo.location}</span>
                    </div>
                    {ngo.website_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={ngo.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {ngo.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant={ngo.is_active ? "default" : "secondary"}>
                      {ngo.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={ngo.is_verified ? "default" : "secondary"}>
                      {ngo.is_verified ? "Verified" : "Pending"}
                    </Badge>
                    <Badge variant="outline">{ngo.category}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Created: {format(new Date(ngo.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    {ngo.registration_number && (
                      <div>
                        <span className="text-sm font-medium">Registration: </span>
                        <span className="text-sm text-muted-foreground">{ngo.registration_number}</span>
                      </div>
                    )}
                  </div>

                  {ngo.mission && (
                    <div>
                      <h4 className="font-medium mb-1">Mission</h4>
                      <p className="text-sm text-muted-foreground">{ngo.mission}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vendors">Vendors ({associatedVendors.length})</TabsTrigger>
              <TabsTrigger value="packages">Packages ({associatedPackages.length})</TabsTrigger>
              <TabsTrigger value="users">Users ({associatedUsers.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Associated Vendors</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{associatedVendors.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active vendors working with this NGO
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{associatedPackages.filter(p => p.is_active).length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active donation packages
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Associated Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{associatedUsers.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Staff and members
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest packages and vendor activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {associatedPackages.slice(0, 3).map((pkg) => (
                      <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{pkg.title}</div>
                          <div className="text-sm text-muted-foreground">
                            ${pkg.amount} • {pkg.category}
                          </div>
                        </div>
                        <Badge variant={pkg.is_active ? "default" : "secondary"}>
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vendors Tab */}
            <TabsContent value="vendors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Associated Vendors</CardTitle>
                  <CardDescription>Vendors working with {ngo.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {associatedVendors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No vendors associated with this NGO
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {associatedVendors.map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{vendor.company_name}</div>
                                <div className="text-sm text-muted-foreground">{vendor.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{vendor.contact_person || 'N/A'}</TableCell>
                            <TableCell>{vendor.email}</TableCell>
                            <TableCell>{vendor.phone}</TableCell>
                            <TableCell>
                              <Badge variant={vendor.is_active ? "default" : "secondary"}>
                                {vendor.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(vendor.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packages Tab */}
            <TabsContent value="packages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Associated Packages</CardTitle>
                  <CardDescription>Donation packages managed by {ngo.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {associatedPackages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No packages associated with this NGO
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {associatedPackages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{pkg.title}</div>
                                <div className="text-sm text-muted-foreground">{pkg.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{pkg.category}</TableCell>
                            <TableCell>${pkg.amount}</TableCell>
                            <TableCell>{pkg.vendor_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={pkg.is_active ? "default" : "secondary"}>
                                {pkg.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(pkg.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Associated Users</CardTitle>
                  <CardDescription>Staff and members of {ngo.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {associatedUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users associated with this NGO
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {associatedUsers.map((user) => (
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
                              <Badge variant="outline">{user.role || 'User'}</Badge>
                            </TableCell>
                            <TableCell>{user.phone || 'N/A'}</TableCell>
                            <TableCell>
                              {format(new Date(user.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NGODetailView; 