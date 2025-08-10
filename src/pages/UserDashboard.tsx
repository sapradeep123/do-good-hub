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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Package, Users, Building2, CreditCard, History, ShoppingCart, Eye, Heart, LogOut, Home } from 'lucide-react';

interface Package {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: string;
  created_at: string;
}

interface NGO {
  id: string;
  name: string;
  description?: string;
  mission?: string;
  city?: string;
  state?: string;
  photo_url?: string;
}

interface Transaction {
  id: string;
  order_id: string;
  package_title: string;
  ngo_name: string;
  amount: number;
  status: string;
  created_at: string;
  payment_status?: string;
}

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Payment states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleLogout = () => {
    // Clear auth data and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleHome = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      if (user.role !== 'user') {
        toast.error('Access denied. User privileges required.');
        navigate('/dashboard');
        return;
      }
      
      fetchData();
    }
  }, [user, authLoading, navigate]);
  
  const fetchData = async () => {
    try {
      const [packagesResponse, ngosResponse, transactionsResponse] = await Promise.all([
        apiClient.get('/api/packages') as any,
        apiClient.get('/api/ngos') as any,
        apiClient.get('/api/payments/history') as any
      ]);
      
      setPackages(packagesResponse.data || []);
      setNgos(ngosResponse.data || []);
      setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedPackage || !selectedNGO) return;

    setIsProcessingPayment(true);
    try {
      // Create order
      const orderResponse = await apiClient.post('/api/payments/create-order', {
        packageId: selectedPackage.id,
        ngoId: selectedNGO.id,
        quantity: quantity
      }) as any;

      const { orderId, amount, keyId } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount: amount,
        currency: 'INR',
        name: 'Do Good Hub',
        description: `Donation for ${selectedPackage.title}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            await apiClient.post('/api/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            toast.success('Payment successful! Thank you for your donation.');
            setIsPaymentDialogOpen(false);
            setSelectedPackage(null);
            setSelectedNGO(null);
            setQuantity(1);
            fetchData(); // Refresh data
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.firstName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#10B981'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading User Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800">
            {transactions.length} Donations
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner NGOs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ngos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Available Packages</TabsTrigger>
          <TabsTrigger value="ngos">Partner NGOs</TabsTrigger>
          <TabsTrigger value="history">Donation History</TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Packages</CardTitle>
              <CardDescription>Choose a package to donate to an NGO</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{pkg.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-blue-100 text-blue-800">{pkg.category}</Badge>
                          <span className="text-lg font-bold text-green-600">₹{pkg.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePayment(pkg)}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Donate Now
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NGOs Tab */}
        <TabsContent value="ngos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner NGOs</CardTitle>
              <CardDescription>NGOs you can donate to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ngos.map((ngo) => (
                  <Card key={ngo.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                        {ngo.photo_url && <AvatarImage src={ngo.photo_url} />}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{ngo.name}</h3>
                        <p className="text-sm text-gray-600">{ngo.description}</p>
                        {ngo.city && ngo.state && (
                          <p className="text-sm text-gray-500 mt-1">{ngo.city}, {ngo.state}</p>
                        )}
                        {ngo.mission && (
                          <p className="text-sm text-gray-600 mt-2">{ngo.mission}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
              <CardDescription>Your past donations and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>NGO</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.package_title}</div>
                          <div className="text-sm text-gray-500">Order: {transaction.order_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.ngo_name}</TableCell>
                      <TableCell>₹{transaction.amount?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make a Donation</DialogTitle>
            <DialogDescription>
              Choose an NGO and complete your donation
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-4">
              <div>
                <Label>Selected Package</Label>
                <div className="p-3 bg-gray-50 rounded-md mt-1">
                  <div className="font-medium">{selectedPackage.title}</div>
                  <div className="text-sm text-gray-600">{selectedPackage.description}</div>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    ₹{selectedPackage.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="ngo">Select NGO</Label>
                <Select onValueChange={(value) => {
                  const ngo = ngos.find(n => n.id === value);
                  setSelectedNGO(ngo || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an NGO" />
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
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm text-blue-800">
                  <div>Total Amount: ₹{(selectedPackage.amount * quantity).toLocaleString()}</div>
                  <div className="text-xs mt-1">This donation will be processed securely via Razorpay</div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={processPayment}
                  disabled={!selectedNGO || isProcessingPayment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessingPayment ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
