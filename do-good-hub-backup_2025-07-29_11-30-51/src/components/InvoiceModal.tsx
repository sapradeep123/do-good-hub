import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Download, CheckCircle, Calendar, CreditCard, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Donation {
  id: string;
  ngo_id: string;
  package_title: string;
  package_amount: number;
  quantity: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  invoice_number: string;
  created_at: string;
}

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donationId: string | null;
  ngoName: string;
}

export const InvoiceModal = ({ open, onOpenChange, donationId, ngoName }: InvoiceModalProps) => {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && donationId) {
      fetchDonation();
    }
  }, [open, donationId]);

  const fetchDonation = async () => {
    if (!donationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', donationId)
        .single();

      if (error) throw error;
      setDonation(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load donation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    if (!donation) return;

    const invoiceContent = `
DONATION INVOICE
================

Invoice Number: ${donation.invoice_number}
Date: ${new Date(donation.created_at).toLocaleDateString()}
Transaction ID: ${donation.transaction_id}

DONOR INFORMATION
-----------------
Donation to: ${ngoName}

DONATION DETAILS
----------------
Package: ${donation.package_title}
Quantity: ${donation.quantity}
Amount per package: ₹${donation.package_amount.toLocaleString()}
Total Amount: ₹${donation.total_amount.toLocaleString()}
Payment Method: ${donation.payment_method.toUpperCase()}
Status: ${donation.payment_status.toUpperCase()}

TAX INFORMATION
---------------
80G Tax Benefit: ₹${Math.floor(donation.total_amount * 0.8).toLocaleString()}

Thank you for your generous donation!
This is a computer-generated invoice.
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${donation.invoice_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Invoice Downloaded",
      description: "Your donation invoice has been downloaded successfully.",
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!donation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-success" />
            Donation Invoice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Success Message */}
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <h3 className="font-semibold text-success">Payment Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your donation has been processed successfully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">DONATION RECEIPT</h3>
                <p className="text-sm text-muted-foreground">#{donation.invoice_number}</p>
              </div>

              <Separator />

              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Payment</p>
                    <Badge variant="secondary">{donation.payment_method.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Donation Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Donated to</p>
                  <p className="font-semibold">{ngoName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Package</p>
                  <p className="font-medium">{donation.package_title}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <span>{donation.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount per package</span>
                  <span>₹{donation.package_amount.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              {/* Amount Summary */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Donation</span>
                  <span>₹{donation.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-success">
                  <span>80G Tax Benefit</span>
                  <span>₹{Math.floor(donation.total_amount * 0.8).toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              {/* Transaction ID */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="text-sm font-mono">{donation.transaction_id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Download Button */}
          <Button onClick={downloadInvoice} className="w-full" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Keep this receipt for your tax records. Thank you for your generous donation!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};