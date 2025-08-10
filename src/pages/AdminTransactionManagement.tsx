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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, CheckCircle, Clock, DollarSign, Eye, Users, Building2, Package } from 'lucide-react';

interface Transaction {
  id: string;
  order_id: string;
  package_title: string;
  package_description?: string;
  ngo_name: string;
  first_name: string;
  last_name: string;
  user_email: string;
  amount: number;
  status: string;
  payment_status?: string;
  created_at: string;
  package_id: string;
}

interface Vendor {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  business_type?: string;
  verified: boolean;
}

interface TransactionStats {
  statistics: {
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    total_amount: number;
    avg_amount: number;
  };
  recentOrders: Transaction[];
}

const AdminTransactionManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
        return;
      }
      
      fetchData();
    }
  }, [user, authLoading, navigate]);
  
  const fetchData = async () => {
    try {
      const [transactionsResponse, statsResponse, vendorsResponse] = await Promise.all([
        apiClient.get('/api/payments/transactions') as any,
        apiClient.get('/api/payments/statistics') as any,
        apiClient.get('/api/vendors') as any
      ]);
      
      setTransactions(transactionsResponse.data || []);
      setTransactionStats(statsResponse.data);
      setVendors(vendorsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const assignVendorToPackage = async (packageId: string, vendorId: string) => {
    try {
      await apiClient.post('/api/vendors/assign-package', {
        packageId,
        vendorId
      });
      toast.success('Vendor assigned successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
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
          <p className="mt-4 text-gray-600">Loading Transaction Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600">Manage all payment transactions and vendor assignments</p>
        </div>
        <Button onClick={() => navigate('/admin')} variant="outline">
          Back to Admin Dashboard
        </Button>
      </div>

      {/* Transaction Statistics */}
      {transactionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.statistics?.total_orders || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.statistics?.completed_orders || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.statistics?.pending_orders || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(transactionStats.statistics?.total_amount || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Manage payment transactions and vendor assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>NGO</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{transaction.order_id}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.first_name} {transaction.last_name}</div>
                      <div className="text-sm text-gray-500">{transaction.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.package_title}</div>
                      <div className="text-sm text-gray-500">{transaction.package_description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.ngo_name}</TableCell>
                  <TableCell>₹{transaction.amount?.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setIsTransactionDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {transaction.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => assignVendorToPackage(transaction.package_id, 'vendor-id')}
                        >
                          Assign Vendor
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Detailed information about the transaction</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{selectedTransaction.order_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm text-gray-600">
                    {selectedTransaction.first_name} {selectedTransaction.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{selectedTransaction.user_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-gray-600">₹{selectedTransaction.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Package</Label>
                  <p className="text-sm text-gray-600">{selectedTransaction.package_title}</p>
                  <p className="text-sm text-gray-500">{selectedTransaction.package_description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">NGO</Label>
                  <p className="text-sm text-gray-600">{selectedTransaction.ngo_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTransaction.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.payment_status || 'pending')}</div>
                </div>
              </div>
              
              {selectedTransaction.status === 'completed' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Vendor Assignment</h4>
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Select Vendor</Label>
                    <Select onValueChange={(value) => assignVendorToPackage(selectedTransaction.package_id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vendor" />
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
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactionManagement;
