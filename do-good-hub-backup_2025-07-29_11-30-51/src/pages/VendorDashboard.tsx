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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, FileText, Plus, Eye, Upload } from "lucide-react";
import { format } from "date-fns";

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  ngo_id: string;
  package_id: string;
  donation_id: string;
  total_amount: number;
  status: string;
  issued_date: string;
  expected_delivery_date?: string;
  created_at: string;
  ngo_name?: string;
  package_title?: string;
}

interface VendorInvoice {
  id: string;
  purchase_order_id: string;
  vendor_id: string;
  invoice_number: string;
  gst_number?: string;
  invoice_type: string;
  invoice_amount: number;
  tax_amount: number;
  total_amount: number;
  invoice_date: string;
  delivery_date?: string;
  items?: any;
  notes?: string;
  status: string;
  created_at: string;
  po_number?: string;
}

const VendorDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isVendor, setIsVendor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

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

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "vendor") {
        navigate("/dashboard");
        return;
      }

      setIsVendor(true);
      await Promise.all([
        fetchPurchaseOrders(),
        fetchInvoices()
      ]);
    } catch (error) {
      console.error("Error checking vendor role:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          ngos!purchase_orders_ngo_id_fkey(name),
          packages!purchase_orders_package_id_fkey(title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ordersWithNames = data?.map(order => ({
        ...order,
        ngo_name: order.ngos?.name || '',
        package_title: order.packages?.title || ''
      })) || [];

      setPurchaseOrders(ordersWithNames);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast.error("Failed to fetch purchase orders");
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("vendor_invoices")
        .select(`
          *,
          purchase_orders!vendor_invoices_purchase_order_id_fkey(po_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const invoicesWithPO = data?.map(invoice => ({
        ...invoice,
        po_number: invoice.purchase_orders?.po_number || ''
      })) || [];

      setInvoices(invoicesWithPO);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to fetch invoices");
    }
  };

  const openCreateInvoiceDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsCreateInvoiceOpen(true);
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

  if (!isVendor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your purchase orders and invoices
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseOrders.filter(po => po.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Orders assigned to your company</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>NGO</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.ngo_name}</TableCell>
                        <TableCell>{po.package_title}</TableCell>
                        <TableCell>₹{po.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            po.status === 'pending' ? 'secondary' :
                            po.status === 'delivered' ? 'default' : 'destructive'
                          }>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {po.expected_delivery_date ? 
                            format(new Date(po.expected_delivery_date), 'MMM dd, yyyy') : 
                            'Not set'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCreateInvoiceDialog(po)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Invoices</CardTitle>
                <CardDescription>Your GST invoices and delivery notes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.po_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {invoice.invoice_type === 'gst_invoice' ? 'GST Invoice' : 'Delivery Note'}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{invoice.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            invoice.status === 'submitted' ? 'secondary' :
                            invoice.status === 'approved' ? 'default' : 'destructive'
                          }>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Invoice Dialog */}
        <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>
                Submit GST Invoice or Delivery Note for PO: {selectedPO?.po_number}
              </DialogDescription>
            </DialogHeader>
            {selectedPO && (
              <CreateInvoiceForm 
                purchaseOrder={selectedPO}
                onSuccess={() => {
                  setIsCreateInvoiceOpen(false);
                  setSelectedPO(null);
                  fetchInvoices();
                }}
                onCancel={() => {
                  setIsCreateInvoiceOpen(false);
                  setSelectedPO(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Create Invoice Form Component
const CreateInvoiceForm = ({ 
  purchaseOrder, 
  onSuccess, 
  onCancel 
}: { 
  purchaseOrder: PurchaseOrder;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    invoice_number: '',
    gst_number: '',
    invoice_type: 'gst_invoice',
    invoice_amount: purchaseOrder.total_amount.toString(),
    tax_amount: '0',
    total_amount: purchaseOrder.total_amount.toString(),
    invoice_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("vendor_invoices")
        .insert([{
          purchase_order_id: purchaseOrder.id,
          vendor_id: purchaseOrder.vendor_id,
          ...formData,
          invoice_amount: parseFloat(formData.invoice_amount),
          tax_amount: parseFloat(formData.tax_amount),
          total_amount: parseFloat(formData.total_amount)
        }]);

      if (error) throw error;

      toast.success("Invoice submitted successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to submit invoice");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="invoice_number">Invoice Number *</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="invoice_type">Invoice Type *</Label>
          <select
            id="invoice_type"
            value={formData.invoice_type}
            onChange={(e) => setFormData({...formData, invoice_type: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="gst_invoice">GST Invoice</option>
            <option value="delivery_note">Delivery Note</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gst_number">GST Number</Label>
          <Input
            id="gst_number"
            value={formData.gst_number}
            onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="invoice_date">Invoice Date *</Label>
          <Input
            id="invoice_date"
            type="date"
            value={formData.invoice_date}
            onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="invoice_amount">Invoice Amount *</Label>
          <Input
            id="invoice_amount"
            type="number"
            step="0.01"
            value={formData.invoice_amount}
            onChange={(e) => setFormData({...formData, invoice_amount: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="tax_amount">Tax Amount</Label>
          <Input
            id="tax_amount"
            type="number"
            step="0.01"
            value={formData.tax_amount}
            onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="total_amount">Total Amount *</Label>
          <Input
            id="total_amount"
            type="number"
            step="0.01"
            value={formData.total_amount}
            onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="delivery_date">Delivery Date</Label>
        <Input
          id="delivery_date"
          type="date"
          value={formData.delivery_date}
          onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Additional notes about the delivery or invoice"
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">Submit Invoice</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

export default VendorDashboard;