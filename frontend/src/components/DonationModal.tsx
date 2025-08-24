import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DonationPackage } from "@/data/ngos";
import { Minus, Plus, Heart, Shield, Clock } from "lucide-react";

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: DonationPackage | null;
  ngoId: string;
  ngoName: string;
  onPaymentSuccess: (donationId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const DonationModal = ({ 
  open, 
  onOpenChange, 
  package: donationPackage, 
  ngoId, 
  ngoName,
  onPaymentSuccess 
}: DonationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!donationPackage) return null;

  const totalAmount = donationPackage.amount * quantity;
  const taxBenefit = Math.floor(totalAmount * 0.8); // 80% tax deduction

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const simulatePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create Razorpay order for immediate payment to admin escrow
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-escrow-payment',
        {
          body: { 
            amount: totalAmount,
            package_id: donationPackage.id,
            ngo_id: ngoId,
            quantity,
            package_title: donationPackage.title,
            package_amount: donationPackage.amount,
            description: `Escrow payment for ${donationPackage.title} to ${ngoName}`
          }
        }
      );

      if (orderError) {
        throw new Error(orderError.message);
      }

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK");
      }

      // Get user profile for payment details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .single();

      const options = {
        key: 'rzp_test_nCd2hfvHCMCHEt',
        amount: orderData.razorpay_order.amount,
        currency: orderData.razorpay_order.currency,
        name: 'NGO Platform - Admin Escrow',
        description: `Escrow payment for ${donationPackage.title}`,
        order_id: orderData.razorpay_order.id,
        prefill: {
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Donor',
          email: profile?.email || '',
          contact: profile?.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async function (response: any) {
          try {
            // Verify escrow payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-escrow-payment',
              {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  donation_id: orderData.donation_id
                }
              }
            );

            if (verifyError || !verifyData.success) {
              throw new Error(verifyData?.error || verifyError?.message || "Payment verification failed");
            }

            toast({
              title: "Payment Successful!",
              description: "Your donation is now in admin escrow. Processing will begin shortly.",
            });
            
            onPaymentSuccess(orderData.donation_id);
            onOpenChange(false);
            setQuantity(1);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification failed",
              description: error instanceof Error ? error.message : "Payment verification failed",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast({
              title: "Payment cancelled",
              description: "You can try again anytime.",
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Complete Your Donation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Package Details */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{donationPackage.title}</h3>
                    <p className="text-sm text-muted-foreground">to {ngoName}</p>
                  </div>
                  <Badge variant="secondary">₹{donationPackage.amount.toLocaleString()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{donationPackage.description}</p>
                <div className="flex items-center gap-2 text-xs text-accent font-medium">
                  <Heart className="h-3 w-3" />
                  {donationPackage.impact}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Selection */}
          <div className="space-y-3">
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
                min="1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Amount Summary */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Package Amount</span>
              <span>₹{donationPackage.amount.toLocaleString()} × {quantity}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-success">
              <span>Tax Benefit (80G)</span>
              <span>₹{taxBenefit.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Security Features */}
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="flex flex-col items-center gap-1">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Instant Receipt</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Heart className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Impact Updates</span>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={simulatePayment}
            disabled={isProcessing}
            className="w-full"
            variant="donate"
            size="lg"
          >
            {isProcessing ? "Processing Payment..." : `Donate ₹${totalAmount.toLocaleString()}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By proceeding, you agree to our terms and conditions. 
            This is a demo payment system.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};